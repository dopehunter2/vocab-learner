import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Pressable,
    Modal
} from 'react-native';
import { createInitialVocabularyItem } from '../logic/srs';
import { getWordInfo, AiLookupResult, AiTranslation, getSpellingSuggestions, getBilingualExample, BilingualExample } from '../services/ai';
import { playText } from '../services/pronunciationService';
import { Ionicons } from '@expo/vector-icons';
import { useVocabularyStore } from '../store/useVocabularyStore';
// Import navigation types if needed

// Dark Theme Color Palette
const PRIMARY_BACKGROUND = '#121212';
const SURFACE_BACKGROUND = '#1E1E1E';
const PRIMARY_TEXT = '#E0E0E0';
const SECONDARY_TEXT = '#A0A0A0';
const ACCENT_COLOR = '#64FFDA';
const ACCENT_COLOR_BUTTON_TEXT = '#000000'; // Black text for high contrast on ACCENT_COLOR buttons
const ERROR_COLOR = '#CF6679';
const BORDER_COLOR = '#2C2C2C';
const WARNING_COLOR = '#FFC107'; // Yellow for warnings

export const AddWordScreen: React.FC = () => {
    const [lookupWord, setLookupWord] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [wordInfo, setWordInfo] = useState<AiLookupResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedTranslationObjects, setSelectedTranslationObjects] = useState<AiTranslation[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [suggestions, setSuggestions] = useState<string[] | null>(null);
    const [lookupAttempted, setLookupAttempted] = useState(false);
    const [typoWarningSuggestion, setTypoWarningSuggestion] = useState<string | null>(null);

    // State for the bilingual example modal
    const [isExampleModalVisible, setIsExampleModalVisible] = useState(false);
    const [selectedTranslationForExample, setSelectedTranslationForExample] = useState<AiTranslation | null>(null);
    const [bilingualExample, setBilingualExample] = useState<BilingualExample | null>(null);
    const [isLoadingBilingualExample, setIsLoadingBilingualExample] = useState(false);

    const addCard = useVocabularyStore(state => state.addCard);

    const handleLookup = useCallback(async (wordToLookup: string) => {
        const trimmedWord = wordToLookup.trim();
        if (!trimmedWord) {
            Alert.alert('Missing Input', 'Please enter a word to look up.');
            return;
        }
        Keyboard.dismiss();
        setIsLoading(true);
        setWordInfo(null);
        setError(null);
        setSelectedTranslationObjects([]);
        setSuggestions(null);
        setLookupAttempted(true);
        setTypoWarningSuggestion(null);

        let wordInfoResult: AiLookupResult | null = null;
        let suggestionResults: string[] | null = null;
        let primaryError: string | null = null;

        try {
            wordInfoResult = await getWordInfo(trimmedWord);
            if (wordInfoResult && (wordInfoResult.translations.length > 0 || wordInfoResult.generalExamples.length > 0)) {
                setWordInfo(wordInfoResult);
            } else {
                 primaryError = 'Could not retrieve detailed information for this word.';
                 if (!wordInfoResult) { primaryError += ' Gemini API error or unexpected format.'; }
            }
        } catch (err) {
            console.error('Error looking up word:', err);
            primaryError = 'An unexpected error occurred during lookup.';
        }

        try {
            console.log('Fetching spelling suggestions for:', trimmedWord);
            suggestionResults = await getSpellingSuggestions(trimmedWord);
            if (suggestionResults && suggestionResults.length > 0) {
                setSuggestions(suggestionResults);
            } else {
                console.log('No spelling suggestions found.');
            }
        } catch (suggestionError) {
            console.error('Error fetching spelling suggestions:', suggestionError);
        }

        const hasWordInfo = wordInfoResult && (wordInfoResult.translations.length > 0 || wordInfoResult.generalExamples.length > 0);
        const hasDifferentSuggestion = 
            suggestionResults && 
            suggestionResults.length > 0 && 
            suggestionResults[0].toLowerCase() !== trimmedWord.toLowerCase();

        if (hasWordInfo && hasDifferentSuggestion && suggestionResults) {
            setTypoWarningSuggestion(suggestionResults[0]); 
        } else {
            setTypoWarningSuggestion(null);
        }

        const noSuggestionsAvailable = !suggestionResults || suggestionResults.length === 0;
        if (primaryError && !hasWordInfo && noSuggestionsAvailable) {
            setError(primaryError);
        }

        setIsLoading(false);
    }, []);

    const handleSuggestionTap = (suggestion: string) => {
        setLookupWord(suggestion);
        setSelectedTranslationObjects([]);
        handleLookup(suggestion);
    };

    const handleTranslationPress = (translationObject: AiTranslation) => {
        setSelectedTranslationObjects(prevSelected => {
            const isAlreadySelected = prevSelected.some(t => t.translation === translationObject.translation);
            if (isAlreadySelected) {
                return prevSelected.filter(t => t.translation !== translationObject.translation);
            } else {
                return [...prevSelected, translationObject];
            }
        });
    };

    const handleShowBilingualExample = async (translationObject: AiTranslation) => {
        if (!wordInfo?.originalWord || !wordInfo?.identifiedLang || wordInfo.identifiedLang === 'Unknown') return;
        
        setSelectedTranslationForExample(translationObject);
        setIsExampleModalVisible(true);
        setIsLoadingBilingualExample(true);
        setBilingualExample(null); // Clear previous example

        try {
            const example = await getBilingualExample(
                wordInfo.originalWord,
                wordInfo.identifiedLang,
                translationObject.translation
            );
            setBilingualExample(example);
        } catch (error) {
            console.error("Error fetching bilingual example:", error);
            // You might want to set an error state here to show in the modal
        } finally {
            setIsLoadingBilingualExample(false);
        }
    };

    const handleSave = async () => {
        if (!wordInfo || selectedTranslationObjects.length === 0 || !lookupWord.trim()) {
            Alert.alert('Cannot Save', 'Please look up a word and select at least one translation first.');
            return;
        }
        if (!wordInfo.identifiedLang || wordInfo.identifiedLang === 'Unknown') {
            Alert.alert('Cannot Save', 'Could not determine the language of the original word.');
            return;
        }

        setIsSaving(true);
        try {
            const sourceWord = wordInfo.originalWord;
            const allTranslations = selectedTranslationObjects.map(t => t.translation);
            // Use the first available example as the primary context for the front word.
            const frontContext = wordInfo.generalExamples?.[0] || selectedTranslationObjects[0]?.examplesForThisTranslation?.[0];

            const initialItemState = createInitialVocabularyItem(
                sourceWord,
                allTranslations,
                frontContext,
                sourceWord
            );

            await addCard(initialItemState);

            // The store now handles showing an "Updated" alert.
            // We only need to show a "Success" alert if the word was truly new,
            // which is hard to know here without returning the item from the store.
            // A simple approach is to have a generic success message or let the store handle all alerts.
            // For now, let's slightly modify the alert to be more general.
            Alert.alert('Success', `Your request to add/update "${sourceWord}" has been processed.`);

            // Reset the state after successful save
            setLookupWord('');
            setWordInfo(null);
            setSelectedTranslationObjects([]);
            setError(null);
            setSuggestions(null);
            setLookupAttempted(false);
            setTypoWarningSuggestion(null);

        } catch (err) {
            console.error('Error saving item:', err);
            // The store's addCard action will show an alert on failure.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView style={styles.screenContainer} contentContainerStyle={styles.scrollContentContainer}>
                {/* Bilingual Example Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isExampleModalVisible}
                    onRequestClose={() => setIsExampleModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Example for "{selectedTranslationForExample?.translation}"</Text>
                            {isLoadingBilingualExample ? (
                                <ActivityIndicator size="large" color={ACCENT_COLOR} />
                            ) : bilingualExample ? (
                                <>
                                    <View style={styles.examplePairContainer}>
                                        <Text style={styles.exampleLabel}>{wordInfo?.identifiedLang} Example:</Text>
                                        <Text style={styles.modalExampleText}>{bilingualExample.sourceSentence}</Text>
                                    </View>
                                    <View style={styles.examplePairContainer}>
                                        <Text style={styles.exampleLabel}>{wordInfo?.identifiedLang === 'English' ? 'Russian' : 'English'} Translation:</Text>
                                        <Text style={styles.modalExampleText}>{bilingualExample.translationSentence}</Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.modalExampleText}>Could not load an example.</Text>
                            )}
                            <Pressable style={styles.modalCloseButton} onPress={() => setIsExampleModalVisible(false)}>
                                <Text style={styles.modalCloseButtonText}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                <Text style={styles.label}>Enter a word or phrase:</Text>
                <TextInput
                    style={styles.input}
                    value={lookupWord}
                    onChangeText={(text) => {
                        setLookupWord(text);
                        setWordInfo(null);
                        setSuggestions(null);
                        setError(null);
                        setSelectedTranslationObjects([]);
                        setLookupAttempted(false);
                        setTypoWarningSuggestion(null);
                    }}
                    placeholder="Enter English or Russian word"
                    placeholderTextColor={SECONDARY_TEXT}
                    autoCapitalize="none"
                    editable={!isLoading && !isSaving}
                    onSubmitEditing={() => handleLookup(lookupWord)}
                    selectionColor={ACCENT_COLOR}
                />
                <Pressable 
                    style={[styles.button, (isLoading || isSaving || !lookupWord.trim()) ? styles.disabledButton : {}]}
                    onPress={() => handleLookup(lookupWord)}
                    disabled={isLoading || isSaving || !lookupWord.trim()}
                >
                    <Text style={styles.buttonText}>{isLoading ? 'Looking up...' : 'Look up Word'}</Text>
                </Pressable>

                {isLoading && <ActivityIndicator size="large" color={ACCENT_COLOR} style={styles.spacerV} />}

                {error && !suggestions && (!wordInfo || wordInfo.translations.length === 0) && (
                    <Text style={[styles.errorText, styles.spacerV]}>{`Error: ${error}`}</Text>
                )}

                {typoWarningSuggestion && (
                    <View style={[styles.suggestionContainer, styles.typoWarningContainer, styles.spacerV]}>
                        <Text style={styles.typoWarningText}>
                            No exact match. Did you mean '{typoWarningSuggestion}'?
                        </Text>
                        <Pressable style={styles.suggestionButtonAlt} onPress={() => handleSuggestionTap(typoWarningSuggestion)}>
                            <Text style={styles.suggestionButtonAltText}>Look up '{typoWarningSuggestion}'</Text>
                        </Pressable>
                    </View>
                )}

                {suggestions && suggestions.length > 0 && (!wordInfo || wordInfo.translations.length === 0) && !typoWarningSuggestion && (
                    <View style={[styles.suggestionContainer, styles.spacerV]}>
                        <Text style={styles.suggestionTitle}>Spelling Suggestions:</Text>
                        {suggestions.slice(0, 3).map((s, i) => (
                            <Pressable key={i} style={styles.suggestionButton} onPress={() => handleSuggestionTap(s)}>
                                <Text style={styles.suggestionText}>{s}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {wordInfo && (
                    <View style={styles.resultsContainer}>
                        <View style={styles.headerRow}>
                            <Text style={styles.sectionTitle}>Translations for "{wordInfo.originalWord}" ({wordInfo.identifiedLang})</Text>
                            <TouchableOpacity onPress={() => playText(wordInfo.originalWord, wordInfo.identifiedLang || undefined)} style={styles.pronunciationIconButton}>
                                <Ionicons name="volume-high" size={32} color={ACCENT_COLOR} />
                            </TouchableOpacity>
                        </View>

                        {wordInfo.translations.length > 0 ? (
                            <View style={styles.chipsContainer}>
                                {wordInfo.translations.map((transObj: AiTranslation, index) => {
                                    const isSelected = selectedTranslationObjects.some(t => t.translation === transObj.translation);

                                    return (
                                        <View key={`chip-container-${index}`} style={styles.translationChipOuterContainer}>
                                            <TouchableOpacity 
                                                key={`chip-${index}`} 
                                                style={[styles.translationChipUnified, isSelected && styles.selectedChip]}
                                                onPress={() => handleTranslationPress(transObj)}
                                                onLongPress={() => handleShowBilingualExample(transObj)}
                                            >
                                                <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                                                    {transObj.translation}
                                                    {transObj.partOfSpeech && <Text style={styles.posText}> ({transObj.partOfSpeech})</Text>}
                                                </Text>
                                                {transObj.examplesForThisTranslation && transObj.examplesForThisTranslation.length > 0 && (
                                                    <View style={styles.translationExampleContainer}>
                                                        <Text style={styles.translationExampleText}>
                                                            {transObj.examplesForThisTranslation[0]}
                                                        </Text>
                                                        <Text style={styles.exampleHintText}>
                                                            (Long-press for bilingual example)
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : <Text style={styles.infoText}>{lookupAttempted ? 'No translations found.' : ''}</Text>}
                        
                        {selectedTranslationObjects.length > 0 && (
                            <Pressable 
                                style={[styles.button, styles.saveButton, isSaving ? styles.disabledButton : {}]} 
                                onPress={handleSave} 
                                disabled={isSaving}
                            >
                                <Text style={styles.buttonText}>{isSaving ? 'Saving...' : `Save Selected (${selectedTranslationObjects.length})`}</Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {!isLoading && !wordInfo && lookupAttempted && !error && (!suggestions || suggestions.length === 0) && (
                    <Text style={styles.infoTextFallback}>No information found for "{lookupWord}". Try checking the spelling or a different word.</Text>
                )}
            </ScrollView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: PRIMARY_BACKGROUND,
    },
    scrollContentContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        color: SECONDARY_TEXT,
        marginBottom: 8,
    },
    input: {
        backgroundColor: SURFACE_BACKGROUND,
        color: PRIMARY_TEXT,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        marginBottom: 15,
    },
    button: {
        backgroundColor: ACCENT_COLOR,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: ACCENT_COLOR_BUTTON_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#4A4A4A', // Darker, less prominent shade for disabled
    },
    spacerV: {
        marginVertical: 15,
    },
    errorText: {
        color: ERROR_COLOR,
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 10,
    },
    infoText: {
        color: SECONDARY_TEXT,
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 10,
    },
    infoTextFallback: {
        color: SECONDARY_TEXT,
        fontSize: 15,
        textAlign: 'center',
        marginTop: 20,
    },
    resultsContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: SURFACE_BACKGROUND,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PRIMARY_TEXT,
        marginBottom: 10,
    },
    chipsContainer: {
        flexDirection: 'column',
        marginBottom: 15,
        gap: 12,
    },
    translationChip: {
        backgroundColor: '#333333', // Slightly lighter than SURFACE_BACKGROUND
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    selectedChip: {
        backgroundColor: ACCENT_COLOR,
        borderColor: ACCENT_COLOR,
    },
    chipText: {
        color: PRIMARY_TEXT,
        fontSize: 14,
        textAlign: 'center', // Center text within the chip
    },
    selectedChipText: {
        color: ACCENT_COLOR_BUTTON_TEXT,
        fontWeight: 'bold',
    },
    posText: {
        color: SECONDARY_TEXT, 
        fontStyle: 'italic',
        fontSize: 13,
    },
    exampleSection: { marginBottom: 15, paddingLeft: 10 },
    exampleTitle: { fontSize: 15, color: PRIMARY_TEXT, marginBottom: 5, fontWeight: '500' },
    exampleTextListItem: { fontSize: 14, color: SECONDARY_TEXT, marginLeft: 5, marginBottom: 3 },
    translationExampleContainer: { marginTop: 5, paddingLeft: 10 },
    translationExampleText: { fontSize: 13, color: SECONDARY_TEXT, fontStyle: 'italic' },
    saveButton: {
        marginTop: 20,
        backgroundColor: '#00BFA5',
    },
    speakerButton: {
        marginLeft: 10,
        padding: 5, // Add some padding to make it easier to press
    },
    typoWarningContainer: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)', // Light yellow background for warning
        borderColor: WARNING_COLOR,
    },
    typoWarningText: {
        color: WARNING_COLOR, // Yellow text
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 10,
    },
    suggestionButtonAlt: {
        backgroundColor: WARNING_COLOR,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    suggestionButtonAltText: {
        color: ACCENT_COLOR_BUTTON_TEXT, // High contrast text
        fontSize: 15,
        fontWeight: 'bold',
    },
    suggestionContainer: {
        padding: 15,
        backgroundColor: SURFACE_BACKGROUND, // Use surface for consistency
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        marginBottom: 15,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: PRIMARY_TEXT,
        marginBottom: 10,
    },
    suggestionButton: {
        backgroundColor: '#333333', // Same as unselected chip
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginBottom: 8,
        alignItems: 'center',
    },
    suggestionText: {
        color: ACCENT_COLOR, // Make suggestions stand out
        fontSize: 15,
        fontWeight: '500',
    },
    translationChipOuterContainer: {
        width: '100%',
    },
    // Styles for Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: SURFACE_BACKGROUND,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PRIMARY_TEXT,
        marginBottom: 15,
    },
    examplePairContainer: {
        marginBottom: 15,
        width: '100%',
    },
    exampleLabel: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        marginBottom: 5,
    },
    modalExampleText: {
        fontSize: 16,
        color: PRIMARY_TEXT,
        textAlign: 'center',
    },
    modalCloseButton: {
        backgroundColor: ACCENT_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 10,
    },
    modalCloseButtonText: {
        color: ACCENT_COLOR_BUTTON_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    pronunciationIconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: SURFACE_BACKGROUND,
        borderWidth: 1,
        borderColor: ACCENT_COLOR,
    },
    translationChipUnified: {
        backgroundColor: '#333333',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        minHeight: 100,
        width: '100%',
    },
    exampleHintText: {
        fontSize: 11,
        color: SECONDARY_TEXT,
        fontStyle: 'italic',
        marginTop: 6,
    },
}); 

export default AddWordScreen; 