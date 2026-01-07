'use client';

import { useState, useMemo } from 'react';
import { Winner } from '@/types/winner';

interface AnalyticsProps {
  winners: Winner[];
}

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

interface ExpandableRowProps {
  label: string;
  count: number;
  total: number;
  color?: string;
  subsections?: [string, number][];
}

function ExpandableRow({ label, count, total, color = 'bg-slate-500', subsections }: ExpandableRowProps) {
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

// Parse theme string into separate tags (same logic as Chips.tsx)
// Note: "Concept" removed (not a theme), "Holiday" merged into "Seasonal"
function parseThemeTags(theme: string): string[] {
  if (!theme) return [];
  
  const themeLower = theme.toLowerCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const tags: string[] = [];
  
  // Check for each known tag
  // "Holiday" now maps to "Seasonal" since they're the same concept
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
  // "Concept" removed - not a valid theme
  if (themeLower.includes('winning')) tags.push('Winning');
  
  // If no tags found, return "Other"
  if (tags.length === 0) {
    tags.push('Other');
  }
  
  return tags;
}

// Count theme tags (each winner can have multiple tags)
function countThemeTags(arr: Winner[]): [string, number][] {
  const counts: Record<string, number> = {};
  arr.forEach(w => {
    const tags = parseThemeTags(w.theme);
    tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

// Get all unique theme tags from winners
function getAllThemeTags(winners: Winner[]): string[] {
  const tagSet = new Set<string>();
  winners.forEach(w => {
    parseThemeTags(w.theme).forEach(tag => tagSet.add(tag));
  });
  return [...tagSet].sort();
}

// Check if a winner has a specific theme tag
function hasThemeTag(winner: Winner, tag: string): boolean {
  return parseThemeTags(winner.theme).includes(tag);
}

// Normalize caps to combine similar ones - all white w/stroke variants go under main category
function normalizeCaps(caps: string): string {
  const normalized = caps.toLowerCase().trim();
  
  // All white w/stroke variants combined into one main category
  if (normalized.includes('white') && normalized.includes('stroke')) {
    return 'White w/black stroke';
  }
  if (normalized.includes('green') && normalized.includes('red')) {
    return 'Keywords in Green/Red';
  }
  if (normalized.includes('tiktok')) {
    return 'TikTok style';
  }
  if (normalized.includes('classic') || normalized.includes('grey highlight')) {
    return 'Classic/Grey highlight';
  }
  if (normalized.includes('capcut')) {
    return 'CapCut';
  }
  if (normalized === 'n/a' || normalized === '') {
    return 'None/N/A';
  }
  
  return caps.trim();
}

// Check if caps has green/red keywords (subsection of white w/stroke)
function hasGreenRedKeywords(caps: string): boolean {
  const normalized = caps.toLowerCase().trim();
  return normalized.includes('green') && normalized.includes('red');
}

// Count caps with subsections for white w/stroke
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
    
    // Track subsections for white w/stroke
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

// Normalize music genres - combine similar ones
function normalizeMusic(music: string): string[] {
  if (!music || music === 'n/a') return [];
  
  const genres = music.split(',').map(g => g.trim().toLowerCase());
  const normalized: string[] = [];
  
  genres.forEach(genre => {
    // Chill / Lounge / Lofi combined
    if (genre.includes('chill') || genre.includes('lounge') || genre.includes('lofi')) {
      if (!normalized.includes('Chill/Lounge/Lofi')) {
        normalized.push('Chill/Lounge/Lofi');
      }
    }
    // EDM
    else if (genre.includes('edm')) {
      if (!normalized.includes('EDM')) {
        normalized.push('EDM');
      }
    }
    // Upbeat
    else if (genre.includes('upbeat')) {
      if (!normalized.includes('Upbeat')) {
        normalized.push('Upbeat');
      }
    }
    // Seasonal / Themed
    else if (genre.includes('seasonal') || genre.includes('themed')) {
      if (!normalized.includes('Seasonal/Themed')) {
        normalized.push('Seasonal/Themed');
      }
    }
    // Corporate
    else if (genre.includes('corporate')) {
      if (!normalized.includes('Corporate')) {
        normalized.push('Corporate');
      }
    }
    // Hip-hop
    else if (genre.includes('hip') || genre.includes('hop')) {
      if (!normalized.includes('Hip-Hop')) {
        normalized.push('Hip-Hop');
      }
    }
    // Pop
    else if (genre.includes('pop')) {
      if (!normalized.includes('Pop')) {
        normalized.push('Pop');
      }
    }
    // Rock
    else if (genre.includes('rock')) {
      if (!normalized.includes('Rock')) {
        normalized.push('Rock');
      }
    }
    // Funk / Goofy
    else if (genre.includes('funk') || genre.includes('goofy')) {
      if (!normalized.includes('Funk/Goofy')) {
        normalized.push('Funk/Goofy');
      }
    }
    // Acoustic
    else if (genre.includes('acoustic')) {
      if (!normalized.includes('Acoustic')) {
        normalized.push('Acoustic');
      }
    }
    // Motivational
    else if (genre.includes('motivational')) {
      if (!normalized.includes('Motivational')) {
        normalized.push('Motivational');
      }
    }
    // Romantic
    else if (genre.includes('romantic')) {
      if (!normalized.includes('Romantic')) {
        normalized.push('Romantic');
      }
    }
    // Spa / Relaxing
    else if (genre.includes('spa') || genre.includes('relax')) {
      if (!normalized.includes('Spa/Relaxing')) {
        normalized.push('Spa/Relaxing');
      }
    }
    // Foreign
    else if (genre.includes('foreign')) {
      if (!normalized.includes('Foreign')) {
        normalized.push('Foreign');
      }
    }
    // Sitcom
    else if (genre.includes('sitcom')) {
      if (!normalized.includes('Sitcom')) {
        normalized.push('Sitcom');
      }
    }
    // Award ceremony
    else if (genre.includes('award') || genre.includes('ceremony')) {
      if (!normalized.includes('Award/Ceremony')) {
        normalized.push('Award/Ceremony');
      }
    }
  });
  
  return normalized;
}

// Normalize text overlay to combine similar ones  
function normalizeTextOverlay(overlay: string): string {
  if (!overlay || overlay.trim() === '') return 'None/N/A';
  
  const normalized = overlay.toLowerCase().trim();
  
  // Keyboard / typing
  if (normalized.includes('keyboard') || normalized.includes('typing') || normalized.includes('imessage')) {
    return 'Keyboard/Typing Text';
  }
  // Handwritten / shaky
  if (normalized.includes('handwritten') || normalized.includes('shak')) {
    return 'Handwritten/Shaky';
  }
  // Full screen bleed
  if (normalized.includes('full screen') || normalized.includes('bleed')) {
    return 'Full Screen Bleed';
  }
  // Keywords in green
  if (normalized.includes('keyword') && normalized.includes('green')) {
    return 'Keywords Highlighted (Green)';
  }
  // Large/bold text
  if (normalized.includes('large') || normalized.includes('bold') || normalized.includes('big')) {
    return 'Large/Bold Text';
  }
  // Web windows / grant title
  if (normalized.includes('web window') || normalized.includes('grant title')) {
    return 'Web Windows Style';
  }
  // Blog/article
  if (normalized.includes('blog') || normalized.includes('article')) {
    return 'Blog/Article Style';
  }
  // On theme / seasonal
  if (normalized.includes('on theme') || normalized.includes('themed') || normalized.includes('seasonal')) {
    return 'Themed/Seasonal Text';
  }
  // Default text
  if (normalized.includes('default')) {
    return 'Default/Standard';
  }
  
  // Return shortened version
  return overlay.length > 30 ? overlay.substring(0, 27) + '...' : overlay;
}

// Helper to get quarter from month string (e.g., "December 2025" -> "Q4 2025")
function getQuarter(month: string): string {
  const monthName = month.split(' ')[0]?.toLowerCase();
  const year = month.split(' ')[1];
  
  if (['january', 'february', 'march'].includes(monthName)) return `Q1 ${year}`;
  if (['april', 'may', 'june'].includes(monthName)) return `Q2 ${year}`;
  if (['july', 'august', 'september'].includes(monthName)) return `Q3 ${year}`;
  if (['october', 'november', 'december'].includes(monthName)) return `Q4 ${year}`;
  
  return 'Unknown';
}

// Helper to get months in a quarter
function getMonthsInQuarter(quarter: string): string[] {
  const [q, year] = quarter.split(' ');
  
  if (q === 'Q1') return [`January ${year}`, `February ${year}`, `March ${year}`];
  if (q === 'Q2') return [`April ${year}`, `May ${year}`, `June ${year}`];
  if (q === 'Q3') return [`July ${year}`, `August ${year}`, `September ${year}`];
  if (q === 'Q4') return [`October ${year}`, `November ${year}`, `December ${year}`];
  
  return [];
}

export function Analytics({ winners }: AnalyticsProps) {
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  
  const months = useMemo(() => [...new Set(winners.map(w => w.month))].sort(), [winners]);
  
  // Get unique quarters from the data
  const quarters = useMemo(() => {
    const quarterSet = new Set(winners.map(w => getQuarter(w.month)));
    return [...quarterSet].sort().reverse(); // Most recent first
  }, [winners]);

  // Get all unique theme tags
  const allThemeTags = useMemo(() => getAllThemeTags(winners), [winners]);

  const filteredWinners = useMemo(() => {
    let filtered = winners;
    
    // Time filter
    if (timeFilter !== 'all') {
      if (timeFilter.startsWith('Q')) {
        const monthsInQuarter = getMonthsInQuarter(timeFilter);
        filtered = filtered.filter(w => monthsInQuarter.includes(w.month));
      } else {
        filtered = filtered.filter(w => w.month === timeFilter);
      }
    }
    
    // Theme filter
    if (themeFilter !== 'all') {
      filtered = filtered.filter(w => hasThemeTag(w, themeFilter));
    }
    
    return filtered;
  }, [winners, timeFilter, themeFilter]);

  const kikoffWinners = useMemo(() => filteredWinners.filter(w => w.brand === 'KIKOFF'), [filteredWinners]);
  const grantWinners = useMemo(() => filteredWinners.filter(w => w.brand === 'GRANT'), [filteredWinners]);

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

  // Duration analysis
  const analyzeDuration = (arr: Winner[]) => {
    const durations = arr.map(w => parseInt(w.duration?.replace(/[^0-9]/g, '') || '0')).filter(d => d > 0);
    if (durations.length === 0) return { avg: 0, min: 0, max: 0, ranges: {} as Record<string, number> };
    
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    const ranges: Record<string, number> = {
      '0-8s (Short)': durations.filter(d => d <= 8).length,
      '9-15s (Medium)': durations.filter(d => d > 8 && d <= 15).length,
      '16-22s (Long)': durations.filter(d => d > 15 && d <= 22).length,
      '23s+ (Very Long)': durations.filter(d => d > 22).length,
    };
    
    return { avg, min, max, ranges };
  };

  // Mention timing analysis
  const analyzeMention = (arr: Winner[]) => {
    const mentions = arr.map(w => parseInt(w.mention?.replace(/[^0-9]/g, '') || '0')).filter(m => m > 0);
    if (mentions.length === 0) return { avg: 0, ranges: {} as Record<string, number> };
    
    const avg = Math.round(mentions.reduce((a, b) => a + b, 0) / mentions.length);
    
    const ranges: Record<string, number> = {
      '1-3s (Early)': mentions.filter(m => m <= 3).length,
      '4-6s (Mid)': mentions.filter(m => m > 3 && m <= 6).length,
      '7-9s (Late)': mentions.filter(m => m > 6 && m <= 9).length,
      '10s+ (Very Late)': mentions.filter(m => m > 9).length,
    };
    
    return { avg, ranges };
  };

  const kikoffDuration = analyzeDuration(kikoffWinners);
  const grantDuration = analyzeDuration(grantWinners);
  const kikoffMention = analyzeMention(kikoffWinners);
  const grantMention = analyzeMention(grantWinners);

  const kikoffExecution = countBy(kikoffWinners, 'execution');
  const grantExecution = countBy(grantWinners, 'execution');
  
  // Caps counting with subsections for white w/stroke variants
  const kikoffCapsData = countCapsWithSubsections(kikoffWinners);
  const grantCapsData = countCapsWithSubsections(grantWinners);

  // Theme counting using split tags (like music)
  const kikoffThemes = countThemeTags(kikoffWinners);
  const grantThemes = countThemeTags(grantWinners);

  // Music counting (special handling since each winner can have multiple genres)
  const countMusicGenres = (arr: Winner[]) => {
    const counts: Record<string, number> = {};
    arr.forEach(w => {
      const genres = normalizeMusic(w.music || '');
      genres.forEach(genre => {
        counts[genre] = (counts[genre] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const kikoffMusic = countMusicGenres(kikoffWinners);
  const grantMusic = countMusicGenres(grantWinners);

  // Text Overlay counting
  const kikoffTextOverlay = countBy(kikoffWinners, 'textOverlay', normalizeTextOverlay);
  const grantTextOverlay = countBy(grantWinners, 'textOverlay', normalizeTextOverlay);

  const execColors: Record<string, string> = {
    'UGC': 'bg-amber-500',
    'AI': 'bg-violet-500',
    'FLIX': 'bg-fuchsia-500',
    'Stock': 'bg-slate-500',
    '*UGC*': 'bg-amber-500',
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
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
              Clear all filters
            </button>
          )}
          
          <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredWinners.length} of {winners.length} winners
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Winners" value={filteredWinners.length} color="slate" />
        <StatCard label="KIKOFF" value={kikoffWinners.length} subtext={`${Math.round((kikoffWinners.length / filteredWinners.length) * 100) || 0}% of total`} color="blue" />
        <StatCard label="GRANT" value={grantWinners.length} subtext={`${Math.round((grantWinners.length / filteredWinners.length) * 100) || 0}% of total`} color="emerald" />
        <StatCard label="Avg Duration" value={`${analyzeDuration(filteredWinners).avg}s`} color="slate" />
      </div>

      {/* Two Column Layout for Brand Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KIKOFF Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">KIKOFF</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">({kikoffWinners.length} winners)</span>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Duration</h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{kikoffDuration.avg}s</span> (range: {kikoffDuration.min}s - {kikoffDuration.max}s)
            </div>
            <div className="space-y-1.5">
              {Object.entries(kikoffDuration.ranges).map(([range, count]) => (
                <ExpandableRow key={range} label={range} count={count} total={kikoffWinners.length} color="bg-blue-500" />
              ))}
            </div>
          </div>

          {/* Execution */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Execution Type</h4>
            <div className="space-y-1.5">
              {kikoffExecution.slice(0, 5).map(([exec, count]) => (
                <ExpandableRow key={exec} label={exec} count={count} total={kikoffWinners.length} color={execColors[exec] || 'bg-slate-500'} />
              ))}
            </div>
          </div>

          {/* Mention Timing */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">First Mention Timing</h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{kikoffMention.avg}s</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(kikoffMention.ranges).map(([range, count]) => (
                <ExpandableRow key={range} label={range} count={count} total={kikoffWinners.length} color="bg-blue-500" />
              ))}
            </div>
          </div>

          {/* Caps */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Caption Styles</h4>
            <div className="space-y-1.5">
              {kikoffCapsData.main.slice(0, 6).map(([caps, count]) => (
                <ExpandableRow 
                  key={caps} 
                  label={caps} 
                  count={count} 
                  total={kikoffWinners.length} 
                  color="bg-blue-500"
                  subsections={kikoffCapsData.subsections[caps]}
                />
              ))}
            </div>
          </div>

          {/* Themes */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Top Themes</h4>
            <div className="space-y-1.5">
              {kikoffThemes.slice(0, 8).map(([theme, count]) => (
                <ExpandableRow key={theme} label={theme} count={count} total={kikoffWinners.length} color="bg-blue-500" />
              ))}
            </div>
          </div>

          {/* Music */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Music Genres</h4>
            <div className="space-y-1.5">
              {kikoffMusic.length > 0 ? kikoffMusic.slice(0, 8).map(([genre, count]) => (
                <ExpandableRow key={genre} label={genre} count={count} total={kikoffWinners.length} color="bg-blue-500" />
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">No music data</div>
              )}
            </div>
          </div>

          {/* Text Overlay */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Text Overlay Styles</h4>
            <div className="space-y-1.5">
              {kikoffTextOverlay.slice(0, 6).map(([overlay, count]) => (
                <ExpandableRow key={overlay} label={overlay} count={count} total={kikoffWinners.length} color="bg-blue-500" />
              ))}
            </div>
          </div>
        </div>

        {/* GRANT Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">GRANT</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">({grantWinners.length} winners)</span>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Duration</h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{grantDuration.avg}s</span> (range: {grantDuration.min}s - {grantDuration.max}s)
            </div>
            <div className="space-y-1.5">
              {Object.entries(grantDuration.ranges).map(([range, count]) => (
                <ExpandableRow key={range} label={range} count={count} total={grantWinners.length} color="bg-emerald-500" />
              ))}
            </div>
          </div>

          {/* Execution */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Execution Type</h4>
            <div className="space-y-1.5">
              {grantExecution.slice(0, 5).map(([exec, count]) => (
                <ExpandableRow key={exec} label={exec} count={count} total={grantWinners.length} color={execColors[exec] || 'bg-slate-500'} />
              ))}
            </div>
          </div>

          {/* Mention Timing */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">First Mention Timing</h4>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Avg: <span className="font-semibold text-slate-900 dark:text-white">{grantMention.avg}s</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(grantMention.ranges).map(([range, count]) => (
                <ExpandableRow key={range} label={range} count={count} total={grantWinners.length} color="bg-emerald-500" />
              ))}
            </div>
          </div>

          {/* Caps */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Caption Styles</h4>
            <div className="space-y-1.5">
              {grantCapsData.main.slice(0, 6).map(([caps, count]) => (
                <ExpandableRow 
                  key={caps} 
                  label={caps} 
                  count={count} 
                  total={grantWinners.length} 
                  color="bg-emerald-500"
                  subsections={grantCapsData.subsections[caps]}
                />
              ))}
            </div>
          </div>

          {/* Themes */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Top Themes</h4>
            <div className="space-y-1.5">
              {grantThemes.slice(0, 8).map(([theme, count]) => (
                <ExpandableRow key={theme} label={theme} count={count} total={grantWinners.length} color="bg-emerald-500" />
              ))}
            </div>
          </div>

          {/* Music */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Music Genres</h4>
            <div className="space-y-1.5">
              {grantMusic.length > 0 ? grantMusic.slice(0, 8).map(([genre, count]) => (
                <ExpandableRow key={genre} label={genre} count={count} total={grantWinners.length} color="bg-emerald-500" />
              )) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">No music data</div>
              )}
            </div>
          </div>

          {/* Text Overlay */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Text Overlay Styles</h4>
            <div className="space-y-1.5">
              {grantTextOverlay.slice(0, 6).map(([overlay, count]) => (
                <ExpandableRow key={overlay} label={overlay} count={count} total={grantWinners.length} color="bg-emerald-500" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-3">Key Insights</h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
          <li>• <strong>KIKOFF</strong> winners avg <strong>{kikoffDuration.avg}s</strong> duration vs GRANT at <strong>{grantDuration.avg}s</strong></li>
          <li>• <strong>KIKOFF</strong> top execution: <strong>{kikoffExecution[0]?.[0] || 'N/A'}</strong> ({kikoffExecution[0]?.[1] || 0}/{kikoffWinners.length})</li>
          <li>• <strong>GRANT</strong> top execution: <strong>{grantExecution[0]?.[0] || 'N/A'}</strong> ({grantExecution[0]?.[1] || 0}/{grantWinners.length})</li>
          <li>• <strong>KIKOFF</strong> avg first mention at <strong>{kikoffMention.avg}s</strong> vs GRANT at <strong>{grantMention.avg}s</strong></li>
          <li>• <strong>KIKOFF</strong> top theme: <strong>{kikoffThemes[0]?.[0] || 'N/A'}</strong> ({kikoffThemes[0]?.[1] || 0}/{kikoffWinners.length})</li>
          <li>• <strong>GRANT</strong> top theme: <strong>{grantThemes[0]?.[0] || 'N/A'}</strong> ({grantThemes[0]?.[1] || 0}/{grantWinners.length})</li>
        </ul>
      </div>
    </div>
  );
}
