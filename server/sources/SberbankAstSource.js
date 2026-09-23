/**
 * Адаптер для Сбербанк-АСТ (sberbank-ast.ru)
 */

const { BaseSource } = require('./BaseSource');

class SberbankAstSource extends BaseSource {
  constructor(config = {}) {
    super(config);
    this.name = 'sberbank_ast';
    this.baseUrl = 'https://www.sberbank-ast.ru';
  }

  async fetch() {
    console.log(`📡 [Сбербанк-АСТ] Загрузка тендеров...`);

    try {
      // Сбербанк-АСТ имеет SOAP API
      // В реальности: SOAP запрос к ws.sberbank-ast.ru
      
      /*
      const soapRequest = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
          xmlns:fas="http://fabricants.ru/OrderFacade">
          <soapenv:Header/>
          <soapenv:Body>
            <fas:GetOrderList>
              <fas:filter>
                <fas:publishDateFrom>${this.getDateDaysAgo(7)}</fas:publishDateFrom>
              </fas:filter>
            </fas:GetOrderList>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
      */

      return this.getMockData();
    } catch (error) {
      console.error(`❌ [Сбербанк-АСТ] Ошибка:`, error.message);
      return this.getMockData();
    }
  }

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  getMockData() {
    const tenders = [
      {
        id: 'sberast_2001',
        title: 'Поставка медицинского оборудования для клиники',
        organization: 'ГБУЗ «Городская клиническая больница №7»',
        category: 'medical',
        status: 'evaluation',
        budget: 67000000,
        region: 'Новосибирск',
        publishDate: '2026-01-10',
        deadline: '2026-02-15',
        description: 'Поставка МРТ-аппарата, УЗИ-системы, рентген-аппарата.',
        requirements: ['Лицензия на мед. деятельность', 'Гарантия от 3 лет'],
        url: 'https://www.sberbank-ast.ru/order/2001',
        participantsCount: 15,
      },
      {
        id: 'sberast_2002',
        title: 'Консалтинговые услуги по цифровой трансформации',
        organization: 'ПАО «Сбербанк»',
        category: 'consulting',
        status: 'active',
        budget: 45000000,
        region: 'Москва',
        publishDate: '2026-01-22',
        deadline: '2026-02-20',
        description: 'Аудит IT-инфраструктуры, стратегия цифровой трансформации.',
        requirements: ['Опыт в банковской сфере', 'Команда от 10 человек', 'NDA'],
        url: 'https://www.sberbank-ast.ru/order/2002',
        participantsCount: 5,
      },
    ];

    return tenders.map(t => this.normalizeTender(t));
  }
}

module.exports = { SberbankAstSource };
