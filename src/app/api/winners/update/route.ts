import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

// Support base64-encoded credentials or individual env vars
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

// Column mapping for fields
const COLUMN_MAP: Record<string, string> = {
  month: 'A',
  brand: 'B',
  ticket: 'C',
  theme: 'D',
  variant: 'E',
  duration: 'F',
  execution: 'G',
  testDifferentiators: 'H',
  music: 'I',
  caps: 'J',
  textOverlay: 'K',
  mention: 'L',
  productOverlay: 'M',
  ifBroll: 'N',
  notes: 'O',
  videoUrl: 'P',
};

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticket, field, value } = body;

    if (!ticket || !field) {
      return NextResponse.json(
        { error: 'Missing required fields: ticket and field' },
        { status: 400 }
      );
    }

    const column = COLUMN_MAP[field];
    if (!column) {
      return NextResponse.json(
        { error: `Invalid field: ${field}` },
        { status: 400 }
      );
    }

    // First, find the row with matching ticket (Column C)
    const searchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!C:C',
    });

    const rows = searchResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === ticket) {
        rowIndex = i + 1; // Sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: `Ticket not found: ${ticket}` },
        { status: 404 }
      );
    }

    // Update the specific cell
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Sheet1!${column}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    return NextResponse.json({
      success: true,
      updated: { ticket, field, value, row: rowIndex }
    });
  } catch (error) {
    console.error('Error updating winner:', error);
    return NextResponse.json(
      { error: 'Failed to update winner' },
      { status: 500 }
    );
  }
}
