import React from 'react';
import { FilterState, TenderCategory, TenderStatus, SortBy } from '../types';
import { categories, regions } from '../data';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, setFilters, isOpen, setIsOpen }) => {
  const toggleCategory = (cat: TenderCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const toggleStatus = (status: TenderStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const toggleRegion = (region: string) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      statuses: [],
      regions: [],
      budgetMin: null,
      budgetMax: null,
      sortBy: 'date',
      onlyFavorites: false,
      onlyNew: false,
    });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.statuses.length > 0 ||
    filters.regions.length > 0 || filters.budgetMin !== null || filters.budgetMax !== null ||
    filters.onlyNew;

  return (
    <div className="space-y-4">
      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Поиск по названию, организации..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SortBy }))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="date">По дате</option>
            <option value="budget">По бюджету</option>
            <option value="deadline">По дедлайну</option>
            <option value="name">По названию</option>
          </select>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
              isOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>⚙️</span>
            Фильтры
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                ✓
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all"
            >
              ✕ Сброс
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 animate-in">
          {/* Categories */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Категории</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value as TenderCategory)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.categories.includes(cat.value as TenderCategory)
                      ? `${cat.color} ring-2 ring-offset-1 ring-blue-300`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Регионы</label>
            <div className="flex flex-wrap gap-2">
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.regions.includes(region)
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-offset-1 ring-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📍 {region}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Бюджет (млн ₽)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="От"
                value={filters.budgetMin !== null ? filters.budgetMin / 1000000 : ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  budgetMin: e.target.value ? Number(e.target.value) * 1000000 : null
                }))}
                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                placeholder="До"
                value={filters.budgetMax !== null ? filters.budgetMax / 1000000 : ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  budgetMax: e.target.value ? Number(e.target.value) * 1000000 : null
                }))}
                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick toggles */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyNew}
                onChange={(e) => setFilters(prev => ({ ...prev, onlyNew: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Только новые</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
