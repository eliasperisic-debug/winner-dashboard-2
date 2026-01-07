'use client';

import { useState } from 'react';
import { Winner } from '@/types/winner';
import { WinnerTable } from './WinnerTable';
import { AddWinnerForm } from './AddWinnerForm';
import { Analytics } from './Analytics';

interface DashboardProps {
  winners: Winner[];
}

export function Dashboard({ winners }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'winners' | 'analytics'>('winners');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  return (
    <>
      {/* Tab Navigation + Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab('winners')}
            className={`relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'winners'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Winners
            </span>
            {activeTab === 'winners' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </span>
            {activeTab === 'analytics' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'winners' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Winner
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'winners' ? (
        <WinnerTable winners={winners} key={refreshKey} />
      ) : (
        <Analytics winners={winners} />
      )}

      {/* Add Winner Modal */}
      {showAddForm && (
        <AddWinnerForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
