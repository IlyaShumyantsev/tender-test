#!/bin/bash

# ============================================
# TenderTrack — Запуск через Podman БЕЗ compose
# Для случаев когда podman-compose не установлен
# ============================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# ============================================
# Конфигурация
# ============================================
PROJECT_NAME="tendertrack"
NETWORK_NAME="${PROJECT_NAME}-network"
VOLUME_NAME="${PROJECT_NAME}-data"
BACKEND_IMAGE="${PROJECT_NAME}-backend"
FRONTEND_IMAGE="${PROJECT_NAME}-frontend"
BACKEND_CONTAINER="${PROJECT_NAME}-backend"
FRONTEND_CONTAINER="${PROJECT_NAME}-frontend"

FRONTEND_PORT=${FRONTEND_PORT:-8080}
BACKEND_PORT=${BACKEND_PORT:-3001}

# Определяем команду (podman или docker)
if command -v podman &> /dev/null; then
    CTX_CMD="podman"
elif command -v docker &> /dev/null; then
    CTX_CMD="docker"
else
    error "Не найден Podman или Docker!"
    exit 1
fi

success "Используется: $CTX_CMD"

# ============================================
# Функции
# ============================================

cleanup() {
    info "Остановка и удаление старых контейнеров..."
    $CTX_CMD rm -f $BACKEND_CONTAINER $FRONTEND_CONTAINER 2>/dev/null || true
}

build_images() {
    info "Сборка образа Backend..."
    $CTX_CMD build -t $BACKEND_IMAGE -f Dockerfile.backend .
    success "Backend образ собран"

    info "Сборка образа Frontend..."
    $CTX_CMD build -t $FRONTEND_IMAGE -f Dockerfile.frontend .
    success "Frontend образ собран"
}

create_network() {
    if ! $CTX_CMD network exists $NETWORK_NAME 2>/dev/null; then
        info "Создание сети $NETWORK_NAME..."
        $CTX_CMD network create $NETWORK_NAME
        success "Сеть создана"
    else
        success "Сеть $NETWORK_NAME уже существует"
    fi
}

create_volume() {
    if ! $CTX_CMD volume exists $VOLUME_NAME 2>/dev/null; then
        info "Создание volume $VOLUME_NAME..."
        $CTX_CMD volume create $VOLUME_NAME
        success "Volume создан"
    else
        success "Volume $VOLUME_NAME уже существует"
    fi
}

start_backend() {
    info "Запуск Backend контейнера..."
    $CTX_CMD run -d \
        --name $BACKEND_CONTAINER \
        --network $NETWORK_NAME \
        -v ${VOLUME_NAME}:/data \
        -p ${BACKEND_PORT}:3001 \
        -e NODE_ENV=production \
        -e PORT=3001 \
        -e DB_PATH=/data/tendertrack.db \
        --restart unless-stopped \
        $BACKEND_IMAGE
    
    success "Backend запущен на порту $BACKEND_PORT"
}

start_frontend() {
    info "Запуск Frontend контейнера..."
    
    # Ждём пока backend получит IP адрес
    info "Ожидание IP адреса backend..."
    for i in {1..10}; do
        BACKEND_IP=$($CTX_CMD inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $BACKEND_CONTAINER 2>/dev/null | tr -d '[:space:]')
        
        if [ -n "$BACKEND_IP" ] && [ "$BACKEND_IP" != "" ]; then
            success "Backend IP: $BACKEND_IP"
            break
        fi
        
        if [ $i -eq 10 ]; then
            warning "Не удалось получить IP backend, используем имя хоста"
            BACKEND_IP=""
        fi
        
        sleep 1
    done
    
    # Запускаем frontend с --add-host если получили IP
    if [ -n "$BACKEND_IP" ]; then
        info "Добавляю host mapping: backend -> $BACKEND_IP"
        $CTX_CMD run -d \
            --name $FRONTEND_CONTAINER \
            --network $NETWORK_NAME \
            -p ${FRONTEND_PORT}:80 \
            --restart unless-stopped \
            --add-host backend:$BACKEND_IP \
            $FRONTEND_IMAGE
    else
        # Если IP не получили, пробуем запустить без --add-host
        warning "IP backend не получен, запускаю без --add-host"
        $CTX_CMD run -d \
            --name $FRONTEND_CONTAINER \
            --network $NETWORK_NAME \
            -p ${FRONTEND_PORT}:80 \
            --restart unless-stopped \
            $FRONTEND_IMAGE
    fi
    
    success "Frontend запущен на порту $FRONTEND_PORT"
}

wait_for_healthy() {
    info "Ожидание готовности сервисов..."
    
    # Ждём backend
    for i in {1..30}; do
        if $CTX_CMD exec $BACKEND_CONTAINER curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
            success "Backend готов"
            break
        fi
        if [ $i -eq 30 ]; then
            warning "Backend не ответил за 30 секунд, но продолжаем..."
        fi
        sleep 1
    done
    
    # Ждём frontend
    for i in {1..15}; do
        if $CTX_CMD exec $FRONTEND_CONTAINER wget --quiet --spider --timeout=3 http://localhost:80/ 2>/dev/null; then
            success "Frontend готов"
            break
        fi
        if [ $i -eq 15 ]; then
            warning "Frontend не ответил за 15 секунд"
            info "Проверьте логи: $CTX_CMD logs $FRONTEND_CONTAINER"
        fi
        sleep 1
    done
}

show_status() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  TenderTrack запущен успешно!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 Frontend:${NC}  http://localhost:${FRONTEND_PORT}"
    echo -e "${BLUE}🔌 Backend API:${NC} http://localhost:${BACKEND_PORT}/api"
    echo -e "${BLUE}📊 Health:${NC}     http://localhost:${BACKEND_PORT}/api/health"
    echo ""
    echo -e "${YELLOW}Контейнеры:${NC}"
    $CTX_CMD ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${YELLOW}Полезные команды:${NC}"
    echo "  ./podman-run.sh logs     # Просмотр логов"
    echo "  ./podman-run.sh status   # Статус контейнеров"
    echo "  ./podman-run.sh stop     # Остановка"
    echo "  ./podman-run.sh clean    # Полная очистка"
    echo ""
}

show_logs() {
    local container=${1:-all}
    
    if [ "$container" = "all" ] || [ "$container" = "backend" ]; then
        echo -e "${BLUE}=== Backend ===${NC}"
        $CTX_CMD logs -f $BACKEND_CONTAINER &
        BACKEND_PID=$!
    fi
    
    if [ "$container" = "all" ] || [ "$container" = "frontend" ]; then
        echo -e "${BLUE}=== Frontend ===${NC}"
        $CTX_CMD logs -f $FRONTEND_CONTAINER &
        FRONTEND_PID=$!
    fi
    
    # Ждём Ctrl+C
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
}

stop_containers() {
    info "Остановка контейнеров..."
    $CTX_CMD stop $BACKEND_CONTAINER $FRONTEND_CONTAINER 2>/dev/null || true
    success "Контейнеры остановлены"
}

remove_containers() {
    info "Удаление контейнеров..."
    $CTX_CMD rm -f $BACKEND_CONTAINER $FRONTEND_CONTAINER 2>/dev/null || true
    success "Контейнеры удалены"
}

clean_all() {
    warning "Это удалит ВСЁ: контейнеры, образы, volume с данными!"
    read -p "Продолжить? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        remove_containers
        info "Удаление сети..."
        $CTX_CMD network rm $NETWORK_NAME 2>/dev/null || true
        info "Удаление volume..."
        $CTX_CMD volume rm $VOLUME_NAME 2>/dev/null || true
        info "Удаление образов..."
        $CTX_CMD rmi $BACKEND_IMAGE $FRONTEND_IMAGE 2>/dev/null || true
        success "Полная очистка завершена"
    else
        info "Отменено"
    fi
}

# ============================================
# Основная логика
# ============================================

case "${1:-up}" in
    up|start)
        cleanup
        build_images
        create_network
        create_volume
        start_backend
        start_frontend
        wait_for_healthy
        show_status
        ;;
    stop)
        stop_containers
        ;;
    restart)
        stop_containers
        sleep 2
        $CTX_CMD start $BACKEND_CONTAINER $FRONTEND_CONTAINER
        wait_for_healthy
        show_status
        ;;
    status)
        echo ""
        info "Контейнеры:"
        $CTX_CMD ps -a --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        info "Сети:"
        $CTX_CMD network ls --filter "name=${PROJECT_NAME}"
        echo ""
        info "Volumes:"
        $CTX_CMD volume ls --filter "name=${PROJECT_NAME}"
        echo ""
        ;;
    logs)
        show_logs "${2:-all}"
        ;;
    build)
        build_images
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        cat << EOF
${BLUE}TenderTrack — Запуск через Podman (без compose)${NC}

Использование:
  ./podman-run.sh [command]

Команды:
  up/start    Собрать и запустить (по умолчанию)
  stop        Остановить контейнеры
  restart     Перезапустить
  status      Показать статус
  logs        Показать логи (logs backend/frontend)
  build       Только собрать образы
  clean       Полная очистка
  help        Эта справка

Переменные окружения:
  FRONTEND_PORT   Порт фронтенда (по умолчанию: 8080)
  BACKEND_PORT    Порт бэкенда (по умолчанию: 3001)

EOF
        ;;
    *)
        error "Неизвестная команда: $1"
        exit 1
        ;;
esac
