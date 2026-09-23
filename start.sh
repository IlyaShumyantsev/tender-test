#!/bin/bash

# ============================================
# TenderTrack — Скрипт запуска
# Поддержка Docker и Podman
# ============================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции вывода
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# ============================================
# Проверка зависимостей
# ============================================

# Определяем доступный контейнерный движок
if command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
    success "Docker найден: $(docker --version)"
elif command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    success "Podman найден: $(podman --version)"
else
    error "Не найден Docker или Podman!"
    echo "Установите Docker: https://docs.docker.com/get-docker/"
    echo "Или Podman: https://podman.io/getting-started/installation"
    exit 1
fi

# Определяем compose команду
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    success "docker-compose найден"
elif $CONTAINER_CMD compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="$CONTAINER_CMD compose"
    success "$CONTAINER_CMD compose найден"
elif command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    success "podman-compose найден"
else
    error "Не найден compose инструмент!"
    echo "Установите docker-compose или podman-compose"
    exit 1
fi

# ============================================
# Функции
# ============================================

show_help() {
    cat << EOF
${BLUE}TenderTrack — Система мониторинга тендеров${NC}

Использование:
  ./start.sh [command]

Команды:
  up        Запустить все сервисы (по умолчанию)
  down      Остановить все сервисы
  restart   Перезапустить все сервисы
  status    Показать статус контейнеров
  logs      Показать логи
  build     Пересобрать образы
  clean     Остановить и удалить все данные
  help      Показать эту справку

Примеры:
  ./start.sh              # Запустить сервисы
  ./start.sh logs         # Показать логи
  ./start.sh down         # Остановить сервисы
  ./start.sh clean        # Полная очистка

Переменные окружения:
  FRONTEND_PORT   Порт фронтенда (по умолчанию: 8080)
  BACKEND_PORT    Порт бэкенда (по умолчанию: 3001)

EOF
}

build_images() {
    info "Сборка образов..."
    $COMPOSE_CMD build --no-cache
    success "Образы собраны"
}

start_services() {
    info "Запуск сервисов..."
    $COMPOSE_CMD up -d
    
    # Ждём пока сервисы станут здоровыми
    info "Ожидание готовности сервисов..."
    sleep 5
    
    # Проверяем статус
    if $COMPOSE_CMD ps | grep -q "Up"; then
        success "Сервисы запущены!"
        echo ""
        show_urls
        show_status
    else
        error "Ошибка запуска сервисов"
        $COMPOSE_CMD logs
        exit 1
    fi
}

stop_services() {
    info "Остановка сервисов..."
    $COMPOSE_CMD down
    success "Сервисы остановлены"
}

restart_services() {
    info "Перезапуск сервисов..."
    $COMPOSE_CMD restart
    success "Сервисы перезапущены"
    show_urls
}

show_status() {
    echo ""
    info "Статус контейнеров:"
    $COMPOSE_CMD ps
    echo ""
}

show_logs() {
    $COMPOSE_CMD logs -f
}

clean_all() {
    warning "Это удалит все контейнеры, образы и данные!"
    read -p "Продолжить? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Остановка и удаление контейнеров..."
        $COMPOSE_CMD down -v --rmi all --remove-orphans
        success "Все данные удалены"
    else
        info "Отменено"
    fi
}

show_urls() {
    FRONTEND_PORT=${FRONTEND_PORT:-8080}
    BACKEND_PORT=${BACKEND_PORT:-3001}
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  TenderTrack запущен успешно!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 Frontend:${NC}  http://localhost:${FRONTEND_PORT}"
    echo -e "${BLUE}🔌 Backend API:${NC} http://localhost:${BACKEND_PORT}/api"
    echo -e "${BLUE}📊 Health:${NC}     http://localhost:${BACKEND_PORT}/api/health"
    echo ""
    echo -e "${YELLOW}Полезные команды:${NC}"
    echo "  ./start.sh logs      # Просмотр логов"
    echo "  ./start.sh status    # Статус контейнеров"
    echo "  ./start.sh down      # Остановка"
    echo ""
}

# ============================================
# Основная логика
# ============================================

# Обработка команд
case "${1:-up}" in
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        build_images
        start_services
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Неизвестная команда: $1"
        show_help
        exit 1
        ;;
esac
