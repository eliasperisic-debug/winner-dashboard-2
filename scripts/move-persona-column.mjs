/**
 * Migration script: Move Persona column from H (index 7) back to R (index 17)
 *
 * The user manually inserted a Persona column at position H, which shifted
 * all columns from H onward right by one. This script moves it back to R
 * (after Type in Q) to restore the expected column order.
 *
 * Expected order: A=Month, B=Brand, C=Ticket, D=Theme, E=Variant, F=Duration,
 *   G=Execution, H=TestDifferentiators, I=Music, J=Caps, K=TextOverlay,
 *   L=Mention, M=ProductOverlay, N=IfBroll, O=Notes, P=VideoUrl, Q=Type, R=Persona
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load .env.local
config({ path: resolve(projectRoot, '.env.local') });

function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    const creds = JSON.parse(decoded);
    return { client_email: creds.client_email, private_key: creds.private_key };
  }
  return {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
if (!SPREADSHEET_ID) {
  console.error('ERROR: GOOGLE_SHEETS_ID not found in .env.local');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: getCredentials(),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function readHeaderRow() {
  // Row 2 has the actual headers (row 1 is mostly empty except Q/R)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A2:S2',
  });
  return res.data.values?.[0] || [];
}

async function getSheetId() {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties',
  });
  const sheet = res.data.sheets?.find(s => s.properties?.title === 'Sheet1');
  if (!sheet) throw new Error('Sheet1 not found');
  return sheet.properties.sheetId;
}

function colLetter(index) {
  return String.fromCharCode(65 + index);
}

async function main() {
  console.log('=== Move Persona Column: H → R ===\n');

  // Step 1: Read current headers
  console.log('Step 1: Reading current header row...');
  const headersBefore = await readHeaderRow();
  console.log('Current headers:');
  headersBefore.forEach((h, i) => console.log(`  ${colLetter(i)}: ${h}`));

  // Verify column H is Persona
  const colH = (headersBefore[7] || '').toLowerCase().trim();
  if (!colH.includes('persona')) {
    console.error(`\nERROR: Column H is "${headersBefore[7]}", not Persona.`);
    console.error('The column may have already been moved or the sheet layout is different than expected.');
    process.exit(1);
  }
  console.log(`\n✓ Confirmed: Column H is "${headersBefore[7]}"\n`);

  // Step 2: Move column H to after current column R (index 17)
  // Using MoveDimension: move column at index 7 to destinationIndex 18
  // (destinationIndex is calculated before the source is removed)
  console.log('Step 2: Moving column H (index 7) to position R (after Q)...');
  const sheetId = await getSheetId();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        moveDimension: {
          source: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 7,  // Column H (0-based)
            endIndex: 8,    // Exclusive
          },
          destinationIndex: 18, // After current column R (index 17); 18 in pre-move coordinates
        },
      }],
    },
  });

  console.log('✓ Column moved successfully\n');

  // Step 3: Verify
  console.log('Step 3: Verifying new column order...');
  const headersAfter = await readHeaderRow();
  console.log('New headers:');
  headersAfter.forEach((h, i) => console.log(`  ${colLetter(i)}: ${h}`));

  // Verify expected order
  const expectedOrder = [
    'Month', 'Brand', 'Ticket', 'Theme', 'Variant', 'Duration',
    'Execution', 'Test Differentiators', 'Music', 'Caps', 'Text Overlay',
    'Mention', 'Product Overlay', 'If Broll', 'Notes', 'Video URL', 'Type', 'Persona',
  ];

  // Check that Persona is no longer at H and is now at the end
  const personaIndex = headersAfter.findIndex(h => h?.toLowerCase().includes('persona'));
  if (personaIndex === 17) {
    console.log('\n✓ SUCCESS: Persona is now at column R (index 17)');
  } else if (personaIndex >= 0) {
    console.log(`\n⚠ WARNING: Persona is at column ${colLetter(personaIndex)} (index ${personaIndex}), expected R (17)`);
  } else {
    console.log('\n⚠ WARNING: Could not find Persona column in headers');
  }

  // Verify H is now Test Differentiators (or whatever was at I before)
  const colHAfter = headersAfter[7] || '';
  if (colHAfter.toLowerCase().includes('test') || colHAfter.toLowerCase().includes('differentiator')) {
    console.log(`✓ Column H is now "${colHAfter}" (correct)`);
  } else {
    console.log(`⚠ Column H is now "${colHAfter}" - verify this is correct`);
  }

  console.log('\n=== Migration complete ===');
}

main().catch(err => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
