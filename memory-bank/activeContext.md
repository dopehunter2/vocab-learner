# Active Context: FSRS Vocabulary Learning App

## 1. Current Focus
- **Fixing State Management Bug:** The highest priority is to resolve the bug where newly added words are saved to the database but do not appear in the UI. This involves refactoring the word addition logic to correctly update the Zustand store.
- **Reaffirming Core Goal:** Ensuring the application functions as an FSRS-based vocabulary learning tool, with AI assistance for adding new words and TTS pronunciation.
- **Refining the Word Addition Flow (`AddWordScreen.tsx`):** Includes AI lookup, translation selection, example display (general and for selected translations), and TTS for the original word.
- **Ensuring Review Cycle Integrity (`ReviewScreen.tsx`):** Includes review of due items, user rating, FSRS state updates, and TTS for the displayed word.
- **Testing and Refining TTS Feature:** Ensuring pronunciation works correctly across screens and considering further enhancements.
- **Overall UI/UX Polish and Robustness:** Improving the look, feel, and error handling of the application.

## 2. Recent Changes (Corrective Actions & Recent Progress)
- **Corrected Misinterpretation:** Realigned project focus back to FSRS learning.
- **Memory Bank Update:** Updated memory bank files to reflect SRS learning goal and recent feature additions.
- **AI Service (`ai.ts`) Updates:** Refined prompts and parsing for cleaner data.
- **UI (`AddWordScreen.tsx`) Updates:**
    - Translations displayed as wrapped chips.
- **UI Overhaul:** Implemented a stylish dark theme across `App.tsx`, `AddWordScreen.tsx`, `ReviewScreen.tsx`, and `AllWordsScreen.tsx`.
- **Text-to-Speech (TTS) Integration (Phases 1 & 2 Complete):**
    - Installed `expo-speech`.
    - Created `src/services/pronunciationService.ts`.
    - Added pronunciation for the original word on `AddWordScreen.tsx`.
    - Added pronunciation for the displayed word on `ReviewScreen.tsx`.
- **Resolved Gemini API Errors:** Fixed persistent `404` errors by identifying the correct, non-standard model name (`gemini-2.0-flash`) from Google Cloud Console logs.
- **Resolved State Management Bug:** Corrected the logic for adding/updating words so that the UI now updates instantly without needing an app restart. The `AddWordScreen` now correctly uses the Zustand store's actions.
- **Successful APK builds** for testing on Android.

## 3. Next Steps (Realigned with SRS Goal & TTS Integration)
- **Build and Test Stable Version:** Now that the major API and state management bugs are resolved, the next step is to create a new, stable `.apk` build for thorough end-to-end testing.
- **TTS Feature Refinements (Phase 3):**
    - Implement error handling for TTS (e.g., language not supported, speech engine errors).
    - Provide UI feedback while speech is initializing or playing (e.g., icon change, subtle loading indicator).
    - Consider adding TTS pronunciation to `AllWordsScreen.tsx` for each listed word.
- **Refine Example Display on `ReviewScreen`:** (Still relevant)
    - When a card is due on `ReviewScreen`, consider if/how to display example sentences. (AI example button already exists, this might refer to examples saved with the item).
- **UI Polish & UX Enhancements:** Continue minor adjustments for clarity and ease of use across all screens.
- **Error Handling:** Improve robustness of error handling for AI calls, database operations, and TTS, providing clear user feedback.

## 4. Known Issues
*(No critical bugs are currently known. The focus is now on testing and refinement.)*

## 5. Active Decisions / Considerations
- **Core Functionality IS FSRS-based vocabulary learning.** AI lookup and TTS are supporting features.
- **Data Model:** Each word-translation pair is an independent `VocabularyItem` in the database, each with its own FSRS state.
- **Key Technologies:** React Native, Expo, TypeScript, `expo-sqlite`, `ts-fsrs`, `Zustand`, Google Gemini API, `expo-speech`.
- **Current UI State:** Dark theme applied. Core screens (`AddWordScreen`, `ReviewScreen`, `AllWordsScreen`) are functional with SRS and initial TTS integration.

*(Sections related to a dictionary-only pivot have been removed or corrected.)* 