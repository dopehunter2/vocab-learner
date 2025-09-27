import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { VocabularyItem } from '../types/vocabulary';
import {
    getDueVocabularyItems,
    updateVocabularyItem,
    getAllVocabularyItems,
    deleteVocabularyItem,
    addVocabularyItem,
    findVocabularyItemByFrontWord
} from '../database/database';
import { processReview, ReviewRating } from '../logic/srs';
import { Alert } from 'react-native';
import { saveReviewLimit, getReviewLimit, DEFAULT_REVIEW_LIMIT } from '../services/settingsService';

// Fisher-Yates (aka Knuth) Shuffle function
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

interface VocabularyState {
    dueCards: VocabularyItem[];
    isLoadingDueCards: boolean;
    errorLoadingDueCards: string | null;
    fetchDueCards: () => Promise<void>;
    reviewCard: (id: string, rating: ReviewRating) => Promise<void>;

    // State for all cards
    allCards: VocabularyItem[];
    isLoadingAllCards: boolean;
    errorLoadingAllCards: string | null;
    fetchAllCards: () => Promise<void>;
    deleteCard: (id: string) => Promise<void>;

    // Settings related state
    reviewLimit: number;
    actualDueCount: number; // Total number of cards due before applying limit
    setReviewLimit: (limit: number) => Promise<void>;
    loadReviewLimitFromStorage: () => Promise<void>;
    addCard: (item: Omit<VocabularyItem, 'id'>) => Promise<void>;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
    dueCards: [],
    isLoadingDueCards: false,
    errorLoadingDueCards: null,

    // State for all cards
    allCards: [],
    isLoadingAllCards: false,
    errorLoadingAllCards: null,

    // Settings related state
    reviewLimit: DEFAULT_REVIEW_LIMIT,
    actualDueCount: 0,

    loadReviewLimitFromStorage: async () => {
        const limit = await getReviewLimit();
        set({ reviewLimit: limit });
    },

    setReviewLimit: async (limit: number) => {
        await saveReviewLimit(limit);
        set({ reviewLimit: limit });
        // Optionally, re-fetch due cards if the limit change should immediately affect a current session
        // For now, it will apply to the next call of fetchDueCards
    },

    fetchDueCards: async () => {
        if (get().isLoadingDueCards) return;
        set({ isLoadingDueCards: true, errorLoadingDueCards: null });
        try {
            const nowTimestamp = Date.now();
            const allDueItems = await getDueVocabularyItems(nowTimestamp);
            const currentReviewLimit = get().reviewLimit;
            
            set({ actualDueCount: allDueItems.length });

            const shuffledDueItems = shuffleArray(allDueItems);
            const limitedDueItems = shuffledDueItems.slice(0, currentReviewLimit);

            set({ dueCards: limitedDueItems, isLoadingDueCards: false });
        } catch (error: any) {
            console.error("Error fetching due cards:", error);
            set({ errorLoadingDueCards: error.message || 'Failed to load due cards', isLoadingDueCards: false, actualDueCount: 0 });
        }
    },

    reviewCard: async (id: string, rating: ReviewRating) => {
        const itemToReview = get().dueCards.find(card => card.id === id);
        if (!itemToReview) {
            console.error(`Card with id ${id} not found in dueCards.`);
            Alert.alert('Error', 'Could not find the card to review.');
            return;
        }

        try {
            // processReview returns a full, updated VocabularyItem object now
            const updatedItem = processReview(itemToReview, rating);

            await updateVocabularyItem(updatedItem);

            // Also update the item in the `allCards` state if it exists there
            set(state => ({
                dueCards: state.dueCards.filter(card => card.id !== id),
                allCards: state.allCards.map(card => card.id === id ? updatedItem : card),
                // Decrement actualDueCount if a card is successfully reviewed and removed from the overall due pool
                actualDueCount: Math.max(0, state.actualDueCount -1) 
            }));

        } catch (error: any) {
            console.error("Error processing review:", error);
            Alert.alert('Review Error', error.message || 'Failed to update card after review.');
        }
    },

    // Action to fetch all cards
    fetchAllCards: async () => {
        if (get().isLoadingAllCards) return;
        set({ isLoadingAllCards: true, errorLoadingAllCards: null });
        try {
            const allItems = await getAllVocabularyItems();
            set({ allCards: allItems, isLoadingAllCards: false });
        } catch (error: any) {
            console.error("Error fetching all cards:", error);
            set({ errorLoadingAllCards: error.message || 'Failed to load all cards', isLoadingAllCards: false });
        }
    },

    // Action to delete a card
    deleteCard: async (id: string) => {
        try {
            await deleteVocabularyItem(id);
            // Update both allCards and dueCards state
            set(state => ({
                allCards: state.allCards.filter(card => card.id !== id),
                dueCards: state.dueCards.filter(card => card.id !== id), // Also remove from due if present
                // Adjust actualDueCount if a card is deleted and was part of the due count
                actualDueCount: state.allCards.find(c => c.id === id && c.dueDate <= Date.now()) ? Math.max(0, state.actualDueCount - 1) : state.actualDueCount
            }));
            console.log(`Card with id ${id} deleted successfully.`);
        } catch (error: any) {
            console.error(`Error deleting card with id ${id}:`, error);
            Alert.alert('Delete Error', error.message || 'Failed to delete the card.');
            // Optionally re-throw or handle differently
        }
    },

    addCard: async (newItemData: Omit<VocabularyItem, 'id'>) => {
        try {
            const existingItem = await findVocabularyItemByFrontWord(newItemData.frontWord);

            if (existingItem) {
                // --- UPDATE LOGIC ---
                // Merge new translations with existing ones, avoiding duplicates
                const existingTranslations = new Set(existingItem.translations.map(t => t.toLowerCase()));
                const mergedTranslations = [...existingItem.translations];

                newItemData.translations.forEach(newTrans => {
                    if (!existingTranslations.has(newTrans.toLowerCase())) {
                        mergedTranslations.push(newTrans);
                    }
                });

                const updatedItem: VocabularyItem = {
                    ...existingItem,
                    translations: mergedTranslations,
                    // Optionally update context if a new one is provided
                    frontContext: newItemData.frontContext || existingItem.frontContext,
                };

                await updateVocabularyItem(updatedItem);
                
                // Update the state
                set(state => ({
                    allCards: state.allCards.map(card => card.id === updatedItem.id ? updatedItem : card),
                }));
                Alert.alert('Word Updated', `Added ${newItemData.translations.length} new translation(s) to "${newItemData.frontWord}".`);
            } else {
                // --- ADD NEW LOGIC ---
                const newItemWithId: VocabularyItem = {
                    ...newItemData,
                    id: Crypto.randomUUID(),
                };
                await addVocabularyItem(newItemWithId);
                set(state => ({
                    allCards: [...state.allCards, newItemWithId].sort((a, b) => a.frontWord.localeCompare(b.frontWord)),
                }));
                 // No alert here, the AddWordScreen will show one.
            }
        } catch (error: any) {
            console.error("Error in addOrUpdateCard store action:", error);
            Alert.alert('Save Error', error.message || 'Failed to save or update the card.');
            throw error; // Re-throw to let the calling component know something went wrong
        }
    },
})); 