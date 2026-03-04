import { google } from 'googleapis';
import { Winner } from '@/types/winner';

// Sheet ID for variant tracking (output tracking sheet)
const VARIANT_SHEET_ID = '1YiKOrIkpvT7Pdt9ScNIz48HHDo9YHxXFbTBdHu_V-rk';

// Support base64-encoded credentials (more reliable for Vercel)
// or fall back to individual env vars
function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    const creds = JSON.parse(decoded);
    return {
      client_email: creds.client_email,
      private_key: creds.private_key,
    };
  }
  return {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

const auth = new google.auth.GoogleAuth({
  credentials: getCredentials(),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function getWinners(): Promise<Winner[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Sheet1!A2:R', // Skip header row, include VIDEO_URL, TYPE, and PERSONA columns
  });

  const rows = response.data.values || [];

  // Filter out header rows and empty rows
  const dataRows = rows.filter(row => {
    const month = row[0] || '';
    const brand = row[1] || '';
    // Skip if month is "MONTH" (header) or empty, or brand is "BRAND" or empty
    return month && month !== 'MONTH' && brand && brand !== 'BRAND';
  });

  return dataRows.map((row): Winner => ({
    month: row[0] || '',
    brand: row[1] as 'KIKOFF' | 'GRANT',
    type: (row[16] as 'Video' | 'Static') || 'Video',
    ticket: row[2] || '',
    theme: row[3] || '',
    variant: row[4] || '',
    duration: row[5] || '',
    execution: row[6] as 'AI' | 'UGC' | 'FLIX' | 'Stock',
    testDifferentiators: row[7] || '',
    music: row[8] || '',
    caps: row[9] || '',
    textOverlay: row[10] || '',
    mention: row[11] || '',
    productOverlay: row[12] || '',
    ifBroll: row[13] || '',
    notes: row[14] || '',
    videoUrl: row[15] || '',
    persona: row[17] || '',
  })).filter(w => isOnOrAfterJuly2025(w.month)).reverse();
}

// Monthly variant totals for win rate calculations
export interface MonthlyAdTotals {
  month: string;
  kikoffAds: number;
  grantAds: number;
  totalAds: number;
  kikoffTickets: number;
  grantTickets: number;
  totalTickets: number;
}

// Month name normalization map (handles abbreviations and typos)
const MONTH_MAP: Record<string, string> = {
  'jan': 'January',
  'january': 'January',
  'feb': 'February',
  'february': 'February',
  'feburary': 'February', // Common typo
  'mar': 'March',
  'march': 'March',
  'apr': 'April',
  'april': 'April',
  'may': 'May',
  'jun': 'June',
  'june': 'June',
  'jul': 'July',
  'july': 'July',
  'aug': 'August',
  'august': 'August',
  'sep': 'September',
  'sept': 'September',
  'september': 'September',
  'oct': 'October',
  'october': 'October',
  'nov': 'November',
  'november': 'November',
  'dec': 'December',
  'december': 'December',
};

// Parse date string like "Jan 2" or "July 15" and normalize the month
function normalizeMonth(dateStr: string): string | null {
  if (!dateStr) return null;

  // Extract month name (first word)
  const monthPart = dateStr.trim().split(/\s+/)[0]?.toLowerCase();
  if (!monthPart) return null;

  return MONTH_MAP[monthPart] || null;
}

// Only include data from July 2025 onward
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

function isOnOrAfterJuly2025(monthStr: string): boolean {
  const [month, yearStr] = monthStr.split(' ');
  const year = parseInt(yearStr);
  if (year > 2025) return true;
  if (year === 2025) return MONTH_ORDER.indexOf(month) >= MONTH_ORDER.indexOf('July');
  return false;
}

export async function getMonthlyAdTotals(): Promise<MonthlyAdTotals[]> {
  try {
    // Fetch from both tabs of the variant tracking sheet
    const [response2025, response2026] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: VARIANT_SHEET_ID,
        range: '2025!A:F', // 2025 tab (Jul-Dec 2025)
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: VARIANT_SHEET_ID,
        range: '2026!A:F', // 2026 tab (Jan onward)
      }),
    ]);

    const rows2025 = response2025.data.values || [];
    const rows2026 = response2026.data.values || [];

    // Process rows and aggregate variants + tickets by month and brand
    const monthlyData: Record<string, { kikoff: number; grant: number; kikoffTickets: number; grantTickets: number }> = {};

    const processRows = (rows: string[][], year: string) => {
      // Skip header row
      rows.slice(1).forEach(row => {
        const dateDelivered = row[1]; // Column B
        const brand = row[2]?.toLowerCase(); // Column C
        const totalVariants = parseInt(row[5]) || 0; // Column F

        if (!dateDelivered || !brand || totalVariants === 0) return;

        const normalizedMonth = normalizeMonth(dateDelivered);
        if (!normalizedMonth) return;

        const monthKey = `${normalizedMonth} ${year}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { kikoff: 0, grant: 0, kikoffTickets: 0, grantTickets: 0 };
        }

        if (brand === 'kikoff') {
          monthlyData[monthKey].kikoff += totalVariants;
          monthlyData[monthKey].kikoffTickets += 1;
        } else if (brand === 'grant') {
          monthlyData[monthKey].grant += totalVariants;
          monthlyData[monthKey].grantTickets += 1;
        }
      });
    };

    processRows(rows2025, '2025');
    processRows(rows2026, '2026');

    // Convert to array and sort by date
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    return Object.entries(monthlyData)
      .filter(([month]) => isOnOrAfterJuly2025(month))
      .map(([month, data]): MonthlyAdTotals => ({
        month,
        kikoffAds: data.kikoff,
        grantAds: data.grant,
        totalAds: data.kikoff + data.grant,
        kikoffTickets: data.kikoffTickets,
        grantTickets: data.grantTickets,
        totalTickets: data.kikoffTickets + data.grantTickets,
      }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
      });
  } catch (error) {
    console.error('Error fetching variant totals:', error);
    return [];
  }
}
