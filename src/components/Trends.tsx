'use client';

import { useState, useMemo } from 'react';
import { Winner } from '@/types/winner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  calculateMonthlyStats,
  calculateQuarterlyStats,
  getTopThemes,
  getAllThemes,
  getAllExecutions,
  generateInsights,
  MonthlyStats,
  QuarterlyStats,
  Insight,
} from '@/lib/trendUtils';
import { MonthlyAdTotals } from '@/lib/sheets';

interface TrendsProps {
  winners: Winner[];
  adTotals: MonthlyAdTotals[];
  onDrillDown: (month: string, brand?: 'KIKOFF' | 'GRANT') => void;
  onQuarterDrillDown?: (quarter: string, months: string[], brand?: 'KIKOFF' | 'GRANT') => void;
}

type BrandFilter = 'all' | 'KIKOFF' | 'GRANT';
type ViewMode = 'monthly' | 'quarterly';

// Brand colors
const KIKOFF_COLOR = '#00C853';
const GRANT_COLOR = '#f59e0b';
const KIKOFF_COLOR_LIGHT = '#4ade80';
const GRANT_COLOR_LIGHT = '#fbbf24';

// Execution colors
const EXEC_COLORS: Record<string, string> = {
  'UGC': '#f59e0b',
  'AI': '#8b5cf6',
  'FLIX': '#d946ef',
  'Stock': '#64748b',
  'Unknown': '#94a3b8',
};

// Theme colors (rotating palette)
const THEME_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      <p className="font-medium text-slate-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// Get quarter boundaries for visual grouping
function getQuarterBoundaries(data: MonthlyStats[]): { quarter: string; startIdx: number; endIdx: number }[] {
  const quarters: { quarter: string; startIdx: number; endIdx: number }[] = [];
  let currentQuarter = '';
  let startIdx = 0;
  
  data.forEach((d, i) => {
    if (d.quarter !== currentQuarter) {
      if (currentQuarter) {
        quarters.push({ quarter: currentQuarter, startIdx, endIdx: i - 1 });
      }
      currentQuarter = d.quarter;
      startIdx = i;
    }
  });
  if (currentQuarter) {
    quarters.push({ quarter: currentQuarter, startIdx, endIdx: data.length - 1 });
  }
  
  return quarters;
}

// Insight icon component
function InsightIcon({ type }: { type: Insight['type'] }) {
  if (type === 'increase') {
    return <span className="text-green-500">↑</span>;
  }
  if (type === 'decrease') {
    return <span className="text-red-500">↓</span>;
  }
  if (type === 'peak') {
    return <span className="text-amber-500">★</span>;
  }
  return <span className="text-blue-500">→</span>;
}

export function Trends({ winners, adTotals, onDrillDown, onQuarterDrillDown }: TrendsProps) {
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  
  // Calculate monthly stats
  const monthlyStats = useMemo(() => calculateMonthlyStats(winners), [winners]);
  
  // Get top themes for default view
  const topThemes = useMemo(() => getTopThemes(winners, 5), [winners]);
  const allThemes = useMemo(() => getAllThemes(winners), [winners]);
  const allExecutions = useMemo(() => getAllExecutions(winners), [winners]);
  
  // Active themes (user selected or top 5)
  const activeThemes = selectedThemes.length > 0 ? selectedThemes : topThemes;
  
  // Generate insights
  const insights = useMemo(() => generateInsights(monthlyStats, winners), [monthlyStats, winners]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return monthlyStats.map(stats => ({
      ...stats,
      name: stats.shortMonth,
    }));
  }, [monthlyStats]);
  
  // Prepare quarterly chart data
  const quarterlyData = useMemo(() => {
    return calculateQuarterlyStats(monthlyStats);
  }, [monthlyStats]);
  
  // Prepare execution trend data
  const executionData = useMemo(() => {
    return chartData.map(d => {
      const execData: Record<string, any> = { name: d.name, shortMonth: d.shortMonth };
      allExecutions.forEach(exec => {
        if (brandFilter === 'KIKOFF') {
          execData[exec] = d.executionsKikoff[exec] || 0;
        } else if (brandFilter === 'GRANT') {
          execData[exec] = d.executionsGrant[exec] || 0;
        } else {
          execData[exec] = d.executions[exec] || 0;
        }
      });
      return execData;
    });
  }, [chartData, allExecutions, brandFilter]);
  
  // Prepare theme trend data
  const themeData = useMemo(() => {
    return chartData.map(d => {
      const themeDataPoint: Record<string, any> = { name: d.name, shortMonth: d.shortMonth };
      activeThemes.forEach(theme => {
        if (brandFilter === 'KIKOFF') {
          themeDataPoint[theme] = d.themesKikoff[theme] || 0;
        } else if (brandFilter === 'GRANT') {
          themeDataPoint[theme] = d.themesGrant[theme] || 0;
        } else {
          themeDataPoint[theme] = d.themes[theme] || 0;
        }
      });
      return themeDataPoint;
    });
  }, [chartData, activeThemes, brandFilter]);
  
  // Prepare win rate data by matching monthly stats with ad totals
  const winRateData = useMemo(() => {
    // Map month names from adTotals to match monthlyStats format
    const monthMap: Record<string, MonthlyAdTotals> = {};
    adTotals.forEach(at => {
      monthMap[at.month] = at;
    });
    
    return chartData.map(d => {
      const adTotal = monthMap[d.month];
      if (!adTotal || adTotal.totalAds === 0) {
        return {
          name: d.name,
          shortMonth: d.shortMonth,
          month: d.month,
          winRateKikoff: 0,
          winRateGrant: 0,
          winRateTotal: 0,
          winnersKikoff: d.kikoff,
          winnersGrant: d.grant,
          winnersTotal: d.total,
          adsKikoff: 0,
          adsGrant: 0,
          adsTotal: 0,
        };
      }
      
      const winRateKikoff = adTotal.kikoffAds > 0 ? (d.kikoff / adTotal.kikoffAds) * 100 : 0;
      const winRateGrant = adTotal.grantAds > 0 ? (d.grant / adTotal.grantAds) * 100 : 0;
      const winRateTotal = adTotal.totalAds > 0 ? (d.total / adTotal.totalAds) * 100 : 0;
      
      return {
        name: d.name,
        shortMonth: d.shortMonth,
        month: d.month,
        winRateKikoff: Math.round(winRateKikoff * 10) / 10,
        winRateGrant: Math.round(winRateGrant * 10) / 10,
        winRateTotal: Math.round(winRateTotal * 10) / 10,
        winnersKikoff: d.kikoff,
        winnersGrant: d.grant,
        winnersTotal: d.total,
        adsKikoff: adTotal.kikoffAds,
        adsGrant: adTotal.grantAds,
        adsTotal: adTotal.totalAds,
      };
    }).filter(d => d.adsTotal > 0); // Only show months with ad data
  }, [chartData, adTotals]);
  
  // Calculate overall win rates
  const overallWinRates = useMemo(() => {
    const totalWinners = { kikoff: 0, grant: 0, total: 0 };
    const totalAds = { kikoff: 0, grant: 0, total: 0 };
    
    winRateData.forEach(d => {
      totalWinners.kikoff += d.winnersKikoff;
      totalWinners.grant += d.winnersGrant;
      totalWinners.total += d.winnersTotal;
      totalAds.kikoff += d.adsKikoff;
      totalAds.grant += d.adsGrant;
      totalAds.total += d.adsTotal;
    });
    
    return {
      kikoff: totalAds.kikoff > 0 ? (totalWinners.kikoff / totalAds.kikoff) * 100 : 0,
      grant: totalAds.grant > 0 ? (totalWinners.grant / totalAds.grant) * 100 : 0,
      total: totalAds.total > 0 ? (totalWinners.total / totalAds.total) * 100 : 0,
      totalWinners,
      totalAds,
    };
  }, [winRateData]);
  
  // Calculate Y-axis domains
  const winnersDomain: [number, number] = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => Math.max(d.kikoff, d.grant, d.total)));
    return [0, Math.ceil(maxVal * 1.1)];
  }, [chartData]);
  
  const durationDomain: [number, number] = useMemo(() => {
    const values = chartData.flatMap(d => [d.avgDurationKikoff, d.avgDurationGrant, d.avgDuration]).filter(v => v > 0);
    if (values.length === 0) return [0, 20];
    return [Math.floor(Math.min(...values) * 0.8), Math.ceil(Math.max(...values) * 1.1)];
  }, [chartData]);
  
  const mentionDomain: [number, number] = useMemo(() => {
    const values = chartData.flatMap(d => [d.avgMentionKikoff, d.avgMentionGrant, d.avgMention]).filter(v => v > 0);
    if (values.length === 0) return [0, 10];
    return [Math.floor(Math.min(...values) * 0.8), Math.ceil(Math.max(...values) * 1.1)];
  }, [chartData]);
  
  // Handle chart click for drill-down - called when clicking on a data point
  const handlePointClick = (data: any, brand?: 'KIKOFF' | 'GRANT') => {
    if (data && data.payload) {
      const monthData = data.payload;
      const fullMonth = monthlyStats.find(m => m.shortMonth === monthData.shortMonth || m.shortMonth === monthData.name)?.month;
      if (fullMonth) {
        // Use the passed brand if filtering by brand, otherwise use the line that was clicked
        const targetBrand = brandFilter !== 'all' ? brandFilter : brand;
        onDrillDown(fullMonth, targetBrand);
      }
    }
  };
  
  // Handle quarterly bar click for drill-down
  const handleQuarterClick = (data: any, brand?: 'KIKOFF' | 'GRANT') => {
    if (data && onQuarterDrillDown) {
      const quarterData = quarterlyData.find(q => q.quarter === data.quarter);
      if (quarterData) {
        const targetBrand = brandFilter !== 'all' ? brandFilter : brand;
        onQuarterDrillDown(quarterData.quarter, quarterData.months, targetBrand);
      }
    }
  };
  
  // Theme customizer modal
  const ThemeCustomizer = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowThemeCustomizer(false)}>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Customize Theme Trends</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select up to 5 themes to track:</p>
        <div className="space-y-2 mb-6">
          {allThemes.map(theme => (
            <label key={theme} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg">
              <input
                type="checkbox"
                checked={selectedThemes.includes(theme) || (selectedThemes.length === 0 && topThemes.includes(theme))}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (selectedThemes.length === 0) {
                      // First selection - start fresh
                      setSelectedThemes([theme]);
                    } else if (selectedThemes.length < 5) {
                      setSelectedThemes([...selectedThemes, theme]);
                    }
                  } else {
                    if (selectedThemes.length === 0) {
                      // Deselecting from top themes - set all top except this one
                      setSelectedThemes(topThemes.filter(t => t !== theme));
                    } else {
                      setSelectedThemes(selectedThemes.filter(t => t !== theme));
                    }
                  }
                }}
                disabled={!selectedThemes.includes(theme) && selectedThemes.length >= 5 && selectedThemes.length > 0}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{theme}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedThemes([]);
              setShowThemeCustomizer(false);
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Reset to Top 5
          </button>
          <button
            onClick={() => setShowThemeCustomizer(false)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">View:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode('quarterly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'quarterly'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>
          
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
          
          {/* Brand Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setBrandFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                brandFilter === 'all'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Brands
            </button>
            <button
              onClick={() => setBrandFilter('KIKOFF')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                brandFilter === 'KIKOFF'
                  ? 'bg-white dark:bg-slate-600 text-[#00913a] dark:text-[#4ade80] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#00913a]'
              }`}
            >
              <img src="/kikoff-logo.png" alt="" className="w-4 h-4 rounded" />
              KIKOFF
            </button>
            <button
              onClick={() => setBrandFilter('GRANT')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                brandFilter === 'GRANT'
                  ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              <img src="/grant-logo.png" alt="" className="w-4 h-4 rounded" />
              GRANT
            </button>
          </div>
          
          <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            {monthlyStats.length} months of data
          </div>
        </div>
      </div>
      
      {/* Winners Over Time - Hero Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Winners Over Time {viewMode === 'quarterly' && '(by Quarter)'}
          </h3>
          {viewMode === 'monthly' ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Click any dot to view winners</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Click any bar to view winners</p>
          )}
        </div>
        <div className="h-[350px]">
          {viewMode === 'monthly' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="shortMonth" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  domain={winnersDomain}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {brandFilter === 'all' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="kikoff"
                      name="KIKOFF"
                      stroke={KIKOFF_COLOR}
                      strokeWidth={2}
                      dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 4, cursor: 'pointer' }}
                      activeDot={{ r: 8, fill: KIKOFF_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'KIKOFF') }}
                    />
                    <Line
                      type="monotone"
                      dataKey="grant"
                      name="GRANT"
                      stroke={GRANT_COLOR}
                      strokeWidth={2}
                      dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 4, cursor: 'pointer' }}
                      activeDot={{ r: 8, fill: GRANT_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'GRANT') }}
                    />
                  </>
                ) : brandFilter === 'KIKOFF' ? (
                  <Line
                    type="monotone"
                    dataKey="kikoff"
                    name="KIKOFF"
                    stroke={KIKOFF_COLOR}
                    strokeWidth={2}
                    dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 4, cursor: 'pointer' }}
                    activeDot={{ r: 8, fill: KIKOFF_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'KIKOFF') }}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="grant"
                    name="GRANT"
                    stroke={GRANT_COLOR}
                    strokeWidth={2}
                    dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 4, cursor: 'pointer' }}
                    activeDot={{ r: 8, fill: GRANT_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'GRANT') }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="quarter" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {brandFilter === 'all' ? (
                  <>
                    <Bar 
                      dataKey="kikoff" 
                      name="KIKOFF" 
                      fill={KIKOFF_COLOR} 
                      radius={[4, 4, 0, 0]} 
                      cursor="pointer"
                      onClick={(data) => handleQuarterClick(data, 'KIKOFF')}
                    />
                    <Bar 
                      dataKey="grant" 
                      name="GRANT" 
                      fill={GRANT_COLOR} 
                      radius={[4, 4, 0, 0]} 
                      cursor="pointer"
                      onClick={(data) => handleQuarterClick(data, 'GRANT')}
                    />
                  </>
                ) : brandFilter === 'KIKOFF' ? (
                  <Bar 
                    dataKey="kikoff" 
                    name="KIKOFF" 
                    fill={KIKOFF_COLOR} 
                    radius={[4, 4, 0, 0]} 
                    cursor="pointer"
                    onClick={(data) => handleQuarterClick(data, 'KIKOFF')}
                  />
                ) : (
                  <Bar 
                    dataKey="grant" 
                    name="GRANT" 
                    fill={GRANT_COLOR} 
                    radius={[4, 4, 0, 0]} 
                    cursor="pointer"
                    onClick={(data) => handleQuarterClick(data, 'GRANT')}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Win Rate Section */}
      {winRateData.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Win Rate Analysis
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                Winners / Total Ads = Win Rate %
              </p>
            </div>
          </div>
          
          {/* Overall Win Rate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <img src="/kikoff-logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">KIKOFF</span>
              </div>
              <div className="text-2xl font-bold text-[#00C853]">
                {overallWinRates.kikoff.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {overallWinRates.totalWinners.kikoff} wins / {overallWinRates.totalAds.kikoff} ads
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <img src="/grant-logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">GRANT</span>
              </div>
              <div className="text-2xl font-bold text-amber-500">
                {overallWinRates.grant.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {overallWinRates.totalWinners.grant} wins / {overallWinRates.totalAds.grant} ads
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">OVERALL</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {overallWinRates.total.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {overallWinRates.totalWinners.total} wins / {overallWinRates.totalAds.total} ads
              </div>
            </div>
          </div>
          
          {/* Win Rate Trend Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Win Rate Over Time</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
                          <p className="font-medium text-slate-900 dark:text-white mb-2">{data?.month}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-[#00C853]">
                              KIKOFF: <span className="font-semibold">{data?.winRateKikoff}%</span>
                              <span className="text-slate-400 ml-1">({data?.winnersKikoff}/{data?.adsKikoff})</span>
                            </p>
                            <p className="text-amber-500">
                              GRANT: <span className="font-semibold">{data?.winRateGrant}%</span>
                              <span className="text-slate-400 ml-1">({data?.winnersGrant}/{data?.adsGrant})</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  {brandFilter === 'all' ? (
                    <>
                      <Bar dataKey="winRateKikoff" name="KIKOFF %" fill={KIKOFF_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="winRateGrant" name="GRANT %" fill={GRANT_COLOR} radius={[4, 4, 0, 0]} />
                    </>
                  ) : brandFilter === 'KIKOFF' ? (
                    <Bar dataKey="winRateKikoff" name="KIKOFF %" fill={KIKOFF_COLOR} radius={[4, 4, 0, 0]} />
                  ) : (
                    <Bar dataKey="winRateGrant" name="GRANT %" fill={GRANT_COLOR} radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {/* Two Column Grid for Other Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Type Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Execution Type Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {allExecutions.filter(e => e !== 'Unknown').map((exec) => (
                  <Area
                    key={exec}
                    type="monotone"
                    dataKey={exec}
                    name={exec}
                    stackId="1"
                    stroke={EXEC_COLORS[exec] || '#94a3b8'}
                    fill={EXEC_COLORS[exec] || '#94a3b8'}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Duration Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Average Duration Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="shortMonth" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  domain={durationDomain}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${value}s`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {brandFilter === 'all' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="avgDurationKikoff"
                      name="KIKOFF"
                      stroke={KIKOFF_COLOR}
                      strokeWidth={2}
                      dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                      activeDot={{ r: 6, fill: KIKOFF_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'KIKOFF') }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="avgDurationGrant"
                      name="GRANT"
                      stroke={GRANT_COLOR}
                      strokeWidth={2}
                      dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                      activeDot={{ r: 6, fill: GRANT_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'GRANT') }}
                      connectNulls
                    />
                  </>
                ) : brandFilter === 'KIKOFF' ? (
                  <Line
                    type="monotone"
                    dataKey="avgDurationKikoff"
                    name="KIKOFF"
                    stroke={KIKOFF_COLOR}
                    strokeWidth={2}
                    dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                    activeDot={{ r: 6, fill: KIKOFF_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'KIKOFF') }}
                    connectNulls
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="avgDurationGrant"
                    name="GRANT"
                    stroke={GRANT_COLOR}
                    strokeWidth={2}
                    dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                    activeDot={{ r: 6, fill: GRANT_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'GRANT') }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Theme Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Theme Trends {selectedThemes.length === 0 ? '(Top 5)' : '(Custom)'}
            </h3>
            <button
              onClick={() => setShowThemeCustomizer(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Customize
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={themeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {activeThemes.map((theme, i) => (
                  <Line
                    key={theme}
                    type="monotone"
                    dataKey={theme}
                    name={theme}
                    stroke={THEME_COLORS[i % THEME_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: THEME_COLORS[i % THEME_COLORS.length], strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: THEME_COLORS[i % THEME_COLORS.length] }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {selectedThemes.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              Showing default top 5 themes · <button onClick={() => setShowThemeCustomizer(true)} className="text-blue-600 dark:text-blue-400 hover:underline">Click to customize</button>
            </p>
          )}
        </div>
        
        {/* Mention Timing Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">First Mention Timing Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="shortMonth" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  domain={mentionDomain}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${value}s`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {brandFilter === 'all' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="avgMentionKikoff"
                      name="KIKOFF"
                      stroke={KIKOFF_COLOR}
                      strokeWidth={2}
                      dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                      activeDot={{ r: 6, fill: KIKOFF_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'KIKOFF') }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMentionGrant"
                      name="GRANT"
                      stroke={GRANT_COLOR}
                      strokeWidth={2}
                      dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                      activeDot={{ r: 6, fill: GRANT_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'GRANT') }}
                      connectNulls
                    />
                  </>
                ) : brandFilter === 'KIKOFF' ? (
                  <Line
                    type="monotone"
                    dataKey="avgMentionKikoff"
                    name="KIKOFF"
                    stroke={KIKOFF_COLOR}
                    strokeWidth={2}
                    dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                    activeDot={{ r: 6, fill: KIKOFF_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'KIKOFF') }}
                    connectNulls
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="avgMentionGrant"
                    name="GRANT"
                    stroke={GRANT_COLOR}
                    strokeWidth={2}
                    dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3, cursor: 'pointer' }}
                    activeDot={{ r: 6, fill: GRANT_COLOR, cursor: 'pointer', onClick: (e: any, data: any) => handlePointClick(data, 'GRANT') }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Key Insights Section */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Key Insights
          </h3>
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 text-blue-800 dark:text-blue-200">
                <span className="text-lg mt-0.5">
                  <InsightIcon type={insight.type} />
                </span>
                <span>{insight.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Theme Customizer Modal */}
      {showThemeCustomizer && <ThemeCustomizer />}
    </div>
  );
}
