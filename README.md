# Monetizely Quoting Tool

A lightweight quoting application for modeling SaaS client pricing and producing quotes for customers.

## Live Demo

- **Application**: [https://monetizely-quoting.vercel.app]([https://monetizely-quoting.vercel.app](https://monetizely-quoting-five.vercel.app/)) *(deploy to Vercel and update this URL)*
- **GitHub**: [https://github.com/your-username/monetizely-quoting](https://github.com/your-username/monetizely-quoting) *(update this URL)*

---

## How to Run Locally

### Prerequisites
- Node.js ≥ 20.9.0
- npm

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/monetizely-quoting.git
cd monetizely-quoting

# 2. Install dependencies
npm install

# 3. Create environment file
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env

# 4. Run database migrations (creates the SQLite database)
npx prisma migrate dev

# 5. Generate Prisma client
npx prisma generate

# 6. Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
# Unit tests (pricing math)
npm test

# E2E tests (requires the app to be running or will start it automatically)
npm run test:e2e
```

### Building for Production

```bash
npm run build
npm run start
```

---

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (TypeScript)
- **Database**: SQLite via Prisma (with `better-sqlite3` driver adapter)
- **Styling**: Tailwind CSS 4
- **Testing**: Jest (unit tests) + Playwright (E2E tests)

### Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── products/           # Product CRUD
│   │   ├── tiers/              # Tier updates
│   │   ├── features/           # Feature updates
│   │   └── quotes/             # Quote CRUD
│   ├── catalog/                # Catalog management pages
│   │   └── products/[id]/      # Product detail (tiers + features)
│   ├── quotes/                 # Quote pages
│   │   ├── new/                # Quote builder
│   │   └── [id]/               # Shareable quote view (no auth required)
│   └── page.tsx                # Dashboard
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   └── pricing.ts              # All pricing calculation logic
└── __tests__/
    └── pricing.test.ts         # 30 unit tests for pricing math
e2e/
└── workflow.test.ts            # Playwright E2E tests
```

---

## Assumptions

### Pricing Model
1. **All monetary values are stored as integers in cents** (e.g., $100 = 10000) to avoid floating-point precision issues. Percentages are stored as basis points (10% = 1000 basis points).

2. **Term discounts apply only to the base product seat price**, not to add-ons. Add-on costs are calculated at their face value regardless of term length, then multiplied by the number of months. This seemed like the most operationally sensible interpretation — the discount rewards commitment on the core product.

3. **Percentage add-ons are calculated against the discounted monthly base price**. So if the base is $500/month and the annual discount brings it to $425/month, a 10% add-on charges $42.50/month. This ensures the percentage reflects the actual cost being paid.

4. **The quote view page is publicly accessible** (no authentication) by design, as the brief explicitly states it should be shareable without login.

5. **Quote data is snapshotted at creation time**. The `productName`, `tierName`, `basePricePerSeat`, `featureName`, and `pricingModel` are stored on the quote itself, not just as foreign keys. This means changing catalog prices later won't retroactively alter existing quotes — which is what you'd want for a real quoting tool.

---

## Decisions and Trade-offs

### Database: SQLite over Postgres/MongoDB
**I chose SQLite** for local development because it requires zero infrastructure setup and allows the app to run immediately after cloning. For Vercel deployment, this uses `@prisma/adapter-better-sqlite3`.

**Trade-off**: SQLite doesn't scale horizontally and has limitations with concurrent writes. For a production tool used by multiple analysts simultaneously, I'd migrate to Vercel Postgres (or any Postgres host). The Prisma schema is identical — only the adapter/connection string changes.

### Prisma 7 with Driver Adapters
Prisma 7 introduced a new configuration model requiring explicit database adapters. This was a significant deviation from the Prisma 4/5 experience. I chose to work with this new paradigm rather than pinning to an older Prisma version, since Vercel deployment (the requirement) would work with the same pattern using `@prisma/adapter-neon` or `@prisma/adapter-pg`.

### Add-on Pricing: Percentage Uses Discounted Base
I chose to calculate percentage add-ons against the post-discount monthly base price (not the pre-discount price). My reasoning: the percentage is meant to represent "X% of what you're actually paying for the product," which is the discounted amount. If a client is paying $425/month for Growth (after annual discount from $500), a 10% add-on should be $42.50, not $50.

### Quote URL: UUID-based IDs (via Prisma cuid)
Quote IDs are CUIDs (collision-resistant unique identifiers), which are long enough to be unpredictable. This makes quote URLs non-guessable while still being shareable — a lightweight security approach that's appropriate for "read-only documents" that don't contain sensitive PII (the brief says no customer login, no payment info).

### No Editing of Quotes
Per the brief, I didn't implement quote editing. The data model supports creating new quotes, and the UI directs users toward this. If editing were needed, the snapshot model would need rethinking — you'd need to decide whether editing a quote updates the snapshot or creates a new version.

---

## Questions I Would Have Asked

1. **Do add-on discounts follow term length?** I assumed no, but the brief doesn't specify. If a customer signs up for an annual plan with a per-seat add-on, do they also get 15% off the add-on? I'd want to confirm before deploying.

2. **Can a feature appear in multiple products?** Currently, features are scoped to a single product. If a feature like "SSO" could apply across products, we'd need a different data model (shared features library vs. product-scoped features).

3. **Is the "additional discount" applied before or after the term discount?** I apply it after — so the term discount happens first, then the analyst's manual discount is applied to the subtotal. The alternative (apply manual discount first, then term discount) would give a marginally different result. The current behavior (compound discounts) is documented in the line items so the customer can see both.

4. **What happens when catalog prices change after a quote is saved?** My current implementation snapshots prices at quote creation time. Is this the right behavior, or should quotes "live update" to reflect the current catalog? I went with snapshots since that's standard for quoting tools.

5. **Multi-user / analyst collaboration?** The brief says no auth needed, but in practice multiple analysts might use the same instance. I'd want to know whether quotes should be visible to all analysts or scoped to the creator.

---

## What I Would Build Next

Given more time, I'd prioritize:

1. **Quote expiry tracking and renewal flow** — Quotes should expire (currently shows "valid for 30 days" in the footer but it's purely cosmetic). A real system would send expiry reminders.

2. **Catalog import from CSV/Excel** — The brief mentions an Excel file as reference. An import flow would save analysts significant time when onboarding new clients.

3. **Quote comparison view** — Let analysts compare two or three quote scenarios side by side (e.g., "Starter vs. Growth, 1 year vs. 2 year").

4. **Vercel Postgres migration** — Swap out SQLite for Vercel Postgres for production reliability. The schema and queries are identical; only the adapter changes.

5. **Quote PDF export** — The brief says it's out of scope, but it would be the first thing a real customer would ask for.

6. **Audit trail** — Track when quotes were viewed and by whom (even without auth, you can log access by URL).

7. **API authentication** — The API routes currently have no authentication. In production, these would need API key validation or session-based auth.
