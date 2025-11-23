import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView
} from 'react-native';
import { useVocabularyStore } from '../store/useVocabularyStore';
import { MIN_REVIEW_LIMIT, MAX_REVIEW_LIMIT, DEFAULT_REVIEW_LIMIT } from '../services/settingsService';

// Dark Theme Color Palette (consistent with other screens)
const PRIMARY_BACKGROUND = '#121212';
const SURFACE_BACKGROUND = '#1E1E1E';
const PRIMARY_TEXT = '#E0E0E0';
const SECONDARY_TEXT = '#A0A0A0';
const ACCENT_COLOR = '#64FFDA';
const ACCENT_COLOR_BUTTON_TEXT = '#000000';
const ERROR_COLOR = '#CF6679';
const BORDER_COLOR = '#2C2C2C';

export const SettingsScreen: React.FC = () => {
    const reviewLimit = useVocabularyStore(state => state.reviewLimit);
    const setReviewLimitStore = useVocabularyStore(state => state.setReviewLimit);
    const exportData = useVocabularyStore(state => state.exportData);
    const importData = useVocabularyStore(state => state.importData);


    const [inputValue, setInputValue] = useState<string>(reviewLimit.toString());

    useEffect(() => {
        setInputValue(reviewLimit.toString());
    }, [reviewLimit]);

    const handleSaveLimit = () => {
        Keyboard.dismiss();
        const numValue = parseInt(inputValue, 10);
        if (isNaN(numValue) || numValue < MIN_REVIEW_LIMIT || numValue > MAX_REVIEW_LIMIT) {
            Alert.alert(
                'Invalid Limit',
                `Please enter a number between ${MIN_REVIEW_LIMIT} and ${MAX_REVIEW_LIMIT}.`,
                [{ text: 'OK', onPress: () => setInputValue(reviewLimit.toString()) }]
            );
            return;
        }
        setReviewLimitStore(numValue);
        Alert.alert('Settings Saved', `Review limit set to ${numValue}.`);
    };

    const handleExport = async () => {
        try {
            await exportData();
            Alert.alert('Export Successful', 'Your data has been prepared for sharing.');
        } catch (error) {
            console.error(error);
            Alert.alert('Export Failed', 'Could not export your data. Please check the logs.');
        }
    };

    const handleImport = async () => {
        Alert.alert(
            'Import Data',
            'Importing data will overwrite your current vocabulary. This action cannot be undone. Are you sure you want to continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await importData();
                            // Success message will be handled within importData or here later
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Import Failed', 'Could not import your data. Please check the file and logs.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView style={styles.screenContainer} contentContainerStyle={styles.scrollContentContainer}>
                <Text style={styles.title}>Settings</Text>

                {/* Review Limit Setting */}
                <View style={styles.settingItem}>
                    <Text style={styles.label}>Review Session Limit</Text>
                    <Text style={styles.description}>
                        Set the maximum number of cards to review in a single session.
                        (Value between {MIN_REVIEW_LIMIT} and {MAX_REVIEW_LIMIT}, default: {DEFAULT_REVIEW_LIMIT})
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={`Enter limit (${MIN_REVIEW_LIMIT}-${MAX_REVIEW_LIMIT})`}
                        placeholderTextColor={SECONDARY_TEXT}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        onSubmitEditing={handleSaveLimit}
                        selectionColor={ACCENT_COLOR}
                    />
                    <Pressable style={styles.button} onPress={handleSaveLimit}>
                        <Text style={styles.buttonText}>Save Limit</Text>
                    </Pressable>
                </View>

                {/* Data Management Section */}
                <View style={styles.settingItem}>
                    <Text style={styles.label}>Data Management</Text>
                    <Text style={styles.description}>
                        Save your vocabulary and progress to a file, or import it on another device.
                    </Text>
                    <Pressable style={styles.button} onPress={handleExport}>
                        <Text style={styles.buttonText}>Export All Data</Text>
                    </Pressable>
                    <View style={{ marginVertical: 8 }} />
                    <Pressable style={[styles.button, styles.importButton]} onPress={handleImport}>
                        <Text style={[styles.buttonText, styles.importButtonText]}>Import from File</Text>
                    </Pressable>
                </View>

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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_TEXT,
        marginBottom: 20,
        textAlign: 'center',
    },
    settingItem: {
        backgroundColor: SURFACE_BACKGROUND,
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: '500',
        color: PRIMARY_TEXT,
        marginBottom: 5,
    },
    description: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        marginBottom: 15,
    },
    input: {
        backgroundColor: PRIMARY_BACKGROUND, // Slightly different for input within surface
        color: PRIMARY_TEXT,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        marginBottom: 15,
        textAlign: 'center',
    },
    button: {
        backgroundColor: ACCENT_COLOR,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: ACCENT_COLOR_BUTTON_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
    },
    importButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: ACCENT_COLOR,
    },
    importButtonText: {
        color: ACCENT_COLOR,
    },
});

export default SettingsScreen; 