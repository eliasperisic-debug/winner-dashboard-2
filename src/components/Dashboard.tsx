'use client';

import { useState } from 'react';
import { Winner } from '@/types/winner';
import { WinnerTable } from './WinnerTable';
import { AddWinnerForm } from './AddWinnerForm';
import { Analytics } from './Analytics';
import { Trends } from './Trends';

interface DashboardProps {
  winners: Winner[];
}

type TabType = 'winners' | 'analytics' | 'trends';

export function Dashboard({ winners }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('winners');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filter state for drill-down from Trends
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [filterMonths, setFilterMonths] = useState<string[] | null>(null); // For quarter drill-down
  const [filterQuarter, setFilterQuarter] = useState<string | null>(null);
  const [filterBrand, setFilterBrand] = useState<'KIKOFF' | 'GRANT' | null>(null);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };
  
  // Handle drill-down from Trends tab (single month)
  const handleTrendsDrillDown = (month: string, brand?: 'KIKOFF' | 'GRANT') => {
    setFilterMonth(month);
    setFilterMonths(null);
    setFilterQuarter(null);
    setFilterBrand(brand || null);
    setActiveTab('winners');
  };
  
  // Handle drill-down from Trends tab (quarter - multiple months)
  const handleQuarterDrillDown = (quarter: string, months: string[], brand?: 'KIKOFF' | 'GRANT') => {
    setFilterMonth(null);
    setFilterMonths(months);
    setFilterQuarter(quarter);
    setFilterBrand(brand || null);
    setActiveTab('winners');
  };
  
  // Clear filters when switching tabs
  const handleTabChange = (tab: TabType) => {
    if (tab !== 'winners') {
      setFilterMonth(null);
      setFilterMonths(null);
      setFilterQuarter(null);
      setFilterBrand(null);
    }
    setActiveTab(tab);
  };

  return (
    <>
      {/* Tab Navigation + Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 shadow-inner">
          <button
            onClick={() => handleTabChange('winners')}
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
            onClick={() => handleTabChange('analytics')}
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
          <button
            onClick={() => handleTabChange('trends')}
            className={`relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'trends'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Trends
            </span>
            {activeTab === 'trends' && (
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
      
      {/* Filter indicator when drilling down from Trends */}
      {activeTab === 'winners' && (filterMonth || filterMonths || filterBrand) && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Filtered from Trends: 
            {filterQuarter && <span className="font-medium"> {filterQuarter}</span>}
            {filterMonth && <span className="font-medium"> {filterMonth}</span>}
            {filterBrand && <span className="font-medium"> ({filterBrand})</span>}
          </span>
          <button
            onClick={() => { setFilterMonth(null); setFilterMonths(null); setFilterQuarter(null); setFilterBrand(null); }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'winners' ? (
        <WinnerTable 
          winners={winners} 
          key={refreshKey} 
          initialMonthFilter={filterMonth}
          initialMonthsFilter={filterMonths}
          initialBrandFilter={filterBrand}
        />
      ) : activeTab === 'analytics' ? (
        <Analytics winners={winners} />
      ) : (
        <Trends 
          winners={winners} 
          onDrillDown={handleTrendsDrillDown} 
          onQuarterDrillDown={handleQuarterDrillDown}
        />
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
