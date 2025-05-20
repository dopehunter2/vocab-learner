# Progress: FSRS Vocabulary Learning App

## 1. What Works
- **Core Setup:** React Native with Expo, TypeScript, Dark Theme applied globally.
- **AI Integration (`ai.ts`):** Gemini API lookup (`getWordInfo`, `getSpellingSuggestions`) provides translations, examples. Parser handles responses.
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
- **Zustand Store (`useVocabularyStore.ts`):** Review for efficiency in fetching due cards and state updates.

## 3. Current Status
- **Goal Reaffirmed:** Project is an FSRS vocabulary learning tool with AI and TTS support.
- **Core Components Enhanced:** Key screens have a dark theme, improved functionality (typed answers, random direction, progress display), and initial TTS integration.
- **Next Step:** Focus on rigorous testing of the core SRS learning loop, TTS refinements, and overall polish.

## 4. Known Issues / Areas for Improvement
- **Limited Extensive Testing:** The full SRS cycle with all new features needs more comprehensive testing.
- **TTS Refinements:** Phase 3 (error handling, UI feedback) is pending.
- **Version Tagging:** The current stable build (as of YYYY-MM-DD HH:MM, corresponding to recent commits) has been locally tagged in Git for potential rollback.