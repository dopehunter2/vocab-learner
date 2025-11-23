import { State } from 'ts-fsrs'; // Import State enum from ts-fsrs

export interface VocabularyItem {
  id: string; // Unique ID for this learning card
  frontWord: string; // The word/phrase to be translated or identified
  sourceLanguage?: 'English' | 'Russian'; // The language of frontWord, for sorting purposes
  frontContext?: string; // The example sentence where frontWord is shown (e.g., "Her **resilience** was admirable.")
  translations: string[]; // An array of accepted translations/synonyms for the frontWord.
  sourceQueryWord?: string; // Optional: The original word the user looked up, useful for grouping or analysis

  // FSRS fields - align with ts-fsrs library needs and existing database structure
  dueDate: number; // Unix timestamp (milliseconds)
  stability: number;
  difficulty: number;
  repetitions: number; // Corresponds to 'reps' in ts-fsrs
  lapses: number;
  state: State; // Use State enum from ts-fsrs (New, Learning, Review, Relearning)
  lastReviewed: number | null; // Unix timestamp (milliseconds), or null if never reviewed
  // Note: ts-fsrs also uses elapsed_days and scheduled_days. 
  // You'll need to ensure your srs.ts maps these correctly if they are not directly stored.
} 