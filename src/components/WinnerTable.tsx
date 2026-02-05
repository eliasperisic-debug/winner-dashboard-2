'use client';

import { useState, useMemo, Fragment, useEffect } from 'react';
import { Winner } from '@/types/winner';
import {
  BrandChip,
  TypeChip,
  ExecutionChip,
  DurationChip,
  MentionChip,
  MusicChips,
  VariantChip,
  MonthChip,
  ThemeChips,
  CapsChip,
  ProductOverlayChips,
} from './Chips';
import { ThemeSelector } from './ThemeSelector';

// Extract Google Drive file ID from various URL formats
function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

interface WinnerTableProps {
  winners: Winner[];
  initialMonthFilter?: string | null;
  initialMonthsFilter?: string[] | null; // For quarter drill-down (multiple months)
  initialBrandFilter?: 'KIKOFF' | 'GRANT' | null;
}

// Parse theme string into separate tags (same logic as Chips.tsx)
function parseThemeTags(theme: string): string[] {
  if (!theme) return [];
  
  const themeLower = theme.toLowerCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const tags: string[] = [];
  
  if (themeLower.includes('seasonal') || themeLower.includes('seasonality')) tags.push('Seasonal');
  if (themeLower.includes('skit')) tags.push('Skit');
  if (themeLower.includes('halloween')) tags.push('Halloween');
  if (themeLower.includes('christmas')) tags.push('Christmas');
  if (themeLower.includes('thanksgiving')) tags.push('Thanksgiving');
  if (themeLower.includes('holiday') && !tags.includes('Halloween') && !tags.includes('Christmas') && !tags.includes('Thanksgiving')) tags.push('Holiday');
  if (themeLower.includes('new year')) tags.push('New Year');
  if ((themeLower.includes('prob') && themeLower.includes('solv')) || themeLower.includes('problem/solution')) tags.push('Prob/Solve');
  if (themeLower.includes('opportunity') && themeLower.includes('cost')) tags.push('Opportunity Cost');
  else if (themeLower.includes('opportunity') && !tags.some(t => t.includes('Opportunity'))) tags.push('Opportunity');
  if (themeLower.includes('education') && themeLower.includes('good credit')) tags.push('Good Credit Education');
  else if (themeLower.includes('education') && !tags.some(t => t.includes('Education'))) tags.push('Education');
  if (themeLower.includes('student')) tags.push('Student');
  if (themeLower.includes('analogy')) tags.push('Analogy');
  if (themeLower.includes('evergreen')) tags.push('Evergreen');
  if (themeLower.includes('aspirational')) tags.push('Aspirational');
  if (themeLower.includes('denied')) tags.push('Denied');
  if (themeLower.includes('held back')) tags.push('Held Back');
  if (themeLower.includes('busy') && themeLower.includes('mom')) tags.push('Busy Mom');
  if (themeLower.includes('paradise')) tags.push('Paradise');
  if (themeLower.includes('bachelor')) tags.push('Bachelor');
  if (themeLower.includes('comedy')) tags.push('Comedy');
  if (themeLower.includes('concept')) tags.push('Concept');
  if (themeLower.includes('winning')) tags.push('Winning');
  
  return tags;
}

function hasThemeTag(winner: Winner, tag: string): boolean {
  return parseThemeTags(winner.theme).includes(tag);
}

function getAllThemeTags(winners: Winner[]): string[] {
  const tagSet = new Set<string>();
  winners.forEach(w => {
    parseThemeTags(w.theme).forEach(tag => tagSet.add(tag));
  });
  return [...tagSet].sort();
}

export function WinnerTable({ winners, initialMonthFilter, initialMonthsFilter, initialBrandFilter }: WinnerTableProps) {
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>(initialBrandFilter || 'all');
  const [monthFilter, setMonthFilter] = useState<string>(initialMonthFilter || 'all');
  const [monthsFilter, setMonthsFilter] = useState<string[] | null>(initialMonthsFilter || null);
  const [executionFilter, setExecutionFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // Track locally updated themes (optimistic updates)
  const [updatedThemes, setUpdatedThemes] = useState<Record<string, string>>({});

  // Pinned winners state with localStorage persistence
  // Use unique ID: ticket + variant to distinguish between variants
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [pinnedLoaded, setPinnedLoaded] = useState(false);

  // Helper to create unique ID for a winner
  const getWinnerId = (winner: Winner) => `${winner.ticket}::${winner.variant || 'default'}`;

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem('pinnedWinners');
    if (saved) {
      setPinnedIds(new Set(JSON.parse(saved)));
    }
    setPinnedLoaded(true);
  }, []);

  // Save to localStorage when pins change (only after initial load)
  useEffect(() => {
    if (pinnedLoaded) {
      localStorage.setItem('pinnedWinners', JSON.stringify([...pinnedIds]));
    }
  }, [pinnedIds, pinnedLoaded]);

  // Toggle pin function
  const togglePin = (winner: Winner) => {
    const id = getWinnerId(winner);
    setPinnedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Clear all pins
  const clearPins = () => {
    setPinnedIds(new Set());
    setShowPinAnalysis(false);
  };

  // Pin analysis panel state
  const [showPinAnalysis, setShowPinAnalysis] = useState(false);

  // Get unique values for filters
  const months = useMemo(() => [...new Set(winners.map(w => w.month))].sort(), [winners]);
  const executions = useMemo(() => [...new Set(winners.map(w => w.execution))], [winners]);
  const themeTags = useMemo(() => getAllThemeTags(winners), [winners]);

  // Get pinned winners (always visible, regardless of filters)
  const pinnedWinners = useMemo(() => {
    return winners.filter(winner => pinnedIds.has(getWinnerId(winner)));
  }, [winners, pinnedIds]);

  // Compute pin analysis data
  const pinAnalysis = useMemo(() => {
    if (pinnedWinners.length === 0) return null;

    const total = pinnedWinners.length;
    const kikoff = pinnedWinners.filter(w => w.brand === 'KIKOFF').length;
    const grant = pinnedWinners.filter(w => w.brand === 'GRANT').length;

    // Execution breakdown
    const executions: Record<string, number> = {};
    pinnedWinners.forEach(w => {
      const exec = w.execution === '*UGC*' ? 'UGC' : w.execution;
      executions[exec] = (executions[exec] || 0) + 1;
    });

    // Duration breakdown
    const durations: Record<string, number> = { '0-8s': 0, '9-15s': 0, '16-22s': 0, '23s+': 0 };
    pinnedWinners.forEach(w => {
      const dur = parseInt(w.duration) || 0;
      if (dur <= 8) durations['0-8s']++;
      else if (dur <= 15) durations['9-15s']++;
      else if (dur <= 22) durations['16-22s']++;
      else durations['23s+']++;
    });

    // Theme breakdown
    const themes: Record<string, number> = {};
    pinnedWinners.forEach(w => {
      parseThemeTags(w.theme).forEach(tag => {
        themes[tag] = (themes[tag] || 0) + 1;
      });
    });

    // Month breakdown
    const months: Record<string, number> = {};
    pinnedWinners.forEach(w => {
      months[w.month] = (months[w.month] || 0) + 1;
    });

    return { total, kikoff, grant, executions, durations, themes, months };
  }, [pinnedWinners]);

  // Filter winners (apply search/filters but keep all items)
  const filteredWinners = useMemo(() => {
    return winners.filter(winner => {
      // Use updated theme if available, otherwise use original
      const currentTheme = updatedThemes[winner.ticket] ?? winner.theme;

      const matchesSearch = search === '' ||
        winner.ticket.toLowerCase().includes(search.toLowerCase()) ||
        currentTheme.toLowerCase().includes(search.toLowerCase()) ||
        winner.notes.toLowerCase().includes(search.toLowerCase());

      const matchesBrand = brandFilter === 'all' || winner.brand === brandFilter;

      // Handle month filtering - single month OR multiple months (quarter)
      let matchesMonth = true;
      if (monthsFilter && monthsFilter.length > 0) {
        matchesMonth = monthsFilter.includes(winner.month);
      } else if (monthFilter !== 'all') {
        matchesMonth = winner.month === monthFilter;
      }

      const matchesExecution = executionFilter === 'all' || winner.execution === executionFilter;
      // Use theme with updates applied
      const matchesTheme = themeFilter === 'all' || parseThemeTags(currentTheme).includes(themeFilter);

      return matchesSearch && matchesBrand && matchesMonth && matchesExecution && matchesTheme;
    });
  }, [winners, search, brandFilter, monthFilter, monthsFilter, executionFilter, themeFilter, updatedThemes]);

  // Separate pinned from non-pinned filtered winners
  const pinnedFilteredWinners = useMemo(() => {
    return filteredWinners.filter(w => pinnedIds.has(getWinnerId(w)));
  }, [filteredWinners, pinnedIds]);

  const nonPinnedFilteredWinners = useMemo(() => {
    return filteredWinners.filter(w => !pinnedIds.has(getWinnerId(w)));
  }, [filteredWinners, pinnedIds]);

  // Stats (based on all filtered winners)
  const stats = useMemo(() => {
    const total = filteredWinners.length;
    const kikoff = filteredWinners.filter(w => w.brand === 'KIKOFF').length;
    const grant = filteredWinners.filter(w => w.brand === 'GRANT').length;
    const aiCount = filteredWinners.filter(w => w.execution === 'AI').length;
    const ugcCount = filteredWinners.filter(w => w.execution === 'UGC' || w.execution === '*UGC*').length;
    return { total, kikoff, grant, aiCount, ugcCount };
  }, [filteredWinners]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-700/50">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.kikoff}</div>
          <div className="text-xs text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide">Kikoff</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-xl p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-700/50">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.grant}</div>
          <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide">Grant</div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/20 rounded-xl p-4 shadow-sm border border-violet-200/50 dark:border-violet-700/50">
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.aiCount}</div>
          <div className="text-xs text-violet-600/70 dark:text-violet-400/70 uppercase tracking-wide">AI</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl p-4 shadow-sm border border-amber-200/50 dark:border-amber-700/50">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.ugcCount}</div>
          <div className="text-xs text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wide">UGC</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search titles, themes, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Brands</option>
            <option value="KIKOFF">KIKOFF</option>
            <option value="GRANT">GRANT</option>
          </select>
          <select
            value={monthsFilter ? 'quarter' : monthFilter}
            onChange={(e) => {
              setMonthsFilter(null); // Clear quarter filter when manually selecting
              setMonthFilter(e.target.value);
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Months</option>
            {monthsFilter && <option value="quarter">{monthsFilter.length} months (Quarter)</option>}
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select
            value={executionFilter}
            onChange={(e) => setExecutionFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Executions</option>
            {executions.map(exec => (
              <option key={exec} value={exec}>{exec}</option>
            ))}
          </select>
          <select
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Themes</option>
            {themeTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          {pinnedIds.size > 0 && (
            <>
              <button
                onClick={() => setShowPinAnalysis(!showPinAnalysis)}
                className={`px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                  showPinAnalysis
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze Pins
              </button>
              <button
                onClick={clearPins}
                className="px-3 py-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                </svg>
                Clear Pins ({pinnedIds.size})
              </button>
            </>
          )}
          {(brandFilter !== 'all' || monthFilter !== 'all' || executionFilter !== 'all' || themeFilter !== 'all' || search !== '') && (
            <button
              onClick={() => { setBrandFilter('all'); setMonthFilter('all'); setExecutionFilter('all'); setThemeFilter('all'); setSearch(''); }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Pin Analysis Panel */}
      {showPinAnalysis && pinAnalysis && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Pinned Videos Analysis
            </h3>
            <button
              onClick={() => setShowPinAnalysis(false)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{pinAnalysis.total}</div>
              <div className="text-xs text-slate-500 uppercase">Total Pinned</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{pinAnalysis.kikoff}</div>
              <div className="text-xs text-slate-500 uppercase">Kikoff</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-emerald-600">{pinAnalysis.grant}</div>
              <div className="text-xs text-slate-500 uppercase">Grant</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-violet-600">{Object.keys(pinAnalysis.themes).length}</div>
              <div className="text-xs text-slate-500 uppercase">Themes</div>
            </div>
          </div>

          {/* Detailed Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Execution Types */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Execution</h4>
              <div className="space-y-1.5">
                {Object.entries(pinAnalysis.executions).sort((a, b) => b[1] - a[1]).map(([exec, count]) => (
                  <div key={exec} className="flex items-center justify-between text-sm">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      exec === 'UGC' ? 'bg-amber-100 text-amber-700' :
                      exec === 'AI' ? 'bg-violet-100 text-violet-700' :
                      exec === 'FLIX' ? 'bg-pink-100 text-pink-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{exec}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Duration</h4>
              <div className="space-y-1.5">
                {Object.entries(pinAnalysis.durations).filter(([, count]) => count > 0).map(([dur, count]) => (
                  <div key={dur} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{dur}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(count / pinAnalysis.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Top Themes</h4>
              <div className="space-y-1.5">
                {Object.entries(pinAnalysis.themes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([theme, count]) => (
                  <div key={theme} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate">{theme}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Months */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Months</h4>
              <div className="space-y-1.5">
                {Object.entries(pinAnalysis.months).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([month, count]) => (
                  <div key={month} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate text-xs">{month}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned Videos List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Pinned Videos</h4>
            <div className="flex flex-wrap gap-2">
              {pinnedWinners.map(w => (
                <span key={w.ticket} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded text-xs">
                  {w.ticket.length > 30 ? w.ticket.substring(0, 30) + '...' : w.ticket}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click hint */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Click any row to expand details and watch video
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Month</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand</th>
                <th className="px-1.5 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Theme</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Var</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dur</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mention</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exec</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Caps</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product UI</th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Music</th>
              </tr>
            </thead>
            <tbody key={`tbody-${search}-${filteredWinners.length}-${pinnedIds.size}`} className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* Search results header */}
              {search !== '' && (
                <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                  <td colSpan={12} className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    Search Results for "{search}" ({filteredWinners.length})
                  </td>
                </tr>
              )}

              {/* Pinned section header (if any pinned in current filter) */}
              {pinnedFilteredWinners.length > 0 && (
                <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                  <td colSpan={12} className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                      </svg>
                      Pinned ({pinnedFilteredWinners.length})
                    </div>
                  </td>
                </tr>
              )}

              {/* Pinned winners first */}
              {pinnedFilteredWinners.map((winner) => {
                const isPinned = true;
                const winnerId = getWinnerId(winner);
                return (
                  <Fragment key={winnerId}>
                    <tr
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${
                        expandedRow === winnerId ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      } ${
                        isPinned ? 'bg-amber-50/30 dark:bg-amber-900/5 border-l-2 border-l-amber-400 dark:border-l-amber-500' : ''
                      }`}
                      onClick={() => setExpandedRow(expandedRow === winnerId ? null : winnerId)}
                    >
                      <td className="px-2 py-2 whitespace-nowrap">
                        <MonthChip month={winner.month} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <BrandChip brand={winner.brand} />
                      </td>
                      <td className="px-1.5 py-2 whitespace-nowrap">
                        <TypeChip type={winner.type} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(winner);
                            }}
                            className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                              isPinned
                                ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
                                : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'
                            }`}
                            title={isPinned ? 'Unpin' : 'Pin for comparison'}
                          >
                            <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isPinned ? 0 : 2} viewBox="0 0 24 24">
                              <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                            </svg>
                          </button>
                          {winner.videoUrl && (
                            <span className="text-blue-500 dark:text-blue-400 flex-shrink-0" title="Video available">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </span>
                          )}
                          <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                            {winner.ticket}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <ThemeSelector
                          ticket={winner.ticket}
                          currentTheme={updatedThemes[winner.ticket] ?? winner.theme}
                          onUpdate={(newTheme) => setUpdatedThemes(prev => ({ ...prev, [winner.ticket]: newTheme }))}
                        />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <VariantChip variant={winner.variant} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <DurationChip duration={winner.duration} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <MentionChip mention={winner.mention} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <ExecutionChip execution={winner.execution} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <CapsChip caps={winner.caps} />
                      </td>
                      <td className="px-2 py-2">
                        <ProductOverlayChips overlay={winner.productOverlay} />
                      </td>
                      <td className="px-2 py-2">
                        <MusicChips music={winner.music} />
                      </td>
                    </tr>
                    {expandedRow === winnerId && (
                      <tr className="bg-slate-50/80 dark:bg-slate-900/30">
                        <td colSpan={12} className="px-4 py-4">
                          <div className="flex flex-col lg:flex-row gap-4">
                            {winner.videoUrl && extractGoogleDriveId(winner.videoUrl) ? (
                              <div className="lg:w-72 flex-shrink-0">
                                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                  <iframe
                                    src={`https://drive.google.com/file/d/${extractGoogleDriveId(winner.videoUrl)}/preview`}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="lg:w-72 flex-shrink-0">
                                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500" style={{ aspectRatio: '1/1' }}>
                                  <div className="text-center p-4">
                                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs">No video</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Full Ticket</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.ticket || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Test Differentiators</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.testDifferentiators || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Text Overlay Style</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.textOverlay || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Caps Style (Full)</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.caps || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Product Overlay (Full)</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.productOverlay || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Music</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.music || '-'}</p>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700/50 shadow-sm sm:col-span-2">
                                <span className="font-semibold text-amber-700 dark:text-amber-300 text-xs uppercase tracking-wide block mb-1.5">Notes</span>
                                <p className="text-amber-800 dark:text-amber-200 text-sm break-words">{winner.notes || 'No notes available'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {/* All other winners section header */}
              {pinnedFilteredWinners.length > 0 && nonPinnedFilteredWinners.length > 0 && (
                <tr className="bg-slate-100/50 dark:bg-slate-900/30">
                  <td colSpan={12} className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    All Winners ({nonPinnedFilteredWinners.length})
                  </td>
                </tr>
              )}

              {/* Non-pinned winners */}
              {nonPinnedFilteredWinners.map((winner) => {
                const isPinned = false;
                const winnerId = getWinnerId(winner);
                return (
                  <Fragment key={winnerId}>
                    <tr
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${
                        expandedRow === winnerId ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => setExpandedRow(expandedRow === winnerId ? null : winnerId)}
                    >
                      <td className="px-2 py-2 whitespace-nowrap">
                        <MonthChip month={winner.month} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <BrandChip brand={winner.brand} />
                      </td>
                      <td className="px-1.5 py-2 whitespace-nowrap">
                        <TypeChip type={winner.type} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(winner);
                            }}
                            className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                              isPinned
                                ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
                                : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'
                            }`}
                            title={isPinned ? 'Unpin' : 'Pin for comparison'}
                          >
                            <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isPinned ? 0 : 2} viewBox="0 0 24 24">
                              <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                            </svg>
                          </button>
                          {winner.videoUrl && (
                            <span className="text-blue-500 dark:text-blue-400 flex-shrink-0" title="Video available">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </span>
                          )}
                          <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                            {winner.ticket}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <ThemeSelector
                          ticket={winner.ticket}
                          currentTheme={updatedThemes[winner.ticket] ?? winner.theme}
                          onUpdate={(newTheme) => setUpdatedThemes(prev => ({ ...prev, [winner.ticket]: newTheme }))}
                        />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <VariantChip variant={winner.variant} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <DurationChip duration={winner.duration} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <MentionChip mention={winner.mention} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <ExecutionChip execution={winner.execution} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <CapsChip caps={winner.caps} />
                      </td>
                      <td className="px-2 py-2">
                        <ProductOverlayChips overlay={winner.productOverlay} />
                      </td>
                      <td className="px-2 py-2">
                        <MusicChips music={winner.music} />
                      </td>
                    </tr>
                    {expandedRow === winnerId && (
                      <tr className="bg-slate-50/80 dark:bg-slate-900/30">
                        <td colSpan={12} className="px-4 py-4">
                          <div className="flex flex-col lg:flex-row gap-4">
                            {winner.videoUrl && extractGoogleDriveId(winner.videoUrl) ? (
                              <div className="lg:w-72 flex-shrink-0">
                                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                  <iframe
                                    src={`https://drive.google.com/file/d/${extractGoogleDriveId(winner.videoUrl)}/preview`}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="lg:w-72 flex-shrink-0">
                                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500" style={{ aspectRatio: '1/1' }}>
                                  <div className="text-center p-4">
                                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs">No video</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Full Ticket</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.ticket || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Test Differentiators</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.testDifferentiators || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Text Overlay Style</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.textOverlay || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Caps Style (Full)</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.caps || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Product Overlay (Full)</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.productOverlay || '-'}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide block mb-1.5">Music</span>
                                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">{winner.music || '-'}</p>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700/50 shadow-sm sm:col-span-2">
                                <span className="font-semibold text-amber-700 dark:text-amber-300 text-xs uppercase tracking-wide block mb-1.5">Notes</span>
                                <p className="text-amber-800 dark:text-amber-200 text-sm break-words">{winner.notes || 'No notes available'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {pinnedWinners.length === 0 && filteredWinners.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            {search !== '' ? `No results found for "${search}"` : 'No winners found matching your filters.'}
          </div>
        )}
      </div>
    </div>
  );
}
