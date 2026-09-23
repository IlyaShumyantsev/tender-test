/**
 * Адаптер для Росэлторг (roseltorg.ru)
 */

const { BaseSource } = require('./BaseSource');

class RoseltorgSource extends BaseSource {
  constructor(config = {}) {
    super(config);
    this.name = 'roseltorg';
    this.baseUrl = 'https://www.roseltorg.ru';
    this.categories = config.categories || [];
  }

  async fetch() {
    console.log(`📡 [Росэлторг] Загрузка тендеров...`);

    try {
      // В реальности: парсинг HTML или API
      // Росэлторг имеет закрытый API, доступный только авторизованным пользователям
      
      /*
      const url = `${this.baseUrl}/api/v1/trades/search`;
      const response = await this.httpRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: this.categories,
          limit: 50,
          offset: 0,
        }),
      });
      const data = await response.json();
      */

      return this.getMockData();
    } catch (error) {
      console.error(`❌ [Росэлторг] Ошибка:`, error.message);
      return this.getMockData();
    }
  }

  getMockData() {
    const tenders = [
      {
        id: 'roseltorg_1001',
        title: 'Строительство жилого комплекса «Солнечный»',
        organization: 'ООО «ГрадСтройИнвест»',
        category: 'construction',
        status: 'active',
        budget: 245000000,
        region: 'Москва',
        publishDate: '2026-01-15',
        deadline: '2026-03-01',
        description: 'Строительство жилого комплекса на 450 квартир с подземной парковкой.',
        requirements: ['Лицензия СРО', 'Опыт от 100 млн руб.', 'Наличие техники'],
        url: 'https://www.roseltorg.ru/tender/1001',
        participantsCount: 12,
      },
      {
        id: 'roseltorg_1002',
        title: 'Поставка серверного оборудования для ЦОД',
        organization: 'ФГУП «Ростелеком»',
        category: 'it',
        status: 'evaluation',
        budget: 156000000,
        region: 'Москва',
        publishDate: '2026-01-08',
        deadline: '2026-02-10',
        description: 'Поставка 200 стоечных серверов, систем хранения данных.',
        requirements: ['Авторизация у производителей', 'Склад в Москве', 'Гарантия 5 лет'],
        url: 'https://www.roseltorg.ru/tender/1002',
        participantsCount: 11,
      },
      {
        id: 'roseltorg_1003',
        title: 'Строительство солнечной электростанции 50 МВт',
        organization: 'АО «ЭнергоПроект»',
        category: 'energy',
        status: 'active',
        budget: 1200000000,
        region: 'Краснодарский край',
        publishDate: '2026-01-12',
        deadline: '2026-03-20',
        description: 'Проектирование и строительство СЭС мощностью 50 МВт.',
        requirements: ['Лицензия на проектирование', 'Опыт от 10 МВт', 'Фингарантия'],
        url: 'https://www.roseltorg.ru/tender/1003',
        participantsCount: 7,
      },
    ];

    return tenders.map(t => this.normalizeTender(t));
  }
}

module.exports = { RoseltorgSource };
