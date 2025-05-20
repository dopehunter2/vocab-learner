# Tech Context: Vocabulary Learning Tool

## 1. Target Platforms & Framework
- **Platforms**: Android, iOS
- **Chosen Framework (Confirmed)**: React Native with Expo. This allows for cross-platform development from a single codebase, suitable for reaching both Android and iOS efficiently, and simplifies build/distribution.

## 2. Key Technologies
- **UI**: React Native components (using Expo)
- **State Management**: **Zustand** (Implemented in `src/store/useVocabularyStore.ts` for managing SRS due cards and review flow).
- **Data Persistence**: **SQLite via `expo-sqlite`** (Setup implemented for storing `VocabularyItem` data for SRS).
- **SRS Logic**: **`ts-fsrs` library and custom logic in `src/logic/srs.ts`** are core to the application for scheduling vocabulary reviews.
- **Language**: TypeScript.
- **Icons**: **`@expo/vector-icons`** (Installed and used).
- **Word Lookup & Information Source**: **Google Gemini API (via `ai.ts`)** is the primary source for identifying language, providing multiple translations, and example sentences.
- **Text-to-Speech (TTS)**: **`expo-speech` (via `src/services/pronunciationService.ts`)** for audio pronunciation.
- **Unique IDs**: `expo-crypto` for UUID generation (used for `VocabularyItem` IDs).

## 3. Development Setup
- Node.js / npm / yarn
- Expo CLI
- Android Studio / Xcode for platform-specific setup and emulators/simulators.
- Google Cloud project for Gemini API key.

## 4. Technical Constraints
- **Word lookup features (Gemini-powered) require an internet connection.**
- Offline functionality will be limited to reviewing already synced SRS items if due and no internet is available for fetching new AI data.
- Distribution outside official app stores (Expo EAS Build preferred).
- Secure handling of Gemini API key - **Currently hardcoded in `src/config/apiKeys.ts` for personal use.**

## 5. Version Control Practices
- **Local Tagging:** Stable points in development are marked with local Git tags (e.g., `stable-YYYYMMDD-HHMMSS`) in both the main project and the `vocab-learner-app` submodule. These tags can be used for rollbacks if necessary. Pushing tags to a remote repository is contingent on a remote being configured for the respective repositories.

*(External dictionary API integration, including `dictionaryService.ts`, has been removed from the project due to service unreliability. The project now relies solely on Gemini for lookups.)*