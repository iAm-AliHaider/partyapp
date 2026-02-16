# Political Party Membership App — Research & Architecture

## 🇵🇰 Pakistan Political Party Hierarchy

### National Level
```
Party Chairman / President
  └── Central Executive Committee
       └── Secretary General
            └── Central Working Committee
                 └── Provincial Presidents (4 provinces + AJK, GB, ICT)
```

### Provincial Level (per province)
```
Provincial President
  └── Provincial General Secretary
       └── Divisional Presidents (8 divisions in Punjab, 6 in Sindh, etc.)
            └── District Presidents (~150+ districts)
                 └── Tehsil/Town Presidents
                      └── Union Council Presidents
                           └── Ward/Mohalla Presidents
                                └── Workers/Members
```

### Key Administrative Units
| Level | Approx. Count | Notes |
|-------|---------------|-------|
| Provinces | 4 + 3 territories | Punjab, Sindh, KPK, Balochistan + AJK, GB, ICT |
| Divisions | ~35 | Administrative groupings |
| Districts | ~150+ | Main local admin unit |
| Tehsils | ~600+ | Sub-district |
| Union Councils | ~7,000+ | Lowest elected tier |
| Wards | ~40,000+ | Neighborhood level |

### Election Seats (2024)
| Assembly | Total Seats | General | Women | Minorities |
|----------|-------------|---------|-------|------------|
| National Assembly (NA) | 336 | 266 | 60 | 10 |
| Punjab Assembly (PP) | 371 | 297 | 66 | 8 |
| Sindh Assembly (PS) | 168 | 130 | 29 | 9 |
| KPK Assembly (PK) | 145 | 115 | 26 | 4 |
| Balochistan Assembly (PB) | 65 | 51 | 11 | 3 |

---

## 📱 App Concept: Referral-Based Party Membership

### Core Idea
Members join a political party through the app → recruit others via referral links → earn ranking points → highest-ranked members in each constituency become party candidates for that seat.

### How Rankings Work

```
Member joins → gets unique referral code
  → Refers others → each verified referral = points
    → Points accumulate up the hierarchy
      → Constituency leaderboard determines candidate selection
```

### Ranking Formula (Proposed)
```
Score = (Direct Referrals × 10) + (2nd Level × 5) + (3rd Level × 2) + (Active Member Bonus × 3)
```

- **Direct Referral:** Person you personally recruited (10 pts)
- **2nd Level:** People your referrals recruited (5 pts)
- **3rd Level:** Third generation (2 pts)
- **Active Member Bonus:** Members who complete profile, attend events, etc. (3 pts per active referral)
- **Depth Cap:** 3 levels max to prevent pyramid dynamics

### Constituency Mapping
Each member is mapped to a constituency based on:
1. **CNIC number** (first 5 digits = district code)
2. **Registered voter address**
3. **Manual selection** (with verification)

The member's rank applies to their **home constituency** (NA + PA).

### Candidate Selection Logic
```
For each constituency seat:
  1. Filter members registered in that constituency
  2. Rank by referral score
  3. Top-ranked member = recommended candidate
  4. Party leadership reviews + approves/overrides
```

---

## 🏗️ App Architecture (High Level)

### Tech Stack (Recommended)
- **Frontend:** React Native (iOS + Android) or Flutter
- **Backend:** Node.js/NestJS or Python/FastAPI
- **Database:** PostgreSQL (relational data) + Redis (leaderboards)
- **Auth:** Phone OTP (Pakistani numbers) + CNIC verification
- **Maps:** Pakistan constituency boundary data (ECP shapefiles)
- **Hosting:** AWS/GCP or local Pakistan hosting (PTCL Cloud)

### Core Modules
1. **Auth & KYC**
   - Phone number verification (OTP)
   - CNIC upload + OCR extraction
   - Constituency auto-assignment from CNIC
   - Party selection

2. **Membership Management**
   - Profile (name, CNIC, constituency, party)
   - Membership card generation (digital)
   - Party hierarchy position tracking
   - Membership status (active/inactive/suspended)

3. **Referral Engine**
   - Unique referral codes/links per member
   - Multi-level tracking (3 levels deep)
   - Anti-fraud: duplicate CNIC detection, geo-verification
   - Real-time referral notifications

4. **Ranking System**
   - Per-constituency leaderboard
   - National leaderboard
   - Historical ranking trends
   - Score breakdown (transparency)

5. **Candidate Selection**
   - Auto-recommendation based on rankings
   - Party leadership override capability
   - Election timeline integration
   - Ticket allocation dashboard

6. **Admin Panel (Party Owner)**
   - Membership analytics dashboard
   - Referral chain visualization (tree view)
   - Constituency heatmap
   - Candidate recommendation engine
   - Reports generation
   - **AI Agent integration** (Siyasat agent reports here)

7. **AI Agent Layer (Siyasat)**
   - Connected via API to app backend
   - Generates daily/weekly briefings
   - Anomaly detection (fake referrals, circular chains)
   - Constituency gap analysis
   - Candidate readiness scoring

### Database Schema (Key Tables)
```sql
-- Members
members (id, cnic, phone, name, party_id, constituency_na, constituency_pa, 
         referred_by, referral_code, score, rank, status, created_at)

-- Referrals
referrals (id, referrer_id, referred_id, level, verified, created_at)

-- Parties
parties (id, name, name_urdu, chairman, symbol, ecp_registered)

-- Constituencies
constituencies (id, type[NA/PA], code, name, province, district, 
               boundary_geojson, total_voters)

-- Rankings
rankings (id, member_id, constituency_id, score, rank, period, computed_at)

-- Party Hierarchy
party_positions (id, party_id, member_id, position, level, region_id)
```

---

## ⚖️ Legal Considerations (Pakistan)

### ECP (Election Commission of Pakistan) Rules
- Political parties must maintain **membership records** (Political Parties Order 2002)
- Intra-party elections are **mandatory** (Article 17, Constitution)
- ECP can audit party membership rolls
- Digital membership is **not explicitly prohibited** but CNIC verification adds legitimacy

### Data Protection
- Pakistan's **Personal Data Protection Bill** (pending) — design for compliance
- CNIC data is sensitive — encrypt at rest, limit access
- NADRA integration would need government approval

### Political Parties Act Compliance
- Party constitution must define candidate selection process
- Referral-based selection is novel — may need ECP consultation
- Transparency in ranking = defensible position

---

## 🤖 AI Agent Integration (Siyasat ↔ App)

### Connection Architecture
```
App Backend (API) ←→ Webhook/Polling ←→ Siyasat Agent (OpenClaw)
                                              ↓
                                    WhatsApp Reports → Party Owner
```

### Agent Capabilities
1. **Scheduled Reports:** Daily membership summary, weekly deep dives
2. **Alert System:** Unusual activity, ranking shake-ups, fraud signals
3. **Query Interface:** Owner asks "How's Lahore doing?" → agent queries API → responds
4. **Recommendation Engine:** "These 5 constituencies need more recruitment"

### API Endpoints (Agent Needs)
- `GET /api/stats/summary` — overall numbers
- `GET /api/members?constituency=NA-120` — constituency members
- `GET /api/rankings?constituency=NA-120&top=10` — leaderboard
- `GET /api/referrals/chain/:memberId` — referral tree
- `GET /api/alerts` — anomalies and flags
- `GET /api/growth?period=7d` — growth trends

---

## 🚀 MVP Scope (Phase 1)

1. ✅ Member registration (phone + CNIC)
2. ✅ Single party support (expand later)
3. ✅ Referral system (3 levels)
4. ✅ Constituency-based leaderboard
5. ✅ Basic admin dashboard
6. ✅ Siyasat agent with daily WhatsApp reports
7. ❌ Multi-party support (Phase 2)
8. ❌ ECP integration (Phase 3)
9. ❌ Voting/polling features (Phase 3)

---

*Research compiled: Feb 16, 2026*
*Agent: Nexus ⚡*
