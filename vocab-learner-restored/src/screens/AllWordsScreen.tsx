import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useVocabularyStore } from '../store/useVocabularyStore';
import { VocabularyItem } from '../types/vocabulary';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { State } from 'ts-fsrs';
import { WordDetailModal } from '../components/WordDetailModal';

// Dark Theme Color Palette
const PRIMARY_BACKGROUND = '#121212';
const SURFACE_BACKGROUND = '#1E1E1E';
const PRIMARY_TEXT = '#E0E0E0';
const SECONDARY_TEXT = '#A0A0A0';
const ACCENT_COLOR = '#64FFDA';
const ERROR_COLOR = '#CF6679';
const BORDER_COLOR = '#2C2C2C';

// --- Progress Calculation Constants ---
const PERCENT_NEW = 0;
const PERCENT_LEARNING = 30;
const PERCENT_RELEARNING = 50; // Was forgotten, slightly higher base than learning
const PERCENT_REVIEW_BASE = 60;
const STABILITY_FOR_MAX_REVIEW_PERCENT = 90; // Stability in days for 100% in review state
const REVIEW_PERCENT_FROM_STABILITY = 100 - PERCENT_REVIEW_BASE; // e.g. 40% comes from stability

interface ProgressInfo {
    statusText: string;
    progressPercent: number;
}

// Helper function to get displayable state string and progress percentage
const getDisplayProgressInfo = (state: State, stability: number): ProgressInfo => {
    let statusText = 'Unknown';
    let progressPercent = 0;

    switch (state) {
        case State.New:
            statusText = 'New';
            progressPercent = PERCENT_NEW;
            break;
        case State.Learning:
            statusText = 'Learning';
            progressPercent = PERCENT_LEARNING;
            break;
        case State.Review:
            statusText = 'Review';
            // Calculate progress: base + portion from stability, capped at 100%
            progressPercent = Math.min(
                PERCENT_REVIEW_BASE + (stability / STABILITY_FOR_MAX_REVIEW_PERCENT) * REVIEW_PERCENT_FROM_STABILITY,
                100
            );
            break;
        case State.Relearning:
            statusText = 'Relearning';
            progressPercent = PERCENT_RELEARNING;
            break;
        default:
            // Should not happen with valid State enum but good to have a default
            progressPercent = 0;
            break;
    }
    // Ensure percentage is not negative if stability is somehow negative (though unlikely for FSRS)
    progressPercent = Math.max(0, progressPercent);
    return { statusText, progressPercent: Math.round(progressPercent) }; // Round to nearest integer
};

export const AllWordsScreen: React.FC = () => {
    // Get state and actions from Zustand store
    const {
        allCards,
        isLoadingAllCards,
        errorLoadingAllCards,
        fetchAllCards,
        deleteCard
    } = useVocabularyStore();

    // State for Word Detail Modal
    const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // State for Sorting
    type SortOption = 'none' | 'en-az' | 'en-za' | 'ru-az' | 'ru-za';
    const [sortOption, setSortOption] = useState<SortOption>('none');

    // Helper function to detect if text is Russian (contains Cyrillic characters)
    const isRussian = (text: string): boolean => {
        return /[а-яА-ЯёЁ]/.test(text);
    };

    // Sorted cards using useMemo for performance
    const sortedCards = useMemo(() => {
        const cards = [...allCards];
        
        if (sortOption === 'none') return cards;

        return cards.sort((a, b) => {
            const aWord = a.frontWord.toLowerCase();
            const bWord = b.frontWord.toLowerCase();

            if (sortOption === 'en-az') {
                // English A-Z: Russian words go to end
                if (isRussian(a.frontWord) && !isRussian(b.frontWord)) return 1;
                if (!isRussian(a.frontWord) && isRussian(b.frontWord)) return -1;
                return aWord.localeCompare(bWord, 'en');
            }

            if (sortOption === 'en-za') {
                // English Z-A: Russian words go to end
                if (isRussian(a.frontWord) && !isRussian(b.frontWord)) return 1;
                if (!isRussian(a.frontWord) && isRussian(b.frontWord)) return -1;
                return bWord.localeCompare(aWord, 'en');
            }

            if (sortOption === 'ru-az') {
                // Russian А-Я: English words go to end
                if (!isRussian(a.frontWord) && isRussian(b.frontWord)) return 1;
                if (isRussian(a.frontWord) && !isRussian(b.frontWord)) return -1;
                return aWord.localeCompare(bWord, 'ru');
            }

            if (sortOption === 'ru-za') {
                // Russian Я-А: English words go to end
                if (!isRussian(a.frontWord) && isRussian(b.frontWord)) return 1;
                if (isRussian(a.frontWord) && !isRussian(b.frontWord)) return -1;
                return bWord.localeCompare(aWord, 'ru');
            }

            return 0;
        });
    }, [allCards, sortOption]);

    const handleItemPress = (item: VocabularyItem) => {
        setSelectedItem(item);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedItem(null);
    };

    // Fetch cards when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log('AllWordsScreen focused, fetching cards...');
            fetchAllCards();
            // Optional: Return a cleanup function if needed, though likely not for fetchAllCards
            // return () => console.log('AllWordsScreen blurred');
        }, [fetchAllCards]) // Dependency includes fetchAllCards
    );

    // --- Delete Handler ---
    const handleDeletePress = (id: string, word: string) => {
        Alert.alert(
            'Delete Word',
            `Are you sure you want to delete "${word}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => console.log('Delete cancelled') },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCard(id);
                        } catch (error) {
                            console.error('Deletion failed from screen:', error);
                        }
                    },
                },
            ],
            { cancelable: true } // Removed non-standard titleStyle and messageStyle
        );
    };

    // Render item function for FlatList
    const renderItem = ({ item }: { item: VocabularyItem }) => {
        const { statusText, progressPercent } = getDisplayProgressInfo(item.state, item.stability);
        
        // Join the translations array for display.
        const displayFront = item.frontWord || '[No Front Word]';
        const displayBack = (item.translations && item.translations.length > 0)
            ? item.translations.join(', ')
            : '[No Translations]';

        return (
            <TouchableOpacity onPress={() => handleItemPress(item)} activeOpacity={0.7}>
                <View style={styles.itemContainer}>
                    <View style={styles.textWrapper}> 
                        <Text style={styles.wordText}>{displayFront}</Text>
                        <Text style={styles.translationText}>{displayBack}</Text>
                        <Text style={styles.stateText}>Status: {statusText} ({progressPercent}%)</Text>
                    </View>
                    <Pressable onPress={() => handleDeletePress(item.id, displayFront)} style={styles.deleteButton}>
                        <MaterialCommunityIcons name="trash-can-outline" size={26} color={ERROR_COLOR} />
                    </Pressable>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading state
    if (isLoadingAllCards) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
                <Text style={styles.loadingText}>Loading vocabulary...</Text>
            </View>
        );
    }

    // Error state
    if (errorLoadingAllCards) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>Error loading vocabulary:</Text>
                <Text style={styles.errorText}>{errorLoadingAllCards}</Text>
            </View>
        );
    }

    // Empty state
    if (allCards.length === 0) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.infoText}>Your vocabulary list is empty.</Text>
                <Text style={styles.infoText}>Add some words using the 'Add New Word' tab!</Text>
            </View>
        );
    }

    // Main list view
    return (
        <View style={styles.listScreenContainer}>
            {/* Sorting Controls */}
            <View style={styles.sortingContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={sortOption}
                        onValueChange={(value) => setSortOption(value as SortOption)}
                        style={styles.picker}
                        dropdownIconColor={ACCENT_COLOR}
                    >
                        <Picker.Item label="Default" value="none" />
                        <Picker.Item label="English (A-Z)" value="en-az" />
                        <Picker.Item label="English (Z-A)" value="en-za" />
                        <Picker.Item label="Russian (А-Я)" value="ru-az" />
                        <Picker.Item label="Russian (Я-А)" value="ru-za" />
                    </Picker>
                </View>
            </View>

            <FlatList
                data={sortedCards}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
            <WordDetailModal
                visible={isModalVisible}
                item={selectedItem}
                onClose={handleCloseModal}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    listScreenContainer: { // New container for the whole screen
        flex: 1,
        backgroundColor: PRIMARY_BACKGROUND,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: PRIMARY_BACKGROUND, // Ensure this is set
    },
    listContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    itemContainer: {
        backgroundColor: SURFACE_BACKGROUND,
        paddingVertical: 15, // Increased padding
        paddingHorizontal: 20, // Increased padding
        marginBottom: 12, // Increased margin
        borderRadius: 10, // More rounded
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000', // Shadow for depth
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textWrapper: {
        flex: 1,
        marginRight: 10, // Increased margin
    },
    wordText: {
        fontSize: 19, // Slightly larger
        fontWeight: '600', // Bolder
        marginBottom: 4, // Increased margin
        color: PRIMARY_TEXT,
    },
    translationText: {
        fontSize: 17, // Slightly larger
        color: SECONDARY_TEXT,
        marginBottom: 6, // Add some margin
    },
    stateText: {
        fontSize: 15, // Slightly larger
        color: ACCENT_COLOR, // Use accent for status
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 8, // Increased padding for easier touch
        marginLeft: 10,
    },
    errorText: {
        color: ERROR_COLOR,
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
    },
    infoText: {
        fontSize: 17, // Slightly larger
        textAlign: 'center',
        color: PRIMARY_TEXT,
        lineHeight: 24, // Improved readability
    },
    loadingText: {
        color: PRIMARY_TEXT,
        marginTop: 10,
        fontSize: 16,
    },
    sortingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: SURFACE_BACKGROUND,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    sortLabel: {
        fontSize: 14,
        color: PRIMARY_TEXT,
        fontWeight: '600',
        marginRight: 10,
    },
    pickerWrapper: {
        flex: 1,
        backgroundColor: '#000000',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        overflow: 'hidden',
    },
    picker: {
        color: ACCENT_COLOR,
        backgroundColor: '#000000',
    }
}); 