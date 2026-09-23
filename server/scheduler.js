/**
 * Планировщик задач для автоматической синхронизации
 */

const cron = require('node-cron');

function startScheduler(sourceManager, wss, db) {
  console.log('⏰ Планировщик задач запущен');

  // Синхронизация всех источников каждый час
  cron.schedule('0 * * * *', async () => {
    console.log('\n🕐 Запуск плановой синхронизации (каждый час)');
    try {
      wss.notifySyncStatus('all', 'started', { message: 'Начата плановая синхронизация' });
      
      const results = await sourceManager.syncAll();
      
      let totalAdded = 0;
      let totalFound = 0;
      
      for (const [sourceId, result] of Object.entries(results)) {
        if (result.error) {
          wss.notifySyncStatus(sourceId, 'error', { error: result.error });
        } else {
          totalAdded += result.added || 0;
          totalFound += result.found || 0;
          wss.notifySyncStatus(sourceId, 'completed', {
            found: result.found,
            added: result.added,
            updated: result.updated,
          });
        }
      }

      wss.notifySyncStatus('all', 'completed', {
        message: `Синхронизация завершена. Найдено: ${totalFound}, добавлено: ${totalAdded}`,
        totalFound,
        totalAdded,
      });

      console.log(`✅ Плановая синхронизация завершена. Найдено: ${totalFound}, добавлено: ${totalAdded}`);
    } catch (error) {
      console.error('❌ Ошибка плановой синхронизации:', error);
      wss.notifyError(error, 'scheduler');
    }
  });

  // Синхронизация ЕИС каждые 30 минут (чаще, т.к. основной источник)
  cron.schedule('*/30 * * * *', async () => {
    console.log('\n🕐 Синхронизация ЕИС (каждые 30 минут)');
    try {
      wss.notifySyncStatus('zakupki_gov', 'started', { message: 'Синхронизация ЕИС' });
      const result = await sourceManager.syncSource('zakupki_gov');
      
      wss.notifySyncStatus('zakupki_gov', 'completed', {
        found: result.found,
        added: result.added,
        updated: result.updated,
      });

      console.log(`✅ ЕИС: найдено ${result.found}, добавлено ${result.added}`);
    } catch (error) {
      console.error('❌ Ошибка синхронизации ЕИС:', error);
      wss.notifySyncStatus('zakupki_gov', 'error', { error: error.message });
    }
  });

  // Очистка старых логов каждый день в 3:00
  cron.schedule('0 3 * * *', () => {
    console.log('\n🧹 Очистка старых логов синхронизации');
    try {
      const result = db.prepare(`
        DELETE FROM sync_logs 
        WHERE started_at < datetime('now', '-30 days')
      `).run();
      console.log(`✅ Удалено ${result.changes} старых записей`);
    } catch (error) {
      console.error('❌ Ошибка очистки логов:', error);
    }
  });

  // Сброс флага "новый" для тендеров старше 3 дней (каждые 6 часов)
  cron.schedule('0 */6 * * *', () => {
    console.log('\n🔄 Сброс флага "новый" для старых тендеров');
    try {
      const result = db.prepare(`
        UPDATE tenders 
        SET is_new = 0 
        WHERE is_new = 1 
        AND created_at < datetime('now', '-3 days')
      `).run();
      console.log(`✅ Обновлено ${result.changes} тендеров`);
    } catch (error) {
      console.error('❌ Ошибка сброса флага:', error);
    }
  });

  // Проверка дедлайнов каждый час
  cron.schedule('15 * * * *', () => {
    console.log('\n⏰ Проверка приближающихся дедлайнов');
    try {
      const upcomingDeadlines = db.prepare(`
        SELECT * FROM tenders 
        WHERE deadline BETWEEN date('now') AND date('now', '+3 days')
        AND status = 'active'
        AND is_favorite = 1
      `).all();

      if (upcomingDeadlines.length > 0) {
        console.log(`⚠️ ${upcomingDeadlines.length} избранных тендеров с дедлайном в ближайшие 3 дня`);
        
        for (const tender of upcomingDeadlines) {
          wss.broadcast({
            type: 'deadline_warning',
            data: {
              tenderId: tender.id,
              title: tender.title,
              deadline: tender.deadline,
              daysLeft: Math.ceil(
                (new Date(tender.deadline) - new Date()) / (1000 * 60 * 60 * 24)
              ),
            },
          });
        }
      }
    } catch (error) {
      console.error('❌ Ошибка проверки дедлайнов:', error);
    }
  });

  console.log('📅 Задачи запланированы:');
  console.log('   • ЕИС: каждые 30 минут');
  console.log('   • Все источники: каждый час');
  console.log('   • Проверка дедлайнов: каждый час (15 мин)');
  console.log('   • Сброс "новых": каждые 6 часов');
  console.log('   • Очистка логов: ежедневно в 3:00');
}

module.exports = { startScheduler };
