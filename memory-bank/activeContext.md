# Active Context: FSRS Vocabulary Learning App

## 1. Current Focus
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
    - Implemented display of examples specific to *selected* translations.
- **UI Overhaul:** Implemented a stylish dark theme across `App.tsx`, `AddWordScreen.tsx`, `ReviewScreen.tsx`, and `AllWordsScreen.tsx`.
- **Text-to-Speech (TTS) Integration (Phases 1 & 2 Complete):**
    - Installed `expo-speech`.
    - Created `src/services/pronunciationService.ts`.
    - Added pronunciation for the original word on `AddWordScreen.tsx`.
    - Added pronunciation for the displayed word on `ReviewScreen.tsx`.
- **Successful APK builds** for testing on Android.

## 3. Next Steps (Realigned with SRS Goal & TTS Integration)
- **Thoroughly Test Core SRS Loop:**
    - Add several words with multiple selected translations via `AddWordScreen`.
    - Go through multiple review cycles on `ReviewScreen`, testing all rating options (Again, Hard, Good, Easy).
    - Verify that FSRS scheduling behaves as expected (items appear for review at correct intervals).
    - Check `AllWordsScreen` to see all items and their current progress/status.
- **TTS Feature Refinements (Phase 3):**
    - Implement error handling for TTS (e.g., language not supported, speech engine errors).
    - Provide UI feedback while speech is initializing or playing (e.g., icon change, subtle loading indicator).
    - Consider adding TTS pronunciation to `AllWordsScreen.tsx` for each listed word.
- **Refine Example Display on `ReviewScreen`:** (Still relevant)
    - When a card is due on `ReviewScreen`, consider if/how to display example sentences. (AI example button already exists, this might refer to examples saved with the item).
- **Review Data Model for `VocabularyItem`:** Ensure all fields are correctly handled.
- **UI Polish & UX Enhancements:** Continue minor adjustments for clarity and ease of use across all screens.
- **Error Handling:** Improve robustness of error handling for AI calls, database operations, and TTS, providing clear user feedback.

## 4. Active Decisions / Considerations
- **Core Functionality IS FSRS-based vocabulary learning.** AI lookup and TTS are supporting features.
- **Data Model:** Each word-translation pair is an independent `VocabularyItem` in the database, each with its own FSRS state.
- **Key Technologies:** React Native, Expo, TypeScript, `expo-sqlite`, `ts-fsrs`, `Zustand`, Google Gemini API, `expo-speech`.
- **Current UI State:** Dark theme applied. Core screens (`AddWordScreen`, `ReviewScreen`, `AllWordsScreen`) are functional with SRS and initial TTS integration.

*(Sections related to a dictionary-only pivot have been removed or corrected.)* 