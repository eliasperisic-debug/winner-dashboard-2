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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('winners')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'winners'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Winners
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'winners' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
