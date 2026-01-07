'use client';

import { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  className?: string;
}

function Chip({ children, className = '' }: ChipProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

// Brand chips - KIKOFF=blue, GRANT=green (more vibrant)
export function BrandChip({ brand }: { brand: string }) {
  const styles: Record<string, string> = {
    KIKOFF: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 ring-1 ring-blue-500/20',
    GRANT: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 ring-1 ring-emerald-500/20',
  };
  return <Chip className={styles[brand] || 'bg-gray-100 text-gray-600'}>{brand}</Chip>;
}

// Execution chips - distinct colors for each type
export function ExecutionChip({ execution }: { execution: string }) {
  const styles: Record<string, string> = {
    AI: 'bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-300 ring-1 ring-violet-500/20',
    UGC: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 ring-1 ring-amber-500/20',
    FLIX: 'bg-fuchsia-500/15 text-fuchsia-600 dark:bg-fuchsia-400/20 dark:text-fuchsia-300 ring-1 ring-fuchsia-500/20',
    Stock: 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300 ring-1 ring-slate-500/20',
    '*UGC*': 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 ring-1 ring-amber-500/20',
  };
  return <Chip className={styles[execution] || 'bg-gray-100 text-gray-600'}>{execution}</Chip>;
}

// Duration chips - gradient from green (short) to red (long)
export function DurationChip({ duration }: { duration: string }) {
  const seconds = parseInt(duration.replace(/[^0-9]/g, '')) || 0;
  let style = 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300';
  
  if (seconds <= 8) {
    style = 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300';
  } else if (seconds <= 15) {
    style = 'bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300';
  } else if (seconds <= 22) {
    style = 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300';
  } else {
    style = 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300';
  }
  
  return <Chip className={style}>{duration}</Chip>;
}

// Mention timing chips - early mentions are good (green), late are bad (red)
export function MentionChip({ mention }: { mention: string }) {
  if (!mention) return <span className="text-gray-400 text-xs">-</span>;
  
  const seconds = parseInt(mention.replace(/[^0-9]/g, '')) || 0;
  let style = 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300';
  
  if (seconds <= 3) {
    style = 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300';
  } else if (seconds <= 6) {
    style = 'bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300';
  } else if (seconds <= 9) {
    style = 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300';
  } else {
    style = 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300';
  }
  
  return <Chip className={style}>{mention}</Chip>;
}

// Music genre chips with cohesive colors
export function MusicChips({ music }: { music: string }) {
  if (!music || music === 'n/a') return <span className="text-gray-400 text-xs">-</span>;
  
  const genres = music.split(',').map(g => g.trim()).filter(Boolean);
  const genreStyles: Record<string, string> = {
    'chill': 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300',
    'lounge': 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300',
    'lofi': 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300',
    'upbeat': 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300',
    'seasonal': 'bg-purple-500/15 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300',
    'themed': 'bg-purple-500/15 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300',
    'edm': 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300',
    'corporate': 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300',
    'hip': 'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
    'pop': 'bg-pink-500/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300',
    'rock': 'bg-red-500/15 text-red-600 dark:bg-red-400/20 dark:text-red-300',
    'funk': 'bg-lime-500/15 text-lime-600 dark:bg-lime-400/20 dark:text-lime-300',
    'acoustic': 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
    'romantic': 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300',
    'motivational': 'bg-cyan-500/15 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300',
    'spa': 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
    'foreign': 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300',
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {genres.slice(0, 2).map((genre, i) => {
        const matchedStyle = Object.entries(genreStyles).find(([key]) => 
          genre.toLowerCase().includes(key)
        );
        return (
          <Chip key={i} className={matchedStyle?.[1] || 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300'}>
            {genre}
          </Chip>
        );
      })}
      {genres.length > 2 && (
        <Chip className="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">+{genres.length - 2}</Chip>
      )}
    </div>
  );
}

// Variant chip - subtle
export function VariantChip({ variant }: { variant: string }) {
  const cleanVariant = variant.trim();
  return (
    <Chip className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
      {cleanVariant}
    </Chip>
  );
}

// Month chip - seasonal colors
export function MonthChip({ month }: { month: string }) {
  const monthStyles: Record<string, string> = {
    September: 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300',
    October: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
    November: 'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
    December: 'bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300',
    January: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300',
  };
  const monthName = month.split(' ')[0];
  return <Chip className={monthStyles[monthName] || 'bg-slate-100 text-slate-600'}>{month}</Chip>;
}

// Theme chip - color coded by category with cleaner palette (single chip version)
export function ThemeChip({ theme }: { theme: string }) {
  if (!theme) return <span className="text-gray-400 text-xs">-</span>;
  
  const themeLower = theme.toLowerCase();
  let style = 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300';
  
  // Seasonal themes - purple
  if (themeLower.includes('seasonal') || themeLower.includes('holiday') || themeLower.includes('halloween')) {
    style = 'bg-purple-500/15 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300';
  }
  // Problem/Solution - rose/red
  else if (themeLower.includes('prob') || themeLower.includes('solve')) {
    style = 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300';
  }
  // Opportunity Cost - emerald
  else if (themeLower.includes('opportunity')) {
    style = 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300';
  }
  // Education / Student - blue
  else if (themeLower.includes('education') || themeLower.includes('student')) {
    style = 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300';
  }
  // Skit / Comedy - pink
  else if (themeLower.includes('skit') || themeLower.includes('paradise') || themeLower.includes('comedy')) {
    style = 'bg-pink-500/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300';
  }
  // Evergreen - green
  else if (themeLower.includes('evergreen')) {
    style = 'bg-green-500/15 text-green-600 dark:bg-green-400/20 dark:text-green-300';
  }
  // Aspirational - amber/gold
  else if (themeLower.includes('aspirational')) {
    style = 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300';
  }
  // Denied / Pain points / Held Back - orange
  else if (themeLower.includes('denied') || themeLower.includes('held back')) {
    style = 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300';
  }
  // Busy Mom / Lifestyle - teal
  else if (themeLower.includes('busy') || themeLower.includes('mom')) {
    style = 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300';
  }
  // Winning UGC - cyan
  else if (themeLower.includes('winning')) {
    style = 'bg-cyan-500/15 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300';
  }
  
  // Clean up the theme text (remove line breaks)
  const cleanTheme = theme.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  return <Chip className={style}>{cleanTheme}</Chip>;
}

// Theme styles for individual tags
// Note: "holiday" removed (merged into seasonal), "concept" removed (not a theme)
const themeTagStyles: Record<string, string> = {
  seasonal: 'bg-purple-500/15 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300',
  skit: 'bg-pink-500/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300',
  halloween: 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300',
  christmas: 'bg-red-500/15 text-red-600 dark:bg-red-400/20 dark:text-red-300',
  thanksgiving: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
  'new year': 'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
  'prob/solve': 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300',
  'problem': 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300',
  'solution': 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300',
  'opportunity cost': 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
  'opportunity': 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
  education: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300',
  student: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300',
  analogy: 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300',
  evergreen: 'bg-green-500/15 text-green-600 dark:bg-green-400/20 dark:text-green-300',
  aspirational: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300',
  denied: 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300',
  'held back': 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300',
  'busy mom': 'bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300',
  paradise: 'bg-pink-500/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300',
  bachelor: 'bg-pink-500/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300',
  comedy: 'bg-pink-500/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300',
  'good credit': 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
  winning: 'bg-cyan-500/15 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300',
};

// Parse theme string into separate tags
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
  else if (themeLower.includes('opportunity') && !tags.includes('Opportunity Cost')) tags.push('Opportunity');
  if (themeLower.includes('education') && themeLower.includes('good credit')) tags.push('Good Credit Education');
  else if (themeLower.includes('education')) tags.push('Education');
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
  
  // If no tags found, return the cleaned original
  if (tags.length === 0) {
    const cleanTheme = theme.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanTheme) tags.push(cleanTheme);
  }
  
  return tags;
}

// Get style for a theme tag
function getThemeTagStyle(tag: string): string {
  const tagLower = tag.toLowerCase();
  for (const [key, style] of Object.entries(themeTagStyles)) {
    if (tagLower.includes(key)) return style;
  }
  return 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300';
}

// Theme chips - splits compound themes into separate tags (like music)
export function ThemeChips({ theme }: { theme: string }) {
  if (!theme) return <span className="text-gray-400 text-xs">-</span>;
  
  const tags = parseThemeTags(theme);
  
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag, i) => (
        <Chip key={i} className={getThemeTagStyle(tag)}>{tag}</Chip>
      ))}
      {tags.length > 3 && (
        <Chip className="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">+{tags.length - 3}</Chip>
      )}
    </div>
  );
}

// Caps style chip - clean simple labels
export function CapsChip({ caps }: { caps: string }) {
  if (!caps || caps === 'n/a') return <span className="text-slate-400 text-xs">-</span>;
  
  const capsLower = caps.toLowerCase();
  
  // White with black stroke
  if (capsLower.includes('white') && capsLower.includes('stroke')) {
    return <Chip className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800">W+Stroke</Chip>;
  }
  // Keywords in green/red
  if (capsLower.includes('green') && capsLower.includes('red')) {
    return <Chip className="bg-gradient-to-r from-emerald-500 to-rose-500 text-white">G/R Keys</Chip>;
  }
  // Keywords in green only
  if (capsLower.includes('green') && !capsLower.includes('red')) {
    return <Chip className="bg-emerald-500 text-white">Green Keys</Chip>;
  }
  // TikTok style
  if (capsLower.includes('tiktok')) {
    return <Chip className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">TikTok</Chip>;
  }
  // Classic / grey highlight
  if (capsLower.includes('classic') || capsLower.includes('grey highlight')) {
    return <Chip className="bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200">Classic</Chip>;
  }
  // CapCut
  if (capsLower.includes('capcut')) {
    return <Chip className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">CapCut</Chip>;
  }
  // No caps
  if (capsLower.includes('no cap')) {
    return <Chip className="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">None</Chip>;
  }
  
  // Default - truncate long text
  const displayCaps = caps.length > 15 ? caps.substring(0, 12) + '...' : caps;
  return <Chip className="bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300">{displayCaps}</Chip>;
}

// Product Overlay chips - key UI elements
export function ProductOverlayChips({ overlay }: { overlay: string }) {
  if (!overlay || overlay === 'NONE' || overlay.toLowerCase() === 'none' || overlay.trim() === '') {
    return <Chip className="bg-red-500/15 text-red-600 dark:bg-red-400/20 dark:text-red-300">None</Chip>;
  }
  
  const items = overlay.split(',').map(item => item.trim()).filter(Boolean);
  
  const getStyle = (item: string) => {
    const itemLower = item.toLowerCase();
    // Credit score increases - green
    if (itemLower.includes('+84') || itemLower.includes('+86') || itemLower.includes('+25')) {
      return 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/25 dark:text-emerald-300 font-semibold';
    }
    // Dollar amounts - green
    if (itemLower.includes('$')) {
      return 'bg-green-500/20 text-green-600 dark:bg-green-400/25 dark:text-green-300';
    }
    // New/Old UI
    if (itemLower === 'new' || itemLower === 'old') {
      return 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300';
    }
    // Screens/Pages
    if (itemLower.includes('home') || itemLower.includes('page') || itemLower.includes('screen') || itemLower.includes('app')) {
      return 'bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-300';
    }
    // Tradeline
    if (itemLower.includes('tradeline')) {
      return 'bg-cyan-500/15 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300';
    }
    return 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300';
  };
  
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 3).map((item, i) => (
        <Chip key={i} className={getStyle(item)}>{item}</Chip>
      ))}
      {items.length > 3 && (
        <Chip className="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">+{items.length - 3}</Chip>
      )}
    </div>
  );
}

// Extract title from ticket name
export function extractTitle(ticket: string): string {
  if (!ticket) return '';
  
  // Look for patterns like "CR-XXX: " or "CBG-XXX: " and get everything after
  const colonMatch = ticket.match(/^[A-Z]+-\d+:\s*(.+)$/);
  if (colonMatch) {
    let title = colonMatch[1];
    // Remove the CR/CBG prefix repetition if present (e.g., "CR-222 KIKOFF - Title" -> "Title")
    const brandMatch = title.match(/(?:CR-?\d*|CBG-?\d*)?[_\s]*(?:KIKOFF|GRANT)[_\s-]*(.+)/i);
    if (brandMatch) {
      title = brandMatch[1];
    }
    // Clean up any remaining prefixes like "R1_" or "R2_"
    title = title.replace(/^R\d+[_\s-]*/i, '');
    return title.trim();
  }
  
  return ticket;
}
