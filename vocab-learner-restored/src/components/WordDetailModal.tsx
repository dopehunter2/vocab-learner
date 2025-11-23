import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VocabularyItem } from '../types/vocabulary';
import { getBilingualExample, BilingualExample } from '../services/ai';
import { playText } from '../services/pronunciationService';

// Dark Theme Colors
const PRIMARY_BACKGROUND = '#121212';
const SURFACE_BACKGROUND = '#1E1E1E';
const PRIMARY_TEXT = '#E0E0E0';
const SECONDARY_TEXT = '#A0A0A0';
const ACCENT_COLOR = '#64FFDA';
const BORDER_COLOR = '#2C2C2C';

interface WordDetailModalProps {
    visible: boolean;
    item: VocabularyItem | null;
    onClose: () => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({ visible, item, onClose }) => {
    const [bilingualExamples, setBilingualExamples] = useState<Record<string, BilingualExample | null>>({});
    const [loadingExamples, setLoadingExamples] = useState<Record<string, boolean>>({});

    // Fetch bilingual examples when modal opens
    useEffect(() => {
        let isMounted = true; // --- Add this flag

        if (visible && item) {
            // Clear previous examples
            setBilingualExamples({});
            setLoadingExamples({});

            // Fetch examples for each translation
            item.translations.forEach(async (translation) => {
                if (!isMounted) return; // --- Check flag before starting
                setLoadingExamples(prev => ({ ...prev, [translation]: true }));
                
                const sourceLanguage = item.frontWord.match(/[а-яА-ЯёЁ]/) ? 'Russian' : 'English';
                const example = await getBilingualExample(item.frontWord, sourceLanguage, translation);
                
                if (isMounted) { // --- Check flag before updating state
                    setBilingualExamples(prev => ({ ...prev, [translation]: example }));
                    setLoadingExamples(prev => ({ ...prev, [translation]: false }));
                }
            });
        }
        
        // --- Add cleanup function ---
        return () => {
            isMounted = false;
        };
    }, [visible, item]);

    if (!item) return null;

    const handlePlayPronunciation = () => {
        const language = item.frontWord.match(/[а-яА-ЯёЁ]/) ? 'Russian' : 'English';
        playText(item.frontWord, language);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitle}>
                            <Text style={styles.mainWord}>{item.frontWord}</Text>
                            <TouchableOpacity onPress={handlePlayPronunciation} style={styles.speakerButton}>
                                <Ionicons name="volume-high" size={28} color={ACCENT_COLOR} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={PRIMARY_TEXT} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Translations</Text>
                        
                        {item.translations.map((translation, index) => (
                            <View key={index} style={styles.translationBlock}>
                                <Text style={styles.translationText}>{translation}</Text>
                                
                                {/* Bilingual Example */}
                                {loadingExamples[translation] ? (
                                    <View style={styles.exampleLoading}>
                                        <ActivityIndicator size="small" color={ACCENT_COLOR} />
                                        <Text style={styles.exampleLoadingText}>Loading example...</Text>
                                    </View>
                                ) : bilingualExamples[translation] ? (
                                    <View style={styles.exampleContainer}>
                                        <Text style={styles.exampleSentence}>
                                            {bilingualExamples[translation]!.sourceSentence}
                                        </Text>
                                        <Text style={styles.exampleTranslation}>
                                            {bilingualExamples[translation]!.translationSentence}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        ))}

                        {/* Context (if available) */}
                        {item.frontContext && (
                            <View style={styles.contextSection}>
                                <Text style={styles.sectionTitle}>Context</Text>
                                <Text style={styles.contextText}>{item.frontContext}</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: SURFACE_BACKGROUND,
        borderRadius: 12,
        padding: 20,
        elevation: 5,
        flexShrink: 1, // Allow the container to shrink if needed
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
        paddingBottom: 15,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    mainWord: {
        fontSize: 28,
        fontWeight: 'bold',
        color: PRIMARY_TEXT,
        marginRight: 12,
    },
    speakerButton: {
        padding: 8,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        // No flex: 1 here, ScrollView will manage its own size within the container
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: ACCENT_COLOR,
        marginBottom: 12,
        marginTop: 8,
    },
    translationBlock: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: PRIMARY_BACKGROUND,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: ACCENT_COLOR,
    },
    translationText: {
        fontSize: 20,
        fontWeight: '600',
        color: PRIMARY_TEXT,
        marginBottom: 8,
    },
    exampleLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    exampleLoadingText: {
        marginLeft: 8,
        color: SECONDARY_TEXT,
        fontStyle: 'italic',
    },
    exampleContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR,
    },
    exampleSentence: {
        fontSize: 14,
        color: PRIMARY_TEXT,
        marginBottom: 6,
        lineHeight: 20,
    },
    exampleTranslation: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    contextSection: {
        marginTop: 16,
        padding: 12,
        backgroundColor: PRIMARY_BACKGROUND,
        borderRadius: 8,
    },
    contextText: {
        fontSize: 14,
        color: SECONDARY_TEXT,
        lineHeight: 20,
    },
});

