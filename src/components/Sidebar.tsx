import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenderCounts: {
    all: number;
    active: number;
    upcoming: number;
    evaluation: number;
    closed: number;
    favorites: number;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, tenderCounts }) => {
  const menuItems = [
    { id: 'all', label: 'Все тендеры', icon: '📋', count: tenderCounts.all },
    { id: 'active', label: 'Приём заявок', icon: '🟢', count: tenderCounts.active },
    { id: 'upcoming', label: 'Скоро открытие', icon: '🔵', count: tenderCounts.upcoming },
    { id: 'evaluation', label: 'Оценка заявок', icon: '🟡', count: tenderCounts.evaluation },
    { id: 'closed', label: 'Закрытые', icon: '⚫', count: tenderCounts.closed },
    { id: 'favorites', label: 'Избранное', icon: '⭐', count: tenderCounts.favorites },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TT</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">TenderTrack</h1>
            <p className="text-xs text-gray-500">Мониторинг закупок</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Навигация</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === item.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {item.count}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-900 mb-1">💡 Подсказка</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Добавьте тендеры в избранное, чтобы не пропустить важные закупки
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
