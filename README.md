# PartyApp 🇵🇰

Political Party Membership PWA with Referral-Based Ranking System for Pakistan.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# 3. Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# 4. Seed constituencies data
npm run db:seed

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features
- 📱 Mobile-first PWA (installable)
- 🔗 3-level referral system (10/5/2 points)
- 🏆 Per-constituency leaderboards
- 🇵🇰 All 266 NA + sample PA constituencies
- 👤 CNIC-based auto-constituency mapping
- 🤖 AI Agent webhook endpoint
- 🌙 Pakistan green theme

## Tech Stack
Next.js 14 | TypeScript | Tailwind CSS | PostgreSQL | Prisma | NextAuth.js
