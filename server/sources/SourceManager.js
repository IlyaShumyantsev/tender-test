/**
 * Менеджер источников тендеров
 * Управляет подключением, синхронизацией и мониторингом источников
 */

const { ZakupkiGovSource } = require('./ZakupkiGovSource');
const { RoseltorgSource } = require('./RoseltorgSource');
const { SberbankAstSource } = require('./SberbankAstSource');
const { FabrikantSource } = require('./FabrikantSource');
const { B2BCenterSource } = require('./B2BCenterSource');
const { CustomRSSSource } = require('./CustomRSSSource');

class SourceManager {
  constructor(db) {
    this.db = db;
    this.sources = new Map();
    this.syncing = new Set();
  }

  async initialize() {
    // Загружаем источники из БД
    const dbSources = this.db.prepare('SELECT * FROM sources').all();

    if (dbSources.length === 0) {
      // Инициализация стандартных источников
      await this.initDefaultSources();
    } else {
      // Загружаем существующие
      for (const s of dbSources) {
        const adapter = this.createAdapter(s);
        if (adapter) {
          this.sources.set(s.id, { config: s, adapter });
        }
      }
    }
  }

  async initDefaultSources() {
    const defaultSources = [
      {
        id: 'zakupki_gov',
        name: 'ЕИС Закупки (zakupki.gov.ru)',
        type: 'zakupki_gov',
        url: 'https://zakupki.gov.ru',
        enabled: 1,
        sync_interval: 3600,
        config: JSON.stringify({ apiVersion: 'v2', pageSize: 100 }),
        stats: JSON.stringify({ totalFetched: 0, lastSync: null }),
      },
      {
        id: 'roseltorg',
        name: 'Росэлторг',
        type: 'roseltorg',
        url: 'https://www.roseltorg.ru',
        enabled: 1,
        sync_interval: 1800,
        config: JSON.stringify({ categories: ['construction', 'it', 'medical'] }),
        stats: JSON.stringify({ totalFetched: 0, lastSync: null }),
      },
      {
        id: 'sberbank_ast',
        name: 'Сбербанк-АСТ',
        type: 'sberbank_ast',
        url: 'https://www.sberbank-ast.ru',
        enabled: 1,
        sync_interval: 3600,
        config: JSON.stringify({}),
        stats: JSON.stringify({ totalFetched: 0, lastSync: null }),
      },
      {
        id: 'fabrikant',
        name: 'Фабрикант',
        type: 'fabrikant',
        url: 'https://www.fabrikant.ru',
        enabled: 1,
        sync_interval: 7200,
        config: JSON.stringify({}),
        stats: JSON.stringify({ totalFetched: 0, lastSync: null }),
      },
      {
        id: 'b2b_center',
        name: 'B2B-Center',
        type: 'b2b_center',
        url: 'https://www.b2b-center.ru',
        enabled: 1,
        sync_interval: 3600,
        config: JSON.stringify({}),
        stats: JSON.stringify({ totalFetched: 0, lastSync: null }),
      },
      {
        id: 'custom_rss',
        name: 'RSS-ленты закупок',
        type: 'custom_rss',
        url: 'https://zakupki.gov.ru/epz/order/extendedsearch/rss.html',
        enabled: 0,
        sync_interval: 900,
        config: JSON.stringify({
          feeds: [
            'https://zakupki.gov.ru/epz/order/extendedsearch/rss.html',
          ],
        }),
        stats: JSON.stringify({ totalFetched: 0, lastSync: null }),
      },
    ];

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO sources (id, name, type, url, enabled, sync_interval, config, stats)
      VALUES (@id, @name, @type, @url, @enabled, @sync_interval, @config, @stats)
    `);

    for (const source of defaultSources) {
      insert.run(source);
      const adapter = this.createAdapter(source);
      if (adapter) {
        this.sources.set(source.id, { config: source, adapter });
      }
    }
  }

  createAdapter(sourceConfig) {
    const config = typeof sourceConfig.config === 'string' 
      ? JSON.parse(sourceConfig.config) 
      : sourceConfig.config;

    switch (sourceConfig.type) {
      case 'zakupki_gov':
        return new ZakupkiGovSource(config);
      case 'roseltorg':
        return new RoseltorgSource(config);
      case 'sberbank_ast':
        return new SberbankAstSource(config);
      case 'fabrikant':
        return new FabrikantSource(config);
      case 'b2b_center':
        return new B2BCenterSource(config);
      case 'custom_rss':
        return new CustomRSSSource(config);
      default:
        console.warn(`Неизвестный тип источника: ${sourceConfig.type}`);
        return null;
    }
  }

  getSourcesCount() {
    return this.sources.size;
  }

  getEnabledSources() {
    return Array.from(this.sources.entries())
      .filter(([_, s]) => s.config.enabled)
      .map(([id, s]) => ({ id, ...s }));
  }

  async syncSource(sourceId) {
    if (this.syncing.has(sourceId)) {
      console.log(`⏳ Источник ${sourceId} уже синхронизируется`);
      return;
    }

    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error(`Источник ${sourceId} не найден`);
    }

    this.syncing.add(sourceId);
    const startTime = new Date();

    // Записываем начало синхронизации
    const logId = this.db.prepare(`
      INSERT INTO sync_logs (source_id, status, started_at)
      VALUES (?, 'running', ?)
    `).run(sourceId, startTime.toISOString()).lastInsertRowid;

    try {
      console.log(`🔄 Синхронизация источника: ${source.config.name}`);

      // Получаем тендеры из источника
      const tenders = await source.adapter.fetch();

      let added = 0;
      let updated = 0;

      // Сохраняем в БД
      for (const tender of tenders) {
        const result = this.saveTender(sourceId, tender);
        if (result === 'added') added++;
        else if (result === 'updated') updated++;
      }

      // Обновляем статистику источника
      const stats = typeof source.config.stats === 'string' 
        ? JSON.parse(source.config.stats) 
        : source.config.stats;
      
      stats.totalFetched = (stats.totalFetched || 0) + tenders.length;
      stats.lastSync = new Date().toISOString();

      this.db.prepare(`
        UPDATE sources SET last_sync = ?, stats = ? WHERE id = ?
      `).run(new Date().toISOString(), JSON.stringify(stats), sourceId);

      // Записываем лог
      this.db.prepare(`
        UPDATE sync_logs 
        SET status = 'completed', tenders_found = ?, tenders_added = ?, tenders_updated = ?, finished_at = ?
        WHERE id = ?
      `).run(tenders.length, added, updated, new Date().toISOString(), logId);

      console.log(`✅ ${source.config.name}: найдено ${tenders.length}, добавлено ${added}, обновлено ${updated}`);

      return { found: tenders.length, added, updated };
    } catch (error) {
      // Записываем ошибку
      this.db.prepare(`
        UPDATE sync_logs 
        SET status = 'error', errors = ?, finished_at = ?
        WHERE id = ?
      `).run(error.message, new Date().toISOString(), logId);

      console.error(`❌ Ошибка синхронизации ${source.config.name}:`, error.message);
      throw error;
    } finally {
      this.syncing.delete(sourceId);
    }
  }

  async syncAll() {
    const enabledSources = this.getEnabledSources();
    const results = {};

    for (const source of enabledSources) {
      try {
        results[source.id] = await this.syncSource(source.id);
      } catch (error) {
        results[source.id] = { error: error.message };
      }
    }

    return results;
  }

  saveTender(sourceId, tender) {
    // Проверяем существование
    const existing = this.db.prepare(
      'SELECT id FROM tenders WHERE external_id = ? AND source_id = ?'
    ).get(tender.externalId || tender.id, sourceId);

    if (existing) {
      // Обновляем
      this.db.prepare(`
        UPDATE tenders SET
          title = COALESCE(?, title),
          organization = COALESCE(?, organization),
          status = COALESCE(?, status),
          budget = COALESCE(?, budget),
          deadline = COALESCE(?, deadline),
          description = COALESCE(?, description),
          requirements = COALESCE(?, requirements),
          participants_count = COALESCE(?, participants_count),
          raw_data = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        tender.title,
        tender.organization,
        tender.status,
        tender.budget,
        tender.deadline,
        tender.description,
        JSON.stringify(tender.requirements || []),
        tender.participantsCount || 0,
        JSON.stringify(tender),
        existing.id
      );
      return 'updated';
    }

    // Добавляем новый
    const id = tender.id || `${sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.db.prepare(`
      INSERT INTO tenders (
        id, external_id, source_id, title, organization, category, status,
        budget, currency, region, publish_date, deadline, description,
        requirements, contact_person, contact_email, contact_phone, url, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tender.externalId || tender.id,
      sourceId,
      tender.title,
      tender.organization,
      tender.category || 'other',
      tender.status || 'active',
      tender.budget || 0,
      tender.currency || 'RUB',
      tender.region || '',
      tender.publishDate || new Date().toISOString().split('T')[0],
      tender.deadline || '',
      tender.description || '',
      JSON.stringify(tender.requirements || []),
      tender.contactPerson || '',
      tender.contactEmail || '',
      tender.contactPhone || '',
      tender.url || '',
      JSON.stringify(tender)
    );

    return 'added';
  }
}

module.exports = { SourceManager };
