#!/bin/sh
# Healthcheck для nginx контейнера
# Проверяет доступность фронтенда и backend API

set -e

# Проверка фронтенда
if ! wget --quiet --spider --timeout=3 http://localhost:80/; then
    echo "Frontend not available"
    exit 1
fi

# Проверка backend через nginx proxy
if ! wget --quiet --spider --timeout=3 http://localhost:80/api/health; then
    echo "Backend API not available through proxy"
    exit 1
fi

echo "All services healthy"
exit 0
