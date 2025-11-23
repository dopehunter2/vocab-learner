import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_LIMIT_KEY = 'user_review_limit';
export const DEFAULT_REVIEW_LIMIT = 20;
export const MIN_REVIEW_LIMIT = 5;
export const MAX_REVIEW_LIMIT = 50;

export const saveReviewLimit = async (limit: number): Promise<void> => {
    try {
        const validatedLimit = Math.max(MIN_REVIEW_LIMIT, Math.min(MAX_REVIEW_LIMIT, limit));
        await AsyncStorage.setItem(REVIEW_LIMIT_KEY, JSON.stringify(validatedLimit));
        console.log('[settingsService] Review limit saved:', validatedLimit);
    } catch (error) {
        console.error('[settingsService] Error saving review limit:', error);
        // Optionally, re-throw or handle as per app's error strategy
    }
};

export const getReviewLimit = async (): Promise<number> => {
    try {
        const value = await AsyncStorage.getItem(REVIEW_LIMIT_KEY);
        if (value !== null) {
            const parsedLimit = JSON.parse(value);
            console.log('[settingsService] Review limit loaded:', parsedLimit);
            return Math.max(MIN_REVIEW_LIMIT, Math.min(MAX_REVIEW_LIMIT, parsedLimit));
        }
        console.log('[settingsService] No saved review limit, returning default:', DEFAULT_REVIEW_LIMIT);
        return DEFAULT_REVIEW_LIMIT;
    } catch (error) {
        console.error('[settingsService] Error loading review limit:', error);
        return DEFAULT_REVIEW_LIMIT; // Fallback to default on error
    }
}; 