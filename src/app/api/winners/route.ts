import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      month,
      brand,
      ticket,
      theme,
      variant,
      duration,
      execution,
      testDifferentiators,
      music,
      caps,
      textOverlay,
      mention,
      productOverlay,
      ifBroll,
      notes,
      videoUrl,
    } = body;

    // Append row to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A:P',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          month,
          brand,
          ticket,
          theme,
          variant,
          duration,
          execution,
          testDifferentiators,
          music,
          caps,
          textOverlay,
          mention,
          productOverlay,
          ifBroll,
          notes,
          videoUrl || '',
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding winner:', error);
    return NextResponse.json(
      { error: 'Failed to add winner' },
      { status: 500 }
    );
  }
}
