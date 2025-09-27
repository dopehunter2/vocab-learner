import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Pressable, TextInput, Keyboard, Platform, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useVocabularyStore } from '../store/useVocabularyStore';
import { Rating, ReviewRating } from '../logic/srs';
import { VocabularyItem } from '../types/vocabulary';
// Import AI function
import {
    getAIExample,
    getAiEvaluationForAnswer,
    AiAnswerEvaluation
} from '../services/ai';
import { playText } from '../services/pronunciationService';
import { Ionicons } from '@expo/vector-icons';

// Dark Theme Color Palette (Should be centralized in a theme file eventually)
const PRIMARY_BACKGROUND = '#121212';
const SURFACE_BACKGROUND = '#1E1E1E';
const PRIMARY_TEXT = '#E0E0E0';
const SECONDARY_TEXT = '#A0A0A0';
const ACCENT_COLOR = '#64FFDA'; // Teal/Cyan
const ACCENT_COLOR_BUTTON_TEXT = '#000000'; // Black text for high contrast on ACCENT_COLOR buttons
const ERROR_COLOR = '#CF6679';
const BORDER_COLOR = '#2C2C2C';

// Rating Button Specific Colors (Can be kept as they are often designed to stand out)
const RATING_AGAIN_BG = '#dc3545'; // Red
const RATING_HARD_BG = '#ffc107'; // Yellow/Orange
const RATING_GOOD_BG = '#28a745'; // Green
const RATING_EASY_BG = '#17a2b8'; // Teal/Blue
const RATING_BUTTON_TEXT_COLOR = '#FFFFFF';

type SubmissionStatus = 'pending' | 'correct' | 'incorrect' | 'revealed_directly';

// Helper function to render text with a bold segment
const renderTextWithBoldSegment = (fullText: string | undefined, boldSegment: string | undefined): React.ReactNode => {
  if (!fullText) {
    return null; // Return null for empty/undefined text to prevent rendering errors
  }
  if (!boldSegment || fullText === boldSegment) { // If the full text is the word to bold, just return it bolded
    return <Text style={styles.boldTextInContext}>{fullText}</Text>;
  }
  const escapedBoldSegment = boldSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = fullText.split(new RegExp(`(${escapedBoldSegment})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === boldSegment.toLowerCase() ? (
      <Text key={index} style={styles.boldTextInContext}>{part}</Text>
    ) : (
      part
    )
  );
};

export const ReviewScreen: React.FC = () => {
    const {
        dueCards,
        isLoadingDueCards,
        errorLoadingDueCards,
        fetchDueCards,
        reviewCard,
        actualDueCount
    } = useVocabularyStore();

    // Input and submission state
    const [typedAnswer, setTypedAnswer] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('pending');
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [isLoadingAIResponse, setIsLoadingAIResponse] = useState(false);
    const [aiEvaluation, setAiEvaluation] = useState<AiAnswerEvaluation | null>(null);

    // New state variables for card display
    const [questionText, setQuestionText] = useState<string>(''); // Will now be just the word
    const [wordToPrompt, setWordToPrompt] = useState<string>(''); // Same as questionText
    const [currentContextSentence, setCurrentContextSentence] = useState<string | undefined>(undefined);
    const [expectedAnswers, setExpectedAnswers] = useState<string[]>([]);
    const [primaryAnswer, setPrimaryAnswer] = useState<string>(''); // The first answer in the list to show if incorrect
    const [isReviewSwapped, setIsReviewSwapped] = useState(false); // To know if we are showing back and asking for front
    const [currentDisplayLanguage, setCurrentDisplayLanguage] = useState('English'); // Default, adjust as needed

    // AI Example state
    const [aiExample, setAiExample] = useState<string | null>(null);
    const [isLoadingAiExample, setIsLoadingAiExample] = useState(false);

    const currentCard: VocabularyItem | undefined = dueCards[0];

    const fetchAndSetAiExample = useCallback(async (wordForExample: string, languageOfWord: 'English' | 'Russian') => {
        if (!wordForExample || !languageOfWord) return;
        setIsLoadingAiExample(true);
        setAiExample(null); // Clear previous example
        try {
            const example = await getAIExample(wordForExample, languageOfWord);
            setAiExample(example);
        } catch (err) {
            console.error("Error fetching AI example in ReviewScreen:", err);
            setAiExample('[Could not fetch another example]');
        } finally {
            setIsLoadingAiExample(false);
        }
    }, []);

    const resetCardStateAndDetermineReviewDirection = useCallback(() => {
        setTypedAnswer('');
        setSubmissionStatus('pending');
        setIsAnswerChecked(false);
        Keyboard.dismiss();
        setCurrentContextSentence(undefined); // Reset context sentence
        setAiExample(null); // Reset AI example as well
        setAiEvaluation(null);
        setIsLoadingAIResponse(false);

        if (currentCard) {
            const swap = Math.random() < 0.5;
            setIsReviewSwapped(swap);
            let wordForExampleFetch = '';
            let languageOfWordForExample: 'English' | 'Russian' = 'English'; // Default

            if (swap) { // Show the primary translation, expect the original word
                const primaryTranslation = currentCard.translations[0];
                setQuestionText(primaryTranslation);
                setWordToPrompt(primaryTranslation);
                // Context for translations is not stored on the item, so it will be undefined for now.
                // This is where a future feature could fetch a specific example.
                setCurrentContextSentence(undefined); 
                wordForExampleFetch = primaryTranslation;
                setExpectedAnswers([currentCard.frontWord]);
                setPrimaryAnswer(currentCard.frontWord);
                // This language detection is a simplification and might need improvement.
                setCurrentDisplayLanguage(/[а-яА-Я]/.test(primaryTranslation) ? 'Russian' : 'English');
                languageOfWordForExample = /[а-яА-Я]/.test(primaryTranslation) ? 'Russian' : 'English';
            } else { // Show original word, expect any of the translations
                setQuestionText(currentCard.frontWord);
                setWordToPrompt(currentCard.frontWord);
                setCurrentContextSentence(currentCard.frontContext);
                wordForExampleFetch = currentCard.frontWord;
                setExpectedAnswers(currentCard.translations);
                setPrimaryAnswer(currentCard.translations[0]);
                setCurrentDisplayLanguage(/[а-яА-Я]/.test(currentCard.frontWord) ? 'Russian' : 'English');
                languageOfWordForExample = /[а-яА-Я]/.test(currentCard.frontWord) ? 'Russian' : 'English';
            }
            // Fetch an AI example if no context is available for the displayed word.
            if (!currentContextSentence && wordForExampleFetch) {
                 fetchAndSetAiExample(wordForExampleFetch, languageOfWordForExample);
            }
        } else {
            setQuestionText('');
            setWordToPrompt('');
            setCurrentContextSentence(undefined);
            setExpectedAnswers([]);
            setPrimaryAnswer('');
            setAiExample(null);
        }
    }, [currentCard, fetchAndSetAiExample]);

    useEffect(() => {
        fetchDueCards();
    }, [fetchDueCards]);

    useEffect(() => {
        resetCardStateAndDetermineReviewDirection();
    }, [currentCard?.id, resetCardStateAndDetermineReviewDirection]);

    const handleCheckAnswer = async () => {
        if (!currentCard || expectedAnswers.length === 0) return;
        
        Keyboard.dismiss();
        const userAnswer = typedAnswer.trim();
        const isLocallyCorrect = expectedAnswers.some(answer => answer.toLowerCase() === userAnswer.toLowerCase());

        if (isLocallyCorrect) {
            setSubmissionStatus('correct');
            setIsAnswerChecked(true);
            return;
        }

        // --- Tier 2: AI Semantic Check ---
        setIsLoadingAIResponse(true);
        const evaluation = await getAiEvaluationForAnswer(wordToPrompt, expectedAnswers, userAnswer);
        setIsLoadingAIResponse(false);
        setAiEvaluation(evaluation);
        
        if (evaluation?.evaluation === 'Correct' || evaluation?.evaluation === 'Partially Correct') {
            setSubmissionStatus('correct'); // Treat "Partially Correct" as correct for SRS purposes
        } else {
            setSubmissionStatus('incorrect');
        }
        setIsAnswerChecked(true);
    };

    const handleShowAnswer = () => {
        setIsAnswerChecked(true);
        setSubmissionStatus('revealed_directly');
        Keyboard.dismiss();
    };

    const handleReview = async (rating: ReviewRating) => {
        if (!currentCard) return;
        await reviewCard(currentCard.id, rating);
        // State update (moving to next card) will be handled by dueCards changing in store
    };

    const playDisplayedWord = () => {
        if (wordToPrompt) {
            playText(wordToPrompt, currentDisplayLanguage);
        }
    };

    if (isLoadingDueCards && !currentCard) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
                <Text style={styles.loadingText}>Loading review cards...</Text>
            </View>
        );
    }

    if (errorLoadingDueCards) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>Error: {errorLoadingDueCards}</Text>
                <Pressable style={styles.actionButton} onPress={() => fetchDueCards()}>
                    <Text style={styles.actionButtonText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    if (!currentCard) {
        if (isLoadingDueCards || actualDueCount === 0) {
            return (
                <View style={styles.centeredContainer}>
                    <Text style={styles.infoText}>🎉 No cards due for review right now! 🎉</Text>
                    <Pressable style={styles.actionButton} onPress={() => fetchDueCards()}>
                        <Text style={styles.actionButtonText}>Check Again</Text>
                    </Pressable>
                </View>
            );
        } else {
            return (
                <View style={styles.centeredContainer}>
                    <Text style={styles.infoText}>Current batch finished!</Text>
                    <Text style={styles.infoTextSubtle}>({actualDueCount} more card(s) due overall)</Text>
                    <Pressable style={[styles.actionButton, styles.nextBatchButton]} onPress={() => fetchDueCards()}>
                        <Text style={styles.actionButtonText}>Review Next Batch</Text>
                    </Pressable>
                </View>
            );
        }
    }

    const feedbackFullAnswer = primaryAnswer;

    const headerHeight = Platform.OS === 'ios' ? 60 : 70;

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: PRIMARY_BACKGROUND }} // Ensure KAV also has background
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={headerHeight} // Adjust this value as needed
        >
            <View style={styles.container}>
                <View style={styles.cardArea}>
                    <Text style={styles.directionHintText}>
                        {isReviewSwapped ? `What is the original of this translation?` : `Translate this:`}
                    </Text>
                    <View style={styles.wordDisplayContainer}> 
                        <Text style={styles.wordText}>{renderTextWithBoldSegment(questionText, wordToPrompt)}</Text>
                        {wordToPrompt && (
                            <TouchableOpacity 
                                onPress={playDisplayedWord}
                                style={styles.speakerButton}
                            >
                                <Ionicons name="volume-medium-outline" size={24} color={ACCENT_COLOR} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Display primary context sentence OR AI fetched example */}
                    {currentContextSentence && (
                        <View style={styles.contextSentenceArea}>
                            <Text style={styles.contextSentenceTextStyle}>{currentContextSentence}</Text>
                        </View>
                    )}
                    {isLoadingAiExample && !currentContextSentence && (
                        <ActivityIndicator color={ACCENT_COLOR} style={{ marginVertical: 10 }} />
                    )}
                    {aiExample && !isLoadingAiExample && !currentContextSentence && (
                        <View style={styles.contextSentenceArea}> {/* Re-use style or make specific AI ex style */}
                            <Text style={styles.aiExampleLabel}>Another example:</Text>
                            <Text style={styles.contextSentenceTextStyle}>{aiExample}</Text>
                        </View>
                    )}

                    {isAnswerChecked && submissionStatus !== 'pending' && (
                        <View style={styles.feedbackArea}>
                            {submissionStatus === 'correct' && !aiEvaluation && (
                                <Text style={styles.correctText}>Correct!</Text>
                            )}
                            {aiEvaluation && (
                                <View style={styles.aiFeedbackContainer}>
                                    <Text style={[styles.aiFeedbackEvaluation, aiEvaluation.evaluation === 'Correct' ? styles.correctText : styles.incorrectText]}>
                                        AI says: {aiEvaluation.evaluation}
                                    </Text>
                                    <Text style={styles.aiFeedbackExplanation}>"{aiEvaluation.explanation}"</Text>
                                </View>
                            )}
                            {(submissionStatus === 'incorrect' || submissionStatus === 'revealed_directly') && !aiEvaluation && (
                                <Text style={styles.revealedText}>Correct: {feedbackFullAnswer}</Text>
                            )}
                            {submissionStatus === 'incorrect' && <Text style={styles.incorrectText}>Your answer: {typedAnswer}</Text>}
                        </View>
                    )}
                </View>

                {isLoadingAIResponse && (
                    <View style={styles.aiLoadingContainer}>
                        <ActivityIndicator color={ACCENT_COLOR} />
                        <Text style={styles.aiLoadingText}>Asking AI for evaluation...</Text>
                    </View>
                )}

                {!isAnswerChecked && !isLoadingAIResponse && (
                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type the translation"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={typedAnswer}
                            onChangeText={setTypedAnswer}
                            onSubmitEditing={handleCheckAnswer}
                            blurOnSubmit={false}
                            selectionColor={ACCENT_COLOR}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.inputButtonsContainer}>
                            <Pressable 
                                style={[styles.actionButton, !typedAnswer.trim() ? styles.disabledButton : {}]} 
                                onPress={handleCheckAnswer} 
                                disabled={!typedAnswer.trim()}
                            >
                                <Text style={styles.actionButtonText}>Check Answer</Text>
                            </Pressable>
                            <View style={styles.buttonSpacer} />
                            <Pressable style={styles.secondaryButton} onPress={handleShowAnswer}>
                                 <Text style={styles.secondaryButtonText}>Show Answer</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {isAnswerChecked && (
                    <View style={styles.ratingArea}>
                        <Text style={styles.ratingPromptText}>How well did you know it?</Text>
                        <View style={styles.ratingButtonsContainer}>
                            {[Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map((rating) => (
                                <Pressable
                                    key={rating}
                                    style={[styles.ratingButton, 
                                        rating === Rating.Again && styles.ratingAgain,
                                        rating === Rating.Hard && styles.ratingHard,
                                        rating === Rating.Good && styles.ratingGood,
                                        rating === Rating.Easy && styles.ratingEasy
                                    ]}
                                    onPress={() => handleReview(rating as ReviewRating)}
                                >
                                    <Text style={styles.ratingButtonText}>
                                        {rating === Rating.Again ? 'Again' : rating === Rating.Hard ? 'Hard' : rating === Rating.Good ? 'Good' : 'Easy'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: PRIMARY_BACKGROUND, 
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
        backgroundColor: PRIMARY_BACKGROUND,
    },
    cardArea: {
        minHeight: 120, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: SURFACE_BACKGROUND,
        borderRadius: 12, // Slightly more rounded
        padding: 20, // Increased padding
        marginBottom: 20, // Increased margin
        shadowColor: '#000', // Shadow for depth
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    directionHintText: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        fontStyle: 'italic',
        marginBottom: 8, // Increased margin
        alignSelf: 'flex-start',
    },
    wordText: {
        fontSize: 34, // Slightly larger
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12, // Increased margin
        color: PRIMARY_TEXT,
    },
    feedbackArea: {
        marginTop: 15, // Increased margin
        padding: 12, // Increased padding
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    correctText: {
        fontSize: 19, // Slightly larger
        color: '#4CAF50', // A brighter green
        fontWeight: 'bold',
    },
    incorrectText: {
        fontSize: 19, // Slightly larger
        color: ERROR_COLOR,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    revealedText: {
        fontSize: 19, // Slightly larger
        color: ACCENT_COLOR, // Use accent for revealed
        fontWeight: 'bold',
        textAlign: 'center',
    },
    inputArea: {
        marginBottom: 25, // Increased margin
    },
    textInput: {
        backgroundColor: SURFACE_BACKGROUND,
        color: PRIMARY_TEXT,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 8,
        paddingHorizontal: 18, // Increased padding
        paddingVertical: 15,
        fontSize: 18,
        marginBottom: 20, // Increased margin
    },
    inputButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Changed to space-around
    },
    buttonSpacer: {
        width: 15, // Increased spacer
    },
    actionButton: {
        backgroundColor: ACCENT_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
        marginVertical: 5, // Add some vertical margin for multiple buttons
    },
    actionButtonText: {
        color: ACCENT_COLOR_BUTTON_TEXT, // Black for high contrast
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent', // Secondary can be less prominent
        borderColor: ACCENT_COLOR,
        borderWidth: 1.5,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    secondaryButtonText: {
        color: ACCENT_COLOR,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
      backgroundColor: '#4A4A4A', // Darker, disabled look
      borderColor: '#333333',
    },
    ratingArea: {
        marginTop: 20,
        alignItems: 'center',
    },
    ratingPromptText: {
        fontSize: 16,
        color: SECONDARY_TEXT,
        marginBottom: 15,
    },
    ratingButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    ratingButton: {
        paddingVertical: 14, // Increased padding
        paddingHorizontal: 12, 
        borderRadius: 10, // More rounded
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80, // Increased minWidth
        marginHorizontal: 3, // Slight margin between buttons
        elevation: 3, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    ratingButtonText: {
        color: RATING_BUTTON_TEXT_COLOR,
        fontSize: 16,
        fontWeight: 'bold',
    },
    ratingAgain: { backgroundColor: RATING_AGAIN_BG },
    ratingHard: { backgroundColor: RATING_HARD_BG },
    ratingGood: { backgroundColor: RATING_GOOD_BG },
    ratingEasy: { backgroundColor: RATING_EASY_BG },
    errorText: {
        color: ERROR_COLOR,
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
    },
    infoText: {
        fontSize: 20,
        color: PRIMARY_TEXT,
        textAlign: 'center',
        marginBottom: 10,
    },
    infoTextSubtle: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingText: {
        fontSize: 16,
        color: PRIMARY_TEXT,
        marginTop: 10,
    },
    wordDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    speakerButton: {
        marginLeft: 10,
        padding: 5,
    },
    ratingEasyText: {
        color: RATING_BUTTON_TEXT_COLOR,
        fontWeight: 'bold',
    },
    boldTextInContext: {
        fontWeight: 'bold',
        // Potentially inherit color or set explicitly if needed
        // color: PRIMARY_TEXT, // Example if it needs to match surrounding text
    },
    aiExampleAreaInline: { // Style for AI example shown within the card area
        marginTop: 10,
        padding: 10,
        backgroundColor: PRIMARY_BACKGROUND, // Slightly different background or border to distinguish
        borderRadius: 6,
        width: '100%',
        alignItems: 'center',
    },
    aiExampleTitle: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        marginBottom: 5,
    },
    aiExampleText: {
        fontSize: 15,
        color: PRIMARY_TEXT,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    contextSentenceArea: { // Area for the main context sentence or AI fetched one
        marginTop: 8,
        paddingHorizontal: 10,
        width: '100%',
        alignItems: 'center',
    },
    contextSentenceTextStyle: { // Style for the context sentence text
        fontSize: 16,
        color: PRIMARY_TEXT, // Ensure it's visible on dark background
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 5,
    },
    aiExampleLabel: {
        fontSize: 14,
        color: ACCENT_COLOR, // Use accent to denote it's an additional AI example
        marginBottom: 3,
        fontStyle: 'italic',
    },
    nextBatchButton: {
        backgroundColor: '#00796B', // A different color for distinction
    },
    // AI Feedback Styles
    aiFeedbackContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    aiFeedbackEvaluation: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    aiFeedbackExplanation: {
        fontSize: 16,
        color: SECONDARY_TEXT,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    aiLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    aiLoadingText: {
        color: ACCENT_COLOR,
        marginLeft: 10,
        fontSize: 16,
    },
}); 