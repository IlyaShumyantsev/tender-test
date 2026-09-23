import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tender, FilterState, ViewMode } from './types';
import { mockTenders } from './data';
import { checkBackend, isBackendAvailable, connectWebSocket, disconnectWebSocket, syncSources } from './api';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TenderCard from './components/TenderCard';
import TenderDetail from './components/TenderDetail';
import Filters from './components/Filters';
import ExportModal from './components/ExportModal';
import BackendStatus from './components/BackendStatus';

function App() {
  const [tenders, setTenders] = useState<Tender[]>(mockTenders);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
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
  const [showExport, setShowExport] = useState(false);

  const tenderCounts = useMemo(() => ({
    all: tenders.length,
    active: tenders.filter(t => t.status === 'active').length,
    upcoming: tenders.filter(t => t.status === 'upcoming').length,
    evaluation: tenders.filter(t => t.status === 'evaluation').length,
    closed: tenders.filter(t => t.status === 'closed').length,
    favorites: tenders.filter(t => t.isFavorite).length,
  }), [tenders]);

  const filteredTenders = useMemo(() => {
    let result = [...tenders];

    // Tab filter
    if (activeTab === 'active') result = result.filter(t => t.status === 'active');
    else if (activeTab === 'upcoming') result = result.filter(t => t.status === 'upcoming');
    else if (activeTab === 'evaluation') result = result.filter(t => t.status === 'evaluation');
    else if (activeTab === 'closed') result = result.filter(t => t.status === 'closed');
    else if (activeTab === 'favorites') result = result.filter(t => t.isFavorite);

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(search) ||
        t.organization.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    // Categories
    if (filters.categories.length > 0) {
      result = result.filter(t => filters.categories.includes(t.category));
    }

    // Regions
    if (filters.regions.length > 0) {
      result = result.filter(t => filters.regions.includes(t.region));
    }

    // Budget
    if (filters.budgetMin !== null) {
      result = result.filter(t => t.budget >= filters.budgetMin!);
    }
    if (filters.budgetMax !== null) {
      result = result.filter(t => t.budget <= filters.budgetMax!);
    }

    // Only new
    if (filters.onlyNew) {
      result = result.filter(t => t.isNew);
    }

    // Sort
    switch (filters.sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        break;
      case 'budget':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'deadline':
        result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [tenders, activeTab, filters]);

  const toggleFavorite = (id: string) => {
    setTenders(prev => prev.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
    if (selectedTender && selectedTender.id === id) {
      setSelectedTender(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const showDashboard = activeTab === 'dashboard';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenderCounts={tenderCounts}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Top bar with status and export */}
        <div className="flex items-center justify-between mb-4">
          <BackendStatus />
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать
          </button>
        </div>

        {showDashboard ? (
          <Dashboard tenders={tenders} />
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'all' && 'Все тендеры'}
                  {activeTab === 'active' && 'Приём заявок'}
                  {activeTab === 'upcoming' && 'Скоро открытие'}
                  {activeTab === 'evaluation' && 'Оценка заявок'}
                  {activeTab === 'closed' && 'Закрытые тендеры'}
                  {activeTab === 'favorites' && 'Избранное'}
                </h2>
                <p className="text-gray-500 mt-1">
                  Найдено {filteredTenders.length} {filteredTenders.length === 1 ? 'тендер' :
                    filteredTenders.length < 5 ? 'тендера' : 'тендеров'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <Filters
              filters={filters}
              setFilters={setFilters}
              isOpen={filtersOpen}
              setIsOpen={setFiltersOpen}
            />

            {/* Tender Grid/List */}
            {filteredTenders.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-3'
              }>
                {filteredTenders.map(tender => (
                  <TenderCard
                    key={tender.id}
                    tender={tender}
                    onSelect={setSelectedTender}
                    onToggleFavorite={toggleFavorite}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Тендеры не найдены</h3>
                <p className="text-gray-500">Попробуйте изменить параметры фильтрации</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tender Detail Modal */}
      {selectedTender && (
        <TenderDetail
          tender={selectedTender}
          onClose={() => setSelectedTender(null)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          tenders={filteredTenders}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

export default App;
