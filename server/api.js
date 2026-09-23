/**
 * REST API для TenderTrack
 */

function setupAPI(app, db, sourceManager) {
  const apiRouter = require('express').Router();

  // === ТЕНДЕРЫ ===

  // GET /api/tenders — список тендеров с фильтрацией
  apiRouter.get('/tenders', (req, res) => {
    try {
      const {
        search,
        category,
        status,
        region,
        budgetMin,
        budgetMax,
        sortBy = 'publish_date',
        sortOrder = 'DESC',
        limit = 50,
        offset = 0,
        favoritesOnly,
        newOnly,
        source,
      } = req.query;

      let query = 'SELECT * FROM tenders WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (title LIKE ? OR organization LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (region) {
        query += ' AND region = ?';
        params.push(region);
      }

      if (budgetMin) {
        query += ' AND budget >= ?';
        params.push(Number(budgetMin));
      }

      if (budgetMax) {
        query += ' AND budget <= ?';
        params.push(Number(budgetMax));
      }

      if (favoritesOnly === 'true') {
        query += ' AND is_favorite = 1';
      }

      if (newOnly === 'true') {
        query += ' AND is_new = 1';
      }

      if (source) {
        query += ' AND source_id = ?';
        params.push(source);
      }

      // Сортировка
      const allowedSortFields = ['publish_date', 'deadline', 'budget', 'title', 'created_at'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'publish_date';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortField} ${order}`;

      // Пагинация
      query += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const tenders = db.prepare(query).all(...params);

      // Подсчёт общего количества
      let countQuery = 'SELECT COUNT(*) as total FROM tenders WHERE 1=1';
      const countParams = [];

      if (search) {
        countQuery += ' AND (title LIKE ? OR organization LIKE ? OR description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (category) { countQuery += ' AND category = ?'; countParams.push(category); }
      if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
      if (region) { countQuery += ' AND region = ?'; countParams.push(region); }
      if (budgetMin) { countQuery += ' AND budget >= ?'; countParams.push(Number(budgetMin)); }
      if (budgetMax) { countQuery += ' AND budget <= ?'; countParams.push(Number(budgetMax)); }
      if (favoritesOnly === 'true') { countQuery += ' AND is_favorite = 1'; }
      if (newOnly === 'true') { countQuery += ' AND is_new = 1'; }
      if (source) { countQuery += ' AND source_id = ?'; countParams.push(source); }

      const { total } = db.prepare(countQuery).get(...countParams);

      // Форматирование
      const formatted = tenders.map(formatTender);

      res.json({
        success: true,
        data: formatted,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total,
        },
      });
    } catch (error) {
      console.error('Error fetching tenders:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/tenders/:id — детали тендера
  apiRouter.get('/tenders/:id', (req, res) => {
    try {
      const tender = db.prepare('SELECT * FROM tenders WHERE id = ?').get(req.params.id);
      if (!tender) {
        return res.status(404).json({ success: false, error: 'Тендер не найден' });
      }

      // Увеличить счётчик просмотров
      db.prepare('UPDATE tenders SET views_count = views_count + 1 WHERE id = ?').run(req.params.id);

      res.json({ success: true, data: formatTender({ ...tender, views_count: tender.views_count + 1 }) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/tenders/:id/favorite — добавить/убрать из избранного
  apiRouter.post('/tenders/:id/favorite', (req, res) => {
    try {
      const { favorite } = req.body;
      db.prepare('UPDATE tenders SET is_favorite = ? WHERE id = ?').run(favorite ? 1 : 0, req.params.id);
      
      if (favorite) {
        db.prepare('INSERT OR REPLACE INTO favorites (tender_id) VALUES (?)').run(req.params.id);
      } else {
        db.prepare('DELETE FROM favorites WHERE tender_id = ?').run(req.params.id);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // === ИСТОЧНИКИ ===

  // GET /api/sources — список источников
  apiRouter.get('/sources', (req, res) => {
    try {
      const sources = db.prepare('SELECT * FROM sources').all();
      const formatted = sources.map(s => ({
        ...s,
        enabled: Boolean(s.enabled),
        config: s.config ? JSON.parse(s.config) : {},
        stats: s.stats ? JSON.parse(s.stats) : {},
      }));
      res.json({ success: true, data: formatted });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sources/sync — запустить синхронизацию
  apiRouter.post('/sources/sync', async (req, res) => {
    try {
      const { sourceId } = req.body;
      
      res.json({ success: true, message: 'Синхронизация запущена' });

      // Запуск в фоне
      setImmediate(async () => {
        try {
          if (sourceId) {
            await sourceManager.syncSource(sourceId);
          } else {
            await sourceManager.syncAll();
          }
        } catch (err) {
          console.error('Sync error:', err);
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sources/:id/toggle — включить/выключить источник
  apiRouter.post('/sources/:id/toggle', (req, res) => {
    try {
      const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.id);
      if (!source) {
        return res.status(404).json({ success: false, error: 'Источник не найден' });
      }

      db.prepare('UPDATE sources SET enabled = ? WHERE id = ?').run(source.enabled ? 0 : 1, req.params.id);
      res.json({ success: true, enabled: !source.enabled });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // === СТАТИСТИКА ===

  // GET /api/stats — общая статистика
  apiRouter.get('/stats', (req, res) => {
    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM tenders').get().count;
      const active = db.prepare("SELECT COUNT(*) as count FROM tenders WHERE status = 'active'").get().count;
      const upcoming = db.prepare("SELECT COUNT(*) as count FROM tenders WHERE status = 'upcoming'").get().count;
      const closed = db.prepare("SELECT COUNT(*) as count FROM tenders WHERE status = 'closed'").get().count;
      const evaluation = db.prepare("SELECT COUNT(*) as count FROM tenders WHERE status = 'evaluation'").get().count;
      const favorites = db.prepare("SELECT COUNT(*) as count FROM tenders WHERE is_favorite = 1").get().count;
      const newTenders = db.prepare("SELECT COUNT(*) as count FROM tenders WHERE is_new = 1").get().count;

      const totalBudget = db.prepare('SELECT COALESCE(SUM(budget), 0) as sum FROM tenders WHERE status = ?').get('active').sum;

      const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM tenders 
        GROUP BY category 
        ORDER BY count DESC
      `).all();

      const byRegion = db.prepare(`
        SELECT region, COUNT(*) as count 
        FROM tenders 
        WHERE region IS NOT NULL AND region != ''
        GROUP BY region 
        ORDER BY count DESC 
        LIMIT 10
      `).all();

      const bySource = db.prepare(`
        SELECT s.name, s.id, COUNT(t.id) as count 
        FROM sources s 
        LEFT JOIN tenders t ON t.source_id = s.id 
        GROUP BY s.id 
        ORDER BY count DESC
      `).all();

      const recentSyncs = db.prepare(`
        SELECT sl.*, s.name as source_name 
        FROM sync_logs sl 
        JOIN sources s ON s.id = sl.source_id 
        ORDER BY sl.started_at DESC 
        LIMIT 10
      `).all();

      res.json({
        success: true,
        data: {
          total,
          active,
          upcoming,
          closed,
          evaluation,
          favorites,
          newTenders,
          totalBudget,
          byCategory,
          byRegion,
          bySource,
          recentSyncs,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // === HEALTH CHECK ===
  apiRouter.get('/health', (req, res) => {
    const tendersCount = db.prepare('SELECT COUNT(*) as count FROM tenders').get().count;
    const sourcesCount = db.prepare('SELECT COUNT(*) as count FROM sources WHERE enabled = 1').get().count;

    res.json({
      success: true,
      status: 'healthy',
      uptime: process.uptime(),
      tendersCount,
      activeSources: sourcesCount,
      timestamp: new Date().toISOString(),
    });
  });

  // === EXPORT ===

  // GET /api/export/csv
  apiRouter.get('/export/csv', (req, res) => {
    try {
      const tenders = db.prepare('SELECT * FROM tenders ORDER BY publish_date DESC LIMIT 1000').all();
      
      const headers = ['Название', 'Организация', 'Категория', 'Статус', 'Бюджет', 'Регион', 'Дата публикации', 'Дедлайн', 'Источник'];
      const rows = tenders.map(t => [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.organization || '').replace(/"/g, '""')}"`,
        t.category || '',
        t.status || '',
        t.budget || 0,
        t.region || '',
        t.publish_date || '',
        t.deadline || '',
        t.source_id || '',
      ]);

      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const bom = '\uFEFF';

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=tenders_${Date.now()}.csv`);
      res.send(bom + csv);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/export/json
  apiRouter.get('/export/json', (req, res) => {
    try {
      const tenders = db.prepare('SELECT * FROM tenders ORDER BY publish_date DESC LIMIT 1000').all();
      const formatted = tenders.map(formatTender);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=tenders_${Date.now()}.json`);
      res.json({ success: true, data: formatted, exportedAt: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Подключение роутера
  app.use('/api', apiRouter);
}

// Форматирование тендера для API
function formatTender(t) {
  return {
    id: t.id,
    externalId: t.external_id,
    sourceId: t.source_id,
    title: t.title,
    organization: t.organization,
    category: t.category,
    status: t.status,
    budget: t.budget,
    currency: t.currency,
    region: t.region,
    publishDate: t.publish_date,
    deadline: t.deadline,
    description: t.description,
    requirements: t.requirements ? JSON.parse(t.requirements) : [],
    contactPerson: t.contact_person,
    contactEmail: t.contact_email,
    contactPhone: t.contact_phone,
    url: t.url,
    isFavorite: Boolean(t.is_favorite),
    isNew: Boolean(t.is_new),
    viewsCount: t.views_count,
    participantsCount: t.participants_count,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

module.exports = { setupAPI };
