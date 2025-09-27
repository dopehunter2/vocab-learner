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
- **Notification System:** A local notification system (`expo-notifications`) is in place. It requests permissions and schedules a single notification for the next due card, which is recalculated after every user action.
- **Database Migration System:** A version-aware migration engine is implemented in `database.ts`. This ensures user data is preserved safely across future app updates.

## 2. What's Left to Build / Refine
- **End-to-End SRS Testing (High Priority):** Thoroughly test the complete add-review cycle.
- **Error Handling:** General improvement for AI calls, database ops, and TTS, with clear user feedback.
- **UI/UX Polish:** Minor consistency and aesthetic improvements.
- **Test Notifications with Development Build:** The notification system cannot be fully tested in Expo Go. The next step is to create a development build to verify notification functionality.
- **TTS Feature Refinements (Phase 3):**
    - Implement error handling for TTS.
    - Provide UI feedback during speech.
    - Add TTS to `AllWordsScreen`.
- **UI/UX Polish:** General improvements.

## 3. Current Status
- **Feature Complete (Core):** The application now has a complete set of core features: SRS logic, AI word lookup, TTS, notifications, and a robust data migration system.
- **Next Step:** Create a development build to test notifications, then conduct full end-to-end testing of all features.

## 4. Known Issues / Areas for Improvement
- **Expo Go Limitations:** Notifications cannot be tested in the standard Expo Go client and require a development build.
- **TTS Refinements:** Phase 3 (error handling, UI feedback) is pending.
- **Comprehensive Testing Needed:** The full SRS cycle and new features need thorough testing.