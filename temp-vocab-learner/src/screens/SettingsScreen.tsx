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

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView style={styles.screenContainer} contentContainerStyle={styles.scrollContentContainer}>
                <Text style={styles.title}>Settings</Text>

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

                {/* Add more settings here in the future */}
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
});

export default SettingsScreen; 