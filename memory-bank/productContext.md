# Product Context: FSRS Vocabulary Learning Tool

## 1. Problem Solved
Learning vocabulary, especially for languages like English and Russian, requires consistent review to combat forgetting. Traditional flashcard methods can be inefficient. This application aims to optimize learning using the FSRS algorithm for spaced repetition, minimizing review time while maximizing retention. It also addresses the challenge of adding new words efficiently by using AI to provide rich translation options and contextual examples.

## 2. Target User
Individuals actively learning English or Russian vocabulary who want an efficient, algorithm-driven method for memorization and a streamlined way to add new words with helpful context (translations, examples) powered by AI.

## 3. Core Functionality: SRS Learning Cycle + AI Word Addition
- **Adding Words:**
    - User inputs a word via `AddWordScreen`.
    - App queries Google Gemini API (`ai.ts`) for translations and examples.
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