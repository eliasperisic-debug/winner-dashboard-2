import { Winner } from '@/types/winner';

// Month name to number mapping for chronological sorting
const MONTH_TO_NUM: Record<string, number> = {
  'january': 1, 'february': 2, 'march': 3, 'april': 4,
  'may': 5, 'june': 6, 'july': 7, 'august': 8,
  'september': 9, 'october': 10, 'november': 11, 'december': 12
};

// Parse month string to sortable value (e.g., "August 2025" -> 202508)
function parseMonthToSortValue(month: string): number {
  const parts = month.toLowerCase().split(' ');
  const monthName = parts[0];
  const year = parseInt(parts[1] || '2025', 10);
  const monthNum = MONTH_TO_NUM[monthName] || 1;
  return year * 100 + monthNum;
}

// Get quarter for a month
export function getQuarter(month: string): string {
  const monthName = month.split(' ')[0]?.toLowerCase();
  const year = month.split(' ')[1];
  if (['january', 'february', 'march'].includes(monthName)) return `Q1 ${year}`;
  if (['april', 'may', 'june'].includes(monthName)) return `Q2 ${year}`;
  if (['july', 'august', 'september'].includes(monthName)) return `Q3 ${year}`;
  if (['october', 'november', 'december'].includes(monthName)) return `Q4 ${year}`;
  return 'Unknown';
}

// Get short month name (e.g., "Jul" from "July 2025")
export function getShortMonth(month: string): string {
  const parts = month.split(' ');
  const monthName = parts[0]?.slice(0, 3) || '';
  const year = parts[1]?.slice(2) || ''; // Last 2 digits of year
  return `${monthName} '${year}`;
}

// Sort months chronologically (e.g., "July 2025" before "August 2025" before "January 2026")
export function sortMonths(months: string[]): string[] {
  return [...months].sort((a, b) => {
    return parseMonthToSortValue(a) - parseMonthToSortValue(b);
  });
}

// Parse quarter string to sortable value (e.g., "Q3 2025" -> 202503)
function parseQuarterToSortValue(quarter: string): number {
  const match = quarter.match(/Q(\d)\s+(\d{4})/);
  if (!match) return 0;
  const q = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  return year * 10 + q;
}

// Sort quarters chronologically (e.g., "Q3 2025" before "Q4 2025" before "Q1 2026")
export function sortQuarters(quarters: string[]): string[] {
  return [...quarters].sort((a, b) => {
    return parseQuarterToSortValue(a) - parseQuarterToSortValue(b);
  });
}

// Parse theme tags (same logic as Analytics.tsx)
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

// Normalize execution type
function normalizeExecution(exec: string): string {
  if (!exec || exec.trim() === '') return 'Unknown';
  const normalized = exec.trim();
  if (normalized === '*UGC*') return 'UGC';
  return normalized;
}

// Monthly stats for a brand
export interface MonthlyStats {
  month: string;
  shortMonth: string;
  quarter: string;
  total: number;
  kikoff: number;
  grant: number;
  // Video-only counts for win rate calculations
  kikoffVideos: number;
  grantVideos: number;
  totalVideos: number;
  avgDuration: number;
  avgDurationKikoff: number;
  avgDurationGrant: number;
  avgMention: number;
  avgMentionKikoff: number;
  avgMentionGrant: number;
  executions: Record<string, number>;
  executionsKikoff: Record<string, number>;
  executionsGrant: Record<string, number>;
  themes: Record<string, number>;
  themesKikoff: Record<string, number>;
  themesGrant: Record<string, number>;
}

// Group winners by month and calculate stats
export function calculateMonthlyStats(winners: Winner[]): MonthlyStats[] {
  const months = sortMonths([...new Set(winners.map(w => w.month))]);
  
  return months.map(month => {
    const monthWinners = winners.filter(w => w.month === month);
    const kikoffWinners = monthWinners.filter(w => w.brand === 'KIKOFF');
    const grantWinners = monthWinners.filter(w => w.brand === 'GRANT');
    
    // Duration calculations
    const getDurations = (arr: Winner[]) => 
      arr.map(w => parseInt(w.duration?.replace(/[^0-9]/g, '') || '0')).filter(d => d > 0);
    const avgDur = (durations: number[]) => 
      durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    
    const allDurations = getDurations(monthWinners);
    const kikoffDurations = getDurations(kikoffWinners);
    const grantDurations = getDurations(grantWinners);
    
    // Mention calculations
    const getMentions = (arr: Winner[]) => 
      arr.map(w => parseInt(w.mention?.replace(/[^0-9]/g, '') || '0')).filter(m => m > 0);
    const avgMen = (mentions: number[]) => 
      mentions.length > 0 ? Math.round((mentions.reduce((a, b) => a + b, 0) / mentions.length) * 10) / 10 : 0;
    
    const allMentions = getMentions(monthWinners);
    const kikoffMentions = getMentions(kikoffWinners);
    const grantMentions = getMentions(grantWinners);
    
    // Execution counting
    const countExecutions = (arr: Winner[]) => {
      const counts: Record<string, number> = {};
      arr.forEach(w => {
        const exec = normalizeExecution(w.execution || '');
        counts[exec] = (counts[exec] || 0) + 1;
      });
      return counts;
    };
    
    // Theme counting
    const countThemes = (arr: Winner[]) => {
      const counts: Record<string, number> = {};
      arr.forEach(w => {
        parseThemeTags(w.theme).forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
      return counts;
    };
    
    // Video-only counts for win rate
    const kikoffVideoWinners = kikoffWinners.filter(w => w.type === 'Video');
    const grantVideoWinners = grantWinners.filter(w => w.type === 'Video');
    const allVideoWinners = monthWinners.filter(w => w.type === 'Video');

    return {
      month,
      shortMonth: getShortMonth(month),
      quarter: getQuarter(month),
      total: monthWinners.length,
      kikoff: kikoffWinners.length,
      grant: grantWinners.length,
      kikoffVideos: kikoffVideoWinners.length,
      grantVideos: grantVideoWinners.length,
      totalVideos: allVideoWinners.length,
      avgDuration: avgDur(allDurations),
      avgDurationKikoff: avgDur(kikoffDurations),
      avgDurationGrant: avgDur(grantDurations),
      avgMention: avgMen(allMentions),
      avgMentionKikoff: avgMen(kikoffMentions),
      avgMentionGrant: avgMen(grantMentions),
      executions: countExecutions(monthWinners),
      executionsKikoff: countExecutions(kikoffWinners),
      executionsGrant: countExecutions(grantWinners),
      themes: countThemes(monthWinners),
      themesKikoff: countThemes(kikoffWinners),
      themesGrant: countThemes(grantWinners),
    };
  });
}

// Quarterly stats interface
export interface QuarterlyStats {
  quarter: string;
  kikoff: number;
  grant: number;
  total: number;
  months: string[]; // Full month names in this quarter
}

// Calculate quarterly stats by aggregating monthly data
export function calculateQuarterlyStats(monthlyStats: MonthlyStats[]): QuarterlyStats[] {
  const quarterMap: Record<string, QuarterlyStats> = {};
  
  // Define quarter order for sorting
  const quarterOrder = ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
  
  monthlyStats.forEach(month => {
    if (!quarterMap[month.quarter]) {
      quarterMap[month.quarter] = {
        quarter: month.quarter,
        kikoff: 0,
        grant: 0,
        total: 0,
        months: [],
      };
    }
    quarterMap[month.quarter].kikoff += month.kikoff;
    quarterMap[month.quarter].grant += month.grant;
    quarterMap[month.quarter].total += month.total;
    quarterMap[month.quarter].months.push(month.month);
  });
  
  // Sort quarters chronologically
  return Object.values(quarterMap).sort((a, b) => {
    const idxA = quarterOrder.indexOf(a.quarter);
    const idxB = quarterOrder.indexOf(b.quarter);
    if (idxA === -1 && idxB === -1) return a.quarter.localeCompare(b.quarter);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}

// Get top N themes across all data
export function getTopThemes(winners: Winner[], n: number = 5): string[] {
  const counts: Record<string, number> = {};
  winners.forEach(w => {
    parseThemeTags(w.theme).forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([theme]) => theme);
}

// Get all unique themes
export function getAllThemes(winners: Winner[]): string[] {
  const themeSet = new Set<string>();
  winners.forEach(w => {
    parseThemeTags(w.theme).forEach(tag => themeSet.add(tag));
  });
  return [...themeSet].sort();
}

// Get all unique execution types
export function getAllExecutions(winners: Winner[]): string[] {
  const execSet = new Set<string>();
  winners.forEach(w => {
    const exec = normalizeExecution(w.execution || '');
    execSet.add(exec);
  });
  return [...execSet].sort();
}

// Insight types
export interface Insight {
  type: 'increase' | 'decrease' | 'peak' | 'trend';
  metric: string;
  brand?: 'KIKOFF' | 'GRANT' | 'all';
  value: string;
  comparison?: string;
  percentage?: number;
}

// Generate insights from monthly stats
export function generateInsights(stats: MonthlyStats[], winners: Winner[]): Insight[] {
  const insights: Insight[] = [];
  
  if (stats.length < 2) return insights;
  
  // Get recent months for comparison
  const recentMonths = stats.slice(-3);
  const olderMonths = stats.slice(0, -3);
  
  if (olderMonths.length === 0) {
    // Not enough data for comparison, just show current state
    const latest = stats[stats.length - 1];
    if (latest) {
      // Find top execution
      const topExec = Object.entries(latest.executions).sort((a, b) => b[1] - a[1])[0];
      if (topExec) {
        insights.push({
          type: 'trend',
          metric: 'execution',
          value: `${topExec[0]} is the top execution type in ${latest.shortMonth} (${topExec[1]} winners)`,
        });
      }
    }
    return insights;
  }
  
  // Compare recent vs older for various metrics
  
  // 1. Winner volume changes
  const recentKikoff = recentMonths.reduce((sum, m) => sum + m.kikoff, 0);
  const olderKikoff = olderMonths.reduce((sum, m) => sum + m.kikoff, 0);
  const avgOlderKikoff = olderKikoff / olderMonths.length;
  const avgRecentKikoff = recentKikoff / recentMonths.length;
  
  if (avgOlderKikoff > 0) {
    const kikoffChange = ((avgRecentKikoff - avgOlderKikoff) / avgOlderKikoff) * 100;
    if (Math.abs(kikoffChange) >= 20) {
      insights.push({
        type: kikoffChange > 0 ? 'increase' : 'decrease',
        metric: 'volume',
        brand: 'KIKOFF',
        value: `KIKOFF winners ${kikoffChange > 0 ? 'up' : 'down'} ${Math.abs(Math.round(kikoffChange))}% in recent months`,
        percentage: Math.round(kikoffChange),
      });
    }
  }
  
  const recentGrant = recentMonths.reduce((sum, m) => sum + m.grant, 0);
  const olderGrant = olderMonths.reduce((sum, m) => sum + m.grant, 0);
  const avgOlderGrant = olderGrant / olderMonths.length;
  const avgRecentGrant = recentGrant / recentMonths.length;
  
  if (avgOlderGrant > 0) {
    const grantChange = ((avgRecentGrant - avgOlderGrant) / avgOlderGrant) * 100;
    if (Math.abs(grantChange) >= 20) {
      insights.push({
        type: grantChange > 0 ? 'increase' : 'decrease',
        metric: 'volume',
        brand: 'GRANT',
        value: `GRANT winners ${grantChange > 0 ? 'up' : 'down'} ${Math.abs(Math.round(grantChange))}% in recent months`,
        percentage: Math.round(grantChange),
      });
    }
  }
  
  // 2. Duration changes - per brand
  const recentAvgDurKikoff = recentMonths.filter(m => m.avgDurationKikoff > 0);
  const olderAvgDurKikoff = olderMonths.filter(m => m.avgDurationKikoff > 0);
  
  if (recentAvgDurKikoff.length > 0 && olderAvgDurKikoff.length > 0) {
    const avgRecentDur = recentAvgDurKikoff.reduce((sum, m) => sum + m.avgDurationKikoff, 0) / recentAvgDurKikoff.length;
    const avgOlderDur = olderAvgDurKikoff.reduce((sum, m) => sum + m.avgDurationKikoff, 0) / olderAvgDurKikoff.length;
    const durChange = avgRecentDur - avgOlderDur;
    
    if (Math.abs(durChange) >= 2) {
      insights.push({
        type: durChange < 0 ? 'decrease' : 'increase',
        metric: 'duration',
        brand: 'KIKOFF',
        value: `KIKOFF avg duration ${durChange < 0 ? 'dropped' : 'increased'} from ${Math.round(avgOlderDur)}s to ${Math.round(avgRecentDur)}s`,
      });
    }
  }
  
  const recentAvgDurGrant = recentMonths.filter(m => m.avgDurationGrant > 0);
  const olderAvgDurGrant = olderMonths.filter(m => m.avgDurationGrant > 0);
  
  if (recentAvgDurGrant.length > 0 && olderAvgDurGrant.length > 0) {
    const avgRecentDur = recentAvgDurGrant.reduce((sum, m) => sum + m.avgDurationGrant, 0) / recentAvgDurGrant.length;
    const avgOlderDur = olderAvgDurGrant.reduce((sum, m) => sum + m.avgDurationGrant, 0) / olderAvgDurGrant.length;
    const durChange = avgRecentDur - avgOlderDur;
    
    if (Math.abs(durChange) >= 2) {
      insights.push({
        type: durChange < 0 ? 'decrease' : 'increase',
        metric: 'duration',
        brand: 'GRANT',
        value: `GRANT avg duration ${durChange < 0 ? 'dropped' : 'increased'} from ${Math.round(avgOlderDur)}s to ${Math.round(avgRecentDur)}s`,
      });
    }
  }
  
  // 3. Execution type trends - per brand
  const execTotalsKikoff: Record<string, { recent: number; older: number }> = {};
  const execTotalsGrant: Record<string, { recent: number; older: number }> = {};
  
  recentMonths.forEach(m => {
    Object.entries(m.executionsKikoff).forEach(([exec, count]) => {
      if (!execTotalsKikoff[exec]) execTotalsKikoff[exec] = { recent: 0, older: 0 };
      execTotalsKikoff[exec].recent += count;
    });
    Object.entries(m.executionsGrant).forEach(([exec, count]) => {
      if (!execTotalsGrant[exec]) execTotalsGrant[exec] = { recent: 0, older: 0 };
      execTotalsGrant[exec].recent += count;
    });
  });
  olderMonths.forEach(m => {
    Object.entries(m.executionsKikoff).forEach(([exec, count]) => {
      if (!execTotalsKikoff[exec]) execTotalsKikoff[exec] = { recent: 0, older: 0 };
      execTotalsKikoff[exec].older += count;
    });
    Object.entries(m.executionsGrant).forEach(([exec, count]) => {
      if (!execTotalsGrant[exec]) execTotalsGrant[exec] = { recent: 0, older: 0 };
      execTotalsGrant[exec].older += count;
    });
  });
  
  // KIKOFF execution trends
  Object.entries(execTotalsKikoff).forEach(([exec, { recent, older }]) => {
    if (older > 0 && exec !== 'Unknown') {
      const avgRecent = recent / recentMonths.length;
      const avgOlder = older / olderMonths.length;
      const change = ((avgRecent - avgOlder) / avgOlder) * 100;
      
      if (Math.abs(change) >= 40) {
        insights.push({
          type: change > 0 ? 'increase' : 'decrease',
          metric: 'execution',
          brand: 'KIKOFF',
          value: `KIKOFF ${exec} ${change > 0 ? 'trending up' : 'trending down'} ${Math.abs(Math.round(change))}% recently`,
          percentage: Math.round(change),
        });
      }
    }
  });
  
  // GRANT execution trends
  Object.entries(execTotalsGrant).forEach(([exec, { recent, older }]) => {
    if (older > 0 && exec !== 'Unknown') {
      const avgRecent = recent / recentMonths.length;
      const avgOlder = older / olderMonths.length;
      const change = ((avgRecent - avgOlder) / avgOlder) * 100;
      
      if (Math.abs(change) >= 40) {
        insights.push({
          type: change > 0 ? 'increase' : 'decrease',
          metric: 'execution',
          brand: 'GRANT',
          value: `GRANT ${exec} ${change > 0 ? 'trending up' : 'trending down'} ${Math.abs(Math.round(change))}% recently`,
          percentage: Math.round(change),
        });
      }
    }
  });
  
  // 4. Theme peaks
  const themeTotals: Record<string, { month: string; count: number }> = {};
  stats.forEach(m => {
    Object.entries(m.themes).forEach(([theme, count]) => {
      if (!themeTotals[theme] || count > themeTotals[theme].count) {
        themeTotals[theme] = { month: m.shortMonth, count };
      }
    });
  });
  
  // Find if any theme peaked in recent months
  const topThemes = getTopThemes(winners, 5);
  topThemes.forEach(theme => {
    const peak = themeTotals[theme];
    if (peak && recentMonths.some(m => m.shortMonth === peak.month) && peak.count >= 3) {
      insights.push({
        type: 'peak',
        metric: 'theme',
        value: `"${theme}" peaked in ${peak.month} (${peak.count} winners)`,
      });
    }
  });
  
  // 5. Mention timing trends - per brand
  const recentMentionKikoff = recentMonths.filter(m => m.avgMentionKikoff > 0);
  const olderMentionKikoff = olderMonths.filter(m => m.avgMentionKikoff > 0);
  
  if (recentMentionKikoff.length > 0 && olderMentionKikoff.length > 0) {
    const avgRecentMen = recentMentionKikoff.reduce((sum, m) => sum + m.avgMentionKikoff, 0) / recentMentionKikoff.length;
    const avgOlderMen = olderMentionKikoff.reduce((sum, m) => sum + m.avgMentionKikoff, 0) / olderMentionKikoff.length;
    const menChange = avgRecentMen - avgOlderMen;
    
    if (Math.abs(menChange) >= 1) {
      insights.push({
        type: menChange < 0 ? 'decrease' : 'increase',
        metric: 'mention',
        brand: 'KIKOFF',
        value: `KIKOFF first mention ${menChange < 0 ? 'earlier' : 'later'} (${avgOlderMen.toFixed(1)}s → ${avgRecentMen.toFixed(1)}s)`,
      });
    }
  }
  
  const recentMentionGrant = recentMonths.filter(m => m.avgMentionGrant > 0);
  const olderMentionGrant = olderMonths.filter(m => m.avgMentionGrant > 0);
  
  if (recentMentionGrant.length > 0 && olderMentionGrant.length > 0) {
    const avgRecentMen = recentMentionGrant.reduce((sum, m) => sum + m.avgMentionGrant, 0) / recentMentionGrant.length;
    const avgOlderMen = olderMentionGrant.reduce((sum, m) => sum + m.avgMentionGrant, 0) / olderMentionGrant.length;
    const menChange = avgRecentMen - avgOlderMen;
    
    if (Math.abs(menChange) >= 1) {
      insights.push({
        type: menChange < 0 ? 'decrease' : 'increase',
        metric: 'mention',
        brand: 'GRANT',
        value: `GRANT first mention ${menChange < 0 ? 'earlier' : 'later'} (${avgOlderMen.toFixed(1)}s → ${avgRecentMen.toFixed(1)}s)`,
      });
    }
  }
  
  // Limit to top 5 insights
  return insights.slice(0, 5);
}
