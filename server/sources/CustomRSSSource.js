/**
 * Адаптер для RSS-лент закупок
 * Поддерживает парсинг RSS/Atom фидов с различных площадок
 */

const { BaseSource } = require('./BaseSource');

class CustomRSSSource extends BaseSource {
  constructor(config = {}) {
    super(config);
    this.name = 'custom_rss';
    this.feeds = config.feeds || [];
  }

  async fetch() {
    console.log(`📡 [RSS] Загрузка из ${this.feeds.length} лент...`);

    const allTenders = [];

    for (const feedUrl of this.feeds) {
      try {
        const tenders = await this.parseFeed(feedUrl);
        allTenders.push(...tenders);
      } catch (error) {
        console.error(`❌ [RSS] Ошибка парсинга ${feedUrl}:`, error.message);
      }
    }

    console.log(`✅ [RSS] Загружено ${allTenders.length} тендеров из ${this.feeds.length} лент`);
    return allTenders;
  }

  async parseFeed(feedUrl) {
    const RSSParser = require('rss-parser');
    const parser = new RSSParser({
      timeout: 15000,
      headers: {
        'User-Agent': 'TenderTrack/1.0 RSS Parser',
      },
    });

    try {
      const feed = await parser.parseURL(feedUrl);
      
      return feed.items.map(item => this.normalizeTender({
        id: `rss_${this.hashString(item.link || item.guid || item.title)}`,
        externalId: item.guid || item.link,
        title: item.title || '',
        organization: this.extractOrganization(item),
        category: this.detectCategoryFromTitle(item.title),
        status: 'active',
        budget: this.extractBudget(item.content || item.contentSnippet || ''),
        region: this.extractRegion(item.content || ''),
        publishDate: item.pubDate || item.isoDate,
        deadline: this.extractDeadline(item.content || ''),
        description: item.contentSnippet || item.content || '',
        url: item.link || '',
      }));
    } catch (error) {
      // Если RSS недоступен, возвращаем демо-данные
      console.warn(`⚠️ RSS ${feedUrl} недоступен, используем демо-данные`);
      return this.getMockData();
    }
  }

  extractOrganization(item) {
    // Пытаемся извлечь организацию из разных полей
    if (item.creator) return item.creator;
    if (item['dc:creator']) return item['dc:creator'];
    
    // Пытаемся извлечь из content
    const content = item.content || '';
    const orgMatch = content.match(/Заказчик:\s*([^\n<]+)/i);
    if (orgMatch) return orgMatch[1].trim();
    
    return '';
  }

  extractBudget(content) {
    // Ищем сумму в тексте
    const patterns = [
      /(?:НМЦК|максимальная цена|бюджет|стоимость)[:\s]*(\d[\d\s]*\d)\s*(руб|₽|млн|тыс)/i,
      /(\d[\d\s]*\d)\s*(рубл|₽|млн|тыс)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        let value = parseInt(match[1].replace(/\s/g, ''));
        const unit = (match[2] || '').toLowerCase();
        
        if (unit.includes('млн')) value *= 1000000;
        else if (unit.includes('тыс')) value *= 1000;
        
        return value;
      }
    }
    return 0;
  }

  extractRegion(content) {
    const regions = [
      'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург',
      'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск',
      'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Пермь', 'Воронеж',
      'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти',
    ];

    for (const region of regions) {
      if (content.includes(region)) return region;
    }
    return '';
  }

  extractDeadline(content) {
    // Ищем дату окончания
    const patterns = [
      /(?:окончание|дедлайн|приём заявок до|до)[:\s]*(\d{2}[./]\d{2}[./]\d{4})/i,
      /(\d{2}[./]\d{2}[./]\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return '';
  }

  detectCategoryFromTitle(title) {
    if (!title) return 'other';
    const t = title.toLowerCase();
    
    if (t.includes('строитель') || t.includes('ремонт')) return 'construction';
    if (t.includes('программ') || t.includes('it') || t.includes('информацион')) return 'it';
    if (t.includes('медицин') || t.includes('лекарств')) return 'medical';
    if (t.includes('транспорт') || t.includes('автомобил')) return 'transport';
    if (t.includes('образован') || t.includes('школ')) return 'education';
    if (t.includes('энерг') || t.includes('электр')) return 'energy';
    if (t.includes('питан')) return 'food';
    if (t.includes('консалт') || t.includes('аудит')) return 'consulting';
    
    return 'other';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  getMockData() {
    return [
      this.normalizeTender({
        id: 'rss_demo_1',
        title: 'Поставка офисной бумаги (RSS демо)',
        organization: 'ООО "Компания"',
        category: 'other',
        status: 'active',
        budget: 500000,
        region: 'Москва',
        publishDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        description: 'Демо-тендер из RSS-ленты',
        url: 'https://zakupki.gov.ru/demo/1',
      }),
    ];
  }
}

module.exports = { CustomRSSSource };
