/**
 * Адаптер для Фабрикант (fabrikant.ru)
 */

const { BaseSource } = require('./BaseSource');

class FabrikantSource extends BaseSource {
  constructor(config = {}) {
    super(config);
    this.name = 'fabrikant';
    this.baseUrl = 'https://www.fabrikant.ru';
  }

  async fetch() {
    console.log(`📡 [Фабрикант] Загрузка тендеров...`);

    try {
      // Фабрикант имеет RSS и API
      // В реальности: парсинг RSS или API запрос
      
      /*
      const url = `${this.baseUrl}/api/v2/tenders?limit=50`;
      const response = await this.httpRequest(url);
      const data = await response.json();
      */

      return this.getMockData();
    } catch (error) {
      console.error(`❌ [Фабрикант] Ошибка:`, error.message);
      return this.getMockData();
    }
  }

  getMockData() {
    const tenders = [
      {
        id: 'fabrikant_3001',
        title: 'Разработка мобильного приложения для города',
        organization: 'Правительство Москвы',
        category: 'it',
        status: 'active',
        budget: 28000000,
        region: 'Москва',
        publishDate: '2026-01-25',
        deadline: '2026-03-10',
        description: 'Приложение «Городские сервисы» для iOS и Android.',
        requirements: ['Опыт от 3 лет', 'Команда от 8 человек', 'Соответствие ФСТЭК'],
        url: 'https://www.fabrikant.ru/tender/3001',
        participantsCount: 6,
      },
    ];

    return tenders.map(t => this.normalizeTender(t));
  }
}

module.exports = { FabrikantSource };
