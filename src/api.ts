/**
 * API клиент для TenderTrack
 * Работает с бэкендом, если доступен, иначе использует mock данные
 */

import { Tender } from './types';
import { mockTenders } from './data';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let useBackend = false;
let wsConnection: WebSocket | null = null;

// Проверка доступности бэкенда
export async function checkBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (response.ok) {
      useBackend = true;
      console.log('✅ Бэкенд доступен, переключаемся на API');
      return true;
    }
  } catch {
    console.log('ℹ️ Бэкенд недоступен, используем локальные данные');
  }
  useBackend = false;
  return false;
}

// Получить список тендеров
export async function fetchTenders(filters: {
  search?: string;
  category?: string;
  status?: string;
  region?: string;
  budgetMin?: number;
  budgetMax?: number;
  sortBy?: string;
  limit?: number;
  offset?: number;
  favoritesOnly?: boolean;
  newOnly?: boolean;
  source?: string;
}): Promise<{ data: Tender[]; total: number }> {
  if (!useBackend) {
    // Используем mock данные
    return { data: mockTenders, total: mockTenders.length };
  }

  try {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);
    if (filters.region) params.set('region', filters.region);
    if (filters.budgetMin) params.set('budgetMin', String(filters.budgetMin));
    if (filters.budgetMax) params.set('budgetMax', String(filters.budgetMax));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('offset', String(filters.offset));
    if (filters.favoritesOnly) params.set('favoritesOnly', 'true');
    if (filters.newOnly) params.set('newOnly', 'true');
    if (filters.source) params.set('source', filters.source);

    const response = await fetch(`${API_BASE}/tenders?${params}`);
    const result = await response.json();

    if (result.success) {
      return {
        data: result.data.map(mapApiTender),
        total: result.pagination.total,
      };
    }
  } catch (error) {
    console.error('Error fetching tenders:', error);
  }

  return { data: mockTenders, total: mockTenders.length };
}

// Получить детали тендера
export async function fetchTender(id: string): Promise<Tender | null> {
  if (!useBackend) {
    return mockTenders.find(t => t.id === id) || null;
  }

  try {
    const response = await fetch(`${API_BASE}/tenders/${id}`);
    const result = await response.json();
    if (result.success) {
      return mapApiTender(result.data);
    }
  } catch (error) {
    console.error('Error fetching tender:', error);
  }
  return null;
}

// Переключить избранное
export async function toggleFavorite(id: string, favorite: boolean): Promise<boolean> {
  if (!useBackend) return true;

  try {
    const response = await fetch(`${API_BASE}/tenders/${id}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
}

// Получить источники
export async function fetchSources(): Promise<any[]> {
  if (!useBackend) return [];

  try {
    const response = await fetch(`${API_BASE}/sources`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
}

// Запустить синхронизацию
export async function syncSources(sourceId?: string): Promise<boolean> {
  if (!useBackend) return false;

  try {
    const response = await fetch(`${API_BASE}/sources/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error syncing sources:', error);
    return false;
  }
}

// Получить статистику
export async function fetchStats(): Promise<any> {
  if (!useBackend) return null;

  try {
    const response = await fetch(`${API_BASE}/stats`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// WebSocket подключение
export function connectWebSocket(
  onNewTender?: (data: any) => void,
  onSyncStatus?: (data: any) => void,
  onDeadlineWarning?: (data: any) => void,
) {
  if (!useBackend || wsConnection) return;

  const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001').replace(/\/$/, '');
  
  try {
    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = () => {
      console.log('🔌 WebSocket подключён');
      wsConnection?.send(JSON.stringify({
        type: 'subscribe',
        events: ['new_tender', 'sync_status', 'deadline_warning'],
      }));
    };

    wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'new_tender':
            onNewTender?.(message.data);
            break;
          case 'sync_status':
            onSyncStatus?.(message.data);
            break;
          case 'deadline_warning':
            onDeadlineWarning?.(message.data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    wsConnection.onclose = () => {
      console.log('🔌 WebSocket отключён');
      wsConnection = null;
      // Переподключение через 5 секунд
      setTimeout(() => connectWebSocket(onNewTender, onSyncStatus, onDeadlineWarning), 5000);
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('WebSocket connection error:', error);
  }
}

export function disconnectWebSocket() {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}

// Маппинг API тендера в формат фронтенда
function mapApiTender(apiTender: any): Tender {
  return {
    id: apiTender.id,
    title: apiTender.title,
    organization: apiTender.organization || '',
    category: (apiTender.category || 'other') as Tender['category'],
    status: (apiTender.status || 'active') as Tender['status'],
    budget: apiTender.budget || 0,
    currency: apiTender.currency || 'RUB',
    region: apiTender.region || '',
    publishDate: apiTender.publishDate || apiTender.publish_date || '',
    deadline: apiTender.deadline || '',
    description: apiTender.description || '',
    requirements: apiTender.requirements || [],
    contactPerson: apiTender.contactPerson || apiTender.contact_person || '',
    contactEmail: apiTender.contactEmail || apiTender.contact_email || '',
    contactPhone: apiTender.contactPhone || apiTender.contact_phone || '',
    isFavorite: apiTender.isFavorite || apiTender.is_favorite || false,
    isNew: apiTender.isNew || apiTender.is_new || false,
    viewsCount: apiTender.viewsCount || apiTender.views_count || 0,
    participantsCount: apiTender.participantsCount || apiTender.participants_count || 0,
  };
}

export function isBackendAvailable(): boolean {
  return useBackend;
}
