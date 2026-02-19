'use client';

import { useState, useMemo } from 'react';
import { Winner } from '@/types/winner';
import { MonthlyAdTotals } from '@/lib/sheets';
import { sortMonths, sortQuarters } from '@/lib/trendUtils';

interface AnalyticsProps {
  winners: Winner[];
  adTotals: MonthlyAdTotals[];
}

type BrandView = 'all' | 'KIKOFF' | 'GRANT';

// Parse theme string into separate tags
function parseThemeTags(theme: string): string[] {
  if (!theme) return [];
  const themeLower = theme.toLowerCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const tags: string[] = [];
  
  if (themeLower.includes('seasonal') || themeLower.includes('seasonality') || themeLower.includes('holiday')) tags.push('Seasonal');
  if (themeLower.includes('skit')) tags.push('Skit');
  if (themeLower.includes('halloween')) tags.push('Halloween');
  if (themeLower.includes('christmas')) tags.push('Christmas');
  if (themeLower.includes('thanksgiving')) tags.push('Thanksgiving');
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
  if (themeLower.includes('winning')) tags.push('Winning');
  
  if (tags.length === 0) tags.push('Other');
  return tags;
}

function hasThemeTag(winner: Winner, tag: string): boolean {
  return parseThemeTags(winner.theme).includes(tag);
}

function getAllThemeTags(winners: Winner[]): string[] {
  const tagSet = new Set<string>();
  winners.forEach(w => parseThemeTags(w.theme).forEach(tag => tagSet.add(tag)));
  return [...tagSet].sort();
}

function getQuarter(month: string): string {
  const monthName = month.split(' ')[0]?.toLowerCase();
  const year = month.split(' ')[1];
  if (['january', 'february', 'march'].includes(monthName)) return `Q1 ${year}`;
  if (['april', 'may', 'june'].includes(monthName)) return `Q2 ${year}`;
  if (['july', 'august', 'september'].includes(monthName)) return `Q3 ${year}`;
  if (['october', 'november', 'december'].includes(monthName)) return `Q4 ${year}`;
  return 'Unknown';
}

function getMonthsInQuarter(quarter: string): string[] {
  const [q, year] = quarter.split(' ');
  if (q === 'Q1') return [`January ${year}`, `February ${year}`, `March ${year}`];
  if (q === 'Q2') return [`April ${year}`, `May ${year}`, `June ${year}`];
  if (q === 'Q3') return [`July ${year}`, `August ${year}`, `September ${year}`];
  if (q === 'Q4') return [`October ${year}`, `November ${year}`, `December ${year}`];
  return [];
}

function normalizeCaps(caps: string): string {
  const normalized = caps.toLowerCase().trim();
  if (normalized.includes('white') && normalized.includes('stroke')) return 'White w/black stroke';
  if (normalized.includes('green') && normalized.includes('red')) return 'Keywords in Green/Red';
  if (normalized.includes('tiktok')) return 'TikTok style';
  if (normalized.includes('classic') || normalized.includes('grey highlight')) return 'Classic/Grey highlight';
  if (normalized.includes('capcut')) return 'CapCut';
  if (normalized === 'n/a' || normalized === '') return 'None/N/A';
  return caps.trim();
}

function hasGreenRedKeywords(caps: string): boolean {
  const normalized = caps.toLowerCase().trim();
  return normalized.includes('green') && normalized.includes('red');
}

function countCapsWithSubsections(arr: Winner[]): { main: [string, number][], subsections: Record<string, [string, number][]> } {
  const mainCounts: Record<string, number> = {};
  const whiteStrokeSubsections: Record<string, number> = {
    'With Green/Red Keywords': 0,
    'Standard (No Keywords)': 0,
  };
  
  arr.forEach(w => {
    const caps = w.caps?.toString().trim() || 'Unknown';
    const mainCategory = normalizeCaps(caps);
    mainCounts[mainCategory] = (mainCounts[mainCategory] || 0) + 1;
    
    if (mainCategory === 'White w/black stroke') {
      if (hasGreenRedKeywords(caps)) {
        whiteStrokeSubsections['With Green/Red Keywords']++;
      } else {
        whiteStrokeSubsections['Standard (No Keywords)']++;
      }
    }
  });
  
  const main = Object.entries(mainCounts).sort((a, b) => b[1] - a[1]);
  const subsections: Record<string, [string, number][]> = {
    'White w/black stroke': Object.entries(whiteStrokeSubsections).filter(([_, count]) => count > 0),
  };
  
  return { main, subsections };
}

// Normalize execution type - *UGC* counts as UGC (footage over creator for full video)
function normalizeExecution(exec: string): string {
  if (!exec || exec.trim() === '') return 'Unknown';
  const normalized = exec.trim();
  // *UGC* is a special UGC variant (footage over creator for full video)
  if (normalized === '*UGC*') return 'UGC';
  return normalized;
}

// Check if execution is a special variant (for showing note)
function isSpecialUGC(exec: string): boolean {
  return exec?.trim() === '*UGC*';
}

function normalizeMusic(music: string): string[] {
  if (!music || music === 'n/a') return [];
  const genres = music.split(',').map(g => g.trim().toLowerCase());
  const normalized: string[] = [];
  
  genres.forEach(genre => {
    if (genre.includes('chill') || genre.includes('lounge') || genre.includes('lofi')) {
      if (!normalized.includes('Chill/Lounge/Lofi')) normalized.push('Chill/Lounge/Lofi');
    } else if (genre.includes('edm')) {
      if (!normalized.includes('EDM')) normalized.push('EDM');
    } else if (genre.includes('upbeat')) {
      if (!normalized.includes('Upbeat')) normalized.push('Upbeat');
    } else if (genre.includes('seasonal') || genre.includes('themed')) {
      if (!normalized.includes('Seasonal/Themed')) normalized.push('Seasonal/Themed');
    } else if (genre.includes('corporate')) {
      if (!normalized.includes('Corporate')) normalized.push('Corporate');
    } else if (genre.includes('hip') || genre.includes('hop')) {
      if (!normalized.includes('Hip-Hop')) normalized.push('Hip-Hop');
    } else if (genre.includes('pop')) {
      if (!normalized.includes('Pop')) normalized.push('Pop');
    } else if (genre.includes('funk') || genre.includes('goofy')) {
      if (!normalized.includes('Funk/Goofy')) normalized.push('Funk/Goofy');
    }
  });
  return normalized;
}

function normalizeTextOverlay(overlay: string): string {
  if (!overlay || overlay.trim() === '') return 'None/N/A';
  
  const normalized = overlay.toLowerCase().trim();
  
  if (normalized.includes('keyboard') || normalized.includes('typing') || normalized.includes('imessage')) {
    return 'Keyboard/Typing Text';
  }
  if (normalized.includes('handwritten') || normalized.includes('shak')) {
    return 'Handwritten/Shaky';
  }
  if (normalized.includes('full screen') || normalized.includes('bleed')) {
    return 'Full Screen Bleed';
  }
  if (normalized.includes('keyword') && normalized.includes('green')) {
    return 'Keywords Highlighted (Green)';
  }
  if (normalized.includes('large') || normalized.includes('bold') || normalized.includes('big')) {
    return 'Large/Bold Text';
  }
  if (normalized.includes('web window') || normalized.includes('grant title')) {
    return 'Web Windows Style';
  }
  if (normalized.includes('blog') || normalized.includes('article')) {
    return 'Blog/Article Style';
  }
  if (normalized.includes('on theme') || normalized.includes('themed') || normalized.includes('seasonal')) {
    return 'Themed/Seasonal Text';
  }
  if (normalized.includes('default')) {
    return 'Default/Standard';
  }
  
  return overlay.length > 30 ? overlay.substring(0, 27) + '...' : overlay;
}

// Execution type colors (hex values for inline styles)
const execColorHex: Record<string, string> = {
  'UGC': '#f59e0b',
  'AI': '#8b5cf6',
  'FLIX': '#d946ef',
  'Stock': '#64748b',
  '*UGC*': '#f59e0b',
  'Unknown': '#94a3b8',
};

// Execution type Tailwind classes (for V2 comparison view)
const execColorClass: Record<string, string> = {
  'UGC': 'bg-amber-500',
  'AI': 'bg-violet-500',
  'FLIX': 'bg-fuchsia-500',
  'Stock': 'bg-slate-500',
  '*UGC*': 'bg-amber-500',
  'Unknown': 'bg-slate-400',
};

// Stat card for overview
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
}

function StatCard({ label, value, subtext, color = 'slate' }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    slate: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className={`rounded-lg p-4 border ${colors[color]}`}>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
      {subtext && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</div>}
    </div>
  );
}

// V2-style expandable row (without winners list, for comparison view)
interface ExpandableRowV2Props {
  label: string;
  count: number;
  total: number;
  color?: string;
  subsections?: [string, number][];
}

function ExpandableRowV2({ label, count, total, color = 'bg-slate-500', subsections }: ExpandableRowV2Props) {
  const [expanded, setExpanded] = useState(false);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isLong = label.length > 30;
  const hasSubsections = subsections && subsections.length > 0;
  const isExpandable = isLong || hasSubsections;
  
  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center gap-3 ${isExpandable ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-1 rounded' : ''}`}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <div className="min-w-[140px] max-w-[140px] text-sm text-slate-600 dark:text-slate-400">
          {isLong && !expanded ? (
            <span className="flex items-center gap-1">
              <span className="truncate">{label.slice(0, 27)}...</span>
              <svg className={`w-3 h-3 flex-shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          ) : (
            <span className={`${isLong ? 'block' : 'truncate'} flex items-center gap-1`}>
              {label}
              {hasSubsections && (
                <svg className={`w-3 h-3 flex-shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
          )}
        </div>
        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <div className="w-14 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
          {count}/{total}
        </div>
        <div className="w-10 text-right text-xs text-slate-500 dark:text-slate-400">
          {pct}%
        </div>
      </div>
      {expanded && isLong && !hasSubsections && (
        <div className="ml-2 pl-2 border-l-2 border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 py-1">
          {label}
        </div>
      )}
      {expanded && hasSubsections && (
        <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-600 space-y-1.5 py-1">
          {subsections.map(([subLabel, subCount]) => {
            const subPct = count > 0 ? Math.round((subCount / count) * 100) : 0;
            return (
              <div key={subLabel} className="flex items-center gap-2">
                <div className="min-w-[120px] max-w-[120px] text-xs text-slate-500 dark:text-slate-400 truncate">
                  {subLabel}
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} opacity-60 rounded-full`} style={{ width: `${subPct}%` }} />
                </div>
                <div className="w-12 text-right text-xs text-slate-500 dark:text-slate-400">
                  {subCount}/{count}
                </div>
                <div className="w-8 text-right text-xs text-slate-400">
                  {subPct}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Winner mini card for expanded view
function WinnerMiniCard({ winner, brandColor }: { winner: Winner; brandColor: string }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-l-2 ${brandColor}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{winner.ticket}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{winner.month} · {winner.duration} · {winner.execution || 'Unknown'}</p>
      </div>
      {winner.videoUrl && (
        <a 
          href={winner.videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </a>
      )}
    </div>
  );
}

// Expandable analytics row with winners list (for single brand detail view)
interface AnalyticsRowProps {
  label: string;
  count: number;
  total: number;
  colorHex: string;
  winners: Winner[];
  brandColor: string;
}

function AnalyticsRow({ label, count, total, colorHex, winners, brandColor }: AnalyticsRowProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <svg className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="min-w-[140px] max-w-[140px] text-sm text-slate-700 dark:text-slate-300 truncate font-medium">
          {label}
        </div>
        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all" 
            style={{ width: `${pct}%`, backgroundColor: colorHex }} 
          />
        </div>
        <div className="w-16 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
          {count}/{total}
        </div>
        <div className="w-12 text-right text-sm text-slate-500 dark:text-slate-400">
          {pct}%
        </div>
      </div>
      
      {expanded && winners.length > 0 && (
        <div className="ml-6 pl-4 border-l-2 border-slate-200 dark:border-slate-600 space-y-2 py-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {count} Winner{count !== 1 ? 's' : ''} in this category:
          </p>
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {winners.map((w, i) => (
              <WinnerMiniCard key={`${w.ticket}-${i}`} winner={w} brandColor={brandColor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple bar chart component
function SimpleBarChart({ data, colorHex, maxItems = 6 }: { data: [string, number][]; colorHex: string; maxItems?: number }) {
  const maxValue = Math.max(...data.map(d => d[1]), 1);
  
  return (
    <div className="space-y-2">
      {data.slice(0, maxItems).map(([label, value]) => (
        <div key={label} className="flex items-center gap-2">
          <div className="w-24 text-xs text-slate-600 dark:text-slate-400 truncate text-right">{label}</div>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden relative">
            <div 
              className="h-full rounded transition-all" 
              style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: colorHex }} 
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-200">
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut chart using CSS
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  
  const segments = data.map((d) => {
    const angle = (d.value / total) * 360;
    const segment = { ...d, startAngle: currentAngle, angle };
    currentAngle += angle;
    return segment;
  });
  
  const gradientStops = segments.map(s => {
    const start = s.startAngle;
    const end = s.startAngle + s.angle;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(', ');
  
  return (
    <div className="flex items-center gap-4">
      <div 
        className="w-24 h-24 rounded-full relative"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        <div className="absolute inset-3 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{total}</span>
        </div>
      </div>
      <div className="space-y-1">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600 dark:text-slate-400">{d.label}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Single brand detailed view with expandable rows showing winners
function BrandDetailView({ winners, brand, colorHex, borderColor, adTotals, timeFilter }: { 
  winners: Winner[]; 
  brand: string; 
  colorHex: string; 
  borderColor: string;
  adTotals: MonthlyAdTotals[];
  timeFilter: string;
}) {
  const [winRateMonthFilter, setWinRateMonthFilter] = useState<string>('all');
  
  // Get unique months from winners for the filter
  const availableMonths = useMemo(() => {
    return [...new Set(winners.map(w => w.month))].sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const [aMonth, aYear] = a.split(' ');
      const [bMonth, bYear] = b.split(' ');
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });
  }, [winners]);
  
  // Calculate win rate data (Video only - no tracking for static ad totals)
  const winRateData = useMemo(() => {
    const brandKey = brand === 'KIKOFF' ? 'kikoffAds' : 'grantAds';

    // Use all available months, or filter by winRateMonthFilter
    const monthsToInclude = winRateMonthFilter === 'all' ? availableMonths : [winRateMonthFilter];

    let totalWinners = 0;
    let totalAdsCount = 0;
    const monthlyData: { month: string; winners: number; ads: number; winRate: number }[] = [];

    monthsToInclude.forEach(month => {
      // Only count Video winners for win rate (no static ad totals available)
      const monthWinners = winners.filter(w => w.month === month && w.type === 'Video').length;
      // Flexible month matching - try exact match, then month-only match
      const monthOnly = month.split(' ')[0];
      const adTotalEntry = adTotals.find(a => a.month === month || a.month === monthOnly || a.month.split(' ')[0] === monthOnly);
      const monthAds = adTotalEntry ? adTotalEntry[brandKey] : 0;
      
      if (monthAds > 0) {
        totalWinners += monthWinners;
        totalAdsCount += monthAds;
        monthlyData.push({
          month,
          winners: monthWinners,
          ads: monthAds,
          winRate: (monthWinners / monthAds) * 100
        });
      }
    });
    
    const overallWinRate = totalAdsCount > 0 ? (totalWinners / totalAdsCount) * 100 : 0;
    
    return {
      overallWinRate,
      totalWinners,
      totalAds: totalAdsCount,
      monthlyData
    };
  }, [winners, adTotals, brand, winRateMonthFilter, availableMonths]);
  
  // Reset win rate month filter when time filter changes
  useMemo(() => {
    if (timeFilter !== 'all') {
      setWinRateMonthFilter('all');
    }
  }, [timeFilter]);
  const getDurationRange = (d: number) => {
    if (d <= 8) return '0-8s (Short)';
    if (d <= 15) return '9-15s (Medium)';
    if (d <= 22) return '16-22s (Long)';
    if (brand === 'KIKOFF') {
      if (d <= 30) return '23-30s (Long+)';
      return '30s+ (Very Long)';
    }
    return '23s+ (Very Long)';
  };

  const durationGroups = useMemo(() => {
    const groups: Record<string, Winner[]> = brand === 'KIKOFF' ? {
      '0-8s (Short)': [],
      '9-15s (Medium)': [],
      '16-22s (Long)': [],
      '23-30s (Long+)': [],
      '30s+ (Very Long)': [],
    } : {
      '0-8s (Short)': [],
      '9-15s (Medium)': [],
      '16-22s (Long)': [],
      '23s+ (Very Long)': [],
    };
    // Only include video winners for duration analysis
    winners.filter(w => w.type === 'Video').forEach(w => {
      const d = parseInt(w.duration?.replace(/[^0-9]/g, '') || '0');
      if (d > 0) groups[getDurationRange(d)].push(w);
    });
    return groups;
  }, [winners, brand]);
  
  // Only include video winners for duration analysis (static ads don't have duration)
  const videoWinners = winners.filter(w => w.type === 'Video');
  const durations = videoWinners.map(w => parseInt(w.duration?.replace(/[^0-9]/g, '') || '0')).filter(d => d > 0);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  
  // Execution groups - normalize *UGC* to UGC (video only)
  const executionGroups = useMemo(() => {
    const groups: Record<string, Winner[]> = {};
    winners.filter(w => w.type === 'Video').forEach(w => {
      const exec = normalizeExecution(w.execution || '');
      if (!groups[exec]) groups[exec] = [];
      groups[exec].push(w);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [winners]);
  
  // Count special UGC variants for note (only relevant for Kikoff, video only)
  const specialUGCCount = useMemo(() => {
    return winners.filter(w => w.brand === 'KIKOFF' && w.type === 'Video' && isSpecialUGC(w.execution || '')).length;
  }, [winners]);
  
  // Theme groups
  const themeGroups = useMemo(() => {
    const groups: Record<string, Winner[]> = {};
    winners.forEach(w => {
      parseThemeTags(w.theme).forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(w);
      });
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [winners]);
  
  // Caps groups (video only)
  const capsGroups = useMemo(() => {
    const groups: Record<string, Winner[]> = {};
    winners.filter(w => w.type === 'Video').forEach(w => {
      const caps = normalizeCaps(w.caps || '');
      if (!groups[caps]) groups[caps] = [];
      groups[caps].push(w);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [winners]);
  
  // Music groups (video only - static ads don't have music)
  const musicGroups = useMemo(() => {
    const groups: Record<string, Winner[]> = {};
    winners.filter(w => w.type === 'Video').forEach(w => {
      normalizeMusic(w.music || '').forEach(genre => {
        if (!groups[genre]) groups[genre] = [];
        groups[genre].push(w);
      });
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [winners]);
  
  // Mention timing groups
  const getMentionRange = (m: number) => {
    if (m <= 3) return '1-3s (Early)';
    if (m <= 6) return '4-6s (Mid)';
    if (m <= 9) return '7-9s (Late)';
    return '10s+ (Very Late)';
  };
  
  const mentionGroups = useMemo(() => {
    const groups: Record<string, Winner[]> = {
      '1-3s (Early)': [],
      '4-6s (Mid)': [],
      '7-9s (Late)': [],
      '10s+ (Very Late)': [],
    };
    // Only include video winners for mention timing
    winners.filter(w => w.type === 'Video').forEach(w => {
      const m = parseInt(w.mention?.replace(/[^0-9]/g, '') || '0');
      if (m > 0) groups[getMentionRange(m)].push(w);
    });
    return groups;
  }, [winners]);
  
  // Only include video winners for mention timing (static ads don't have mentions)
  const mentions = videoWinners.map(w => parseInt(w.mention?.replace(/[^0-9]/g, '') || '0')).filter(m => m > 0);
  const avgMention = mentions.length > 0 ? Math.round(mentions.reduce((a, b) => a + b, 0) / mentions.length) : 0;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 ${borderColor} p-6`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <img 
          src={brand === 'KIKOFF' ? '/kikoff-logo.png' : '/grant-logo.png'} 
          alt={brand} 
          className="w-14 h-14 rounded-xl shadow-md" 
        />
        <div>
          <h2 className={`text-2xl font-bold ${brand === 'KIKOFF' ? 'text-[#00913a] dark:text-[#4ade80]' : 'text-amber-600 dark:text-amber-400'}`}>
            {brand}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{winners.length} total winners</p>
        </div>
        
        {/* Quick Stats */}
        <div className="ml-auto flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{avgDuration}s</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{avgMention}s</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg 1st Mention</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{executionGroups[0]?.[0] || '-'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Top Execution</p>
          </div>
        </div>
      </div>
      
      {/* Win Rate Section - Hero Stats + Monthly Bar Chart */}
      <div className="mb-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Hero Stat - Left Side */}
          <div className="p-6 flex flex-col justify-center" style={{ borderRight: '1px solid', borderColor: 'rgba(148,163,184,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Win Rate</span>
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">Videos only</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight" style={{ color: colorHex }}>
                {winRateData.overallWinRate.toFixed(1)}
              </span>
              <span className="text-2xl font-semibold text-slate-400">%</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{winRateData.totalWinners}</span> winners from <span className="font-semibold text-slate-700 dark:text-slate-300">{winRateData.totalAds}</span> ads
            </p>
            {winRateData.totalAds === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No ad data available for this period
              </p>
            )}
            {/* Trend indicator - compare to previous period if available */}
            {winRateData.monthlyData.length >= 2 && winRateMonthFilter === 'all' && (
              <div className="mt-3 flex items-center gap-1.5">
                {(() => {
                  const latest = winRateData.monthlyData[winRateData.monthlyData.length - 1];
                  const previous = winRateData.monthlyData[winRateData.monthlyData.length - 2];
                  const diff = latest.winRate - previous.winRate;
                  const isUp = diff > 0;
                  return (
                    <>
                      <span className={`text-xs font-medium ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isUp ? '+' : ''}{diff.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">vs {previous.month.split(' ')[0]}</span>
                      {isUp ? (
                        <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          
          {/* Monthly Bar Chart - Right Side */}
          <div className="col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Performance</span>
              <select
                value={winRateMonthFilter}
                onChange={(e) => setWinRateMonthFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-xs"
              >
                <option value="all">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            
            {winRateData.monthlyData.length > 0 ? (
              <div className="space-y-3">
                {/* Find max win rate for scaling */}
                {(() => {
                  const maxRate = Math.max(...winRateData.monthlyData.map(d => d.winRate), 15);
                  return winRateData.monthlyData.map(({ month, winners: w, ads, winRate }) => {
                    const isSelected = winRateMonthFilter === month;
                    const barWidth = (winRate / maxRate) * 100;
                    return (
                      <button
                        key={month}
                        onClick={() => setWinRateMonthFilter(isSelected ? 'all' : month)}
                        className={`w-full group transition-all ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm w-20 text-left font-medium ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {month.split(' ')[0].slice(0, 3)}
                          </span>
                          <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full rounded-lg transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                              style={{
                                width: `${Math.max(barWidth, 1)}%`,
                                backgroundColor: colorHex,
                              }}
                            />
                            <span
                              className="absolute top-1/2 -translate-y-1/2 text-sm font-bold text-slate-700 dark:text-slate-300"
                              style={{ left: barWidth < 8 ? `calc(${barWidth}% + 12px)` : '12px' }}
                            >
                              {winRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-20 text-right">
                            <span className={`text-xs ${isSelected ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                              {w}/{ads} ads
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500">
                <p>No win rate data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Execution Donut */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Execution Types</h4>
          <DonutChart 
            data={executionGroups.slice(0, 4).map(([exec, ws]) => ({
              label: exec,
              value: ws.length,
              color: execColorHex[exec] || '#94a3b8'
            }))}
          />
        </div>
        
        {/* Duration Bar Chart */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Duration Distribution</h4>
          <SimpleBarChart 
            data={Object.entries(durationGroups).map(([range, ws]) => [range.split(' ')[0], ws.length])}
            colorHex={colorHex}
          />
        </div>
        
        {/* Top Themes Bar */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Top Themes</h4>
          <SimpleBarChart 
            data={themeGroups.slice(0, 5).map(([theme, ws]) => [theme, ws.length])}
            colorHex={colorHex}
            maxItems={5}
          />
        </div>
      </div>
      
      {/* Detailed Breakdown Sections - click to expand and see winners */}
      <div className="grid grid-cols-2 gap-6">
        {/* Duration (Video only) */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Duration Breakdown <span className="text-xs font-normal text-slate-400">({videoWinners.length} videos)</span></h4>
          <div className="space-y-1">
            {Object.entries(durationGroups).map(([range, ws]) => (
              <AnalyticsRow
                key={range}
                label={range}
                count={ws.length}
                total={videoWinners.length}
                colorHex={colorHex}
                winners={ws}
                brandColor={borderColor}
              />
            ))}
          </div>
        </div>

        {/* Execution (Video only) */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Execution Types <span className="text-xs font-normal text-slate-400">({videoWinners.length} videos)</span></h4>
          <div className="space-y-1">
            {executionGroups.map(([exec, ws]) => (
              <AnalyticsRow
                key={exec}
                label={exec}
                count={ws.length}
                total={videoWinners.length}
                colorHex={execColorHex[exec] || '#94a3b8'}
                winners={ws}
                brandColor={borderColor}
              />
            ))}
          </div>
          {specialUGCCount > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              * {specialUGCCount} UGC winner{specialUGCCount > 1 ? 's' : ''} with footage overlay (no creator on screen)
            </p>
          )}
        </div>

        {/* Themes (All winners) */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Themes <span className="text-xs font-normal text-slate-400">({winners.length} total)</span></h4>
          <div className="space-y-1">
            {themeGroups.slice(0, 8).map(([theme, ws]) => (
              <AnalyticsRow
                key={theme}
                label={theme}
                count={ws.length}
                total={winners.length}
                colorHex={colorHex}
                winners={ws}
                brandColor={borderColor}
              />
            ))}
          </div>
        </div>

        {/* Caption Styles (Video only) */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Caption Styles <span className="text-xs font-normal text-slate-400">({videoWinners.length} videos)</span></h4>
          <div className="space-y-1">
            {capsGroups.slice(0, 6).map(([caps, ws]) => (
              <AnalyticsRow
                key={caps}
                label={caps}
                count={ws.length}
                total={videoWinners.length}
                colorHex={colorHex}
                winners={ws}
                brandColor={borderColor}
              />
            ))}
          </div>
        </div>

        {/* Mention Timing (Video only) */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">First Mention Timing <span className="text-xs font-normal text-slate-400">({videoWinners.length} videos)</span></h4>
          <div className="space-y-1">
            {Object.entries(mentionGroups).map(([range, ws]) => (
              <AnalyticsRow
                key={range}
                label={range}
                count={ws.length}
                total={videoWinners.length}
                colorHex={colorHex}
                winners={ws}
                brandColor={borderColor}
              />
            ))}
          </div>
        </div>

        {/* Music (Video only) */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Music Genres <span className="text-xs font-normal text-slate-400">({videoWinners.length} videos)</span></h4>
          <div className="space-y-1">
            {musicGroups.length > 0 ? musicGroups.slice(0, 6).map(([genre, ws]) => (
              <AnalyticsRow
                key={genre}
                label={genre}
                count={ws.length}
                total={videoWinners.length}
                colorHex={colorHex}
                winners={ws}
                brandColor={borderColor}
              />
            )) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No music data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// V2-style full comparison view (two-column layout with all breakdowns)
function ComparisonView({ kikoffWinners, grantWinners, allWinners, adTotals }: { kikoffWinners: Winner[]; grantWinners: Winner[]; allWinners: Winner[]; adTotals: MonthlyAdTotals[] }) {
  // Get video winners for video-specific metrics
  const kikoffVideoWinners = kikoffWinners.filter(w => w.type === 'Video');
  const grantVideoWinners = grantWinners.filter(w => w.type === 'Video');
  const allVideoWinners = allWinners.filter(w => w.type === 'Video');

  // Calculate win rates for comparison view (Video only - no static ad totals)
  const winRates = useMemo(() => {
    // Get unique months from winners
    const months = [...new Set(allWinners.map(w => w.month))];

    // Only count Video winners for win rate
    let kikoffWins = kikoffVideoWinners.length;
    let grantWins = grantVideoWinners.length;
    let kikoffAds = 0;
    let grantAds = 0;

    months.forEach(month => {
      // Flexible month matching - try exact match, then month-only match
      const monthOnly = month.split(' ')[0];
      const adEntry = adTotals.find(a => a.month === month || a.month === monthOnly || a.month.split(' ')[0] === monthOnly);
      if (adEntry) {
        kikoffAds += adEntry.kikoffAds;
        grantAds += adEntry.grantAds;
      }
    });

    return {
      kikoff: kikoffAds > 0 ? (kikoffWins / kikoffAds) * 100 : 0,
      grant: grantAds > 0 ? (grantWins / grantAds) * 100 : 0,
      overall: (kikoffAds + grantAds) > 0 ? ((kikoffWins + grantWins) / (kikoffAds + grantAds)) * 100 : 0,
      kikoffWins,
      grantWins,
      kikoffAds,
      grantAds
    };
  }, [kikoffWinners, grantWinners, allWinners, adTotals]);
  // Helper to count occurrences with optional normalizer
  const countBy = (arr: Winner[], key: keyof Winner, normalizer?: (val: string) => string) => {
    const counts: Record<string, number> = {};
    arr.forEach(w => {
      let val = w[key]?.toString().trim() || 'Unknown';
      if (normalizer) val = normalizer(val);
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  // Duration analysis (video only - static ads don't have duration)
  const analyzeDuration = (arr: Winner[], isKikoff: boolean = false) => {
    const videoWinners = arr.filter(w => w.type === 'Video');
    const durations = videoWinners.map(w => parseInt(w.duration?.replace(/[^0-9]/g, '') || '0')).filter(d => d > 0);
    if (durations.length === 0) return { avg: 0, min: 0, max: 0, ranges: {} as Record<string, number>, videoCount: 0 };

    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    const ranges: Record<string, number> = isKikoff ? {
      '0-8s (Short)': durations.filter(d => d <= 8).length,
      '9-15s (Medium)': durations.filter(d => d > 8 && d <= 15).length,
      '16-22s (Long)': durations.filter(d => d > 15 && d <= 22).length,
      '23-30s (Long+)': durations.filter(d => d > 22 && d <= 30).length,
      '30s+ (Very Long)': durations.filter(d => d > 30).length,
    } : {
      '0-8s (Short)': durations.filter(d => d <= 8).length,
      '9-15s (Medium)': durations.filter(d => d > 8 && d <= 15).length,
      '16-22s (Long)': durations.filter(d => d > 15 && d <= 22).length,
      '23s+ (Very Long)': durations.filter(d => d > 22).length,
    };

    return { avg, min, max, ranges, videoCount: videoWinners.length };
  };

  // Mention timing analysis (video only - static ads don't have mentions)
  const analyzeMention = (arr: Winner[]) => {
    const videoWinners = arr.filter(w => w.type === 'Video');
    const mentions = videoWinners.map(w => parseInt(w.mention?.replace(/[^0-9]/g, '') || '0')).filter(m => m > 0);
    if (mentions.length === 0) return { avg: 0, ranges: {} as Record<string, number>, videoCount: 0 };

    const avg = Math.round(mentions.reduce((a, b) => a + b, 0) / mentions.length);

    const ranges: Record<string, number> = {
      '1-3s (Early)': mentions.filter(m => m <= 3).length,
      '4-6s (Mid)': mentions.filter(m => m > 3 && m <= 6).length,
      '7-9s (Late)': mentions.filter(m => m > 6 && m <= 9).length,
      '10s+ (Very Late)': mentions.filter(m => m > 9).length,
    };

    return { avg, ranges, videoCount: videoWinners.length };
  };

  // Theme counting using split tags
  const countThemeTags = (arr: Winner[]): [string, number][] => {
    const counts: Record<string, number> = {};
    arr.forEach(w => {
      const tags = parseThemeTags(w.theme);
      tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  // Music counting (video only - static ads don't have music)
  const countMusicGenres = (arr: Winner[]) => {
    const counts: Record<string, number> = {};
    arr.filter(w => w.type === 'Video').forEach(w => {
      const genres = normalizeMusic(w.music || '');
      genres.forEach(genre => {
        counts[genre] = (counts[genre] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const kikoffDuration = analyzeDuration(kikoffWinners, true);
  const grantDuration = analyzeDuration(grantWinners, false);
  const kikoffMention = analyzeMention(kikoffWinners);
  const grantMention = analyzeMention(grantWinners);

  // Execution (video only)
  const kikoffExecution = countBy(kikoffVideoWinners, 'execution', normalizeExecution);
  const grantExecution = countBy(grantVideoWinners, 'execution', normalizeExecution);

  // Count special UGC variants for notes (video only)
  const kikoffSpecialUGC = kikoffVideoWinners.filter(w => isSpecialUGC(w.execution || '')).length;
  const grantSpecialUGC = grantVideoWinners.filter(w => isSpecialUGC(w.execution || '')).length;

  // Caps (video only)
  const kikoffCapsData = countCapsWithSubsections(kikoffVideoWinners);
  const grantCapsData = countCapsWithSubsections(grantVideoWinners);

  const kikoffThemes = countThemeTags(kikoffWinners);
  const grantThemes = countThemeTags(grantWinners);

  const kikoffMusic = countMusicGenres(kikoffWinners);
  const grantMusic = countMusicGenres(grantWinners);

  // Text overlay (video only)
  const kikoffTextOverlay = countBy(kikoffVideoWinners, 'textOverlay', normalizeTextOverlay);
  const grantTextOverlay = countBy(grantVideoWinners, 'textOverlay', normalizeTextOverlay);

  return (
    <>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Winners" value={allWinners.length} color="slate" />
        <StatCard label="KIKOFF" value={kikoffWinners.length} subtext={`${Math.round((kikoffWinners.length / allWinners.length) * 100) || 0}% of total`} color="blue" />
        <StatCard label="GRANT" value={grantWinners.length} subtext={`${Math.round((grantWinners.length / allWinners.length) * 100) || 0}% of total`} color="emerald" />
        <StatCard label="Avg Duration" value={`${analyzeDuration(allWinners).avg}s`} color="slate" />
      </div>

      {/* Win Rate Comparison - Hero Stats (Videos only) */}
      {(winRates.kikoffAds > 0 || winRates.grantAds > 0) && (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
          <div className="px-4 pt-3 pb-1 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Win Rate</span>
            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">Videos only</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
            {/* KIKOFF Win Rate */}
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <img src="/kikoff-logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">KIKOFF</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-[#00C853]">{winRates.kikoff.toFixed(1)}</span>
                <span className="text-lg font-semibold text-slate-400">%</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">{winRates.kikoffWins}</span> wins / <span className="font-medium text-slate-600 dark:text-slate-300">{winRates.kikoffAds}</span> ads
              </p>
            </div>
            
            {/* Overall Win Rate - Featured */}
            <div className="p-5 text-center bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/20 dark:to-transparent">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Overall</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-indigo-500">{winRates.overall.toFixed(1)}</span>
                <span className="text-xl font-semibold text-slate-400">%</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">{winRates.kikoffWins + winRates.grantWins}</span> wins / <span className="font-medium text-slate-600 dark:text-slate-300">{winRates.kikoffAds + winRates.grantAds}</span> ads
              </p>
            </div>
            
            {/* GRANT Win Rate */}
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <img src="/grant-logo.png" alt="" className="w-5 h-5 rounded" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">GRANT</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-amber-500">{winRates.grant.toFixed(1)}</span>
                <span className="text-lg font-semibold text-slate-400">%</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">{winRates.grantWins}</span> wins / <span className="font-medium text-slate-600 dark:text-slate-300">{winRates.grantAds}</span> ads
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout for Brand Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KIKOFF Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-[#00C853]/30 dark:border-[#00C853]/40 p-5">
          <div className="flex items-center gap-3 mb-4">
            <img src="/kikoff-logo.png" alt="Kikoff" className="w-10 h-10 rounded-xl shadow-sm" />
            <div>
              <h3 className="text-lg font-bold text-[#00913a] dark:text-[#4ade80]">KIKOFF</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{kikoffWinners.length} winners ({kikoffVideoWinners.length} videos)</span>
            </div>
          </div>

          {/* Duration (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Duration <span className="font-normal">({kikoffVideoWinners.length} videos)</span></h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{kikoffDuration.avg}s</span> (range: {kikoffDuration.min}s - {kikoffDuration.max}s)
            </div>
            <div className="space-y-1.5">
              {Object.entries(kikoffDuration.ranges).map(([range, count]) => (
                <ExpandableRowV2 key={range} label={range} count={count} total={kikoffVideoWinners.length} color="bg-[#00C853]" />
              ))}
            </div>
          </div>

          {/* Execution (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Execution Type <span className="font-normal">({kikoffVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {kikoffExecution.slice(0, 5).map(([exec, count]) => (
                <ExpandableRowV2 key={exec} label={exec} count={count} total={kikoffVideoWinners.length} color={execColorClass[exec] || 'bg-slate-500'} />
              ))}
            </div>
            {kikoffSpecialUGC > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                * {kikoffSpecialUGC} UGC with footage overlay
              </p>
            )}
          </div>

          {/* Mention Timing (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">First Mention Timing <span className="font-normal">({kikoffVideoWinners.length} videos)</span></h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{kikoffMention.avg}s</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(kikoffMention.ranges).map(([range, count]) => (
                <ExpandableRowV2 key={range} label={range} count={count} total={kikoffVideoWinners.length} color="bg-[#00C853]" />
              ))}
            </div>
          </div>

          {/* Caps (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Caption Styles <span className="font-normal">({kikoffVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {kikoffCapsData.main.slice(0, 6).map(([caps, count]) => (
                <ExpandableRowV2
                  key={caps}
                  label={caps}
                  count={count}
                  total={kikoffVideoWinners.length}
                  color="bg-[#00C853]"
                  subsections={kikoffCapsData.subsections[caps]}
                />
              ))}
            </div>
          </div>

          {/* Themes (All winners) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Top Themes <span className="font-normal">({kikoffWinners.length} total)</span></h4>
            <div className="space-y-1.5">
              {kikoffThemes.slice(0, 8).map(([theme, count]) => (
                <ExpandableRowV2 key={theme} label={theme} count={count} total={kikoffWinners.length} color="bg-[#00C853]" />
              ))}
            </div>
          </div>

          {/* Music (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Music Genres <span className="font-normal">({kikoffVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {kikoffMusic.length > 0 ? kikoffMusic.slice(0, 8).map(([genre, count]) => (
                <ExpandableRowV2 key={genre} label={genre} count={count} total={kikoffVideoWinners.length} color="bg-[#00C853]" />
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">No music data</div>
              )}
            </div>
          </div>

          {/* Text Overlay (Video only) */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Text Overlay Styles <span className="font-normal">({kikoffVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {kikoffTextOverlay.slice(0, 6).map(([overlay, count]) => (
                <ExpandableRowV2 key={overlay} label={overlay} count={count} total={kikoffVideoWinners.length} color="bg-[#00C853]" />
              ))}
            </div>
          </div>
        </div>

        {/* GRANT Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-amber-400/30 dark:border-amber-400/40 p-5">
          <div className="flex items-center gap-3 mb-4">
            <img src="/grant-logo.png" alt="Grant" className="w-10 h-10 rounded-xl shadow-sm" />
            <div>
              <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">GRANT</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{grantWinners.length} winners ({grantVideoWinners.length} videos)</span>
            </div>
          </div>

          {/* Duration (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Duration <span className="font-normal">({grantVideoWinners.length} videos)</span></h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{grantDuration.avg}s</span> (range: {grantDuration.min}s - {grantDuration.max}s)
            </div>
            <div className="space-y-1.5">
              {Object.entries(grantDuration.ranges).map(([range, count]) => (
                <ExpandableRowV2 key={range} label={range} count={count} total={grantVideoWinners.length} color="bg-amber-500" />
              ))}
            </div>
          </div>

          {/* Execution (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Execution Type <span className="font-normal">({grantVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {grantExecution.slice(0, 5).map(([exec, count]) => (
                <ExpandableRowV2 key={exec} label={exec} count={count} total={grantVideoWinners.length} color={execColorClass[exec] || 'bg-slate-500'} />
              ))}
            </div>
          </div>

          {/* Mention Timing (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">First Mention Timing <span className="font-normal">({grantVideoWinners.length} videos)</span></h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{grantMention.avg}s</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(grantMention.ranges).map(([range, count]) => (
                <ExpandableRowV2 key={range} label={range} count={count} total={grantVideoWinners.length} color="bg-amber-500" />
              ))}
            </div>
          </div>

          {/* Caps (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Caption Styles <span className="font-normal">({grantVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {grantCapsData.main.slice(0, 6).map(([caps, count]) => (
                <ExpandableRowV2
                  key={caps}
                  label={caps}
                  count={count}
                  total={grantVideoWinners.length}
                  color="bg-amber-500"
                  subsections={grantCapsData.subsections[caps]}
                />
              ))}
            </div>
          </div>

          {/* Themes (All winners) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Top Themes <span className="font-normal">({grantWinners.length} total)</span></h4>
            <div className="space-y-1.5">
              {grantThemes.slice(0, 8).map(([theme, count]) => (
                <ExpandableRowV2 key={theme} label={theme} count={count} total={grantWinners.length} color="bg-amber-500" />
              ))}
            </div>
          </div>

          {/* Music (Video only) */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Music Genres <span className="font-normal">({grantVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {grantMusic.length > 0 ? grantMusic.slice(0, 8).map(([genre, count]) => (
                <ExpandableRowV2 key={genre} label={genre} count={count} total={grantVideoWinners.length} color="bg-amber-500" />
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">No music data</div>
              )}
            </div>
          </div>

          {/* Text Overlay (Video only) */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Text Overlay Styles <span className="font-normal">({grantVideoWinners.length} videos)</span></h4>
            <div className="space-y-1.5">
              {grantTextOverlay.slice(0, 6).map(([overlay, count]) => (
                <ExpandableRowV2 key={overlay} label={overlay} count={count} total={grantVideoWinners.length} color="bg-amber-500" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-3">Key Insights</h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
          <li>• <strong>KIKOFF</strong> videos avg <strong>{kikoffDuration.avg}s</strong> duration vs GRANT at <strong>{grantDuration.avg}s</strong></li>
          <li>• <strong>KIKOFF</strong> top execution: <strong>{kikoffExecution[0]?.[0] || 'N/A'}</strong> ({kikoffExecution[0]?.[1] || 0}/{kikoffVideoWinners.length} videos)</li>
          <li>• <strong>GRANT</strong> top execution: <strong>{grantExecution[0]?.[0] || 'N/A'}</strong> ({grantExecution[0]?.[1] || 0}/{grantVideoWinners.length} videos)</li>
          <li>• <strong>KIKOFF</strong> avg first mention at <strong>{kikoffMention.avg}s</strong> vs GRANT at <strong>{grantMention.avg}s</strong></li>
          <li>• <strong>KIKOFF</strong> top theme: <strong>{kikoffThemes[0]?.[0] || 'N/A'}</strong> ({kikoffThemes[0]?.[1] || 0}/{kikoffWinners.length} total)</li>
          <li>• <strong>GRANT</strong> top theme: <strong>{grantThemes[0]?.[0] || 'N/A'}</strong> ({grantThemes[0]?.[1] || 0}/{grantWinners.length} total)</li>
        </ul>
      </div>
    </>
  );
}

export function Analytics({ winners, adTotals }: AnalyticsProps) {
  const [brandView, setBrandView] = useState<BrandView>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  
  const months = useMemo(() => sortMonths([...new Set(winners.map(w => w.month))]), [winners]);
  const quarters = useMemo(() => {
    const quarterSet = new Set(winners.map(w => getQuarter(w.month)));
    return sortQuarters([...quarterSet]).reverse(); // Newest first
  }, [winners]);
  const allThemeTags = useMemo(() => getAllThemeTags(winners), [winners]);

  const filteredWinners = useMemo(() => {
    let filtered = winners;
    
    if (timeFilter !== 'all') {
      if (timeFilter.startsWith('Q')) {
        const monthsInQuarter = getMonthsInQuarter(timeFilter);
        filtered = filtered.filter(w => monthsInQuarter.includes(w.month));
      } else {
        filtered = filtered.filter(w => w.month === timeFilter);
      }
    }
    
    if (themeFilter !== 'all') {
      filtered = filtered.filter(w => hasThemeTag(w, themeFilter));
    }
    
    return filtered;
  }, [winners, timeFilter, themeFilter]);

  const kikoffWinners = useMemo(() => filteredWinners.filter(w => w.brand === 'KIKOFF'), [filteredWinners]);
  const grantWinners = useMemo(() => filteredWinners.filter(w => w.brand === 'GRANT'), [filteredWinners]);

  return (
    <div className="space-y-6">
      {/* Brand Selector + Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Brand Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setBrandView('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                brandView === 'all'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Brands
            </button>
            <button
              onClick={() => setBrandView('KIKOFF')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                brandView === 'KIKOFF'
                  ? 'bg-white dark:bg-slate-600 text-[#00913a] dark:text-[#4ade80] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#00913a]'
              }`}
            >
              <img src="/kikoff-logo.png" alt="" className="w-4 h-4 rounded" />
              KIKOFF
            </button>
            <button
              onClick={() => setBrandView('GRANT')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                brandView === 'GRANT'
                  ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              <img src="/grant-logo.png" alt="" className="w-4 h-4 rounded" />
              GRANT
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
          
          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Time:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Time</option>
              <optgroup label="Quarters">
                {quarters.map(quarter => {
                  const monthsInQuarter = getMonthsInQuarter(quarter);
                  const count = winners.filter(w => monthsInQuarter.includes(w.month)).length;
                  return <option key={quarter} value={quarter}>{quarter} ({count})</option>;
                })}
              </optgroup>
              <optgroup label="Months">
                {months.map(month => {
                  const count = winners.filter(w => w.month === month).length;
                  return <option key={month} value={month}>{month} ({count})</option>;
                })}
              </optgroup>
            </select>
          </div>
          
          {/* Theme Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme:</span>
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Themes</option>
              {allThemeTags.map(tag => {
                const count = winners.filter(w => hasThemeTag(w, tag)).length;
                return <option key={tag} value={tag}>{tag} ({count})</option>;
              })}
            </select>
          </div>

          {(timeFilter !== 'all' || themeFilter !== 'all') && (
            <button
              onClick={() => { setTimeFilter('all'); setThemeFilter('all'); }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              Clear filters
            </button>
          )}
          
          <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredWinners.length} of {winners.length} winners
          </div>
        </div>
      </div>

      {/* Content based on brand view */}
      {brandView === 'all' ? (
        <ComparisonView kikoffWinners={kikoffWinners} grantWinners={grantWinners} allWinners={filteredWinners} adTotals={adTotals} />
      ) : brandView === 'KIKOFF' ? (
        <BrandDetailView 
          winners={kikoffWinners} 
          brand="KIKOFF" 
          colorHex="#00C853"
          borderColor="border-[#00C853]/30"
          adTotals={adTotals}
          timeFilter={timeFilter}
        />
      ) : (
        <BrandDetailView 
          winners={grantWinners} 
          brand="GRANT" 
          colorHex="#f59e0b"
          borderColor="border-amber-400/30"
          adTotals={adTotals}
          timeFilter={timeFilter}
        />
      )}
    </div>
  );
}
