import React from 'react';
import { Tender } from '../types';

interface DashboardProps {
  tenders: Tender[];
}

const Dashboard: React.FC<DashboardProps> = ({ tenders }) => {
  const totalBudget = tenders.reduce((sum, t) => sum + t.budget, 0);
  const activeTenders = tenders.filter(t => t.status === 'active').length;
  const newTenders = tenders.filter(t => t.isNew).length;
  const favoriteTenders = tenders.filter(t => t.isFavorite).length;

  const stats = [
    {
      label: 'Всего тендеров',
      value: tenders.length,
      icon: '📋',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Активных закупок',
      value: activeTenders,
      icon: '🟢',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Общий бюджет',
      value: `${(totalBudget / 1000000000).toFixed(1)} млрд ₽`,
      icon: '💰',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Новых сегодня',
      value: newTenders,
      icon: '🆕',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const recentActivity = [
    { text: 'Новый тендер: «Разработка мобильного приложения»', time: '2 часа назад', type: 'new' },
    { text: 'Обновлён статус: «Поставка медоборудования» → Оценка заявок', time: '5 часов назад', type: 'update' },
    { text: 'Закрыт тендер: «Организация питания в школах»', time: '1 день назад', type: 'close' },
    { text: 'Новый тендер: «Ремонт автодороги М-5»', time: '2 дня назад', type: 'new' },
    { text: 'Подана заявка на «Строительство ЖК Солнечный»', time: '3 дня назад', type: 'apply' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Обзор</h2>
        <p className="text-gray-500 mt-1">Сводная информация по тендерам</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${stat.color} opacity-20`}></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📢</span> Последняя активность
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'new' ? 'bg-green-500' :
                  activity.type === 'update' ? 'bg-blue-500' :
                  activity.type === 'close' ? 'bg-gray-400' :
                  'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activity.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> Распределение по категориям
          </h3>
          <div className="space-y-3">
            {[
              { name: 'IT и технологии', count: 3, percent: 25, color: 'bg-blue-500' },
              { name: 'Строительство', count: 2, percent: 17, color: 'bg-orange-500' },
              { name: 'Медицина', count: 2, percent: 17, color: 'bg-red-500' },
              { name: 'Транспорт', count: 1, percent: 8, color: 'bg-green-500' },
              { name: 'Энергетика', count: 1, percent: 8, color: 'bg-yellow-500' },
              { name: 'Образование', count: 1, percent: 8, color: 'bg-purple-500' },
              { name: 'Консалтинг', count: 1, percent: 8, color: 'bg-indigo-500' },
              { name: 'Питание', count: 1, percent: 8, color: 'bg-pink-500' },
            ].map((cat, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-36 truncate">{cat.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${cat.color} transition-all`}
                    style={{ width: `${cat.percent}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <h3 className="font-semibold text-lg mb-2">🚀 Начните работу с TenderTrack</h3>
        <p className="text-blue-100 text-sm mb-4">
          Отслеживайте государственные и коммерческие закупки, получайте уведомления о новых тендерах и управляйте своим портфелем заявок.
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">1</span>
            <span>Настройте фильтры</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">2</span>
            <span>Добавьте в избранное</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">3</span>
            <span>Подайте заявку</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
