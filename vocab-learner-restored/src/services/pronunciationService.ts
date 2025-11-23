import * as Speech from 'expo-speech';

// Basic language mapping
// Gemini might return full names like "English", "Russian"
// expo-speech uses language codes like "en-US", "ru-RU"
const languageMap: { [key: string]: string } = {
    'english': 'en-US',
    'russian': 'ru-RU',
    // Add more mappings if Gemini returns other variations
    'eng': 'en-US', 
    'rus': 'ru-RU',
};

interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    // onStart?: () => void;
    // onDone?: () => void;
    // onError?: (error: Error) => void;
}

/**
 * Speaks the given text using expo-speech.
 * @param text The text to speak.
 * @param languageIdentifier The language of the text (e.g., "English", "rus", "fr-FR").
 *                           The function will attempt to map it to a supported expo-speech code.
 * @param options Optional Speech.SpeechOptions from expo-speech.
 */
export const playText = async (text: string, languageIdentifier?: string, options?: SpeechOptions): Promise<void> => {
    if (!text.trim()) {
        console.log('playText: No text provided.');
        return;
    }

    let languageCode = options?.language;

    if (languageIdentifier) {
        const normalizedLangId = languageIdentifier.toLowerCase().split('-')[0]; // "English" -> "english", "en-GB" -> "en"
        const mappedCode = languageMap[normalizedLangId] || languageMap[languageIdentifier.toLowerCase()];
        if (mappedCode) {
            languageCode = mappedCode;
        } else {
            // If no direct map, try to use the identifier if it looks like a code (e.g., "fr-FR")
            if (languageIdentifier.includes('-')) {
                languageCode = languageIdentifier;
            }
            console.log(`playText: No specific mapping for "${languageIdentifier}". Attempting with ${languageCode || 'default system language'}.`);
        }
    }
    
    try {
        const availableVoices = await Speech.getAvailableVoicesAsync();
        const voiceForLanguage = availableVoices.find(voice => voice.language === languageCode);

        const speechOptions: Speech.SpeechOptions = {
            language: voiceForLanguage ? languageCode : undefined, // Use languageCode if a voice is found, otherwise let system decide
            pitch: options?.pitch || 1.0,
            rate: options?.rate || 1.0,
            // onStart: options?.onStart,
            // onDone: options?.onDone,
            // onError: options?.onError,
        };
        
        // Check if speaking is already in progress for safety, though expo-speech might handle this.
        // const isSpeaking = await Speech.isSpeakingAsync();
        // if (isSpeaking) {
        //     await Speech.stop(); // Stop current speech before starting new one
        // }

        Speech.speak(text, speechOptions);
    } catch (error) {
        console.error('Error in playText with expo-speech:', error);
        // Fallback or re-throw if needed
    }
};

/**
 * Stops any ongoing speech.
 */
export const stopSpeaking = async (): Promise<void> => {
    try {
        await Speech.stop();
    } catch (error) {
        console.error('Error stopping speech:', error);
    }
};

// Example: To check available voices during development
// (async () => {
//     const voices = await Speech.getAvailableVoicesAsync();
//     console.log("Available TTS voices:", voices.map(v => ({ lang: v.language, name: v.name, quality: v.quality }) ));
// })(); 