/**
 * WebSocket сервер для real-time уведомлений
 */

const WebSocket = require('ws');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/' });

  // Хранилище подключений
  const clients = new Set();

  wss.on('connection', (ws, req) => {
    console.log(`🔌 Новое WebSocket подключение (всего: ${clients.size + 1})`);
    clients.add(ws);

    // Отправляем приветствие
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Подключено к TenderTrack',
      timestamp: new Date().toISOString(),
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`🔌 WebSocket отключён (осталось: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clients.delete(ws);
    });
  });

  // Обработка входящих сообщений
  function handleMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      case 'subscribe':
        // Подписка на определённые события
        ws.subscribedEvents = message.events || ['all'];
        ws.send(JSON.stringify({ type: 'subscribed', events: ws.subscribedEvents }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Неизвестный тип сообщения' }));
    }
  }

  // Broadcast всем подключённым клиентам
  function broadcast(data, excludeWs = null) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    });

    clients.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        // Фильтрация по подпискам
        if (client.subscribedEvents) {
          if (client.subscribedEvents.includes('all') || client.subscribedEvents.includes(data.type)) {
            client.send(message);
          }
        } else {
          client.send(message);
        }
      }
    });
  }

  // Уведомление о новом тендере
  function notifyNewTender(tender) {
    broadcast({
      type: 'new_tender',
      data: {
        id: tender.id,
        title: tender.title,
        organization: tender.organization,
        budget: tender.budget,
        category: tender.category,
        region: tender.region,
        source: tender.source_id,
      },
    });
  }

  // Уведомление о статусе синхронизации
  function notifySyncStatus(sourceId, status, details = {}) {
    broadcast({
      type: 'sync_status',
      data: {
        sourceId,
        status, // 'started', 'progress', 'completed', 'error'
        ...details,
      },
    });
  }

  // Уведомление об ошибке
  function notifyError(error, source = 'system') {
    broadcast({
      type: 'error',
      data: {
        source,
        message: error.message || String(error),
      },
    });
  }

  // Периодический пинг для поддержания соединения
  const pingInterval = setInterval(() => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log(`📡 WebSocket сервер готов (${clients.size} подключений)`);

  return {
    wss,
    broadcast,
    notifyNewTender,
    notifySyncStatus,
    notifyError,
    getClientsCount: () => clients.size,
  };
}

module.exports = { setupWebSocket };
