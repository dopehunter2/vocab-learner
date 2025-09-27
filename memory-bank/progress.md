# Progress: FSRS Vocabulary Learning App

## 1. What Works
- **Core Setup:** React Native with Expo, TypeScript, Dark Theme applied globally.
- **AI Integration (`ai.ts`):** Gemini API lookup (`getWordInfo`, `getSpellingSuggestions`) provides translations and examples. The service is now stable using the `gemini-2.0-flash` model. Parser handles responses.
- **Pronunciation Service (`pronunciationService.ts`):** `expo-speech` integration for TTS.
- **Word Addition (`AddWordScreen.tsx`):**
    - Dark theme applied. UI allows word input, displays AI results (translations as chips, general examples).
    - TTS for original word implemented.
    - Users can select translations.
    - Save functionality saves each selected pair as an individual SRS item.
- **Database (`database.ts`):** SQLite setup for FSRS fields. CRUD operations exist.
- **SRS Logic (`srs.ts`):** `ts-fsrs` integration. Functions for initial state and review processing.
- **Review UI (`ReviewScreen.tsx`):**
    - Dark theme applied. Screen displays due cards, allows typed answers, randomized review direction (Eng-Rus/Rus-Eng), and recall rating.
    - TTS for displayed word implemented.
    - AI example fetching for current word.
- **Vocabulary List (`AllWordsScreen.tsx`):**
    - Dark theme applied. Displays all items, delete functionality, and FSRS study progress (status text and percentage).
- **Navigation (`App.tsx`):** Tab navigation connects screens, dark theme applied.
- **Build Process:** Successful Android `.apk` builds using EAS.

## 2. What's Left to Build / Refine
- **End-to-End SRS Testing (High Priority):** Thoroughly test the complete add-review cycle.
- **TTS Feature Refinements (Phase 3):**
    - Implement error handling for TTS (e.g., language not supported, speech engine errors) in `pronunciationService.ts` and calling components.
    - Provide UI feedback while speech is initializing or playing (e.g., icon change, subtle loading indicator) on `AddWordScreen` and `ReviewScreen`.
    - Consider adding TTS pronunciation to `AllWordsScreen.tsx` for each listed word.
- **`ReviewScreen` - Example Display:** Evaluate if current AI example button is sufficient or if examples saved with the item should be more directly accessible.
- **Database Robustness:** Review and test database functions for edge cases and performance.
- **Error Handling:** General improvement for AI calls, database ops, and TTS, with clear user feedback.
- **UI/UX Polish:** Minor consistency and aesthetic improvements.
- **Future Feature - Notifications:**
    - Implement local notifications using `expo-notifications` to remind users when reviews are due.
    - The logic will schedule a single notification for the next upcoming due card and will be recalculated after each review session.
- **Future Feature - App Update Strategy:**
    - Develop a database migration system to handle changes to the SQLite schema between app versions.
    - This will involve versioning the database (`PRAGMA user_version`) and creating migration scripts to prevent data loss during updates.

## 3. Current Status
- **Goal Reaffirmed:** Project is an FSRS vocabulary learning tool with AI and TTS support.
- **Core Components Stabilized:** Key screens are functional, and major bugs related to API connectivity and state management have been resolved.
- **Next Step:** Build a new version for end-to-end testing and then focus on TTS refinements and general polish.

## 4. Known Issues / Areas for Improvement
- **TTS Refinements:** Phase 3 (error handling, UI feedback) is pending.
- **Version Tagging:** The current stable build (as of YYYY-MM-DD HH:MM, corresponding to recent commits) has been locally tagged in Git for potential rollback.
- **Comprehensive Testing Needed:** Now that major bugs are fixed, the full add-review-reschedule SRS cycle needs to be thoroughly tested.