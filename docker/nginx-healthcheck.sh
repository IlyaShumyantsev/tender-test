#!/bin/sh
# Healthcheck для nginx контейнера
# Проверяет доступность фронтенда

set -e

# Используем wget (доступен в alpine) или curl
if command -v wget >/dev/null 2>&1; then
    if ! wget --quiet --spider --timeout=3 http://localhost:80/; then
        echo "Frontend not available"
        exit 1
    fi
elif command -v curl >/dev/null 2>&1; then
    if ! curl -sf --max-time 3 http://localhost:80/ >/dev/null; then
        echo "Frontend not available"
        exit 1
    fi
else
    # Если нет ни wget, ни curl, просто проверяем что nginx запущен
    if ! pgrep nginx >/dev/null 2>&1; then
        echo "Nginx not running"
        exit 1
    fi
fi

echo "Frontend healthy"
exit 0
