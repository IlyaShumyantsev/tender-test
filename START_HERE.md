# 🚀 Быстрый старт — TenderTrack

## Запуск через Docker/Podman (ОДНОЙ КОМАНДОЙ)

```bash
# 1. Сделать скрипт исполняемым (только первый раз)
chmod +x start.sh

# 2. Запустить всё
./start.sh
```

Готово! Откройте http://localhost:8080

### Если нет podman-compose

Скрипт автоматически определит это и переключится на `podman-run.sh` — запуск через обычные podman команды без compose. Ничего дополнительно устанавливать не нужно!

Или запустите напрямую:
```bash
chmod +x podman-run.sh
./podman-run.sh
```

---

## Что делает start.sh

Скрипт автоматически:
- ✅ Определяет Docker или Podman
- ✅ Собирает образы фронтенда и бэкенда
- ✅ Запускает контейнеры
- ✅ Настраивает сеть между ними
- ✅ Создаёт volume для базы данных
- ✅ Показывает URL для доступа

---

## Полезные команды

```bash
./start.sh              # Запустить
./start.sh up           # То же самое
./start.sh down         # Остановить
./start.sh restart      # Перезапустить
./start.sh status       # Статус контейнеров
./start.sh logs         # Логи в реальном времени
./start.sh build        # Пересобрать образы
./start.sh clean        # Полная очистка (включая данные!)
./start.sh help         # Справка
```

---

## Доступ к приложению

После запуска:
- 🌐 **Frontend**: http://localhost:8080
- 🔌 **Backend API**: http://localhost:3001/api
- 📊 **Health check**: http://localhost:3001/api/health

---

## Изменение портов

Создайте файл `.env`:

```bash
cp .env.example .env
nano .env
```

Измените:
```
FRONTEND_PORT=9090
BACKEND_PORT=3002
```

Перезапустите:
```bash
./start.sh restart
```

---

## Структура контейнеров

```
┌─────────────────┐
│   Frontend      │  Port 8080 (nginx)
│   React + Vite  │
└────────┬────────┘
         │
         │ /api/*
         │ /ws
         ▼
┌─────────────────┐
│   Backend       │  Port 3001 (Node.js)
│   Express API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQLite DB     │  Volume: tendertrack-data
│   /data/*.db    │  (сохраняется между запусками)
└─────────────────┘
```

---

## Ручное управление (без start.sh)

```bash
# Docker Compose
docker compose up -d
docker compose down
docker compose logs -f

# Podman Compose
podman-compose up -d
podman-compose down
podman-compose logs -f
```

---

## Требования

### Для Docker:
- Docker Engine 20.10+
- Docker Compose v2.0+

### Для Podman:
- Podman 4.0+
- podman-compose или docker-compose

Проверка:
```bash
docker --version
docker compose version

# или

podman --version
podman-compose --version
```

---

## Решение проблем

### Контейнер не запускается
```bash
./start.sh logs
```

### Порт занят
```bash
# Измените порт в .env
echo "FRONTEND_PORT=9090" >> .env
./start.sh restart
```

### Полная очистка
```bash
./start.sh clean
./start.sh
```

---

## Документация

- 📘 [DOCKER.md](DOCKER.md) — полная документация по Docker
- 📗 [README.md](README.md) — общая документация проекта
- 📙 [QUICKSTART.md](QUICKSTART.md) — быстрый старт для разработки

---

**TenderTrack** — Профессиональная система мониторинга тендеров
