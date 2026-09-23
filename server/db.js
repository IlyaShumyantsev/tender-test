/**
 * Работа с базой данных SQLite
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tendertrack.db');

function initDatabase() {
  const db = new Database(DB_PATH);

  // Настройки производительности
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache

  // Создание таблиц
  db.exec(`
    -- Тендеры
    CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY,
      external_id TEXT,
      source_id TEXT NOT NULL,
      title TEXT NOT NULL,
      organization TEXT,
      category TEXT,
      status TEXT DEFAULT 'active',
      budget REAL,
      currency TEXT DEFAULT 'RUB',
      region TEXT,
      publish_date TEXT,
      deadline TEXT,
      description TEXT,
      requirements TEXT, -- JSON array
      contact_person TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      url TEXT,
      raw_data TEXT, -- JSON с оригинальными данными
      is_favorite INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 1,
      views_count INTEGER DEFAULT 0,
      participants_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Источники
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT,
      api_key TEXT,
      enabled INTEGER DEFAULT 1,
      last_sync TEXT,
      sync_interval INTEGER DEFAULT 3600,
      config TEXT, -- JSON с настройками
      stats TEXT, -- JSON со статистикой
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Логи синхронизации
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT,
      status TEXT,
      tenders_found INTEGER DEFAULT 0,
      tenders_added INTEGER DEFAULT 0,
      tenders_updated INTEGER DEFAULT 0,
      errors TEXT,
      started_at TEXT,
      finished_at TEXT
    );

    -- Избранное (отдельная таблица для быстрого доступа)
    CREATE TABLE IF NOT EXISTS favorites (
      tender_id TEXT PRIMARY KEY,
      added_at TEXT DEFAULT (datetime('now')),
      notes TEXT
    );

    -- Индексы для быстрого поиска
    CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
    CREATE INDEX IF NOT EXISTS idx_tenders_category ON tenders(category);
    CREATE INDEX IF NOT EXISTS idx_tenders_region ON tenders(region);
    CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(deadline);
    CREATE INDEX IF NOT EXISTS idx_tenders_publish_date ON tenders(publish_date);
    CREATE INDEX IF NOT EXISTS idx_tenders_source ON tenders(source_id);
    CREATE INDEX IF NOT EXISTS idx_tenders_external_id ON tenders(external_id);
  `);

  return db;
}

module.exports = { initDatabase, DB_PATH };
