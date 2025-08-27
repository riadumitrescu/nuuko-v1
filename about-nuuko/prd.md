# product requirements document – nuuko (web prototype)

---

## 1. introduction & context

nuuko is an emotion-centered journaling app for gen z.  
it provides a **cozy, storybook-like space** for people to express feelings, notice patterns, and grow self-awareness over time.  

most journaling apps focus on productivity, analytics, or “streak hacking.” nuuko’s focus is different: **warmth, emotional growth, and safe self-expression**.  

---

## 2. the problem

the biggest problem is not just account creation — it’s that:  

- **users sign up but never actually journal.**  
  sign-up friction and a lack of immediate value lead to drop-off.  

- **journaling feels like work.**  
  many apps frame it as logging data or completing tasks, not reflecting.  

- **insights come too late or feel too analytical.**  
  people don’t feel rewarded soon enough. “analytics dashboards” can feel cold.  

- **tone mismatch.**  
  productivity-style apps (e.g., notion, daylio) feel too structured. therapy-style apps can feel clinical. users want something cozy, non-judgmental, personal.  

---

## 3. purpose

nuuko’s prototype should prove that:  

1. users will **journal before creating an account** if given the chance.  
2. immediate **value after journaling** (reflection + preview insights) motivates them to continue.  
3. a cozy aesthetic, gentle copy, and character presence make journaling feel safe and inviting.  
4. gen z responds better to **patterns & storytelling (wrapped, previews, metaphors)** than to raw analytics.  

---

## 4. goals

- reduce drop-off by letting users start journaling instantly (local-first).  
- deliver **instant feedback** after the first entry (reflection + teaser insights).  
- encourage consistency with streaks and monthly reflections, framed positively.  
- position nuuko as a **warm alternative** to cold productivity trackers.  
- test whether cozy design + companion character increases retention.  

---

## 5. target users

- **primary:** gen z (18–25), introspective, aesthetic-driven, digital natives.  
- want safe emotional spaces, not productivity dashboards.  
- often try journaling apps but drop them quickly.  

---

## 6. user stories

- *as a new visitor*, i want to write without signing up so i can try nuuko easily.  
- *as a first-time journaler*, i want a gentle reflection so i feel rewarded.  
- *as a returning user in local mode*, i want to see my recent entries so i can continue without pressure.  
- *as a curious user*, i want a preview of insights so i know why creating an account is valuable.  
- *as a consistent user*, i want streaks and monthly summaries to celebrate my progress.  
- *as a privacy-conscious user*, i want my notes stored locally unless i choose otherwise.  

---

## 7. functional requirements (mvp web prototype)

### journaling (local-first)
1. users can write an entry without creating an account.  
2. entries saved locally (indexeddb).  
3. retention policy → keep only last N entries (default: 30).  

### first reflection
4. after first entry, show a short supportive message.  
   - gemini api if available  
   - fallback heuristic otherwise  

### insights preview
5. homepage shows preview cards:  
   - streak counter  
   - mood mix  
   - word count trend  
6. insights marked as “preview” with lock overlay for full version.  

### onboarding
7. onboarding carousel (3 slides):  
   - private by default  
   - start writing first  
   - unlock insights later  

### settings (local mode)
8. retention options (e.g., last 15/30/100 entries).  
9. export entries (json).  
10. clear all entries.  

### account creation (future stage)
11. not in mvp → stub only for now.  

---

## 8. non-goals
- no cloud sync in mvp.  
- no wrapped monthly summaries yet (future stage).  
- no mobile app build in this phase.  
- no advanced ai insights (beyond first reflection).  
- no gamified competition.  

---

## 9. design principles (from design system)

- **colors**: muted natural tones (cream, clay, green, espresso, stone).  
- **fonts**: inter (ui, body), crimson pro (headlines, storybook).  
- **aesthetic**: cozy, safe, storybook vibe (not corporate).  
- **components**: rounded cards, soft shadows, pill buttons, cream inputs.  
- **illustrations**: lamps, bookshelves, paper, subtle plants.  
- **character**: feather as gentle guide, with emotional states.  

---

## 10. assets & character system

### feather character
- nuuko’s companion, like duolingo owl but softer.  
- emotional variants (calm, happy, thoughtful, celebrating).  
- appears at key touchpoints: onboarding, first journaling, streaks, wrapped.  
- supportive tone: encourages without pressure.  

### icons
- minimal line-based, espresso/stone default, accent highlight when needed.  
- used for navigation, streak markers, locked insights.  

### illustrations
- decorative, cozy, contextual (lamps, shelves, papers).  
- used in onboarding, empty states, or section dividers.  

---

## 11. site structure

### homepage
- hero + “start journaling”  
- onboarding carousel  
- quick composer (inline journaling field)  
- first reflection (after first save)  
- recent entries (local)  
- insights preview cards  
- cta → “create account to unlock full insights & save your story”  

### journal page
- full editor, mood/tags, save  

### insights preview
- streak / mood mix / word count  
- locked overlay with cta  

### settings
- retention controls  
- export  
- clear all  

### secondary
- login/create account (stub)  
- 404 with cozy illustration  

---

## 12. copy & voice (from copy guide)

- lowercase, warm, human.  
- friendly, simple → “nice start”, “today’s a fresh page”.  
- supportive, never judgmental.  
- metaphors from books, plants, light.  
- paired with subtle illustrations/icons, not emojis.  

---

## 13. success metrics

- **engagement**: % of visitors who write at least one entry.  
- **retention**: % of users who return to journal within 7 days.  
- **conversion**: % of users who explore insights preview → sign up later.  
- **qualitative**: users describe nuuko as cozy, warm, safe.  

---

## 14. open questions

- how many entries should local mode keep by default (count vs days)?  
- should feather character be always visible or only at key milestones?  
- should streaks reset after gaps, or show “pause then resume” to reduce guilt?  
- should onboarding be mandatory or skippable?  
- how do we balance wrapped as playful + reflective without being superficial?  
