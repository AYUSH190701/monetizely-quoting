# Monetizely Quoting Tool

A lightweight quoting application for modeling SaaS client pricing and producing quotes for customers.

## Live Demo

- **Application**: [https://monetizely-quoting-five.vercel.app](https://monetizely-quoting-five.vercel.app)
- **GitHub**: [https://github.com/AYUSH190701/monetizely-quoting](https://github.com/AYUSH190701/monetizely-quoting)

---

## How to Run Locally

### Prerequisites
- Node.js ≥ 20.9.0
- npm
- PostgreSQL 14+ (local or cloud, e.g. [Neon](https://neon.tech))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/AYUSH190701/monetizely-quoting.git
cd monetizely-quoting

# 2. Install dependencies
npm install

# 3. Create environment file with your PostgreSQL connection string
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/monetizely_quoting"' > .env

# 4. Run database migrations
npx prisma migrate deploy

# 5. (Optional) Seed the database with sample data
npx tsx prisma/seed.ts

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
- **Database**: PostgreSQL via Prisma 7 (with `@prisma/adapter-pg` driver adapter)
- **Cloud Database**: [Neon](https://neon.tech) (production)
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

