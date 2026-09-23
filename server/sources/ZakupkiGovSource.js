/**
 * Адаптер для ЕИС Закупки (zakupki.gov.ru)
 * 
 * Использует открытый API для получения данных о закупках
 * Документация: https://zakupki.gov.ru/epz/common/apply/info/api
 */

const { BaseSource } = require('./BaseSource');

class ZakupkiGovSource extends BaseSource {
  constructor(config = {}) {
    super(config);
    this.name = 'zakupki_gov';
    this.baseUrl = 'https://zakupki.gov.ru/api';
    this.apiVersion = config.apiVersion || 'v2';
    this.pageSize = config.pageSize || 100;
  }

  async fetch() {
    console.log(`📡 [zakupki.gov.ru] Загрузка тендеров...`);

    try {
      // В реальной реализации здесь будет обращение к API
      // Для демонстрации используем mock-данные с реалистичной структурой
      
      const tenders = await this.fetchFromAPI();
      
      const normalized = tenders.map(raw => this.normalizeTender({
        id: `zakupki_${raw.registrationNumber}`,
        externalId: raw.registrationNumber,
        title: raw.purchaseObjectInfo || raw.subject,
        organization: raw.customer?.name || raw.organizationName,
        category: this.detectCategory(raw),
        status: this.mapEISStatus(raw.stage),
        budget: raw.nmck || raw.maxPrice || 0,
        currency: 'RUB',
        region: this.mapRegion(raw.region),
        publishDate: raw.publishDate || raw.publicationDate,
        deadline: raw.endDate || raw.applicationEndDate,
        description: raw.purchaseObjectInfo || '',
        requirements: this.extractRequirements(raw),
        url: `https://zakupki.gov.ru/epz/order/extendedsearch/details.html?regNumber=${raw.registrationNumber}`,
        participantsCount: raw.applicationsCount || 0,
      }));

      console.log(`✅ [zakupki.gov.ru] Загружено ${normalized.length} тендеров`);
      return normalized;
    } catch (error) {
      console.error(`❌ [zakupki.gov.ru] Ошибка:`, error.message);
      // Возвращаем демо-данные при ошибке
      return this.getDemoData();
    }
  }

  async fetchFromAPI() {
    // Реальная реализация API запроса
    // zakuki.gov.ru требует авторизацию по сертификату для полного API
    // Здесь показана структура реального запроса
    
    /*
    const url = `${this.baseUrl}/${this.apiVersion}/order/search`;
    const params = new URLSearchParams({
      pageSize: this.pageSize.toString(),
      sortBy: 'PUBLISH_DATE',
      sortDirection: 'DESC',
      'fz94': 'true',
      'fz223': 'true',
    });

    const response = await this.httpRequest(`${url}?${params}`, {
      headers: {
        'Accept': 'application/json',
        // В реальности здесь нужен токен авторизации
      },
    });

    const data = await response.json();
    return data.orders || data.items || [];
    */

    // Для демонстрации возвращаем mock
    return this.getMockAPIResponse();
  }

  getMockAPIResponse() {
    return [
      {
        registrationNumber: '017300000122600001',
        purchaseObjectInfo: 'Поставка компьютерного оборудования для нужд министерства',
        customer: { name: 'Министерство цифрового развития РФ' },
        stage: 'ApplicationSubmission',
        nmck: 15000000,
        region: '77',
        publishDate: '2026-01-20',
        endDate: '2026-02-15',
        applicationsCount: 5,
      },
      {
        registrationNumber: '017300000122600002',
        purchaseObjectInfo: 'Выполнение работ по ремонту автомобильных дорог',
        customer: { name: 'ФКУ Упрдор "Прикамье"' },
        stage: 'ApplicationSubmission',
        nmck: 890000000,
        region: '59',
        publishDate: '2026-01-18',
        endDate: '2026-04-01',
        applicationsCount: 23,
      },
      {
        registrationNumber: '017300000122600003',
        purchaseObjectInfo: 'Оказание услуг по организации питания в образовательных учреждениях',
        customer: { name: 'Администрация города Екатеринбурга' },
        stage: 'PublicDiscussion',
        nmck: 95000000,
        region: '66',
        publishDate: '2025-12-01',
        endDate: '2026-01-15',
        applicationsCount: 18,
      },
      {
        registrationNumber: '017300000122600004',
        purchaseObjectInfo: 'Поставка лекарственных препаратов для медицинских учреждений',
        customer: { name: 'Минздрав Республики Татарстан' },
        stage: 'ApplicationSubmission',
        nmck: 42000000,
        region: '16',
        publishDate: '2026-01-19',
        endDate: '2026-02-25',
        applicationsCount: 14,
      },
      {
        registrationNumber: '017300000122600005',
        purchaseObjectInfo: 'Разработка и внедрение информационной системы',
        customer: { name: 'ПАО "ТехноСервис"' },
        stage: 'ApplicationSubmission',
        nmck: 18500000,
        region: '78',
        publishDate: '2026-01-20',
        endDate: '2026-02-28',
        applicationsCount: 8,
      },
    ];
  }

  detectCategory(raw) {
    const title = (raw.purchaseObjectInfo || '').toLowerCase();
    
    if (title.includes('строитель') || title.includes('ремонт') || title.includes('дорог')) return 'construction';
    if (title.includes('компьютер') || title.includes('программ') || title.includes('информацион') || title.includes('software')) return 'it';
    if (title.includes('медицинск') || title.includes('лекарств') || title.includes('оборудован')) return 'medical';
    if (title.includes('транспорт') || title.includes('автомобил') || title.includes('дорог')) return 'transport';
    if (title.includes('образован') || title.includes('школ') || title.includes('питан')) return 'education';
    if (title.includes('энерг') || title.includes('электр')) return 'energy';
    if (title.includes('консалт') || title.includes('услуг') || title.includes('аудит')) return 'consulting';
    
    return 'other';
  }

  mapEISStatus(stage) {
    const mapping = {
      'ApplicationSubmission': 'active',
      'PublicDiscussion': 'upcoming',
      'Evaluation': 'evaluation',
      'ContractExecution': 'active',
      'Completed': 'closed',
      'Cancelled': 'closed',
    };
    return mapping[stage] || 'active';
  }

  mapRegion(code) {
    const regions = {
      '77': 'Москва',
      '78': 'Санкт-Петербург',
      '59': 'Пермский край',
      '66': 'Екатеринбург',
      '16': 'Казань',
      '54': 'Новосибирск',
      '23': 'Краснодарский край',
      '36': 'Воронеж',
    };
    return regions[code] || `Регион ${code}`;
  }

  extractRequirements(raw) {
    // В реальности парсим из документации
    return [
      'Соответствие требованиям технического задания',
      'Наличие необходимых лицензий и допусков',
      'Финансовое обеспечение заявки',
    ];
  }

  getDemoData() {
    // Fallback демо-данные при ошибке API
    return this.getMockAPIResponse().map(raw => this.normalizeTender({
      id: `zakupki_${raw.registrationNumber}`,
      externalId: raw.registrationNumber,
      title: raw.purchaseObjectInfo,
      organization: raw.customer?.name,
      category: this.detectCategory(raw),
      status: this.mapEISStatus(raw.stage),
      budget: raw.nmck,
      region: this.mapRegion(raw.region),
      publishDate: raw.publishDate,
      deadline: raw.endDate,
      url: `https://zakupki.gov.ru/epz/order/extendedsearch/details.html?regNumber=${raw.registrationNumber}`,
      participantsCount: raw.applicationsCount,
    }));
  }
}

module.exports = { ZakupkiGovSource };
