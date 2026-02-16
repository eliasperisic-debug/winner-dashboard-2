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
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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

// 5 distinct theme colors - assigned to active/selected themes only
const THEME_COLORS = [
  '#f43f5e', // Rose/Red
  '#3b82f6', // Blue
  '#f59e0b', // Amber/Orange
  '#8b5cf6', // Purple
  '#10b981', // Emerald/Green
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

// Custom label for win rate bars showing delta
function WinRateDeltaLabel({ x, y, width, dataKey, payload }: any) {
  const delta = dataKey === 'winRateKikoff' ? payload.deltaKikoff : payload.deltaGrant;
  if (delta === null || delta === undefined) return null;

  const color = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#94a3b8';
  const text = delta > 0 ? `+${delta.toFixed(1)}%` : delta === 0 ? '0%' : `${delta.toFixed(1)}%`;

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill={color}
      textAnchor="middle"
      fontSize={9}
      fontWeight={500}
    >
      {text}
    </text>
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
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  // Handler to change brand filter and reset theme selection
  const handleBrandChange = (brand: BrandFilter) => {
    setBrandFilter(brand);
    setSelectedThemes([]); // Reset to show top 4 themes for new brand
  };

  // Calculate monthly stats
  const monthlyStats = useMemo(() => calculateMonthlyStats(winners), [winners]);

  // Filter winners by brand for brand-specific top themes
  const filteredWinners = useMemo(() => {
    if (brandFilter === 'all') return winners;
    return winners.filter(w => w.brand === brandFilter);
  }, [winners, brandFilter]);

  // Get top 4 themes for default view (brand-specific)
  const topThemes = useMemo(() => getTopThemes(filteredWinners, 4), [filteredWinners]);
  const allThemes = useMemo(() => getAllThemes(filteredWinners), [filteredWinners]);
  const allExecutions = useMemo(() => getAllExecutions(winners), [winners]);

  // Active themes (user selected or top 4 for current brand)
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
  
  // Prepare theme trend data (monthly)
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

  // Prepare quarterly theme trend data
  const quarterlyThemeData = useMemo(() => {
    const quarterMap: Record<string, Record<string, number>> = {};

    chartData.forEach(d => {
      if (!quarterMap[d.quarter]) {
        quarterMap[d.quarter] = {};
        activeThemes.forEach(theme => {
          quarterMap[d.quarter][theme] = 0;
        });
      }
      activeThemes.forEach(theme => {
        if (brandFilter === 'KIKOFF') {
          quarterMap[d.quarter][theme] += d.themesKikoff[theme] || 0;
        } else if (brandFilter === 'GRANT') {
          quarterMap[d.quarter][theme] += d.themesGrant[theme] || 0;
        } else {
          quarterMap[d.quarter][theme] += d.themes[theme] || 0;
        }
      });
    });

    return Object.entries(quarterMap).map(([quarter, themes]) => ({
      name: quarter,
      ...themes,
    }));
  }, [chartData, activeThemes, brandFilter]);

  // Dynamic Y-axis domain for theme trends (one higher than max value)
  const themeDomain = useMemo((): [number, number] => {
    const dataToUse = viewMode === 'monthly' ? themeData : quarterlyThemeData;
    let maxVal = 0;
    dataToUse.forEach(d => {
      activeThemes.forEach(theme => {
        const val = d[theme] || 0;
        if (val > maxVal) maxVal = val;
      });
    });
    return [0, maxVal + 1];
  }, [themeData, quarterlyThemeData, activeThemes, viewMode]);

  // Calculate theme totals for sidebar (includes ALL themes, not just active)
  const themeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    allThemes.forEach(theme => {
      totals[theme] = chartData.reduce((sum, d) => {
        if (brandFilter === 'KIKOFF') {
          return sum + (d.themesKikoff[theme] || 0);
        } else if (brandFilter === 'GRANT') {
          return sum + (d.themesGrant[theme] || 0);
        } else {
          return sum + (d.themes[theme] || 0);
        }
      }, 0);
    });
    return totals;
  }, [chartData, allThemes, brandFilter]);

  // Calculate top themes per period (month or quarter) for the leaderboard
  const topThemesPerPeriod = useMemo(() => {
    if (viewMode === 'monthly') {
      return chartData.map(d => {
        const themeSource = brandFilter === 'KIKOFF'
          ? d.themesKikoff
          : brandFilter === 'GRANT'
            ? d.themesGrant
            : d.themes;

        const themeCounts = Object.entries(themeSource)
          .filter(([_, count]) => count > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        return {
          period: d.shortMonth,
          fullPeriod: d.month,
          themes: themeCounts,
          totalWinners: brandFilter === 'KIKOFF' ? d.kikoff : brandFilter === 'GRANT' ? d.grant : d.total,
        };
      });
    } else {
      // Quarterly aggregation
      const quarterMap: Record<string, { themes: Record<string, number>; total: number }> = {};

      chartData.forEach(d => {
        if (!quarterMap[d.quarter]) {
          quarterMap[d.quarter] = { themes: {}, total: 0 };
        }
        const themeSource = brandFilter === 'KIKOFF'
          ? d.themesKikoff
          : brandFilter === 'GRANT'
            ? d.themesGrant
            : d.themes;

        Object.entries(themeSource).forEach(([theme, count]) => {
          quarterMap[d.quarter].themes[theme] = (quarterMap[d.quarter].themes[theme] || 0) + count;
        });
        quarterMap[d.quarter].total += brandFilter === 'KIKOFF' ? d.kikoff : brandFilter === 'GRANT' ? d.grant : d.total;
      });

      return Object.entries(quarterMap).map(([quarter, data]) => ({
        period: quarter,
        fullPeriod: quarter,
        themes: Object.entries(data.themes)
          .filter(([_, count]) => count > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3),
        totalWinners: data.total,
      }));
    }
  }, [chartData, brandFilter, viewMode]);
  
  // Prepare win rate data by matching monthly stats with ad totals (Videos only)
  const winRateData = useMemo(() => {
    // Map month names from adTotals - support both "November 2025" and "November" formats
    const monthMap: Record<string, MonthlyAdTotals> = {};
    adTotals.forEach(at => {
      monthMap[at.month] = at;
      // Also map without year for flexible matching
      const monthOnly = at.month.split(' ')[0];
      if (!monthMap[monthOnly]) {
        monthMap[monthOnly] = at;
      }
    });

    const rawData = chartData.map(d => {
      // Try exact match first, then month-only match
      const adTotal = monthMap[d.month] || monthMap[d.month.split(' ')[0]];
      if (!adTotal || adTotal.totalAds === 0) {
        return {
          name: d.name,
          shortMonth: d.shortMonth,
          month: d.month,
          winRateKikoff: 0,
          winRateGrant: 0,
          winRateTotal: 0,
          winnersKikoff: d.kikoffVideos,
          winnersGrant: d.grantVideos,
          winnersTotal: d.totalVideos,
          adsKikoff: 0,
          adsGrant: 0,
          adsTotal: 0,
          deltaKikoff: null as number | null,
          deltaGrant: null as number | null,
          deltaTotal: null as number | null,
        };
      }

      // Use video-only counts for win rate calculation
      const winRateKikoff = adTotal.kikoffAds > 0 ? (d.kikoffVideos / adTotal.kikoffAds) * 100 : 0;
      const winRateGrant = adTotal.grantAds > 0 ? (d.grantVideos / adTotal.grantAds) * 100 : 0;
      const winRateTotal = adTotal.totalAds > 0 ? (d.totalVideos / adTotal.totalAds) * 100 : 0;

      return {
        name: d.name,
        shortMonth: d.shortMonth,
        month: d.month,
        winRateKikoff: Math.round(winRateKikoff * 10) / 10,
        winRateGrant: Math.round(winRateGrant * 10) / 10,
        winRateTotal: Math.round(winRateTotal * 10) / 10,
        winnersKikoff: d.kikoffVideos,
        winnersGrant: d.grantVideos,
        winnersTotal: d.totalVideos,
        adsKikoff: adTotal.kikoffAds,
        adsGrant: adTotal.grantAds,
        adsTotal: adTotal.totalAds,
        deltaKikoff: null as number | null,
        deltaGrant: null as number | null,
        deltaTotal: null as number | null,
      };
    }).filter(d => {
      // Only show months with ad data
      return d.adsTotal > 0;
    });

    // Calculate deltas (month-over-month change)
    return rawData.map((d, i) => {
      if (i === 0) return d;
      const prev = rawData[i - 1];
      return {
        ...d,
        deltaKikoff: Math.round((d.winRateKikoff - prev.winRateKikoff) * 10) / 10,
        deltaGrant: Math.round((d.winRateGrant - prev.winRateGrant) * 10) / 10,
        deltaTotal: Math.round((d.winRateTotal - prev.winRateTotal) * 10) / 10,
      };
    });
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

  // Get latest month's delta for trend indicators
  const latestDelta = useMemo(() => {
    if (winRateData.length < 2) return null;
    const latest = winRateData[winRateData.length - 1];
    return {
      kikoff: latest.deltaKikoff,
      grant: latest.deltaGrant,
      total: latest.deltaTotal,
      month: latest.month,
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
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select up to 4 themes to track:</p>
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
                    } else if (selectedThemes.length < 4) {
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
                disabled={!selectedThemes.includes(theme) && selectedThemes.length >= 4 && selectedThemes.length > 0}
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
            Reset to Top 4
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
              onClick={() => handleBrandChange('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                brandFilter === 'all'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Brands
            </button>
            <button
              onClick={() => handleBrandChange('KIKOFF')}
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
              onClick={() => handleBrandChange('GRANT')}
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

      {/* Top Themes Per Period - Leaderboard Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Top Themes by {viewMode === 'monthly' ? 'Month' : 'Quarter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Most popular themes each {viewMode === 'monthly' ? 'month' : 'quarter'}
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
          {topThemesPerPeriod.map((periodData) => (
            <div
              key={periodData.fullPeriod}
              className={`flex-shrink-0 ${viewMode === 'quarterly' ? 'w-48' : 'w-40'} bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {periodData.period}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {periodData.totalWinners} wins
                </span>
              </div>
              <div className="space-y-2">
                {periodData.themes.length > 0 ? (
                  periodData.themes.map(([theme, count], idx) => (
                    <div
                      key={theme}
                      className="flex items-center gap-2"
                    >
                      {/* Ribbon Badge */}
                      <div className="flex-shrink-0 w-6 h-8 relative">
                        <svg viewBox="0 0 24 32" className="w-full h-full">
                          {/* Ribbon tails */}
                          <path
                            d="M6 14 L6 28 L9 24 L12 28 L12 14"
                            fill={idx === 0 ? '#CA8A04' : idx === 1 ? '#64748B' : '#C2410C'}
                          />
                          <path
                            d="M18 14 L18 28 L15 24 L12 28 L12 14"
                            fill={idx === 0 ? '#EAB308' : idx === 1 ? '#94A3B8' : '#EA580C'}
                          />
                          {/* Circle badge */}
                          <circle
                            cx="12"
                            cy="10"
                            r="9"
                            fill={idx === 0 ? '#EAB308' : idx === 1 ? '#94A3B8' : '#EA580C'}
                          />
                          <circle
                            cx="12"
                            cy="10"
                            r="7"
                            fill={idx === 0 ? '#FCD34D' : idx === 1 ? '#CBD5E1' : '#FB923C'}
                          />
                          {/* Number */}
                          <text
                            x="12"
                            y="14"
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill={idx === 0 ? '#92400E' : idx === 1 ? '#374151' : '#9A3412'}
                          >
                            {idx + 1}
                          </text>
                        </svg>
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1 font-medium" title={theme}>
                        {theme}
                      </span>
                      <span className={`text-xs font-bold ${
                        idx === 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : idx === 1
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No data</p>
                )}
              </div>
            </div>
          ))}
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
      
      {/* Win Rate - Full Width Stock Chart */}
      {winRateData.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Win Rate Over Time
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded ml-2">Videos only</span>
            </h3>
            {winRateData.length > 0 && winRateData[winRateData.length - 1].month.includes('January') && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                Jan in progress
              </span>
            )}
          </div>

          {/* Overall Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <img src="/kikoff-logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">KIKOFF</span>
              </div>
              <div className="text-2xl font-bold text-[#00C853]">
                {overallWinRates.kikoff.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {overallWinRates.totalWinners.kikoff} wins / {overallWinRates.totalAds.kikoff} ads
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <img src="/grant-logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">GRANT</span>
              </div>
              <div className="text-2xl font-bold text-amber-500">
                {overallWinRates.grant.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {overallWinRates.totalWinners.grant} wins / {overallWinRates.totalAds.grant} ads
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">OVERALL</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {overallWinRates.total.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {overallWinRates.totalWinners.total} wins / {overallWinRates.totalAds.total} ads
              </p>
            </div>
          </div>

          {/* Stock Chart Style Line Graph */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortMonth"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
                          <p className="font-medium text-slate-900 dark:text-white mb-2">{data?.month}</p>
                          <div className="space-y-1 text-sm">
                            <p style={{ color: KIKOFF_COLOR }}>
                              KIKOFF: <span className="font-semibold">{data?.winRateKikoff}%</span>
                              <span className="text-slate-400 ml-1">({data?.winnersKikoff}/{data?.adsKikoff})</span>
                            </p>
                            <p style={{ color: GRANT_COLOR }}>
                              GRANT: <span className="font-semibold">{data?.winRateGrant}%</span>
                              <span className="text-slate-400 ml-1">({data?.winnersGrant}/{data?.adsGrant})</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="winRateKikoff"
                    name="KIKOFF"
                    stroke={KIKOFF_COLOR}
                    strokeWidth={2.5}
                    dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: KIKOFF_COLOR, stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="winRateGrant"
                    name="GRANT"
                    stroke={GRANT_COLOR}
                    strokeWidth={2.5}
                    dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: GRANT_COLOR, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Execution Trends - Full Width */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Execution Trends</h3>
        <div className="h-[280px]">
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
              <Legend wrapperStyle={{ fontSize: '11px' }} />
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

      {/* Theme Trends - Full Width with Sidebar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Theme Trends {viewMode === 'quarterly' && '(Quarterly)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select themes to compare · Hover to highlight
          </p>
        </div>

        <div className="flex gap-6">
          {/* Theme Sidebar Selector */}
          <div className="w-52 flex-shrink-0 space-y-1 max-h-[380px] overflow-y-auto pr-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Select themes:</p>
            {[...allThemes].sort((a, b) => (themeTotals[b] || 0) - (themeTotals[a] || 0)).map((theme) => {
              const isSelected = selectedThemes.length === 0
                ? topThemes.includes(theme)
                : selectedThemes.includes(theme);
              const themeTotal = themeTotals[theme] || 0;
              const activeIndex = activeThemes.indexOf(theme);
              const color = activeIndex >= 0 ? THEME_COLORS[activeIndex % THEME_COLORS.length] : null;

              return (
                <label
                  key={theme}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-opacity-50'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                  style={isSelected && color ? {
                    backgroundColor: `${color}15`,
                    borderColor: `${color}50`,
                  } : undefined}
                  onMouseEnter={() => isSelected && setHoveredTheme(theme)}
                  onMouseLeave={() => setHoveredTheme(null)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedThemes.length === 0) {
                          setSelectedThemes([theme]);
                        } else {
                          setSelectedThemes([...selectedThemes, theme]);
                        }
                      } else {
                        if (selectedThemes.length === 0) {
                          setSelectedThemes(topThemes.filter(t => t !== theme));
                        } else {
                          setSelectedThemes(selectedThemes.filter(t => t !== theme));
                        }
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500"
                    style={color ? { accentColor: color } : undefined}
                  />
                  {color ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-300 dark:bg-slate-600" />
                  )}
                  <span
                    className={`text-xs flex-1 truncate ${isSelected ? 'font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                    style={isSelected && color ? { color } : undefined}
                  >
                    {theme}
                  </span>
                  <span
                    className={`text-xs font-medium ${isSelected ? '' : 'text-slate-400 dark:text-slate-500'}`}
                    style={isSelected && color ? { color } : undefined}
                  >
                    {themeTotal}
                  </span>
                </label>
              );
            })}

            {selectedThemes.length > 0 && (
              <button
                onClick={() => setSelectedThemes([])}
                className="w-full mt-2 px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Reset to Top 4
              </button>
            )}
          </div>

          {/* Large Chart */}
          <div className="flex-1 min-w-0">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewMode === 'monthly' ? themeData : quarterlyThemeData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    domain={themeDomain}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickCount={themeDomain[1] > 10 ? 10 : themeDomain[1] + 1}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {activeThemes.map((theme, index) => {
                    const color = THEME_COLORS[index % THEME_COLORS.length];
                    const isHovered = hoveredTheme === theme;
                    const isFaded = hoveredTheme !== null && !isHovered;
                    return (
                      <Line
                        key={theme}
                        type="linear"
                        dataKey={theme}
                        name={theme}
                        stroke={color}
                        strokeWidth={isHovered ? 4 : 2.5}
                        strokeOpacity={isFaded ? 0.25 : 1}
                        dot={{
                          fill: color,
                          strokeWidth: 2,
                          r: isHovered ? 6 : 4,
                          stroke: '#fff',
                          fillOpacity: isFaded ? 0.25 : 1,
                          strokeOpacity: isFaded ? 0.25 : 1,
                        }}
                        activeDot={{ r: 7, fill: color, stroke: '#fff', strokeWidth: 2 }}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Color Legend below chart */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              {activeThemes.map((theme, index) => {
                const color = THEME_COLORS[index % THEME_COLORS.length];
                const isHovered = hoveredTheme === theme;
                const isFaded = hoveredTheme !== null && !isHovered;
                return (
                  <div
                    key={theme}
                    className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md transition-all"
                    style={{
                      backgroundColor: isHovered ? `${color}20` : 'transparent',
                      opacity: isFaded ? 0.4 : 1,
                    }}
                    onMouseEnter={() => setHoveredTheme(theme)}
                    onMouseLeave={() => setHoveredTheme(null)}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: isHovered ? color : undefined }}
                    >
                      {theme}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Duration and First Mention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Duration Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Average Duration Trends</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={durationDomain}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${value}s`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {brandFilter === 'all' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="avgDurationKikoff"
                      name="KIKOFF"
                      stroke={KIKOFF_COLOR}
                      strokeWidth={2}
                      dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="avgDurationGrant"
                      name="GRANT"
                      stroke={GRANT_COLOR}
                      strokeWidth={2}
                      dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3 }}
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
                    dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="avgDurationGrant"
                    name="GRANT"
                    stroke={GRANT_COLOR}
                    strokeWidth={2}
                    dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* First Mention Timing Trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">First Mention Timing</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={mentionDomain}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => `${value}s`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {brandFilter === 'all' ? (
                  <>
                    <Line
                      type="monotone"
                      dataKey="avgMentionKikoff"
                      name="KIKOFF"
                      stroke={KIKOFF_COLOR}
                      strokeWidth={2}
                      dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMentionGrant"
                      name="GRANT"
                      stroke={GRANT_COLOR}
                      strokeWidth={2}
                      dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3 }}
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
                    dot={{ fill: KIKOFF_COLOR, strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="avgMentionGrant"
                    name="GRANT"
                    stroke={GRANT_COLOR}
                    strokeWidth={2}
                    dot={{ fill: GRANT_COLOR, strokeWidth: 2, r: 3 }}
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
