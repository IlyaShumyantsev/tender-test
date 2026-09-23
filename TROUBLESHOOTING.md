# 🔧 Решение проблем с Podman

## Ошибка: "short-name did not resolve to an alias"

### Проблема
```
Error: creating build container: short-name "nginx:1.25-alpine" did not resolve to an alias 
and no containers-registries.conf(5) was found
```

### Причина
Podman не может найти конфигурацию реестров контейнеров и не знает, откуда загружать образы с короткими именами (например, `nginx:1.25-alpine` вместо `docker.io/library/nginx:1.25-alpine`).

### Решение

#### Вариант 1: Использовать полные имена образов (уже исправлено)

Dockerfile обновлён и использует полные имена:
- `docker.io/library/node:20-alpine` вместо `node:20-alpine`
- `docker.io/library/nginx:1.25-alpine` вместо `nginx:1.25-alpine`

**Это решение уже применено в проекте!**

#### Вариант 2: Настроить реестры для пользователя

Создайте конфигурационный файл:

```bash
# Создайте директорию если её нет
mkdir -p ~/.config/containers

# Скопируйте конфигурацию
cp containers-registries.conf ~/.config/containers/registries.conf
```

Или создайте вручную:

```bash
cat > ~/.config/containers/registries.conf << 'EOF'
unqualified-search-registries = ["docker.io", "quay.io", "registry.fedoraproject.org"]
EOF
```

#### Вариант 3: Системная настройка (требует root)

```bash
sudo cp containers-registries.conf /etc/containers/registries.conf
```

#### Вариант 4: Fedora/RHEL — установить пакет

```bash
sudo dnf install container-common
```

Это автоматически создаст `/etc/containers/registries.conf` с настройками по умолчанию.

#### Вариант 5: Ubuntu/Debian — установить пакет

```bash
sudo apt install containers-common
```

### Проверка

После настройки проверьте:

```bash
# Должно показать конфигурацию
podman info | grep -A 10 registries

# Тестовая загрузка образа
podman pull docker.io/library/nginx:1.25-alpine
```

### Временное решение (не рекомендуется)

Можно использовать полные имена образов вручную:

```bash
# Вместо
podman build -t myimage -f Dockerfile.frontend .

# Использовать
podman build -t myimage -f Dockerfile.frontend --pull-always .
```

Или добавить флаг `--log-level=debug` для диагностики:

```bash
podman --log-level=debug build -t myimage -f Dockerfile.frontend .
```

## Другие частые проблемы

### Ошибка: "permission denied" при запуске

```bash
# Сделать скрипты исполняемыми
chmod +x start.sh podman-run.sh
```

### Ошибка: "port already in use"

```bash
# Измените порты в .env
echo "FRONTEND_PORT=9090" >> .env
echo "BACKEND_PORT=3002" >> .env

# Перезапустите
./start.sh restart
```

### Ошибка: "network already exists"

```bash
# Удалите старую сеть
podman network rm tendertrack-network

# Или используйте podman-run.sh clean
./podman-run.sh clean
```

### Ошибка: "volume already exists"

```bash
# Удалите старый volume (ВСЕ ДАННЫЕ БУДУТ ПОТЕРЯНЫ!)
podman volume rm tendertrack-data

# Или используйте clean
./podman-run.sh clean
```

### Контейнер не запускается

```bash
# Проверьте логи
podman logs tendertrack-backend
podman logs tendertrack-frontend

# Проверьте статус
podman ps -a

# Перезапустите
./podman-run.sh restart
```

### Ошибка сборки: "no such file or directory"

Убедитесь что запускаете из корня проекта:

```bash
cd /path/to/tendertrack
./start.sh
```

### Ошибка: "cannot connect to backend"

Frontend не может подключиться к backend:

```bash
# Проверьте что оба контейнера в одной сети
podman network inspect tendertrack-network

# Проверьте что backend запущен
podman ps | grep backend

# Проверьте логи backend
podman logs tendertrack-backend
```

## Полезные команды Podman

```bash
# Список всех контейнеров
podman ps -a

# Список всех образов
podman images

# Список всех сетей
podman network ls

# Список всех volumes
podman volume ls

# Очистка неиспользуемых ресурсов
podman system prune -a

# Просмотр использования ресурсов
podman stats

# Вход в контейнер
podman exec -it tendertrack-backend sh

# Копирование файлов из контейнера
podman cp tendertrack-backend:/data/tendertrack.db ./backup.db

# Копирование файлов в контейнер
podman cp ./file.txt tendertrack-backend:/tmp/
```

## Полная очистка

Если ничего не помогает:

```bash
# Остановить и удалить все контейнеры проекта
podman rm -f tendertrack-backend tendertrack-frontend

# Удалить образы
podman rmi tendertrack-backend tendertrack-frontend

# Удалить сеть
podman network rm tendertrack-network

# Удалить volume (данные!)
podman volume rm tendertrack-data

# Перезапустить
./start.sh
```

## Дополнительная помощь

### Логи Podman

```bash
# Системные логи
journalctl --user -u podman

# Или
sudo journalctl -u podman
```

### Проверка конфигурации

```bash
# Информация о Podman
podman info

# Конфигурация реестров
podman info | grep -A 20 registries

# Проверка сети
podman network inspect tendertrack-network
```

### Обновление Podman

```bash
# Fedora/RHEL
sudo dnf update podman

# Ubuntu/Debian
sudo apt update && sudo apt upgrade podman

# Arch
sudo pacman -Syu podman
```

## Контакты и поддержка

Если проблема не решена:
1. Проверьте логи: `podman logs <container_name>`
2. Проверьте статус: `podman ps -a`
3. Попробуйте полную очистку: `./podman-run.sh clean`
4. Создайте issue в репозитории проекта

---

**TenderTrack** — Профессиональная система мониторинга тендеров
