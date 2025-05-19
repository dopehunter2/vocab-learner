# Project Brief: FSRS Vocabulary Learning Tool with AI-Assisted Word Addition

## 1. Project Goal
Develop a mobile application for Android and iOS to help users learn English/Russian vocabulary effectively using a Spaced Repetition System (SRS) based on the FSRS algorithm. The app will feature AI-powered assistance for looking up words and adding them to the learning queue with rich contextual information.

## 2. Core Features
- **SRS Learning Engine:** Implementation of the FSRS algorithm for scheduling vocabulary reviews.
- **AI-Powered Word Lookup & Addition (`AddWordScreen`):**
    - Users can input a word (English or Russian).
    - The Google Gemini AI will provide:
        - Multiple translations.
        - Example sentences for the original word.
        - Example sentences for specific translations.
    - Users can select desired translations to create new vocabulary items for SRS learning.
- **Review Interface (`ReviewScreen`):** Interface for users to review due vocabulary items (word-translation pairs) and rate their recall (e.g., Again, Hard, Good, Easy) to update their FSRS state.
    - Text-to-Speech (TTS) pronunciation for words being reviewed.
- **Vocabulary Management (`AllWordsScreen`):** Ability to view all learned/learning words and potentially delete them.

## 3. Target Platforms
- Android
- iOS

## 4. Distribution
The application will **not** be distributed through the Google Play Store or Apple App Store. Alternative distribution methods (e.g., direct download, enterprise distribution) will be required.

## 5. Scope
- User interface for adding words (AI lookup, translation selection).
    - Text-to-Speech (TTS) pronunciation for the looked-up word.
- User interface for reviewing due SRS items.
- User interface for viewing all vocabulary items.
- Integration with Google Gemini AI for word lookup and example generation.
- Implementation of FSRS logic (`ts-fsrs`).
- Local data persistence (`expo-sqlite`) for vocabulary items and their FSRS state.
- Secure handling of the Gemini API key. 