import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const EXPORT_FILE_NAME = 'vocab-learner-export.json';
const EXPORT_MIME_TYPE = 'application/json';

/**
 * Exports data to a JSON file and prompts the user to save it.
 * @param data The data object to be stringified and exported.
 * @returns A promise that resolves when the sharing action is complete, or rejects on error.
 */
export const exportDataToFile = async (data: object): Promise<void> => {
    try {
        const fileUri = FileSystem.cacheDirectory + EXPORT_FILE_NAME;
        const jsonString = JSON.stringify(data, null, 2); // Pretty print JSON

        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        console.log(`Data successfully written to ${fileUri}`);

        if (!(await Sharing.isAvailableAsync())) {
            alert(`Sharing is not available on your platform`);
            return;
        }

        await Sharing.shareAsync(fileUri, {
            mimeType: EXPORT_MIME_TYPE,
            dialogTitle: 'Save your vocabulary export',
            UTI: 'public.json', // for iOS
        });

    } catch (error) {
        console.error('Failed to export data:', error);
        throw new Error('An error occurred during the export process.');
    }
};

/**
 * Opens a document picker for the user to select a JSON file for import.
 * @returns A promise that resolves with the parsed JSON object, or null if cancelled.
 */
export const importDataFromFile = async (): Promise<object | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            console.log('User cancelled the file import.');
            return null;
        }

        const fileUri = result.assets[0].uri;
        const jsonString = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        console.log('Successfully read file for import.');
        return JSON.parse(jsonString);

    } catch (error) {
        console.error('Failed to import data:', error);
        throw new Error('An error occurred during the import process. Please ensure the file is a valid JSON export.');
    }
};
