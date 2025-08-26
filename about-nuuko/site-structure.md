# Nuuko Web Prototype – Site Structure

This document outlines the structure and user flows of the Nuuko web prototype.  
It reflects the product goal: **encourage journaling before account creation**,  
deliver immediate value (reflections + insights preview), and nudge toward sign-up later.

---

## 1. Top-Level Pages (MVP)

### Homepage
- Hero: Nuuko identity + “Start journaling” CTA  
- Onboarding carousel (3 slides: Private, Start Writing First, Unlock Insights Later)  
- Quick Composer: inline journaling field, mood picker, Save button  
- First Reflection: appears after first entry is saved  
- Recent Entries: limited list (local mode only)  
- Insights Preview: streak, mood mix, word trend (marked “Preview”)  
- CTA: “Create Account to unlock full insights & save your story”  

### Journal Page (`/write`)
- Full journaling editor (larger text area, optional mood/tags)  
- Save entry → toast confirmation  
- Retention rules applied (only last N entries kept)  

### Insights (Preview) (`/insights`)
- Teaser cards:
  - Streak counter  
  - Mood distribution chart  
  - Word count trend  
- Lock overlay + CTA: “Sign up to see full insights”  

### Settings (`/settings`)
- Manage retention (e.g., last 30 entries, last 90 days)  
- Export entries as JSON  
- Clear all data  
- Local Mode notice: “Entries live only on this device”  

---

## 2. Secondary Pages
- **Login / Create Account** (stub only, future stage)  
- **404 Page** → Cozy illustration + “Back to journaling”  

---

## 3. Navigation
- **Header (desktop):** Logo · Journal · Insights Preview · Create Account  
- **Footer (mobile):** 3–4 icons (Home · Journal · Insights · Settings)  
- **Banner:** Local Mode message (“Your entries are stored on this device only”)  

---

## 4. User Flows

### First-Time User
1. Arrives on **Homepage** → onboarding carousel  
2. Clicks “Start journaling” → Quick Composer  
3. Writes first entry → reflection shown  
4. Homepage updates with Recent Entries + Insights Preview  
5. CTA prompts: “Create an account to save all entries & unlock full insights”  

### Returning User (Local Mode)
1. Opens Homepage  
2. Banner: “Local Mode – entries saved on this device only”  
3. Can add another entry, browse recent ones, see preview insights  

### Conversion Path
1. User taps Insights Preview  
2. Overlay explains what full insights include  
3. CTA → “Create Account” (stubbed in MVP)  

---

## 5. Content Tone
- **Headlines (Crimson Pro):** Storybook, warm (“Your story begins here”)  
- **Body (Inter):** Friendly, direct (“Write your first note today”)  
- **Microcopy:** Encouraging (“Nice start 🌱”, “Keep going — 3 days in a row”)  

---

## 6. Visual Anchors
- **Hero:** Feather or sparkle icon + cozy tagline  
- **Composer:** Cream card, paper-like look  
- **Insights Preview:** Rounded cards with small illustrations (books, sprouts, sparkles)  
- **Settings:** Minimal, muted, utilitarian  

---

## 7. Key Principles
- Journaling-first onboarding (solves sign-up drop-off problem)  
- Immediate value: reflection + insights preview shown without account  
- Clear upgrade path: gentle sign-up CTA, no pressure  
- Consistent vibe: storybook, cozy, safe, emotional
