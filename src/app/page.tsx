import { getWinners } from '@/lib/sheets';
import { Dashboard } from '@/components/Dashboard';
import { PasswordGate } from '@/components/PasswordGate';

export const revalidate = 30; // Revalidate every 30 seconds for faster updates

export default async function Home() {
  let winners: Awaited<ReturnType<typeof getWinners>> = [];
  let error: string | null = null;

  try {
    winners = await getWinners();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch data';
    console.error('Error fetching winners:', e);
  }

  return (
    <PasswordGate>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Brand Logos */}
                <div className="flex items-center gap-2">
                  <img src="/kikoff-logo.png" alt="Kikoff" className="w-10 h-10 rounded-lg shadow-sm" />
                  <img src="/grant-logo.png" alt="Grant" className="w-10 h-10 rounded-lg shadow-sm" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Winner Breakdown
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ad performance insights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {winners.length} winners
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <h2 className="text-lg font-medium text-red-800 dark:text-red-200">Error loading data</h2>
              <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
              <p className="text-sm text-red-500 dark:text-red-500 mt-4">
                Make sure the Google Sheets API is configured correctly.
              </p>
            </div>
          ) : (
            <Dashboard winners={winners} />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Synced with Google Sheets
            </p>
          </div>
        </footer>
      </div>
    </PasswordGate>
  );
}
