import { google } from 'googleapis';
import { Winner } from '@/types/winner';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function getWinners(): Promise<Winner[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Sheet1!A2:P', // Skip header row, include VIDEO_URL column
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
  }));
}
