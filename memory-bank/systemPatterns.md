# System Patterns: Vocabulary Learning Tool

## 1. Architecture (Initial Thoughts)
- **Client-Side Focus**: The core logic for AI interaction and result display resides within the mobile application. Any data saving (history/bookmarks) would also be client-side.
- **Component-Based UI**: Following React Native principles, the UI will be built from reusable components (e.g., `LookupForm`, `ResultsDisplay`, `TranslationItem`, `ExampleList`).

## 2. Key Technical Decisions (To Be Made/Confirmed)
- **State Management Strategy**: How to manage application state, especially current lookup results and user input.
- **Data Storage Choice**: Decision: SQLite via `expo-sqlite` (if history/bookmarks are implemented, the schema will adapt).

## 3. Design Patterns
- **AI-Driven Dictionary Engine**: Heavy reliance on **Google Gemini API via `ai.ts`** for all aspects of word lookup: language identification, fetching multiple translations (ordered by commonality), providing example sentences for the original word and for each translation.
- **Spaced Repetition System (SRS)**: Core learning mechanism using the **FSRS algorithm via `ts-fsrs`**. Vocabulary items (`VocabularyItem` interface) with their FSRS state (`dueDate`, `stability`, `difficulty`, etc.) are managed.
- **Local Data Persistence**: Storing `VocabularyItem` data, including FSRS state, locally using **SQLite via `expo-sqlite`**. Accessed through `src/database/database.ts`.
- **Text-to-Speech (TTS) Service**: Utilizing **`expo-speech` via `src/services/pronunciationService.ts`** to provide audio pronunciation for words.
- **Cross-Platform Development**: Using React Native with Expo.
- **Database Abstraction**: Using utility functions (`src/database/database.ts`) to interact with SQLite.
- **(Removed) External Dictionary API Integration**: The pattern for using an external dictionary API (and the `dictionaryService.ts` file) has been removed from the project due to service unreliability. 