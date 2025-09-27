import { GEMINI_API_KEY } from '../config/apiKeys';
import { VocabularyItem } from '../types/vocabulary';

// Target data structure for comprehensive AI lookup
export interface AiTranslation {
  translation: string;
  partOfSpeech?: string; // e.g., "noun", "verb", "adjective"
  // Phonetic transcription (IPA) could be added if Gemini can provide it reliably
  // ipa?: string;
  examplesForThisTranslation: string[]; // 1-2 examples specific to this translation's meaning
}

export interface AiLookupResult {
  originalWord: string;
  identifiedLang: 'English' | 'Russian' | 'Unknown';
  // General phonetic transcription for the original word if available
  // originalWordIpa?: string;
  generalExamples: string[]; // 1-2 general examples for the original word
  translations: AiTranslation[]; // Array of different translations
  // Spelling suggestions could also be part of this later
  // spellingSuggestions?: string[];
}

export interface BilingualExample {
    sourceSentence: string;
    translationSentence: string;
}

export interface AiAnswerEvaluation {
    evaluation: 'Correct' | 'Incorrect' | 'Partially Correct';
    explanation: string;
    correctedAnswer?: string; // Provide the best correction if the user was wrong
}


// Reference: https://ai.google.dev/docs/rest_api
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface GeminiContent {
    parts: { text: string }[];
    role?: string; // 'user' or 'model'
}

interface GeminiRequest {
    contents: GeminiContent[];
    // Add safetySettings, generationConfig etc. if needed later
}

interface GeminiResponse {
    candidates?: {
        content: GeminiContent;
        finishReason?: string;
        index?: number;
        safetyRatings?: any[]; // Define more strictly if needed
    }[];
    promptFeedback?: any; // Define more strictly if needed
}

// Interface for the structured AI response we expect (OLD - to be replaced by AiLookupResult)
// export interface WordInfoResponse {
//    identifiedLang: 'English' | 'Russian' | 'Unknown';
//    translations: string[];
//    examples: string[];
// }

// Updated Helper function to parse the AI response (handling Markdown-like text)
// const parseWordInfoResponse = (responseText: string): WordInfoResponse | null => { // OLD - WILL BE REWRITTEN
// ... (existing old parser logic) ...
// };

const parseAiLookupResponse = (responseText: string, originalWord: string): AiLookupResult | null => {
    console.log("[ai.ts] parseAiLookupResponse - Attempting to parse:", responseText);
    const result: AiLookupResult = {
        originalWord: originalWord,
        identifiedLang: 'Unknown',
        generalExamples: [],
        translations: [],
    };

    const lines = responseText.trim().split('\n');
    let currentTranslation: AiTranslation | null = null;
    let processingSection: 'none' | 'originalExamples' | 'translationBlock' | 'translationExamples' = 'none';
    let currentExampleLines: string[] = [];

    const processAndAddCurrentExample = () => {
        if (currentExampleLines.length > 0) {
            const fullExample = currentExampleLines.join(' ').trim(); // Join lines with a space
            const cleanedExample = fullExample.replace(/\s*\([^)]*\)\s*/g, '').trim();
            if (cleanedExample) {
                result.generalExamples.push(cleanedExample);
            }
            currentExampleLines = [];
        }
    };

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('**Source Language:**')) {
            const lang = trimmedLine.replace('**Source Language:**', '').trim().toLowerCase();
            if (lang === 'english') result.identifiedLang = 'English';
            else if (lang === 'russian') result.identifiedLang = 'Russian';
            processingSection = 'none';
            continue;
        }

        if (trimmedLine.startsWith('**Original Word Examples:**')) {
            processAndAddCurrentExample(); // Process any pending example before switching section
            processingSection = 'originalExamples';
            continue;
        }

        if (processingSection === 'originalExamples') {
            if (trimmedLine.match(/^\d+\.\s*/)) { // Starts a new numbered example (e.g., "1. ...")
                processAndAddCurrentExample(); // Process the previous example lines
                currentExampleLines.push(trimmedLine.replace(/^\d+\.\s*/, '').trim()); // Add new line, stripped of number
            } else if (!trimmedLine.startsWith('**') && !trimmedLine.startsWith('---') && trimmedLine) {
                // This is a continuation line of the current example
                currentExampleLines.push(trimmedLine);
            } else { // End of examples section or empty line that might signify break
                processAndAddCurrentExample(); // Process the current example lines
                processingSection = 'none'; // Reset section
                // IMPORTANT: Reprocess this line if it starts a new section, e.g., "--- Translation 1 ---"
                // This needs careful handling to avoid infinite loops or skipping lines.
                // For now, we assume that if it's not an example line, it's a section changer or ignorable.
                // The main loop will continue and check for other section markers.
                // If `trimmedLine` itself is a new section marker, it will be caught in subsequent `if`s in the loop.
            }
            continue; // Continue to next line after handling example part
        }
        
        // If we were in originalExamples and the line caused a section change, 
        // ensure any pending example is processed before handling other sections.
        // This is somewhat implicitly handled by calling processAndAddCurrentExample()
        // when a new section marker like '**Source Language:**' or '--- Translation X ---' is encountered.

        // Check for start of a new translation block
        if (trimmedLine.match(/^--- Translation \d+ ---$/)) {
            processAndAddCurrentExample(); // Process any pending original example
            if (currentTranslation) {
                result.translations.push(currentTranslation);
            }
            currentTranslation = {
                translation: '',
                partOfSpeech: undefined,
                examplesForThisTranslation: [],
            };
            processingSection = 'translationBlock';
            continue;
        }

        if (processingSection === 'translationBlock' && currentTranslation) {
            if (trimmedLine.startsWith('**Translation:**')) {
                currentTranslation.translation = trimmedLine.replace('**Translation:**', '').trim().replace(/\\s*\\([^)]*\\)\\s*/g, '');
            } else if (trimmedLine.startsWith('**Part of Speech:**')) {
                currentTranslation.partOfSpeech = trimmedLine.replace('**Part of Speech:**', '').trim();
            } else if (trimmedLine.startsWith('**Examples:**')) {
                processingSection = 'translationExamples';
            }
            continue;
        }

        if (processingSection === 'translationExamples' && currentTranslation) {
            if (trimmedLine.match(/^\d+\.\s*/)) {
                const exampleText = trimmedLine.replace(/^\d+\.\s*/, '').trim().replace(/\s*\([^)]*\)\s*/g, '');
                currentTranslation.examplesForThisTranslation.push(exampleText);
            } else if (trimmedLine.startsWith('**') || trimmedLine.startsWith('---')) {
                 // End of current translation's examples, revert to looking for new translation block or other sections
                processingSection = 'translationBlock'; 
                // Reprocess this line in case it's the start of a new block or different section
                // This requires careful handling or a more robust state machine, for now, we assume example lists end cleanly
            } else {
                 // Capture lines that are not new sections if they seem part of an example list
                 // Also remove text in parentheses here just in case (Correct regex)
                 const exampleText = trimmedLine.replace(/\s*\([^)]*\)\s*/g, '');
                 currentTranslation.examplesForThisTranslation.push(exampleText);
            }
        }
    }

    processAndAddCurrentExample(); // Process any remaining example lines after the loop

    if (currentTranslation) { // Add the last processed translation
        result.translations.push(currentTranslation);
    }

    // Basic validation: did we get anything meaningful?
    if (result.identifiedLang === 'Unknown' && result.generalExamples.length === 0 && result.translations.length === 0) {
        console.error("[ai.ts] parseAiLookupResponse - Failed to parse any meaningful data.");
        return null;
    }
    
    console.log("[ai.ts] parseAiLookupResponse - Successfully parsed:", JSON.stringify(result, null, 2));
    return result;
};

/**
 * Gets translations and examples for a given word using the Gemini API.
 */
export const getWordInfo = async (word: string): Promise<AiLookupResult | null> => {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key is missing.');
        return null;
    }
    if (!word || !word.trim()) {
        console.warn('Word is empty.');
        return null;
    }

    const cleanWord = word.trim();

    const prompt = `Analyze the word: \"${cleanWord}\"

**Instructions:** Provide the source language, examples for the original word, and several common translations into the other language (English to Russian or Russian to English). For each translation, provide its part of speech (if possible) and 1-2 example sentences using that specific translation. **IMPORTANT: Do NOT include phonetic transcriptions or Romanized transliterations in parentheses (e.g., like '(privet)' or '(predvidet')') anywhere in the response.**

**Source Language:** (Identify if \"${cleanWord}\" is English or Russian and state it clearly, e.g., \"English\" or \"Russian\")

**Original Word Examples:** (These examples should ONLY be in the identified source language of \"${cleanWord}\". Do NOT include translations of \"${cleanWord}\" into the other language within these original word examples.)
1. (Example sentence using \"${cleanWord}\" in its identified source language. This example must not contain the translation of \"${cleanWord}\".)
2. (Another example sentence for \"${cleanWord}\", also only in the source language and without its translation.)

**Translations (into the other language):**

--- Translation 1 ---
**Translation:** (The translated word)
**Part of Speech:** (e.g., Noun, Verb, Adjective - if identifiable)
**Examples:**
1. (Example sentence using this specific translation, illustrating its meaning)
2. (Another example for this translation, if different nuance)

--- Translation 2 ---
**Translation:** (The translated word)
**Part of Speech:** (e.g., Noun, Verb, Adjective - if identifiable)
**Examples:**
1. (Example sentence using this specific translation)
2. (Another example for this translation)

(Provide up to 3-10 common translations in this format. If providing multiple translations, repeat the "--- Translation X ---" block for each. Ensure each translation block is clearly separated by "--- Translation [Number] ---".)`;

    const requestBody: GeminiRequest = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    console.log('[ai.ts] getWordInfo - Sending new prompt to Gemini for:', cleanWord);

    try {
        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[ai.ts] Gemini API Error in getWordInfo: ${response.status} ${response.statusText}`, errorBody);
            return null; 
        }

        const data = (await response.json()) as GeminiResponse;
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
            console.log('[ai.ts] getWordInfo - Raw response from Gemini:', responseText);
            return parseAiLookupResponse(responseText, cleanWord); // Call the new parser
        } else {
            console.warn('[ai.ts] Gemini API response in getWordInfo did not contain expected text content.', data);
            return null;
        }
    } catch (error) {
        console.error('[ai.ts] Error calling or processing Gemini API for getWordInfo:', error);
        return null;
    }
};

/**
 * Gets spelling suggestions for a potentially misspelled word.
 */
export const getSpellingSuggestions = async (word: string): Promise<string[] | null> => {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key is missing for suggestions.');
        return null;
    }
    if (!word || !word.trim()) {
        return null;
    }

    const cleanWord = word.trim();
    // Simple prompt for spelling suggestions
    const prompt = `Is the word "${cleanWord}" potentially misspelled (English or Russian)? If yes, provide a short, comma-separated list of likely corrections. If it seems correct or no suggestions are found, just respond with "OK". Example response for misspelled 'ambigious': ambiguous, ambiguously`;

    // Use the same endpoint and basic request structure
    const requestBody: GeminiRequest = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gemini Suggestion API Error: ${response.status} ${response.statusText}`, errorBody);
            // Don't throw, just return null for suggestion errors
            return null;
        }

        const data = (await response.json()) as GeminiResponse;
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
            const suggestionsText = responseText.trim();
            // Check if the response indicates the word is OK or provides suggestions
            if (suggestionsText.toUpperCase() === 'OK' || suggestionsText.includes('seems correct')) {
                return []; // Return empty array indicating no suggestions needed
            } else {
                // Parse comma-separated suggestions
                const suggestions = suggestionsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
                return suggestions;
            }
        } else {
            console.warn('Gemini suggestion response did not contain expected text.', data);
            return null;
        }
    } catch (error) {
        console.error('Error calling Gemini API for suggestions:', error);
        return null;
    }
};

/**
 * Gets an AI-generated example sentence for a given word in its language.
 * This is a simpler, focused version compared to getWordInfo.
 */
export const getAIExample = async (
    wordToGetExampleFor: string,
    languageOfWord: 'English' | 'Russian'
): Promise<string | null> => {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key is missing for getAIExample.');
        return null;
    }
    if (!wordToGetExampleFor || !wordToGetExampleFor.trim()) {
        console.warn('Word is empty for getAIExample.');
        return null;
    }

    const cleanWord = wordToGetExampleFor.trim();

    const prompt = `Provide a single, concise example sentence for the ${languageOfWord} word \"${cleanWord}\".
The example sentence should clearly illustrate the meaning of \"${cleanWord}\".
Do NOT include any translations or transliterations in the example sentence. Just the sentence itself.
Example sentence: (Your generated sentence here)`;
    
    const requestBody: GeminiRequest = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    console.log('[ai.ts] getAIExample - Sending prompt to Gemini for:', cleanWord, languageOfWord);

    try {
        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[ai.ts] Gemini API Error in getAIExample: ${response.status} ${response.statusText}`, errorBody);
            return null;
        }

        const data = (await response.json()) as GeminiResponse;
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (responseText) {
            console.log('[ai.ts] getAIExample - Raw response from Gemini:', responseText);
            // Attempt to extract content after "Example sentence:" or return the whole thing if not found
            const exampleMatch = responseText.match(/Example sentence:\s*(.*)/i);
            const extractedExample = exampleMatch && exampleMatch[1] ? exampleMatch[1].trim() : responseText;
            
            // Further clean-up: remove any lingering parenthetical content.
            return extractedExample.replace(/\s*\([^)]*\)\s*/g, '').trim();
        } else {
            console.warn('[ai.ts] Gemini API response in getAIExample did not contain expected text content.', data);
            return null;
        }
    } catch (error) {
        console.error('[ai.ts] Error calling or processing Gemini API for getAIExample:', error);
        return null;
    }
};

/**
 * Gets bilingual (source -> target) example sentences for a specific word-translation pair.
 */
export const getBilingualExample = async (
    sourceWord: string,
    sourceLanguage: 'English' | 'Russian',
    translation: string
): Promise<BilingualExample | null> => {
    if (!GEMINI_API_KEY) return null;
    const targetLanguage = sourceLanguage === 'English' ? 'Russian' : 'English';

    const prompt = `
    You are a language teaching assistant.
    For the ${sourceLanguage} word "${sourceWord}", I need an example sentence that specifically illustrates its meaning as "${translation}" in ${targetLanguage}.
    Provide one ${sourceLanguage} sentence and its direct ${targetLanguage} translation.
    Respond ONLY with a JSON object in the format:
    {
      "sourceSentence": "The example sentence in ${sourceLanguage}.",
      "translationSentence": "The translated sentence in ${targetLanguage}."
    }
    Do not include any other text, markdown, or explanations.
    `;

    const requestBody: GeminiRequest = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    try {
        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as GeminiResponse;
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) return null;

        const jsonString = responseText.trim().replace(/```json/g, '').replace(/```/g, '');
        const parsed = JSON.parse(jsonString) as BilingualExample;
        return parsed;

    } catch (error) {
        console.error('[ai.ts] Error fetching bilingual example:', error);
        return null;
    }
};


/**
 * Asks the AI to evaluate if a user's answer is a semantically correct translation.
 */
export const getAiEvaluationForAnswer = async (
    sourceWord: string,
    knownCorrectTranslations: string[],
    userAnswer: string
): Promise<AiAnswerEvaluation | null> => {
    if (!GEMINI_API_KEY) return null;

    const prompt = `
    You are a strict but fair language evaluator.
    A user is learning the word "${sourceWord}".
    They were expected to provide one of the following known correct translations: [${knownCorrectTranslations.join(', ')}].
    The user's answer was: "${userAnswer}".

    Your task is to evaluate if the user's answer is semantically correct in this context.
    - If it's a direct match, a very close synonym, or a correct variation (e.g., singular/plural), it is "Correct".
    - If it's related but not a good translation, or a common mistake, it is "Partially Correct".
    - If it's completely wrong, it is "Incorrect".

    Respond ONLY with a JSON object in the following format:
    {
      "evaluation": "Correct" | "Incorrect" | "Partially Correct",
      "explanation": "A brief, one-sentence explanation for your decision.",
      "correctedAnswer": "The most appropriate translation from the known list if the user was wrong or partially correct."
    }
    Do not include any other text, markdown, or explanations.
    `;

    const requestBody: GeminiRequest = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    try {
        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as GeminiResponse;
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) return null;

        const jsonString = responseText.trim().replace(/```json/g, '').replace(/```/g, '');
        const parsed = JSON.parse(jsonString) as AiAnswerEvaluation;
        return parsed;

    } catch (error) {
        console.error('[ai.ts] Error fetching AI answer evaluation:', error);
        return null;
    }
};

// Function to get an example for a specific word-translation pair
export const getSpecificExample = async (word: string, translation: string, language: 'English' | 'Russian'): Promise<string | null> => {
    const sourceLang = language;
    const targetLang = language === 'English' ? 'Russian' : 'English';

    // Keep prompt very focused
    const prompt = `Provide one simple example sentence in ${sourceLang} using the word "${word}" where it means "${translation}" in ${targetLang}. Focus on illustrating this specific meaning. Output only the sentence text itself.`;

    console.log('Specific AI Example Prompt:', prompt);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Specific AI example API error ${response.status}:`, errorBody);
            return `[AI Error: ${response.status}]`;
        }

        const data = await response.json();
        const example = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!example) {
            console.warn('Specific AI did not return a valid example sentence.', data);
            return '[AI: No example found]';
        }

        console.log('Specific AI Example Received:', example);
        return example;

    } catch (error: any) {
        console.error('Error fetching specific AI example:', error);
        return '[Network Error]';
    }
}; 