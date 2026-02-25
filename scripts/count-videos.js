require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

// Read the links
const links = require('/tmp/drive_links.json');

// Function to fetch a URL and count .mp4 files using fetch API
async function fetchAndCount(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    
    const data = await response.text();
    
    // Count .mp4 files - look for patterns like "Video" + filename + ".mp4"
    // The HTML shows: VideoCR-249-KIKOFF...mp4Sep 3, 202522.1 MB Download
    // Count unique filenames ending in .mp4 followed by a date pattern
    const fileMatches = data.match(/[A-Za-z0-9_\-\[\]\(\)']+\.mp4(?=[A-Z][a-z]{2}\s*\d)/gi) || [];
    const uniqueFiles = new Set(fileMatches.map(f => f.toLowerCase()));
    return uniqueFiles.size;
  } catch (err) {
    throw err;
  }
}

// Process in batches with delay
async function processAll() {
  const results = [];
  const batchSize = 5;
  const delayMs = 1000;
  
  console.log(`Processing ${links.length} links in batches of ${batchSize}...`);
  console.log('');
  
  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        if (item.link === 'MULTIPLE' || item.link === 'NO_LINK') {
          return { ...item, videoCount: null, error: item.link };
        }
        
        try {
          const count = await fetchAndCount(item.link);
          return { ...item, videoCount: count, error: null };
        } catch (err) {
          return { ...item, videoCount: null, error: err.message };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Progress update
    const done = Math.min(i + batchSize, links.length);
    const successCount = results.filter(r => r.videoCount !== null).length;
    const errorCount = results.filter(r => r.error !== null).length;
    process.stdout.write(`\rProcessed ${done}/${links.length} (${successCount} success, ${errorCount} errors)`);
    
    // Delay between batches
    if (i + batchSize < links.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  console.log('\n\nDone!');
  
  // Save results
  fs.writeFileSync('/tmp/video_counts.json', JSON.stringify(results, null, 2));
  console.log('Results saved to /tmp/video_counts.json');
  
  // Print summary
  const success = results.filter(r => r.videoCount !== null);
  const errors = results.filter(r => r.error !== null);
  
  console.log('\n=== SUMMARY ===');
  console.log('Successful:', success.length);
  console.log('Errors:', errors.length);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 10).forEach(e => {
      console.log(`  Row ${e.row}: ${e.error}`);
    });
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
  }
  
  // Monthly totals
  const monthlyTotals = {};
  success.forEach(r => {
    const month = r.date.split(' ')[0]; // "Sep", "Oct", etc.
    const brand = r.brand.toLowerCase();
    
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = { kikoff: 0, grant: 0, total: 0 };
    }
    
    if (brand.includes('kikoff')) {
      monthlyTotals[month].kikoff += r.videoCount;
    } else if (brand.includes('grant')) {
      monthlyTotals[month].grant += r.videoCount;
    }
    monthlyTotals[month].total += r.videoCount;
  });
  
  console.log('\n=== MONTHLY TOTALS ===');
  Object.entries(monthlyTotals).forEach(([month, data]) => {
    console.log(`${month}: ${data.total} total (Kikoff: ${data.kikoff}, Grant: ${data.grant})`);
  });
}

processAll().catch(console.error);
