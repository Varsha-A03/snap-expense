# SnapExpense

A personal expense tracking app that lets you save UPI transaction screenshots and automatically extract transaction details.

## Day 1 — Foundation

This project currently has routing and dummy UI pages for:

- Login (`/`)
- Dashboard (`/dashboard`)
- Upload (`/upload`)
- Confirm (`/confirm`)
- History (`/history`)

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`) and navigate between pages using the navbar or by visiting routes directly.

## Scripts

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

## AI Extraction (Gemini Vision)

Transaction details are extracted server-side via a Supabase Edge Function so your Gemini API key stays secret.

### One-time setup

1. **Confirm the secret name** in Supabase Dashboard → **Edge Functions** → **Secrets**:
   - Name must be exactly: `GEMINI_API_KEY`
   - Value: your Google AI Studio API key

2. **Deploy the edge function** (pick one method below).

#### Option A — npm (recommended if Homebrew fails)

The Supabase CLI is already installed as a dev dependency. Run these in your project folder:

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:deploy
```

#### Option B — Homebrew (if checksum error, skip and use Option A)

```bash
brew update
brew install supabase/tap/supabase
```

If you see a checksum error, use Option A instead.

#### Option C — Supabase Dashboard (no CLI)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Edge Functions**
2. Click **Create a new function** → name it `extract-transaction`
3. Replace the default code with the contents of `supabase/functions/extract-transaction/index.ts`
4. Enable **JWT verification** (verify_jwt = true)
5. Deploy / Save

### Correct link command

Use `--project-ref`, not `--snap-expense`:

```bash
npx supabase link --project-ref lzgavriumssyxmdlrimx
```

### How it works

1. Upload a screenshot on `/upload`
2. Click **Extract details** — calls `extract-transaction` via Gemini Vision
3. Confirm page opens with merchant, amount, and date pre-filled
4. Use **Enter manually** to skip AI and fill the form yourself

## Saving Transactions (Day 5)

### One-time setup

1. **Storage bucket** — create a private bucket named `receipts` in Supabase Dashboard → **Storage**
2. **Storage policies** — run the SQL in `supabase/migrations/20250616000000_storage_policies.sql` in **SQL Editor** (update bucket name in SQL if yours differs)
3. **Transactions table** — must exist with RLS (from Day 2 setup)

Optional: set `VITE_RECEIPTS_BUCKET=your-exact-bucket-name` in `.env.local` if your bucket name is not `receipts`.

### How save works

1. Upload → Extract (or enter manually) → Confirm
2. Click **Save Transaction**
3. Screenshot uploads to `receipts/{user_id}/{uuid}.jpg`
4. Row inserted into `transactions` with amount, merchant, category, date, and image path

