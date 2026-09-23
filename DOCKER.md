# 🐳 Docker развёртывание TenderTrack

Полная инструкция по запуску TenderTrack в контейнерах Docker/Podman.

## 📋 Требования

### Для Docker:
- Docker Engine 20.10+
- Docker Compose v2.0+

### Для Podman:
- Podman 4.0+
- Podman Compose или docker-compose

### Проверка установки:
```bash
# Docker
docker --version
docker compose version

# Podman
podman --version
podman-compose --version
```

## 🚀 Быстрый старт

### 1. Клонирование и подготовка
```bash
# Перейдите в папку проекта
cd tendertrack

# Скопируйте пример конфигурации
cp .env.example .env

# (Опционально) Отредактируйте .env для настройки портов
nano .env
```

### 2. Запуск одной командой
```bash
# Сделать скрипт исполняемым (только первый раз)
chmod +x start.sh

# Запустить всё
./start.sh
```

### 3. Доступ к приложению
После запуска откройте в браузере:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Health check**: http://localhost:3001/api/health

## 📖 Подробное использование

### Автоматический запуск (start.sh)

Скрипт `start.sh` автоматически:
- Определяет Docker или Podman
- Собирает образы
- Запускает контейнеры
- Показывает URL для доступа

**Команды:**
```bash
./start.sh              # Запустить сервисы
./start.sh up           # То же самое
./start.sh down         # Остановить
./start.sh restart      # Перезапустить
./start.sh status       # Статус контейнеров
./start.sh logs         # Логи в реальном времени
./start.sh build        # Пересобрать образы
./start.sh clean        # Полная очистка (включая данные!)
./start.sh help         # Справка
```

### Ручное управление через Docker Compose

```bash
# Сборка и запуск
docker compose up -d --build

# Только запуск (без сборки)
docker compose up -d

# Остановка
docker compose down

# Остановка с удалением volumes (данные!)
docker compose down -v

# Просмотр логов
docker compose logs -f
docker compose logs backend
docker compose logs frontend

# Статус контейнеров
docker compose ps

# Перезапуск одного сервиса
docker compose restart backend

# Выполнить команду в контейнере
docker compose exec backend sh
docker compose exec frontend sh
```

### Использование с Podman

```bash
# Вариант 1: Через podman-compose
podman-compose up -d

# Вариант 2: Через docker compose (если установлен)
docker compose up -d

# Вариант 3: Через start.sh (автоматически определит podman)
./start.sh
```

## ⚙️ Конфигурация

### Переменные окружения (.env)

Скопируйте `.env.example` в `.env` и настройте:

```bash
# Порты
FRONTEND_PORT=8080    # Порт веб-интерфейса
BACKEND_PORT=3001     # Порт API

# API ключи (опционально)
ZAKUPKI_API_KEY=your_key_here
ROSELTORG_TOKEN=your_token_here
SBERBANK_AST_CERT=/path/to/cert.pem

# Интервалы синхронизации
SYNC_INTERVAL_EIS=1800
SYNC_INTERVAL_OTHER=3600
```

### Изменение портов

Если порты 8080 и 3001 заняты:

```bash
# Вариант 1: Через .env файл
echo "FRONTEND_PORT=9090" >> .env
echo "BACKEND_PORT=3002" >> .env

# Вариант 2: Через переменные окружения
FRONTEND_PORT=9090 BACKEND_PORT=3002 ./start.sh

# Вариант 3: Через docker compose
FRONTEND_PORT=9090 docker compose up -d
```

## 🗄️ Хранение данных

### База данных

SQLite база данных хранится в Docker volume `tendertrack-data`:

```bash
# Посмотреть volume
docker volume ls | grep tendertrack

# Информация о volume
docker volume inspect tendertrack-data

# Резервное копирование БД
docker run --rm \
  -v tendertrack-data:/data:ro \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data

# Восстановление из бэкапа
docker run --rm \
  -v tendertrack-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/backup-YYYYMMDD.tar.gz -C /
```

### Очистка данных

```bash
# Удалить только данные (контейнеры останутся)
docker compose down -v

# Полная очистка (контейнеры + образы + данные)
./start.sh clean
```

## 🔍 Мониторинг и отладка

### Просмотр логов

```bash
# Все логи
docker compose logs -f

# Только backend
docker compose logs -f backend

# Только frontend
docker compose logs -f frontend

# Последние 100 строк
docker compose logs --tail=100 backend
```

### Проверка здоровья

```bash
# Health check backend
curl http://localhost:3001/api/health

# Health check frontend
curl http://localhost:8080

# Статус контейнеров
docker compose ps
```

### Вход в контейнер

```bash
# Backend
docker compose exec backend sh

# Frontend
docker compose exec frontend sh

# Выполнить команду
docker compose exec backend node -e "console.log('test')"
```

### Проверка базы данных

```bash
# Войти в контейнер backend
docker compose exec backend sh

# Установить sqlite3 (если нужно)
apk add sqlite

# Подключиться к БД
sqlite3 /data/tendertrack.db

# Примеры запросов
.tables
SELECT COUNT(*) FROM tenders;
SELECT * FROM tenders LIMIT 5;
.quit
```

## 🔄 Обновление

### Обновление кода

```bash
# Получить последние изменения
git pull

# Пересобрать и перезапустить
./start.sh build
```

### Обновление только frontend

```bash
docker compose build frontend
docker compose up -d frontend
```

### Обновление только backend

```bash
docker compose build backend
docker compose up -d backend
```

## 🛡️ Безопасность

### Продакшен рекомендации

1. **Измените порты по умолчанию**
```bash
FRONTEND_PORT=8443
BACKEND_PORT=3001  # Не публикуйте без необходимости
```

2. **Используйте reverse proxy (nginx/traefik)**
```nginx
server {
    listen 443 ssl;
    server_name tendertrack.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Ограничьте доступ к API**
```bash
# Не публикуйте backend порт наружу
# Удалите строку ports из backend в docker-compose.yml
```

4. **Настройте firewall**
```bash
# Разрешите только необходимые порты
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

5. **Регулярные бэкапы**
```bash
# Добавьте в crontab
0 2 * * * /path/to/backup-script.sh
```

## 📊 Ресурсы

### Ограничения ресурсов

В `docker-compose.yml` уже настроены ограничения:

**Backend:**
- CPU: 1.0 (limit), 0.25 (reservation)
- RAM: 512M (limit), 128M (reservation)

**Frontend:**
- CPU: 0.5 (limit), 0.1 (reservation)
- RAM: 128M (limit), 32M (reservation)

### Мониторинг ресурсов

```bash
# Статистика использования ресурсов
docker stats

# Только наши контейнеры
docker stats tendertrack-backend tendertrack-frontend
```

## 🐛 Troubleshooting

### Контейнер не запускается

```bash
# Проверьте логи
docker compose logs backend

# Проверьте статус
docker compose ps

# Перезапустите
docker compose restart backend
```

### Порт уже занят

```bash
# Найдите процесс
sudo lsof -i :8080
sudo lsof -i :3001

# Или измените порт в .env
```

### Ошибка сборки

```bash
# Очистите кэш
docker compose build --no-cache

# Удалите старые образы
docker image prune -a
```

### База данных заблокирована

```bash
# Остановите контейнеры
docker compose down

# Удалите volume (ВСЕ ДАННЫЕ БУДУТ ПОТЕРЯНЫ!)
docker volume rm tendertrack-data

# Запустите заново
docker compose up -d
```

### WebSocket не работает

```bash
# Проверьте nginx конфигурацию
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Проверьте логи nginx
docker compose logs frontend | grep -i websocket
```

## 📚 Дополнительная информация

### Архитектура

```
┌─────────────────┐
│   Frontend      │  Port 8080
│   (Nginx)       │
└────────┬────────┘
         │
         │ /api/*
         │ /ws
         ▼
┌─────────────────┐
│   Backend       │  Port 3001
│   (Node.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQLite DB     │  Volume: tendertrack-data
│   /data/*.db    │
└─────────────────┘
```

### Сеть

Контейнеры общаются через внутреннюю сеть `tendertrack-network`:
- Frontend → Backend: `http://backend:3001`
- Backend доступен только внутри сети (если не опубликован порт)

### Volumes

- `tendertrack-data` — база данных SQLite (сохраняется между перезапусками)

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `./start.sh logs`
2. Проверьте статус: `./start.sh status`
3. Попробуйте перезапустить: `./start.sh restart`
4. В крайнем случае: `./start.sh clean && ./start.sh`

---

**TenderTrack** — Профессиональная система мониторинга тендеров
