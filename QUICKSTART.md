# 🚀 Быстрый старт TenderTrack

## Запуск приложения

### 1. Фронтенд (уже собран)
Фронтенд уже собран и готов к работе. Откройте `dist/index.html` в браузере или запустите:

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

### 2. Бэкенд (опционально)

Для работы с реальными данными запустите бэкенд:

```bash
# Перейдите в папку сервера
cd server

# Запустите сервер
node index.js
```

Сервер будет доступен на `http://localhost:3001`

После запуска бэкенда фронтенд автоматически переключится на работу с API.

## Структура проекта

```
tendertrack/
├── dist/                    # Собранный фронтенд
├── server/                  # Бэкенд
│   ├── index.js            # Главный файл сервера
│   ├── api.js              # REST API
│   ├── db.js               # База данных SQLite
│   ├── websocket.js        # WebSocket сервер
│   ├── scheduler.js        # Планировщик задач
│   └── sources/            # Адаптеры источников
│       ├── SourceManager.js
│       ├── ZakupkiGovSource.js
│       ├── RoseltorgSource.js
│       ├── SberbankAstSource.js
│       ├── FabrikantSource.js
│       ├── B2BCenterSource.js
│       └── CustomRSSSource.js
├── src/                     # Исходный код фронтенда
└── README.md               # Полная документация
```

## Режимы работы

### 🟡 Локальный режим (без бэкенда)
- Работает с demo-данными
- Все функции доступны
- Данные не сохраняются между сессиями

### 🟢 Полный режим (с бэкендом)
- Реальные данные из 6+ источников
- Автоматическая синхронизация
- Сохранение в базу данных
- Real-time уведомления
- Экспорт данных

## API Endpoints

После запуска бэкенда доступны:

- `GET http://localhost:3001/api/tenders` — список тендеров
- `GET http://localhost:3001/api/sources` — источники
- `POST http://localhost:3001/api/sources/sync` — синхронизация
- `GET http://localhost:3001/api/stats` — статистика
- `GET http://localhost:3001/api/health` — статус сервера

## Настройка источников

Для подключения к реальным API нужно:

1. Получить API ключи у провайдеров:
   - zakupki.gov.ru — требуется ЭЦП
   - roseltorg.ru — авторизация
   - sberbank-ast.ru — SOAP API

2. Добавить ключи в `.env` файл:
```env
ZAKUPKI_API_KEY=your_key
ROSELTORG_TOKEN=your_token
```

3. Обновить адаптеры в `server/sources/`

По умолчанию используются demo-данные для демонстрации.

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск фронтенда в режиме разработки
npm run dev

# Запуск бэкенда (в другом терминале)
cd server && node index.js
```

## Документация

Полная документация в файле `README.md`
