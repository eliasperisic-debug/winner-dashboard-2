'use client';

import { useState, useRef, useEffect } from 'react';
import { AVAILABLE_THEMES } from './Chips';

interface ThemeSelectorProps {
  ticket: string;
  currentTheme: string;
  onUpdate: (newTheme: string) => void;
}

// Colors reserved for custom themes (distinct from predefined theme colors)
// These are NOT used by any predefined theme, ensuring visual distinction
const CUSTOM_THEME_COLORS = [
  'bg-lime-500/20 text-lime-700 dark:text-lime-300',      // Bright green-yellow
  'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300', // Bright magenta
  'bg-sky-500/20 text-sky-700 dark:text-sky-300',         // Light blue
  'bg-violet-500/20 text-violet-700 dark:text-violet-300', // Purple-blue
  'bg-stone-500/20 text-stone-700 dark:text-stone-300',   // Warm gray
];

// Generate consistent color index from string (same theme = same color)
function hashStringToIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % max;
}

export function ThemeSelector({ ticket, currentTheme, onUpdate }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [themes, setThemes] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse current themes from string
  useEffect(() => {
    if (currentTheme) {
      const parsed = currentTheme
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
      setThemes(parsed);
    } else {
      setThemes([]);
    }
  }, [currentTheme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTheme = async (newThemes: string[]) => {
    setIsLoading(true);
    const newValue = newThemes.join(', ');

    try {
      const response = await fetch('/api/winners/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket,
          field: 'theme',
          value: newValue,
        }),
      });

      if (response.ok) {
        setThemes(newThemes);
        onUpdate(newValue);
      } else {
        console.error('Failed to update theme');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTheme = (themeValue: string) => {
    if (!themes.includes(themeValue)) {
      updateTheme([...themes, themeValue]);
    }
    setIsOpen(false);
  };

  const removeTheme = (themeValue: string) => {
    updateTheme(themes.filter(t => t !== themeValue));
  };

  // Fuzzy match theme to get proper label
  const getThemeLabel = (value: string) => {
    const valueLower = value.toLowerCase();
    // Check exact match first
    const exactMatch = AVAILABLE_THEMES.find(t => t.value === valueLower);
    if (exactMatch) return exactMatch.label;
    // Fuzzy match
    if (valueLower.includes('seasonal') || valueLower.includes('holiday')) return 'Seasonal';
    if (valueLower.includes('prob') && valueLower.includes('solv')) return 'Prob/Solve';
    if (valueLower.includes('opportunity')) return 'Opportunity Cost';
    if (valueLower.includes('good credit')) return 'Good Credit Education';
    if (valueLower.includes('education')) return 'Education';
    if (valueLower.includes('held back')) return 'Held Back';
    if (valueLower.includes('busy') && valueLower.includes('mom')) return 'Busy Mom';
    if (valueLower.includes('new year')) return 'New Year';
    // Capitalize first letter for display
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  // Fuzzy match theme to get style - same logic as ThemeChips
  const getThemeStyle = (value: string) => {
    const valueLower = value.toLowerCase();

    // Seasonal/Holiday - purple
    if (valueLower.includes('seasonal') || valueLower.includes('holiday') || valueLower.includes('seasonality')) {
      return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
    }
    // Halloween - orange
    if (valueLower.includes('halloween')) {
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
    }
    // Christmas - red
    if (valueLower.includes('christmas')) {
      return 'bg-red-500/20 text-red-700 dark:text-red-300';
    }
    // Thanksgiving - amber
    if (valueLower.includes('thanksgiving')) {
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
    }
    // New Year - yellow
    if (valueLower.includes('new year')) {
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
    }
    // Prob/Solve - rose
    if (valueLower.includes('prob') || valueLower.includes('solv') || valueLower.includes('problem') || valueLower.includes('solution')) {
      return 'bg-rose-500/20 text-rose-700 dark:text-rose-300';
    }
    // Opportunity - emerald
    if (valueLower.includes('opportunity')) {
      return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
    }
    // Education/Student - blue
    if (valueLower.includes('education') || valueLower.includes('student')) {
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
    }
    // Analogy - indigo
    if (valueLower.includes('analogy')) {
      return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300';
    }
    // Evergreen - green
    if (valueLower.includes('evergreen')) {
      return 'bg-green-500/20 text-green-700 dark:text-green-300';
    }
    // Aspirational - amber
    if (valueLower.includes('aspirational')) {
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
    }
    // Denied/Held Back - orange
    if (valueLower.includes('denied') || valueLower.includes('held back')) {
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
    }
    // Busy Mom - teal
    if (valueLower.includes('busy') || valueLower.includes('mom')) {
      return 'bg-teal-500/20 text-teal-700 dark:text-teal-300';
    }
    // Skit/Paradise/Bachelor/Comedy - pink
    if (valueLower.includes('skit') || valueLower.includes('paradise') || valueLower.includes('bachelor') || valueLower.includes('comedy')) {
      return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
    }
    // Good Credit - emerald
    if (valueLower.includes('good credit')) {
      return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
    }
    // Winning - cyan
    if (valueLower.includes('winning')) {
      return 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300';
    }

    // Custom theme - use hash-based color from reserved custom palette
    // This ensures custom themes get distinct colors that don't blend with predefined ones
    const colorIndex = hashStringToIndex(valueLower, CUSTOM_THEME_COLORS.length);
    return CUSTOM_THEME_COLORS[colorIndex];
  };

  // Handle adding a custom theme
  const handleAddCustomTheme = () => {
    const trimmed = customInput.trim().toLowerCase();
    if (trimmed && !themes.includes(trimmed)) {
      updateTheme([...themes, trimmed]);
    }
    setCustomInput('');
    setShowCustomInput(false);
    setIsOpen(false);
  };

  // Focus input when showing custom input
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  // Check if a theme value is already selected (fuzzy match)
  const isThemeSelected = (themeValue: string) => {
    return themes.some(t => {
      const tLower = t.toLowerCase();
      const vLower = themeValue.toLowerCase();
      // Exact match
      if (tLower === vLower) return true;
      // Fuzzy match for compound themes
      if (vLower === 'prob/solve' && (tLower.includes('prob') || tLower.includes('solv'))) return true;
      if (vLower === 'opportunity cost' && tLower.includes('opportunity')) return true;
      if (vLower === 'good credit' && tLower.includes('good credit')) return true;
      if (vLower === 'held back' && tLower.includes('held back')) return true;
      if (vLower === 'busy mom' && (tLower.includes('busy') || tLower.includes('mom'))) return true;
      if (vLower === 'new year' && tLower.includes('new year')) return true;
      if (vLower === 'seasonal' && (tLower.includes('seasonal') || tLower.includes('holiday'))) return true;
      // Simple contains match for single-word themes
      if (tLower.includes(vLower)) return true;
      return false;
    });
  };

  // Available themes not yet selected
  const availableToAdd = AVAILABLE_THEMES.filter(t => !isThemeSelected(t.value));

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Current themes display */}
      <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
        {themes.length === 0 ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 text-xs hover:text-gray-600 dark:hover:text-gray-300 px-2 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400"
            disabled={isLoading}
          >
            + Add theme
          </button>
        ) : (
          <>
            {themes.map((theme) => (
              <span
                key={theme}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getThemeStyle(theme)}`}
              >
                {getThemeLabel(theme)}
                <button
                  onClick={() => removeTheme(theme)}
                  className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 -mr-1"
                  disabled={isLoading}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </>
        )}
        {isLoading && (
          <span className="ml-1">
            <svg className="animate-spin h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-72 overflow-auto">
          {/* Custom theme input */}
          {showCustomInput ? (
            <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomTheme();
                    if (e.key === 'Escape') {
                      setShowCustomInput(false);
                      setCustomInput('');
                    }
                  }}
                  placeholder="Enter theme name..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCustomTheme}
                  disabled={!customInput.trim()}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Press Enter to add, Esc to cancel</p>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create new theme...
            </button>
          )}

          {/* Predefined themes */}
          {availableToAdd.map((theme) => (
            <button
              key={theme.value}
              onClick={() => addTheme(theme.value)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${getThemeStyle(theme.value).split(' ')[0]}`} />
              {theme.label}
            </button>
          ))}

          {availableToAdd.length === 0 && !showCustomInput && (
            <p className="px-3 py-2 text-xs text-gray-400">All predefined themes selected</p>
          )}
        </div>
      )}
    </div>
  );
}
