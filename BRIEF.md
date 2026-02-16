# PartyApp — Political Party Membership PWA

## What To Build
A mobile-first PWA for Pakistan political party membership with referral-based ranking system.
Reference: https://awaamraaj.pk/ (Pakistan Awaam Raaj Tehreek)

## Tech Stack
- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth.js for auth
- PWA (service worker, manifest, installable)

## Core Features

### 1. Auth & Registration
- Phone OTP (+92 Pakistan numbers)
- CNIC validation (13 digits, format: XXXXX-XXXXXXX-X)
- First 5 digits of CNIC = district code → auto-assign constituency
- Support for Resident + Overseas Pakistanis
- Fields: Full Name, Age, Gender, Religion, CNIC, Email, Phone, Province, District, Residential Status

### 2. Referral Engine (CORE)
- Each member gets unique referral code (e.g., AR-XXXXX) + QR code
- Shareable WhatsApp/SMS link
- 3-level tracking:
  - Direct referral: 10 points
  - 2nd level (referral's referral): 5 points
  - 3rd level: 2 points
  - Active member bonus: +3 points per active referral
- Anti-fraud: duplicate CNIC, circular referral detection, same-device detection
- Real-time notifications on new referrals

### 3. Ranking & Leaderboard
- Per-constituency leaderboard (NA + PA seats)
- National leaderboard
- Score formula: (Direct × 10) + (2nd Level × 5) + (3rd Level × 2) + (Active × 3)
- Historical trends
- **Top-ranked member = recommended candidate for that constituency seat**
- Party leadership can override

### 4. Pakistan Political Structure
- Constituencies: NA (266 general + 60 women + 10 minorities = 336), Punjab PA (371), Sindh PA (168), KPK PA (145), Balochistan PA (65)
- Hierarchy: Chairman > Provincial President > Divisional > District > Tehsil > UC > Ward
- Provinces: Punjab, Sindh, KPK, Balochistan + AJK, Gilgit-Baltistan, ICT

### 5. Member Dashboard
- Digital membership card (with QR code, member ID, photo)
- Referral tree visualization
- Personal stats: rank, score, referral count by level
- Notifications

### 6. Admin Dashboard
- Total members, growth charts
- Constituency heatmap (which areas need more recruitment)
- Referral chain visualization
- Top recruiters leaderboard
- Candidate recommendations per constituency
- Export reports (PDF/CSV)
- AI Agent webhook endpoint

### 7. PWA Requirements
- `manifest.json` with Pakistan green theme (#01411C)
- Service worker for offline access
- Bottom tab navigation: 🏠 Home | 🔗 Referrals | 🏆 Rankings | 👤 Profile
- Push notifications
- Installable on Android/iOS

### 8. UI/UX (Mobile-First)
- Primary: Pakistan green (#01411C), accent white, secondary gray
- Bottom tab navigation (fixed, 4 tabs)
- Card-based layouts
- Touch targets min 44px
- Urdu font support (Noto Nastaliq Urdu) — bilingual EN/UR
- RTL support when Urdu is selected
- Pull-to-refresh on lists
- Skeleton loading states

## Database (Prisma Schema)
See `schema-draft.prisma` for starting point. Needs:
- CNIC field on User
- Party model (multi-party support)
- Province/District/Tehsil/UC hierarchy tables
- Constituency seed data
- Referral level tracking
- Score computation

## Seed Data Needed
- All NA constituencies (NA-1 through NA-266)
- Sample PA constituencies (at least Punjab PP-1 through PP-20)
- Province/District mapping
- Sample members with referral chains for demo

## File Structure Expected
```
partyapp/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── fonts/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── home/page.tsx
│   │   │   ├── referrals/page.tsx
│   │   │   ├── rankings/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── constituencies/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── members/route.ts
│   │       ├── referrals/route.ts
│   │       ├── rankings/route.ts
│   │       └── webhook/route.ts
│   ├── components/
│   │   ├── ui/ (Button, Card, Input, etc.)
│   │   ├── BottomNav.tsx
│   │   ├── MembershipCard.tsx
│   │   ├── ReferralTree.tsx
│   │   ├── LeaderboardTable.tsx
│   │   └── ConstituencyMap.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── referral-engine.ts
│   │   ├── ranking-calculator.ts
│   │   ├── cnic-validator.ts
│   │   └── constituency-mapper.ts
│   └── types/
│       └── index.ts
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```
