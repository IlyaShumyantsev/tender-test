/**
 * Адаптер для B2B-Center (b2b-center.ru)
 */

const { BaseSource } = require('./BaseSource');

class B2BCenterSource extends BaseSource {
  constructor(config = {}) {
    super(config);
    this.name = 'b2b_center';
    this.baseUrl = 'https://www.b2b-center.ru';
  }

  async fetch() {
    console.log(`📡 [B2B-Center] Загрузка тендеров...`);

    try {
      // B2B-Center имеет REST API
      // В реальности: OAuth2 авторизация + API запрос
      
      /*
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/api/v1/trades/active`;
      const response = await this.httpRequest(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      */

      return this.getMockData();
    } catch (error) {
      console.error(`❌ [B2B-Center] Ошибка:`, error.message);
      return this.getMockData();
    }
  }

  getMockData() {
    const tenders = [
      {
        id: 'b2b_4001',
        title: 'Оснащение школ интерактивным оборудованием',
        organization: 'Департамент образования г. Казань',
        category: 'education',
        status: 'upcoming',
        budget: 32000000,
        region: 'Казань',
        publishDate: '2026-02-01',
        deadline: '2026-03-15',
        description: 'Поставка интерактивных панелей для 45 школ города.',
        requirements: ['Авторизация у производителей', 'Гарантия от 5 лет'],
        url: 'https://www.b2b-center.ru/trade/4001',
        participantsCount: 3,
      },
      {
        id: 'b2b_4002',
        title: 'Строительство детского сада на 280 мест',
        organization: 'Мэрия г. Воронеж',
        category: 'construction',
        status: 'upcoming',
        budget: 180000000,
        region: 'Воронеж',
        publishDate: '2026-02-10',
        deadline: '2026-04-15',
        description: 'Строительство ДОУ с бассейном и спортивными залами.',
        requirements: ['Лицензия СРО', 'Опыт социальных объектов', 'Фингарантия 30%'],
        url: 'https://www.b2b-center.ru/trade/4002',
        participantsCount: 2,
      },
    ];

    return tenders.map(t => this.normalizeTender(t));
  }
}

module.exports = { B2BCenterSource };
