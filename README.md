# Winner Dashboard

A Next.js dashboard for tracking and analyzing ad creative winners across Kikoff and Grant brands.

## Features

- **Winners Table**: View all winning creatives with themes, hooks, and performance data
- **Analytics Tab**: Per-brand breakdown of win rates with Recharts visualizations
- **Trends Tab**: Win rate over time with monthly/quarterly views
- **Interactive Features**: Expandable breakdowns, side-by-side comparison, pinning
- **Theme Customizer**: Color theme modal for customization

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your credentials (copy from .env.example)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CREDENTIALS_BASE64` | Base64-encoded Google service account JSON |
| `WINNERS_SHEET_ID` | Google Sheet ID for winners data |
| `VARIANT_SHEET_ID` | Google Sheet ID for variant tracking (default: `1YiKOrIkpvT7Pdt9ScNIz48HHDo9YHxXFbTBdHu_V-rk`) |

## AWS Amplify Deployment

### Prerequisites
1. AWS Account with Amplify access
2. GitHub repository access
3. Google service account credentials (base64 encoded)

### Steps

1. **Go to AWS Amplify Console**
   - Navigate to AWS Console → Amplify
   - Click "New app" → "Host web app"

2. **Connect GitHub Repository**
   - Select GitHub and authorize access
   - Choose `Kikoff/kikoff-marketing-tools-aws` repository
   - Select branch `winners-dashboard-v2-enhanced` (or `main` after merge)

3. **Configure Build Settings**
   - Set "App root" to `winner-dashboard`
   - Amplify auto-detects Next.js - use default build settings
   - Or use `amplify.yml` in this directory

4. **Add Environment Variables**
   In Amplify Console → App settings → Environment variables:
   ```
   GOOGLE_CREDENTIALS_BASE64 = <your-base64-encoded-service-account-json>
   WINNERS_SHEET_ID = <your-google-sheet-id>
   VARIANT_SHEET_ID = 1YiKOrIkpvT7Pdt9ScNIz48HHDo9YHxXFbTBdHu_V-rk
   ```

5. **Deploy**
   - Click "Save and deploy"
   - Wait for build to complete (green checkmark)

6. **Update Flask App**
   - Copy the Amplify URL (e.g., `https://main.d1234abcd.amplifyapp.com`)
   - Add to Flask environment: `WINNER_DASHBOARD_URL=<amplify-url>`

### Encoding Credentials

To base64 encode your Google service account JSON:
```bash
base64 -i service-account.json | tr -d '\n'
```

## Architecture

```
winner-dashboard/
├── src/
│   ├── app/
│   │   ├── api/winners/    # API routes for data fetching
│   │   ├── components/     # React components
│   │   └── page.tsx        # Main dashboard page
│   └── lib/                # Utilities and services
├── amplify.yml             # AWS Amplify build config
├── next.config.ts          # Next.js config (standalone output)
└── package.json
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS
- **Charts**: Recharts
- **Data**: Google Sheets API
- **Deployment**: AWS Amplify (SSR)
