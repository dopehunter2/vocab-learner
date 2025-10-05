# Product Context: FSRS Vocabulary Learning Tool

## 1. Problem Solved
Learning vocabulary, especially for languages like English and Russian, requires consistent review to combat forgetting. Traditional flashcard methods can be inefficient. This application aims to optimize learning using the FSRS algorithm for spaced repetition, minimizing review time while maximizing retention. It also addresses the challenge of adding new words efficiently by using AI to provide rich translation options and contextual examples.

## 2. Target User
Individuals actively learning English or Russian vocabulary who want an efficient, algorithm-driven method for memorization and a streamlined way to add new words with helpful context (translations, examples) powered by AI.

## 3. Core Functionality: SRS Learning Cycle + AI Word Addition
- **Adding Words:**
    - User inputs a word via `AddWordScreen`.
    - App queries Google Gemini AI (`ai.ts`) for translations and examples.
    - User can listen to the pronunciation of the looked-up word.
    - User selects desired translation(s).
    - Each selected word-translation pair is saved to the database (`expo-sqlite`) with initial FSRS state (`srs.ts`).
- **Reviewing Words:**
    - `ReviewScreen` displays vocabulary items due for review based on FSRS scheduling.
    - User can listen to the pronunciation of the word being reviewed.
    - User rates recall (Again, Hard, Good, Easy).
    - App updates the item's FSRS state in the database using `srs.ts` and `database.ts`.
- **Viewing Progress:**
    - `AllWordsScreen` allows users to see their entire vocabulary list.

## 4. User Experience Goals
- Efficient and effective vocabulary memorization through FSRS.
- Simple, intuitive interface for reviewing due cards, including auditory pronunciation.
- Seamless process for looking up and adding new words using AI assistance, including auditory pronunciation.
- Clear presentation of AI-provided translations and examples during word addition.
- Minimal friction in the core learning loop (review -> rate -> update). 

## Upcoming Features & User Stories

This section outlines the backlog of features, detailed as user stories with specific acceptance criteria, to guide the next phases of development.

### EPIC 1: Bilingual Context & Word Details

*   **User Story 1.1: Enhanced AI-Powered Bilingual Examples**
    *   **As a user**, I want to receive a high-quality, directly translated bilingual example sentence when I look up a word, **so that** I can understand its usage in a natural and accurate context.
    *   **Acceptance Criteria:**
        *   A new function, `getBilingualExample`, is created in the `ai.ts` service.
        *   The function takes a source word (e.g., "resilience") and a target translation (e.g., "устойчивость") as input.
        *   It prompts the Gemini API to generate one English sentence and its direct, corresponding Russian translation.
        *   The API response is reliably parsed into a structured object: `{ englishSentence: string, russianSentence: string }`.
        *   The function includes robust error handling for API failures or malformed responses.

*   **User Story 1.2: Comprehensive Word Detail View**
    *   **As a user**, I want to tap on any word in my vocabulary list and see a detailed view, **so that** I can review all its information and hear its pronunciation in one place.
    *   **Acceptance Criteria:**
        *   Tapping an item in the `AllWordsScreen` list opens a modal view.
        *   The modal prominently displays the main word (`frontWord`).
        *   It lists all accepted translations for that word.
        *   Below each translation, it displays the corresponding bilingual example sentence (fetched via the new AI service).
        *   A "speaker" icon (TTS button) is present. Tapping it pronounces the main word.
        *   The modal can be closed to return to the vocabulary list.

*   **User Story 1.3: Improved Word Addition Flow**
    *   **As a user**, I want to preview bilingual examples on the `AddWordScreen` before saving a new word, **so that** I can make a more informed decision about which translations are most relevant.
    *   **Acceptance Criteria:**
        *   On the `AddWordScreen`, a long-press gesture on a translation chip triggers the `getBilingualExample` function.
        *   The resulting bilingual sentence pair is displayed in a temporary view (e.g., a small modal or an alert).
        *   The old "Get Example" button and its associated logic are completely removed from the UI and codebase.

### EPIC 2: Control & Portability

*   **User Story 2.1: Advanced Vocabulary Sorting**
    *   **As a user**, I want to sort my vocabulary list alphabetically by both English and Russian, **so that** I can find specific words quickly and efficiently.
    *   **Acceptance Criteria:**
        *   The `AllWordsScreen` features new UI controls (e.g., a dropdown menu).
        *   Available sorting options are: "English (A-Z)", "English (Z-A)", "Russian (А-Я)", and "Russian (Я-А)".
        *   Selecting an option correctly re-orders and re-renders the list.
        *   The sorting logic properly handles both Cyrillic and Latin character sets.
        *   The database schema is updated to store the source language of the `frontWord` to facilitate this.

*   **User Story 2.2: Secure Data Export**
    *   **As a user**, I want to export my entire vocabulary, including all FSRS study progress, **so that** I can create a secure backup or migrate my data to a new device.
    *   **Acceptance Criteria:**
        *   A new "Export Data" option is available in the app (e.g., on the Settings screen).
        *   Tapping it fetches all vocabulary items and their associated FSRS data from the database.
        *   The data is serialized into a structured JSON format.
        *   The app triggers the native OS "share" dialog, allowing me to save the generated `.json` file to my device, a cloud service, or send it via another app.

*   **User Story 2.3: Flexible Data Import**
    *   **As a user**, I want to import a vocabulary file to restore my progress, with control over how to handle words that already exist, **so that** I don't accidentally lose my current progress.
    *   **Acceptance Criteria:**
        *   A new "Import Data" option is available.
        *   Tapping it opens the device's file picker to select a compatible `.json` file.
        *   For each word in the file, the app checks if a word with the same `frontWord` already exists locally.
        *   If a duplicate is found, a native alert prompts me with the options to "Overwrite" the existing word, "Skip" the import for that word, or "Overwrite All" / "Skip All" for remaining duplicates.
        *   The database is updated according to my choices.
        *   A summary message is displayed upon completion (e.g., "Import complete: 50 words added, 5 overwritten, 3 skipped.").

### EPIC 3: Dynamic Learning Experience

*   **User Story 3.1: Randomized Review Direction**
    *   **As a user**, I want my review sessions to randomly quiz me in both directions (e.g., English to Russian and Russian to English), **so that** I build a more robust, bidirectional understanding of my vocabulary.
    *   **Acceptance Criteria:**
        *   When a card is presented on the `ReviewScreen`, the logic randomly decides the translation direction.
        *   **If Direction 1 (e.g., EN -> RU):** The prompt is the `frontWord`, and the expected answers are the translations.
        *   **If Direction 2 (e.g., RU -> EN):** The prompt is a randomly selected translation from the `translations` array, and the expected answer is the `frontWord`.
        *   The UI correctly displays the chosen prompt and evaluates the answer based on that direction.

*   **User Story 3.2: Immediate Answer Feedback**
    *   **As a user**, I want to see the correct answer(s) immediately after I submit my own, regardless of whether I was right or wrong, **so that** I can instantly reinforce my learning and correct my mistakes.
    *   **Acceptance Criteria:**
        *   On the `ReviewScreen`, after the "Check Answer" action is complete.
        *   A new, clear UI element appears below the input area.
        *   This element explicitly displays the correct `frontWord` and all of its associated `translations`. 