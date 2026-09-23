# TenderTrack — Система отслеживания тендеров

Полноценное веб-приложение для мониторинга и отслеживания государственных и коммерческих тендеров с множества источников.

## 🚀 Возможности

### Фронтенд (React + Vite)
- 📊 **Дашборд** — обзорная статистика и аналитика
- 🔍 **Умный поиск** — по названию, организации, описанию
- 🎯 **Фильтрация** — по категориям, регионам, бюджету, статусам
- ⭐ **Избранное** — сохранение важных тендеров
- 📥 **Экспорт** — CSV, JSON, HTML отчёты, PDF
- 📱 **Адаптивный дизайн** — работает на всех устройствах
- 🎨 **Современный UI** — чистый и интуитивный интерфейс

### Бэкенд (Node.js + Express)
- 🔄 **Автоматический сбор** тендеров с 6+ источников
- 📡 **Real-time уведомления** через WebSocket
- 🗄️ **SQLite база данных** — быстрая и надёжная
- ⏰ **Планировщик задач** — автоматическая синхронизация
- 🔌 **REST API** — полный CRUD для тендеров
- 📊 **Аналитика** — статистика по источникам, категориям, регионам

## 📦 Источники тендеров

1. **ЕИС Закупки** (zakupki.gov.ru) — основной государственный источник
2. **Росэлторг** (roseltorg.ru) — крупнейшая электронная площадка
3. **Сбербанк-АСТ** (sberbank-ast.ru) — площадка Сбербанк-АСТ
4. **Фабрикант** (fabrikant.ru) — коммерческие закупки
5. **B2B-Center** (b2b-center.ru) — B2B тендеры
6. **RSS-ленты** — настраиваемые RSS-фиды

## 🛠️ Установка и запуск

### Требования
- Node.js 18+ 
- npm 9+

### Установка зависимостей

```bash
# Установка всех зависимостей
npm install
```

### Запуск в режиме разработки

```bash
# Терминал 1: Запуск бэкенда
npm run server

# Терминал 2: Запуск фронтенда
npm run dev
```

### Сборка для продакшена

```bash
# Сборка фронтенда
npm run build

# Запуск продакшен сервера (фронтенд + бэкенд)
npm run start
```

### Запуск только бэкенда

```bash
npm run server
```

Сервер будет доступен на `http://localhost:3001`

## 📡 API Endpoints

### Тендеры
- `GET /api/tenders` — список тендеров с фильтрацией
- `GET /api/tenders/:id` — детали тендера
- `POST /api/tenders/:id/favorite` — добавить/убрать из избранного

### Источники
- `GET /api/sources` — список источников
- `POST /api/sources/sync` — запустить синхронизацию
- `POST /api/sources/:id/toggle` — включить/выключить источник

### Статистика и экспорт
- `GET /api/stats` — общая статистика
- `GET /api/export/csv` — экспорт в CSV
- `GET /api/export/json` — экспорт в JSON
- `GET /api/health` — проверка здоровья сервера

### Параметры фильтрации `/api/tenders`
```
?search=текст              — поиск по названию/организации
&category=it               — категория
&status=active             — статус
&region=Москва             — регион
&budgetMin=1000000         — минимальный бюджет
&budgetMax=10000000        — максимальный бюджет
&sortBy=publish_date       — сортировка (publish_date, budget, deadline, title)
&sortOrder=DESC            — направление сортировки
&limit=50                  — количество записей
&offset=0                  — смещение
&favoritesOnly=true        — только избранные
&newOnly=true              — только новые
&source=zakupki_gov        — фильтр по источнику
```

## 🔌 WebSocket

Подключение: `ws://localhost:3001`

### События
- `connected` — успешное подключение
- `new_tender` — новый тендер добавлен
- `sync_status` — статус синхронизации
- `deadline_warning` — предупреждение о дедлайне
- `error` — ошибка

### Пример подписки
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: ['new_tender', 'sync_status']
  }));
};
```

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Порт сервера
PORT=3001

# API ключи (для реальных источников)
ZAKUPKI_API_KEY=your_api_key_here
ROSELTORG_TOKEN=your_token_here
SBERBANK_AST_CERT=/path/to/cert.pem

# Интервалы синхронизации (в секундах)
SYNC_INTERVAL_EIS=1800
SYNC_INTERVAL_OTHER=3600
```

### Настройка источников

Источники настраиваются в файле `server/sources/SourceManager.js` в методе `initDefaultSources()`.

Для подключения реальных API:
1. Получите API ключи/токены у провайдеров
2. Добавьте их в `.env` файл
3. Обновите соответствующие адаптеры в `server/sources/`

## 📊 Архитектура

```
tendertrack/
├── server/                    # Бэкенд
│   ├── index.js              # Главный файл сервера
│   ├── api.js                # REST API
│   ├── db.js                 # Работа с БД
│   ├── websocket.js          # WebSocket сервер
│   ├── scheduler.js          # Планировщик задач
│   ├── sources/              # Адаптеры источников
│   │   ├── SourceManager.js  # Менеджер источников
│   │   ├── BaseSource.js     # Базовый класс
│   │   ├── ZakupkiGovSource.js
│   │   ├── RoseltorgSource.js
│   │   ├── SberbankAstSource.js
│   │   ├── FabrikantSource.js
│   │   ├── B2BCenterSource.js
│   │   └── CustomRSSSource.js
│   └── tendertrack.db        # SQLite база данных
├── src/                       # Фронтенд (React)
│   ├── App.tsx               # Главный компонент
│   ├── types.ts              # TypeScript типы
│   ├── data.ts               # Mock данные
│   └── components/           # React компоненты
│       ├── Sidebar.tsx
│       ├── Dashboard.tsx
│       ├── TenderCard.tsx
│       ├── TenderDetail.tsx
│       ├── Filters.tsx
│       └── ExportModal.tsx
└── package.json
```

## 🔐 Безопасность

### Для продакшена рекомендуется:
1. **HTTPS** — используйте reverse proxy (nginx) с SSL
2. **Авторизация** — добавьте JWT или session-based auth
3. **Rate limiting** — ограничьте количество запросов
4. **Валидация** — проверяйте все входные данные
5. **CORS** — настройте разрешённые домены
6. **API ключи** — храните в переменных окружения, не в коде

### Пример nginx конфигурации:
```nginx
server {
    listen 443 ssl;
    server_name tendertrack.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Мониторинг

### Логи
- Сервер выводит логи в консоль
- История синхронизации хранится в таблице `sync_logs`
- Просмотр: `SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 10`

### Метрики
- `GET /api/health` — статус сервера, uptime, количество тендеров

## 🐛 Troubleshooting

### Ошибка подключения к источникам
- Проверьте интернет-соединение
- Убедитесь, что API ключи действительны
- Проверьте логи: `npm run server`

### База данных заблокирована
- SQLite поддерживает только одну запись одновременно
- Проверьте, что нет зависших процессов
- Удалите файл `tendertrack.db` для сброса (данные потеряются!)

### WebSocket не подключается
- Проверьте, что порт 3001 открыт
- Убедитесь, что CORS настроен правильно
- Проверьте firewall/антивирус

## 📝 Лицензия

MIT

## 🤝 Поддержка

При возникновении проблем создайте issue в репозитории.

---

**TenderTrack** — профессиональная система мониторинга тендеров для бизнеса
