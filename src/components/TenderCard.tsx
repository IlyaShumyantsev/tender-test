import React from 'react';
import { Tender } from '../types';
import { categories, statusLabels } from '../data';

interface TenderCardProps {
  tender: Tender;
  onSelect: (tender: Tender) => void;
  onToggleFavorite: (id: string) => void;
  viewMode: 'grid' | 'list';
}

const TenderCard: React.FC<TenderCardProps> = ({ tender, onSelect, onToggleFavorite, viewMode }) => {
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
      month: 'short',
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

  if (viewMode === 'list') {
    return (
      <div
        className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        onClick={() => onSelect(tender)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {tender.isNew && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Новый</span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {tender.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{tender.organization}</p>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-right">
              <p className="text-gray-400 text-xs">Бюджет</p>
              <p className="font-semibold text-gray-900">{formatBudget(tender.budget)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Регион</p>
              <p className="text-gray-700">{tender.region}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Дедлайн</p>
              <p className={`font-medium ${daysLeft <= 7 && daysLeft > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatDate(tender.deadline)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(tender.id); }}
            className={`p-2 rounded-lg transition-colors ${
              tender.isFavorite ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-50 hover:text-yellow-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={tender.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group relative"
      onClick={() => onSelect(tender)}
    >
      {tender.isNew && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Новый</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${category?.color}`}>
          {category?.icon} {category?.label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(tender.id); }}
          className={`p-1.5 rounded-lg transition-colors ${
            tender.isFavorite ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-50 hover:text-yellow-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={tender.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors pr-8">
        {tender.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{tender.organization}</p>

      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${status.color}`}>
          {status.label}
        </span>
        {daysLeft > 0 && daysLeft <= 7 && tender.status === 'active' && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            ⏰ {daysLeft} дн.
          </span>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Бюджет</span>
          <span className="font-bold text-gray-900">{formatBudget(tender.budget)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Регион</span>
          <span className="text-sm text-gray-700">📍 {tender.region}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Дедлайн</span>
          <span className={`text-sm font-medium ${daysLeft <= 7 && daysLeft > 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {formatDate(tender.deadline)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span>👁 {tender.viewsCount}</span>
        <span>👥 {tender.participantsCount} участников</span>
      </div>
    </div>
  );
};

export default TenderCard;
