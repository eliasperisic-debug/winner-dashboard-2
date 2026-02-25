require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

// Simulates WebFetch behavior - uses proper headers and follows redirects
async function webFetchFolder(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const html = await response.text();
    
    // Count .mp4 files - files appear in JSON-like format with &quot; quotes
    // Try multiple patterns to catch different naming conventions
    
    // Pattern 1: Standard CR/CBG ticket format
    const ticketPattern = /(?:CR[E]?-?\d+|CBG-?\d+)[A-Za-z0-9_\-\[\]\(\)&#;'\s]*\.mp4/gi;
    let matches = html.match(ticketPattern) || [];
    
    // Pattern 2: If no ticket matches, fall back to any .mp4 filenames
    // Look for filenames that end in .mp4 and have typical video naming patterns
    if (matches.length === 0) {
      // Match filenames with version/aspect ratio patterns like _V1_1-1.mp4 or -V1LS.mp4
      const fallbackPattern = /[A-Za-z0-9_\-&#;']+(?:_V\d|[-_]V\d)[A-Za-z0-9_\-&#;']*\.mp4/gi;
      matches = html.match(fallbackPattern) || [];
    }
    
    // Normalize and dedupe
    const uniqueFiles = new Set(matches.map(f => {
      let normalized = f.toLowerCase().trim();
      // Decode HTML entities
      normalized = normalized.replace(/&#39;/g, "'");
      normalized = normalized.replace(/&#\d+;/g, '');
      normalized = normalized.replace(/&quot;/g, '');
      normalized = normalized.replace(/&amp;/g, '&');
      // Normalize spaces
      normalized = normalized.replace(/\s+/g, ' ');
      return normalized;
    }));
    
    return { count: uniqueFiles.size, error: null };
  } catch (err) {
    clearTimeout(timeout);
    return { count: 0, error: err.message };
  }
}

async function main() {
  console.log('=== WebFetch Video Counter ===\n');
  
  // Get all links from Google Sheet
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Fetching links from Google Sheet...');
  const response = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    ranges: ['Monthly Totals!A2:I300'],
    includeGridData: true,
  });

  const rows = response.data.sheets?.[0]?.data?.[0]?.rowData || [];
  
  // Extract links (skip OOH)
  const items = [];
  rows.forEach((row, i) => {
    const cells = row.values || [];
    if (!cells[1]?.formattedValue) return;
    
    const date = cells[1]?.formattedValue || '';
    const brand = cells[2]?.formattedValue || '';
    const ticket = cells[4]?.formattedValue || '';
    const variants = cells[5]?.formattedValue || '';
    const link = cells[6]?.hyperlink || '';
    const isOOH = (cells[8]?.formattedValue || '').toUpperCase() === 'OOH';
    
    if (isOOH || !link.includes('drive.google.com')) return;
    
    items.push({ row: i + 2, date, brand, ticket, variants, link });
  });
  
  console.log(`Found ${items.length} Drive folders to process\n`);
  
  // Process in batches
  const batchSize = 5;
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const result = await webFetchFolder(item.link);
        return { ...item, videoCount: result.count, error: result.error };
      })
    );
    
    results.push(...batchResults);
    
    // Progress update
    const done = Math.min(i + batchSize, items.length);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const successCount = results.filter(r => r.videoCount > 0).length;
    const errorCount = results.filter(r => r.error).length;
    process.stdout.write(`\rProcessed ${done}/${items.length} in ${elapsed}s (${successCount} success, ${errorCount} errors)`);
    
    // Small delay between batches to be nice to Google
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nDone in ${totalTime} seconds!`);
  
  // Save results
  fs.writeFileSync('/tmp/webfetch_counts.json', JSON.stringify(results, null, 2));
  console.log('Results saved to /tmp/webfetch_counts.json');
  
  // Calculate monthly totals
  const monthlyData = {};
  results.forEach(r => {
    const month = r.date.split(' ')[0];
    if (!monthlyData[month]) monthlyData[month] = { kikoff: 0, grant: 0, total: 0 };
    
    const brand = r.brand.toLowerCase();
    if (brand.includes('kikoff')) {
      monthlyData[month].kikoff += r.videoCount;
    } else if (brand.includes('grant')) {
      monthlyData[month].grant += r.videoCount;
    }
    monthlyData[month].total += r.videoCount;
  });
  
  console.log('\n=== MONTHLY TOTALS ===');
  let grandTotal = 0;
  ['Sep', 'Oct', 'Nov', 'Dec'].forEach(month => {
    if (monthlyData[month]) {
      const d = monthlyData[month];
      grandTotal += d.total;
      console.log(`${month} 2025: ${d.total} total (Kikoff: ${d.kikoff}, Grant: ${d.grant})`);
    }
  });
  console.log(`\nGrand Total: ${grandTotal} videos`);
  
  // Show any errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.log(`\n=== ERRORS (${errors.length}) ===`);
    errors.forEach(e => console.log(`  Row ${e.row}: ${e.error}`));
  }
  
  // Show any zeros that might be suspicious
  const zeros = results.filter(r => r.videoCount === 0 && !r.error);
  if (zeros.length > 0) {
    console.log(`\n=== ZERO COUNTS (${zeros.length}) - may need verification ===`);
    zeros.slice(0, 10).forEach(z => console.log(`  Row ${z.row}: ${z.date} ${z.brand} v=${z.variants}`));
    if (zeros.length > 10) console.log(`  ... and ${zeros.length - 10} more`);
  }
}

main().catch(console.error);
