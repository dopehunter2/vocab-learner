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
- **Word Lookup & Information Source**: **Google Gemini API (via `ai.ts`)** is the primary source for identifying language, providing multiple translations, and example sentences. The specific model in use is `gemini-2.0-flash`.
- **Text-to-Speech (TTS)**: **`expo-speech` (via `src/services/pronunciationService.ts`)** for audio pronunciation.
- **Notifications**: **`expo-notifications`** for scheduling local study reminders.
- **Unique IDs**: `expo-crypto` for UUID generation (used for `VocabularyItem` IDs).

## 3. Development Setup
