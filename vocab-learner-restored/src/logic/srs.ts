import { FSRS, Card, State, Rating, generatorParameters, FSRSParameters, RecordLog, RecordLogItem } from 'ts-fsrs';
import { VocabularyItem } from '../types/vocabulary';

// Default FSRS parameters (can be tuned later)
// These are often the starting point before user-specific optimization.
const defaultParams: FSRSParameters = generatorParameters({
    request_retention: 0.9, // Target probability of recall (90%)
    maximum_interval: 36500, // Max interval in days (e.g., 100 years)
    // other parameters can be left as default or specified
});

// Initialize FSRS instance with default parameters
const fsrsInstance = new FSRS(defaultParams);

/**
 * Converts our VocabularyItem format to the ts-fsrs Card format.
 * Note: Timestamps (dueDate, lastReviewed) are in ms, FSRS uses Date objects.
 */
const convertVocabItemToFsrsCard = (item: VocabularyItem): Card => {
    return {
        due: new Date(item.dueDate),
        stability: item.stability,
        difficulty: item.difficulty,
        elapsed_days: item.lastReviewed !== null
            ? Math.max(0, Math.round((Date.now() - item.lastReviewed) / (1000 * 60 * 60 * 24)))
            : 0,
        scheduled_days: 0, // This is calculated by FSRS, initial value doesn't matter much here
        reps: item.repetitions,
        lapses: item.lapses,
        state: item.state,
        last_review: item.lastReviewed !== null ? new Date(item.lastReviewed) : undefined,
    };
};

/**
 * Updates a VocabularyItem with the results from an FSRS review.
 */
const updateVocabItemFromFsrsResult = (
    currentItem: VocabularyItem,
    fsrsResult: RecordLogItem,
    reviewTime: Date // The exact time the review happened
): VocabularyItem => {
    const { card: updatedFsrsCard } = fsrsResult;
    return {
        ...currentItem, // Keeps id, frontWord, frontContext, translations, sourceQueryWord
        dueDate: updatedFsrsCard.due.getTime(),
        stability: updatedFsrsCard.stability,
        difficulty: updatedFsrsCard.difficulty,
        lapses: updatedFsrsCard.lapses,
        state: updatedFsrsCard.state,
        repetitions: updatedFsrsCard.reps,
        lastReviewed: reviewTime.getTime(),
    };
};

/**
 * Creates the initial state for a brand new vocabulary item.
 */
export const createInitialVocabularyItem = (
    frontWord: string,
    translations: string[],
    frontContext?: string,
    sourceQueryWord?: string
): Omit<VocabularyItem, 'id'> => {
    const now = Date.now();
    return {
        frontWord,
        translations,
        frontContext,
        sourceQueryWord,
        dueDate: now, // Due immediately
        stability: 0,
        difficulty: 0,
        lapses: 0,
        state: State.New, // Initial state is New
        repetitions: 0,
        lastReviewed: null, // Never reviewed - changed from 0 to null to match VocabularyItem type
    };
};

// Define the valid grades/ratings used for review
export type ReviewRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

/**
 * Processes a review for a vocabulary item.
 * Takes the current item state and the user's grade (rating).
 * Returns the updated vocabulary item.
 */
export const processReview = (
    item: VocabularyItem,
    rating: ReviewRating // Use the restricted type
): VocabularyItem => {
    const card = convertVocabItemToFsrsCard(item);
    const now = new Date(); // Time of the review

    // Get the scheduling results for all possible ratings
    const schedulingCards: RecordLog = fsrsInstance.repeat(card, now);

    // Check if the provided rating is a valid key in the result
    if (!(rating in schedulingCards)) {
        console.error(`Invalid or unexpected rating provided: ${rating}`);
        // Handle error appropriately - return the original item
        return item;
    }

    // Select the result based on the actual rating given by the user
    // Type assertion might be needed if TS still struggles, but check should suffice
    const resultForRating: RecordLogItem = schedulingCards[rating];

    if (!resultForRating) {
        // This case should theoretically be caught by the 'in' check, but belt-and-suspenders
        console.error(`Missing result for rating: ${rating}`);
        return item;
    }

    // Update our item with the calculated FSRS state
    const updatedItem = updateVocabItemFromFsrsResult(item, resultForRating, now);

    return updatedItem;
};

// Export Rating enum for use in UI components
export { Rating }; 