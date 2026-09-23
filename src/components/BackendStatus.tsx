import React, { useState, useEffect } from 'react';
import { checkBackend, isBackendAvailable, syncSources } from '../api';

interface BackendStatusProps {
  onSyncComplete?: () => void;
}

const BackendStatus: React.FC<BackendStatusProps> = ({ onSyncComplete }) => {
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    checkBackend().then(setBackendAvailable);
  }, []);

  const handleSync = async () => {
    if (!backendAvailable) return;
    setSyncing(true);
    try {
      await syncSources();
      setLastSync(new Date().toLocaleTimeString('ru-RU'));
      onSyncComplete?.();
      setTimeout(() => setSyncing(false), 2000);
    } catch {
      setSyncing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowInfo(!showInfo)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
          backendAvailable
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
        {backendAvailable ? 'Бэкенд онлайн' : 'Локальный режим'}
      </button>

      {showInfo && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Статус сервера</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Состояние</span>
              <span className={`text-sm font-medium ${backendAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                {backendAvailable ? '🟢 Подключён' : '🟡 Автономный'}
              </span>
            </div>

            {backendAvailable && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Источники</span>
                  <span className="text-sm font-medium text-gray-900">6 активных</span>
                </div>

                {lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Последняя синхр.</span>
                    <span className="text-sm text-gray-900">{lastSync}</span>
                  </div>
                )}

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                    syncing
                      ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {syncing ? '⏳ Синхронизация...' : '🔄 Синхронизировать'}
                </button>
              </>
            )}

            {!backendAvailable && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Для подключения бэкенда:</strong><br />
                  1. Откройте терминал в папке проекта<br />
                  2. Выполните: <code className="bg-amber-100 px-1 rounded">cd server && node index.js</code><br />
                  3. Сервер запустится на порту 3001
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendStatus;
