# tasks

## completed tasks

- [x] 1.0 repo & tooling scaffold
  - [x] init vite + react + typescript + tailwind, eslint/prettier, simple CI

- [x] 2.0 configure design system
  - [x] tailwind theme (colors/fonts/tokens), global css, base components

- [x] 3.0 data model & local-first storage
  - [x] define `Entry`/`LocalSettings`, indexeddb (localforage), retention policy

## MAJOR REDESIGN - mobile-first storybook aesthetic

### PHASE 1: VISUAL FOUNDATION ✅
- [x] 5.0 complete design system overhaul
  - [x] 5.1 implement warm earthy color palette (creams, browns, muted greens)
  - [x] 5.2 add organic shapes, soft shadows, rounded corners everywhere
  - [x] 5.3 mobile-first responsive grid system
  - [x] 5.4 typography hierarchy with better spacing and readability

### PHASE 2: KILL CORPORATE LAYOUT & ADD CHARACTER ✅
- [x] 6.0 mobile-first transformation
  - [x] 6.1 remove corporate header/nav, create mobile layout wrapper
  - [x] 6.2 add feather character component with emotional states
  - [x] 6.3 create bottom tab navigation (books/feather/sparkles)
  - [x] 6.4 implement mobile-first page structure

### PHASE 3: HOMEPAGE LIKE THE APP ✅
- [x] 7.0 storybook homepage redesign
  - [x] 7.1 "Hi Alex!" greeting with feather character
  - [x] 7.2 daily prompt card with "What surprised you today?"
  - [x] 7.3 "Your Library" with colorful book spines
  - [x] 7.4 "Monthly Map" calendar heatmap
  - [x] 7.5 remove all old corporate homepage content

### PHASE 4: JOURNAL PAGE LIKE THE APP ✅
- [x] 8.0 journal page mobile redesign
  - [x] 8.1 "Today's Entry" header with date
  - [x] 8.2 daily prompt at top with feather character
  - [x] 8.3 mood spectrum gradient slider (not buttons)
  - [x] 8.4 large writing area with voice microphone
  - [x] 8.5 mobile-optimized save flow

### PHASE 5: RICH ENTRY READING EXPERIENCE  
- [ ] 9.0 entry view redesign
  - [ ] 9.1 full-screen entry reading with beautiful typography
  - [ ] 9.2 prompt display at top with character
  - [ ] 9.3 tag display as natural pills
  - [ ] 9.4 entry metadata (date, word count) elegantly integrated

### PHASE 6: INSIGHTS AS STORYTELLING
- [ ] 10.0 insights page redesign
  - [ ] 10.1 word count with encouraging copy ("basically, a short novel")
  - [ ] 10.2 streak visualization with mood wave chart
  - [ ] 10.3 timeline view showing entries as open book pages
  - [ ] 10.4 library shelf view showing entries as books
  - [ ] 10.5 remove analytical dashboard feel

### PHASE 7: VOICE & MICRO-INTERACTIONS
- [ ] 11.0 voice integration
  - [ ] 11.1 voice-to-text for journal entries
  - [ ] 11.2 microphone UI with recording states
  - [ ] 11.3 voice prompts and character responses

### PHASE 8: STORYBOOK NAVIGATION
- [ ] 12.0 navigation redesign
  - [ ] 12.1 bottom tab bar with book/feather/sparkle icons
  - [ ] 12.2 remove corporate header/footer
  - [ ] 12.3 page transitions that feel like turning pages
  - [ ] 12.4 contextual back navigation

### PHASE 9: POLISH & MAGIC
- [ ] 13.0 micro-interactions & animations
  - [ ] 13.1 character animations for different states
  - [ ] 13.2 page transition animations
  - [ ] 13.3 writing feedback and save celebrations
  - [ ] 13.4 mood spectrum interactions

### PHASE 10: TECHNICAL EXCELLENCE
- [ ] 14.0 mobile optimization
  - [ ] 14.1 touch-first interactions
  - [ ] 14.2 proper mobile keyboard handling
  - [ ] 14.3 offline-first with elegant loading states
  - [ ] 14.4 performance optimization for mobile

## DEPRECATED (old corporate design)
- [x] 4.0 app shell, routing, navigation (NEEDS COMPLETE REDESIGN)
- old homepage/journal/insights pages (NEEDS COMPLETE REDESIGN)

---

## relevant files

### completed (tasks 1-3)
- `web/package.json` – project dependencies and scripts
- `web/tailwind.config.js` – design system colors, fonts, components
- `web/postcss.config.js` – tailwind postcss configuration
- `web/src/index.css` – global styles and component classes per design system
- `web/src/types/index.ts` – typescript interfaces for Entry, Settings, Insights, AppState
- `web/src/lib/storage.ts` – indexeddb storage services with localforage
- `web/src/hooks/useStorage.ts` – react hooks for data management
- `web/src/lib/utils.ts` – utility functions for dates, moods, formatting
- `web/src/__tests__/storage.test.ts` – jest tests for storage layer
- `web/.eslintrc.cjs` – eslint configuration
- `web/.prettierrc` – prettier configuration
- `web/jest.config.js` – jest testing configuration
- `web/.github/workflows/ci.yml` – github actions ci pipeline

### completed (task 4)
- `web/src/App.tsx` – router configuration with all main routes
- `web/src/components/Layout.tsx` – main app layout with header/footer structure
- `web/src/components/Navigation.tsx` – responsive navigation with mobile menu
- `web/src/components/LocalModeBanner.tsx` – dismissible offline mode notice
- `web/src/pages/HomePage.tsx` – hero, onboarding, recent entries, insights preview
- `web/src/pages/JournalPage.tsx` – full editor with mood picker and tags
- `web/src/pages/InsightsPage.tsx` – streak/mood/word count charts with lock overlay
- `web/src/pages/SettingsPage.tsx` – retention controls, export, clear data
- `web/src/pages/NotFoundPage.tsx` – cozy 404 page with helpful navigation

### to be created (task 5+)
- first reflection service components
- onboarding carousel improvements
- gemini api integration
