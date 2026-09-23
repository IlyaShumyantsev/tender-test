import React from 'react';
import { Tender } from '../types';
import { categories, statusLabels } from '../data';

interface TenderDetailProps {
  tender: Tender;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

const TenderDetail: React.FC<TenderDetailProps> = ({ tender, onClose, onToggleFavorite }) => {
  const category = categories.find(c => c.value === tender.category);
  const status = statusLabels[tender.status];

  const formatBudget = (budget: number) => {
    if (budget >= 1000000000) return `${(budget / 1000000000).toFixed(1)} млрд ₽`;
    if (budget >= 1000000) return `${(budget / 1000000).toFixed(1)} млн ₽`;
    return `${budget.toLocaleString()} ₽`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = getDaysLeft(tender.deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${category?.color}`}>
                  {category?.icon} {category?.label}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                  {status.label}
                </span>
                {tender.isNew && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Новый</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{tender.title}</h2>
              <p className="text-gray-500 mt-1">{tender.organization}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(tender.id)}
                className={`p-2 rounded-lg transition-colors ${
                  tender.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-50 hover:text-yellow-500'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill={tender.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">Бюджет</p>
              <p className="font-bold text-blue-900">{formatBudget(tender.budget)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-medium mb-1">Регион</p>
              <p className="font-bold text-green-900">{tender.region}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-600 font-medium mb-1">Участников</p>
              <p className="font-bold text-purple-900">{tender.participantsCount}</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${daysLeft <= 7 && daysLeft > 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
              <p className={`text-xs font-medium mb-1 ${daysLeft <= 7 && daysLeft > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                Осталось дней
              </p>
              <p className={`font-bold ${daysLeft <= 7 && daysLeft > 0 ? 'text-red-900' : 'text-amber-900'}`}>
                {daysLeft > 0 ? daysLeft : 'Истёк'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📝 Описание</h3>
            <p className="text-gray-600 leading-relaxed">{tender.description}</p>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📋 Требования к участникам</h3>
            <div className="space-y-2">
              {tender.requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📅 Сроки</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Дата публикации</p>
                <p className="font-medium text-gray-900">{formatDate(tender.publishDate)}</p>
              </div>
              <div className="text-gray-300">→</div>
              <div className={`flex-1 rounded-lg p-4 ${daysLeft <= 7 && daysLeft > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${daysLeft <= 7 && daysLeft > 0 ? 'text-red-500' : 'text-gray-500'}`}>Дедлайн подачи</p>
                <p className={`font-medium ${daysLeft <= 7 && daysLeft > 0 ? 'text-red-900' : 'text-gray-900'}`}>{formatDate(tender.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📞 Контактная информация</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">👤</span>
                <span className="text-sm text-gray-700">{tender.contactPerson}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">📧</span>
                <a href={`mailto:${tender.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                  {tender.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">📱</span>
                <a href={`tel:${tender.contactPhone}`} className="text-sm text-blue-600 hover:underline">
                  {tender.contactPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>👁 {tender.viewsCount} просмотров</span>
            <span>👥 {tender.participantsCount} участников</span>
          </div>
          <button
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
              tender.status === 'active'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                : tender.status === 'upcoming'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={tender.status === 'closed' || tender.status === 'evaluation'}
          >
            {tender.status === 'active' ? 'Подать заявку' :
             tender.status === 'upcoming' ? 'Уведомить об открытии' :
             tender.status === 'evaluation' ? 'Заявки оцениваются' :
             'Тендер закрыт'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderDetail;
