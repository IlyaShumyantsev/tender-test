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
COMPOSE_CMD=""
USE_PODMAN_RUN=false

# Проверяем все возможные варианты
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    success "podman-compose найден"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    success "docker-compose найден"
elif $CONTAINER_CMD compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="$CONTAINER_CMD compose"
    success "$CONTAINER_CMD compose найден"
else
    warning "Compose инструмент не найден"
    echo ""
    
    if [ "$CONTAINER_CMD" = "podman" ]; then
        info "Переключаемся на прямой запуск через podman (без compose)..."
        echo ""
        
        # Проверяем наличие podman-run.sh
        if [ -f "./podman-run.sh" ]; then
            USE_PODMAN_RUN=true
            success "Используем podman-run.sh"
        else
            error "Файл podman-run.sh не найден!"
            echo ""
            echo "Установите podman-compose:"
            echo "  Fedora/RHEL: sudo dnf install podman-compose"
            echo "  Ubuntu/Debian: pip3 install podman-compose"
            echo "  Arch: sudo pacman -S podman-compose"
            exit 1
        fi
    else
        error "Не найден compose инструмент!"
        echo ""
        echo "Установите один из вариантов:"
        echo "  sudo apt install docker-compose-plugin"
        echo "  или: sudo dnf install docker-compose"
        exit 1
    fi
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
    if [ "$USE_PODMAN_RUN" = true ]; then
        info "Сборка образов через podman-run.sh..."
        chmod +x ./podman-run.sh
        ./podman-run.sh build
    else
        info "Сборка образов..."
        $COMPOSE_CMD build --no-cache
    fi
    success "Образы собраны"
}

start_services() {
    if [ "$USE_PODMAN_RUN" = true ]; then
        info "Запуск через podman-run.sh..."
        chmod +x ./podman-run.sh
        ./podman-run.sh up
    else
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
    fi
}

stop_services() {
    if [ "$USE_PODMAN_RUN" = true ]; then
        chmod +x ./podman-run.sh
        ./podman-run.sh stop
    else
        info "Остановка сервисов..."
        $COMPOSE_CMD down
    fi
    success "Сервисы остановлены"
}

restart_services() {
    if [ "$USE_PODMAN_RUN" = true ]; then
        chmod +x ./podman-run.sh
        ./podman-run.sh restart
    else
        info "Перезапуск сервисов..."
        $COMPOSE_CMD restart
    fi
    success "Сервисы перезапущены"
    show_urls
}

show_status() {
    echo ""
    info "Статус контейнеров:"
    if [ "$USE_PODMAN_RUN" = true ]; then
        chmod +x ./podman-run.sh
        ./podman-run.sh status
    else
        $COMPOSE_CMD ps
    fi
    echo ""
}

show_logs() {
    if [ "$USE_PODMAN_RUN" = true ]; then
        chmod +x ./podman-run.sh
        ./podman-run.sh logs
    else
        $COMPOSE_CMD logs -f
    fi
}

clean_all() {
    warning "Это удалит все контейнеры, образы и данные!"
    read -p "Продолжить? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$USE_PODMAN_RUN" = true ]; then
            chmod +x ./podman-run.sh
            ./podman-run.sh clean
        else
            info "Остановка и удаление контейнеров..."
            $COMPOSE_CMD down -v --rmi all --remove-orphans
        fi
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
