# PartyApp — TODO

*Updated 2026-02-22*

---

## 🔴 Priority Features (Pending — Boss Approved)

### 1. Facebook-Style Social System
- Member profiles with personal timelines
- Post movement activities, photos, videos, written updates
- Friend requests (send/accept/reject)
- Friend suggestions (by location, interests, profession)
- Likes, shares, comments on posts
- Media storage (Cloudinary or S3 — base64 won't scale)
- Content moderation tools
- **Est:** 2-3 weeks

### 2. Social Media Account Linking + Hashtag Tracking
- Link Facebook/Twitter/Instagram/TikTok handles to member profile
- Track specific movement hashtags (#PakistanAwaamRaaj etc.)
- Points awarded based on verified online activity
- Options: X API ($100/mo), Meta Graph API (needs app review), or screenshot+AI verification
- **Est:** 1-2 weeks

### 3. Campaign Activity Logging + Verification
- "Start Campaign Session" (camp or door-to-door) in-app
- GPS location tracking, start/end time, photo uploads
- Verification: geotags, EXIF metadata, AI photo analysis
- Auto-award points based on duration × activities × coverage
- Admin review dashboard for flagged submissions
- **Est:** 1-2 weeks

### 4. WhatsApp Chatbot (Conversational)
- Members text the bot → get info, register, check status
- Separate from existing announcement pipeline
- Build on OpenClaw WhatsApp gateway
- Clarify: what was the "rewrite in new language" discussion?
- **Est:** 1 week

### 5. PWA → Native App (React Native)
- Convert web app to native Android/iOS
- Google Play ($25 one-time) + Apple App Store ($99/yr)
- No PTA approval needed to launch
- Privacy policy + ToS required
- **Est:** 2-3 weeks

---

## 🟡 Existing TODOs

- [ ] Run `backfill_tehsils.py` — first 1,500 Neon members missing tehsil_id
- [ ] File uploads — proper storage (not base64 in DB)
- [ ] PWA basics — service worker, offline, push notifications, install prompt
- [ ] Member task actions — accept/start/submit/complete flow with evidence
- [ ] Email notifications

---

## ✅ Completed
- Full CRUD (members, districts, tehsils, announcements, projects, tasks)
- 15 pages (6 member + 5 admin + landing/login/register)
- District/Tehsil hierarchy, rankings per district
- Referral system with QR + WhatsApp share
- Announcements → WhatsApp delivery via Nexus
- DroidClaw bridge for Android automation (end-to-end proven)
- 2,003 members imported, i18n (EN + UR)
- Deployed: https://partyapp-jet.vercel.app
