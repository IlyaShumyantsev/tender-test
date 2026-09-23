/**
 * Базовый класс для адаптеров источников тендеров
 */

class BaseSource {
  constructor(config = {}) {
    this.config = config;
    this.name = 'BaseSource';
    this.baseUrl = '';
  }

  /**
   * Основной метод для получения тендеров
   * Должен быть переопределён в наследниках
   */
  async fetch() {
    throw new Error('Метод fetch() должен быть реализован в наследнике');
  }

  /**
   * Нормализация данных тендера к единому формату
   */
  normalizeTender(raw) {
    return {
      id: raw.id || this.generateId(raw),
      externalId: raw.externalId || raw.id,
      title: raw.title || '',
      organization: raw.organization || '',
      category: this.mapCategory(raw.category),
      status: this.mapStatus(raw.status),
      budget: this.parseBudget(raw.budget),
      currency: raw.currency || 'RUB',
      region: raw.region || '',
      publishDate: this.parseDate(raw.publishDate),
      deadline: this.parseDate(raw.deadline),
      description: raw.description || '',
      requirements: raw.requirements || [],
      contactPerson: raw.contactPerson || '',
      contactEmail: raw.contactEmail || '',
      contactPhone: raw.contactPhone || '',
      url: raw.url || '',
      participantsCount: raw.participantsCount || 0,
    };
  }

  /**
   * Генерация уникального ID
   */
  generateId(raw) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.name}_${timestamp}_${random}`;
  }

  /**
   * Маппинг категорий
   */
  mapCategory(category) {
    const mapping = {
      'строительство': 'construction',
      'construction': 'construction',
      'it': 'it',
      'информационные технологии': 'it',
      'медицина': 'medical',
      'medical': 'medical',
      'транспорт': 'transport',
      'transport': 'transport',
      'образование': 'education',
      'education': 'education',
      'энергетика': 'energy',
      'energy': 'energy',
      'питание': 'food',
      'food': 'food',
      'консалтинг': 'consulting',
      'consulting': 'consulting',
    };

    if (!category) return 'other';
    return mapping[category.toLowerCase()] || 'other';
  }

  /**
   * Маппинг статусов
   */
  mapStatus(status) {
    const mapping = {
      'активный': 'active',
      'active': 'active',
      'прием заявок': 'active',
      'предстоящий': 'upcoming',
      'upcoming': 'upcoming',
      'скоро': 'upcoming',
      'закрытый': 'closed',
      'closed': 'closed',
      'завершен': 'closed',
      'оценка': 'evaluation',
      'evaluation': 'evaluation',
      'рассмотрение': 'evaluation',
    };

    if (!status) return 'active';
    return mapping[status.toLowerCase()] || 'active';
  }

  /**
   * Парсинг бюджета
   */
  parseBudget(budget) {
    if (!budget) return 0;
    if (typeof budget === 'number') return budget;
    
    // Удаляем пробелы, символы валют
    const cleaned = String(budget)
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Парсинг даты
   */
  parseDate(date) {
    if (!date) return '';
    if (date instanceof Date) return date.toISOString().split('T')[0];
    
    // Пробуем разные форматы
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    ];

    const dateStr = String(date).trim();

    // DD.MM.YYYY -> YYYY-MM-DD
    if (formats[1].test(dateStr)) {
      const [day, month, year] = dateStr.split('.');
      return `${year}-${month}-${day}`;
    }

    // DD/MM/YYYY -> YYYY-MM-DD
    if (formats[2].test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }

    // Уже в правильном формате или ISO
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return '';
  }

  /**
   * HTTP запрос с обработкой ошибок
   */
  async httpRequest(url, options = {}) {
    const fetch = require('node-fetch');
    
    const defaultOptions = {
      timeout: 30000,
      headers: {
        'User-Agent': 'TenderTrack/1.0 (tender-tracker@example.com)',
        'Accept': 'application/json, text/html, application/xml',
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || defaultOptions.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Таймаут запроса к ${url}`);
      }
      throw error;
    }
  }
}

module.exports = { BaseSource };
