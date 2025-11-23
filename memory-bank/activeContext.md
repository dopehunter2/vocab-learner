# Active Context: FSRS Vocabulary Learning App

## 1. Current Focus
- **Completing Core Features:** With the native build now stable, the primary focus is to complete the final user-facing features.
    - **Implement Data Import:** The export functionality is complete. The next step is to build the import logic, which includes parsing the file, handling potential duplicates, and safely updating the database.
    - **Re-enable Notifications:** The notification service was disabled during previous debugging. Now that the app is stable, this service needs to be re-enabled and tested.

## 2. Recent Changes (Build Success & Feature Completion)
- **[CRITICAL] Native Build Stabilized (Oct 5, 2025):** After extensive debugging, we have successfully produced a stable Android `.apk` using React Native's New Architecture.
    - The final solution involved upgrading `react-native-reanimated` to a version compatible with the New Architecture, which also resolved the original JavaScript runtime crash.
    - Key blockers overcome: Gradle Metaspace errors, a corrupted Android SDK `package.xml` file, and multiple dependency conflicts.
- **[COMPLETE] EPIC 1 (Bilingual Context):** The `WordDetailModal` and long-press examples on `AddWordScreen` are fully implemented and working.
- **[COMPLETE] EPIC 2 (Control & Portability - Partial):**
    - Advanced sorting is implemented on `AllWordsScreen`.
    - Data export is fully functional via the Settings screen.
- **[COMPLETE] EPIC 3 (Dynamic Learning):**
    - Review direction is randomized.
    - Immediate answer feedback is implemented on `ReviewScreen`.
- **Data Loss and Recovery:** The project was successfully restored from a backup after an accidental deletion. All features have now been re-implemented.

## 3. Next Steps
1.  **Implement Import Logic:**
    - Read the selected JSON file using `fileService`.
    - Create a validation function to check the file's structure.
    - Implement the logic in `useVocabularyStore` to iterate through imported items.
    - For each item, check for duplicates in the local database.
    - If no duplicate, insert the new item.
    - If a duplicate exists, prompt the user to skip or overwrite.
    - Update the database and refresh the app state.
2.  **Re-enable and Test Notifications:**
    - Uncomment the notification-related code in `useVocabularyStore.ts` and `App.tsx`.
    - Thoroughly test the notification scheduling.

## 4. Known Issues
- Data import is not yet functional.
- The notification service is currently disabled in the code.

## 5. Active Decisions / Considerations
- **Core Functionality IS FSRS-based vocabulary learning.**
- **Build Target:** The app now successfully builds with the **New Architecture enabled**. This is a key technical decision going forward.
- **Key Technologies:** React Native, Expo, TypeScript, `expo-sqlite`, `ts-fsrs`, `Zustand`, Google Gemini API, `expo-speech`, `expo-file-system`, `expo-document-picker`, `expo-sharing`. 