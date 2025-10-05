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

## Backlog & Implementation Plan

This section provides a detailed, sequenced plan for the implementation of new features. The plan is organized into phases (Epics) to manage dependencies, mitigate risks, and deliver value iteratively.

### Phase 1: Foundational AI & UI Enhancements (The "Bilingual Context" Epic)

*   **Tech Lead's Rationale:** This phase is foundational. The new bilingual example feature is a core dependency for both the `AddWordScreen` and the new `WordDetailModal`. Building the AI service first unlocks the other two UI tasks. This approach provides immediate, high-impact user value with relatively low architectural risk.
*   **Stories in this Phase:**
    *   **1.1: Enhanced AI-Powered Bilingual Examples:** Develop the core AI service function to generate high-quality, directly translated sentence pairs.
    *   **1.2: Comprehensive Word Detail View:** Create a modal view, accessible from the vocabulary list, that consumes the new AI service to display word details, translations, bilingual examples, and a TTS button.
    *   **1.3: Improved Word Addition Flow:** Refactor the `AddWordScreen` to use the new bilingual example functionality, improving the core word lookup experience.

### Phase 2: Vocabulary Management (The "Control & Portability" Epic)

*   **Tech Lead's Rationale:** These features are largely self-contained and build upon the existing vocabulary list. They don't have major dependencies on the review logic but are essential for long-term usability and data security. We will also introduce a minor, non-disruptive schema change (`sourceLanguage`) to support sorting.
*   **Stories in this Phase:**
    *   **2.1: Advanced Vocabulary Sorting:** Implement UI controls and logic on the `AllWordsScreen` for alphabetical sorting. Requires adding a `sourceLanguage` field to the database.
    *   **2.2: Secure Data Export:** Create a service to export all vocabulary and FSRS data to a shareable JSON file. This requires integrating with `expo-sharing`.
    *   **2.3: Flexible Data Import:** Create a service to import a JSON file, parse the data, and add it to the local database. This requires integrating with `expo-document-picker` and building a UI flow for handling duplicates.

### Phase 3: Core Review Logic Overhaul (The "Dynamic Learning" Epic)

*   **Tech Lead's Rationale:** This is the most complex phase as it fundamentally alters the core review experience and data flow. It is scheduled last because it depends on a completely stable data model and could be disruptive to implement. By tackling this last, we ensure all underlying components are solid, minimizing the risk of cascading failures.
*   **Stories in this Phase:**
    *   **3.1: Randomized Review Direction:** Overhaul the state management and logic on the `ReviewScreen` to randomly select the prompt (either the `frontWord` or one of the `translations`) and evaluate the answer accordingly.
    *   **3.2: Immediate Answer Feedback:** A straightforward but important UI enhancement on the `ReviewScreen` to always display the correct answer(s) after a user's attempt.