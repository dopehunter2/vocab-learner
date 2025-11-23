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
- **File System & Sharing**: `expo-file-system`, `expo-sharing`, and `expo-document-picker` for implementing the import/export functionality.
- **Unique IDs**: `expo-crypto` for UUID generation (used for `VocabularyItem` IDs).

## 3. Build & Environment
- **Architecture:** The project is now configured to build with **React Native's New Architecture (Fabric)**. `newArchEnabled` must be `true` in `android/gradle.properties`.
- **Dependencies:** The current set of dependencies (especially `react-native-reanimated@^4.x.x`) requires the New Architecture. Downgrading is not a viable strategy.
- **Gradle Configuration:** The JVM memory for Gradle has been increased to `org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g` in `android/gradle.properties` to handle the resource requirements of building with the New Architecture.
- **Android SDK Issues:** Be aware of potential build failures due to corrupted `package.xml` files in the Android SDK directory. The solution is to delete the corrupted platform folder (e.g., `platforms/android-36`) and let Gradle redownload it.
