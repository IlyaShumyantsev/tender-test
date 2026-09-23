import React, { useState } from 'react';
import { Tender } from '../types';
import { categories, statusLabels } from '../data';

interface ExportModalProps {
  tenders: Tender[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ tenders, onClose }) => {
  const [exporting, setExporting] = useState(false);

  const formatBudget = (budget: number) => {
    if (budget >= 1000000000) return `${(budget / 1000000000).toFixed(1)} млрд`;
    if (budget >= 1000000) return `${(budget / 1000000).toFixed(1)} млн`;
    return `${budget.toLocaleString()}`;
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  const getStatusLabel = (value: string) => {
    return statusLabels[value]?.label || value;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    setExporting(true);
    setTimeout(() => {
      const headers = [
        'Название', 'Организация', 'Категория', 'Статус',
        'Бюджет (руб)', 'Регион', 'Дата публикации', 'Дедлайн',
        'Описание', 'Участников', 'Просмотров'
      ];

      const rows = tenders.map(t => [
        `"${t.title}"`,
        `"${t.organization}"`,
        getCategoryLabel(t.category),
        getStatusLabel(t.status),
        t.budget,
        t.region,
        t.publishDate,
        t.deadline,
        `"${t.description.replace(/"/g, '""')}"`,
        t.participantsCount,
        t.viewsCount,
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      // Add BOM for Excel compatibility
      const bom = '\uFEFF';
      downloadFile(bom + csvContent, `tenders_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
      setExporting(false);
    }, 300);
  };

  const exportToJSON = () => {
    setExporting(true);
    setTimeout(() => {
      const data = tenders.map(t => ({
        title: t.title,
        organization: t.organization,
        category: getCategoryLabel(t.category),
        status: getStatusLabel(t.status),
        budget: t.budget,
        budgetFormatted: `${formatBudget(t.budget)} ₽`,
        region: t.region,
        publishDate: t.publishDate,
        deadline: t.deadline,
        description: t.description,
        requirements: t.requirements,
        participantsCount: t.participantsCount,
        viewsCount: t.viewsCount,
        isFavorite: t.isFavorite,
      }));

      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `tenders_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      setExporting(false);
    }, 300);
  };

  const exportToHTML = () => {
    setExporting(true);
    setTimeout(() => {
      const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Отчёт по тендерам — TenderTrack</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #333; }
    h1 { color: #1e40af; margin-bottom: 8px; }
    .subtitle { color: #6b7280; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f3f4f6; padding: 12px 16px; text-align: left; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    tr:hover td { background: #f9fafb; }
    .budget { font-weight: 600; color: #059669; }
    .status-active { color: #059669; }
    .status-closed { color: #6b7280; }
    .status-upcoming { color: #2563eb; }
    .status-evaluation { color: #d97706; }
    .footer { margin-top: 30px; color: #9ca3af; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>📋 Отчёт по тендерам</h1>
  <p class="subtitle">TenderTrack — ${new Date().toLocaleDateString('ru-RU')} | Найдено: ${tenders.length} тендеров</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Название</th>
        <th>Организация</th>
        <th>Категория</th>
        <th>Статус</th>
        <th>Бюджет</th>
        <th>Регион</th>
        <th>Дедлайн</th>
      </tr>
    </thead>
    <tbody>
      ${tenders.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${t.title}</strong></td>
        <td>${t.organization}</td>
        <td>${getCategoryLabel(t.category)}</td>
        <td class="status-${t.status}">${getStatusLabel(t.status)}</td>
        <td class="budget">${formatBudget(t.budget)} ₽</td>
        <td>${t.region}</td>
        <td>${new Date(t.deadline).toLocaleDateString('ru-RU')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <p class="footer">Сгенерировано автоматически · TenderTrack © ${new Date().getFullYear()}</p>
</body>
</html>`;
      downloadFile(html, `tenders_report_${new Date().toISOString().split('T')[0]}.html`, 'text/html');
      setExporting(false);
    }, 300);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">📥 Скачать данные</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Экспорт {tenders.length} {tenders.length === 1 ? 'тендера' : tenders.length < 5 ? 'тендеров' : 'тендеров'}
          </p>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              📊
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900">CSV (Excel)</p>
              <p className="text-xs text-gray-500">Таблица для Excel, Google Sheets</p>
            </div>
            <span className="text-gray-400 group-hover:text-green-600 transition-colors">→</span>
          </button>

          <button
            onClick={exportToJSON}
            disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              🗂️
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900">JSON</p>
              <p className="text-xs text-gray-500">Для разработчиков и интеграций</p>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
          </button>

          <button
            onClick={exportToHTML}
            disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              📄
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900">HTML отчёт</p>
              <p className="text-xs text-gray-500">Красивый отчёт с таблицей</p>
            </div>
            <span className="text-gray-400 group-hover:text-purple-600 transition-colors">→</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              🖨️
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900">Печать / PDF</p>
              <p className="text-xs text-gray-500">Сохранить как PDF через диалог печати</p>
            </div>
            <span className="text-gray-400 group-hover:text-amber-600 transition-colors">→</span>
          </button>
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-gray-400 text-center">
            Файл будет сохранён в папку «Загрузки»
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
