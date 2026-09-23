#!/bin/bash

# ============================================
# Запуск только бэкенда в режиме разработки
# ============================================

set -e

echo "🚀 Запуск TenderTrack Backend в режиме разработки..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден!"
    exit 1
fi

# Переход в папку сервера
cd server

# Установка зависимостей если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Запуск сервера
echo "✅ Запуск сервера на http://localhost:3001"
echo "📡 API: http://localhost:3001/api"
echo "🔌 WebSocket: ws://localhost:3001"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo ""

node --watch index.js
