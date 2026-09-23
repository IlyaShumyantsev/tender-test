/**
 * TenderTrack Server — Бэкенд для сбора тендеров
 * 
 * Архитектура:
 * - Express REST API
 * - SQLite база данных
 * - Модульные адаптеры для источников
 * - Cron-планировщик для автообновления
 * - WebSocket для real-time уведомлений
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { initDatabase } = require('./db');
const { setupAPI } = require('./api');
const { setupWebSocket } = require('./websocket');
const { startScheduler } = require('./scheduler');
const { SourceManager } = require('./sources/SourceManager');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы фронтенда
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Инициализация
async function start() {
  console.log('🚀 TenderTrack Server запускается...');
  
  // 1. Инициализация БД
  const db = initDatabase();
  console.log('✅ База данных инициализирована');

  // 2. Менеджер источников
  const sourceManager = new SourceManager(db);
  await sourceManager.initialize();
  console.log(`✅ Загружено ${sourceManager.getSourcesCount()} источников`);

  // 3. REST API
  setupAPI(app, db, sourceManager);
  console.log('✅ REST API настроен');

  // 4. WebSocket
  const wss = setupWebSocket(server);
  console.log('✅ WebSocket сервер запущен');

  // 5. Планировщик
  startScheduler(sourceManager, wss, db);
  console.log('✅ Планировщик задач запущен');

  // 6. SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });

  // Запуск сервера
  server.listen(PORT, () => {
    console.log(`\n🎉 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`\n📋 Доступные эндпоинты:`);
    console.log(`   GET  /api/tenders        — список тендеров`);
    console.log(`   GET  /api/tenders/:id     — детали тендера`);
    console.log(`   GET  /api/sources         — список источников`);
    console.log(`   POST /api/sources/sync    — синхронизация`);
    console.log(`   GET  /api/stats           — статистика`);
    console.log(`   GET  /api/health          — проверка здоровья`);
  });
}

start().catch(err => {
  console.error('❌ Ошибка запуска сервера:', err);
  process.exit(1);
});
