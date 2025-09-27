import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { State } from 'ts-fsrs';
import { VocabularyItem } from '../types/vocabulary';

let db: SQLite.SQLiteDatabase;

const openDB = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('vocabulary.db');
  }
  return db;
};

// Function to initialize the database with the new relational schema
const initializeDatabase = async (): Promise<void> => {
  const database = openDB();
  try {
    // Enable foreign key support
    await database.execAsync('PRAGMA foreign_keys = ON;');
    // Drop old table if it exists
    await database.execAsync('DROP TABLE IF EXISTS vocabulary;');
    
    // Create the main vocabulary items table
    await database.execAsync(
      `CREATE TABLE IF NOT EXISTS vocabulary_items (
        id TEXT PRIMARY KEY NOT NULL,
        frontWord TEXT NOT NULL,
        frontContext TEXT,
        sourceQueryWord TEXT,
        dueDate INTEGER NOT NULL,
        stability REAL NOT NULL,
        difficulty REAL NOT NULL,
        lapses INTEGER NOT NULL,
        state INTEGER NOT NULL,
        repetitions INTEGER NOT NULL,
        lastReviewed INTEGER
      );`
    );

    // Create the table for accepted translations
    await database.execAsync(
      `CREATE TABLE IF NOT EXISTS accepted_translations (
        id TEXT PRIMARY KEY NOT NULL,
        item_id TEXT NOT NULL,
        translation TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES vocabulary_items(id) ON DELETE CASCADE
      );`
    );

    console.log('Database tables (re)initialized successfully with new relational schema.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
};

// --- CRUD Operations ---

// Add a new vocabulary item with its translations in a single transaction
const addVocabularyItem = async (item: Omit<VocabularyItem, 'id'> & { id?: string }): Promise<void> => {
  const database = openDB();
  const itemId = item.id || Crypto.randomUUID();

  try {
    await database.withTransactionAsync(async () => {
      // 1. Insert into the main table
      await database.runAsync(
        'INSERT INTO vocabulary_items (id, frontWord, frontContext, sourceQueryWord, dueDate, stability, difficulty, lapses, state, repetitions, lastReviewed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          itemId,
          item.frontWord,
          item.frontContext ?? null,
          item.sourceQueryWord ?? null,
          item.dueDate,
          item.stability,
          item.difficulty,
          item.lapses,
          item.state,
          item.repetitions,
          item.lastReviewed ?? null
        ]
      );

      // 2. Insert all translations into the second table
      for (const translation of item.translations) {
        await database.runAsync(
          'INSERT INTO accepted_translations (id, item_id, translation) VALUES (?, ?, ?)',
          [Crypto.randomUUID(), itemId, translation]
        );
      }
    });
  } catch (error) {
    console.error('Error adding vocabulary item with transaction:', error);
    throw error;
  }
};

// Helper function to reconstruct VocabularyItem objects from query results
const mapRowsToVocabularyItems = (rows: any[]): VocabularyItem[] => {
    if (!rows || rows.length === 0) {
        return [];
    }

    const itemMap = new Map<string, VocabularyItem>();

    for (const row of rows) {
        const { item_id, translation, ...itemData } = row;
        if (!itemMap.has(item_id)) {
            itemMap.set(item_id, {
                id: item_id,
                frontWord: itemData.frontWord,
                frontContext: itemData.frontContext,
                sourceQueryWord: itemData.sourceQueryWord,
                dueDate: itemData.dueDate,
                stability: itemData.stability,
                difficulty: itemData.difficulty,
                lapses: itemData.lapses,
                state: itemData.state,
                repetitions: itemData.repetitions,
                lastReviewed: itemData.lastReviewed,
                translations: [],
            });
        }
        itemMap.get(item_id)!.translations.push(translation);
    }
    return Array.from(itemMap.values());
};

const BASE_QUERY = `
    SELECT
        vi.id as item_id,
        vi.frontWord,
        vi.frontContext,
        vi.sourceQueryWord,
        vi.dueDate,
        vi.stability,
        vi.difficulty,
        vi.lapses,
        vi.state,
        vi.repetitions,
        vi.lastReviewed,
        at.translation
    FROM
        vocabulary_items vi
    JOIN
        accepted_translations at ON vi.id = at.item_id
`;


// Get all vocabulary items
const getAllVocabularyItems = async (): Promise<VocabularyItem[]> => {
  const database = openDB();
  try {
    const allRows = await database.getAllAsync(BASE_QUERY);
    return mapRowsToVocabularyItems(allRows);
  } catch (error) {
    console.error('Error getting all vocabulary items:', error);
    throw error;
  }
};

// Get items due for review
const getDueVocabularyItems = async (now: number = Date.now()): Promise<VocabularyItem[]> => {
  const database = openDB();
  try {
    const dueRows = await database.getAllAsync(
        `${BASE_QUERY} WHERE vi.dueDate <= ? ORDER BY vi.dueDate ASC`,
        [now]
    );
    return mapRowsToVocabularyItems(dueRows);
  } catch (error) {
    console.error('Error getting due vocabulary items:', error);
    throw error;
  }
};

// Update an existing vocabulary item
const updateVocabularyItem = async (item: VocabularyItem): Promise<void> => {
  const database = openDB();
  try {
    await database.withTransactionAsync(async () => {
        // 1. Update the main item
        const result = await database.runAsync(
          `UPDATE vocabulary_items SET
           frontWord = ?, frontContext = ?, sourceQueryWord = ?,
           dueDate = ?, stability = ?, difficulty = ?, lapses = ?, state = ?,
           repetitions = ?, lastReviewed = ?
           WHERE id = ?`,
          [
            item.frontWord,
            item.frontContext ?? null,
            item.sourceQueryWord ?? null,
            item.dueDate,
            item.stability,
            item.difficulty,
            item.lapses,
            item.state,
            item.repetitions,
            item.lastReviewed ?? null,
            item.id
          ]
        );

        if (result.changes === 0) {
            // If the item doesn't exist, we can't update its translations either.
            throw new Error(`No vocabulary_item found with id ${item.id} to update.`);
        }

        // 2. Delete old translations
        await database.runAsync('DELETE FROM accepted_translations WHERE item_id = ?', [item.id]);

        // 3. Insert new translations
        for (const translation of item.translations) {
            await database.runAsync(
              'INSERT INTO accepted_translations (id, item_id, translation) VALUES (?, ?, ?)',
              [Crypto.randomUUID(), item.id, translation]
            );
        }
    });
  } catch (error) {
    console.error('Error updating vocabulary item with transaction:', error);
    throw error;
  }
};

// Find a vocabulary item by its frontWord
const findVocabularyItemByFrontWord = async (frontWord: string): Promise<VocabularyItem | null> => {
    const database = openDB();
    try {
        const rows = await database.getAllAsync(
            `${BASE_QUERY} WHERE vi.frontWord = ?`,
            [frontWord]
        );
        if (rows.length === 0) {
            return null;
        }
        // The helper function will correctly assemble the single item with all its translations
        const items = mapRowsToVocabularyItems(rows);
        return items[0];
    } catch (error) {
        console.error('Error finding vocabulary item by frontWord:', error);
        throw error;
    }
};


// Delete a vocabulary item
const deleteVocabularyItem = async (id: string): Promise<SQLite.SQLiteRunResult> => {
  const database = openDB();
  try {
    // With "ON DELETE CASCADE", we only need to delete from the parent table.
    const result = await database.runAsync('DELETE FROM vocabulary_items WHERE id = ?', [id]);
    if (result.changes === 0) {
      console.warn(`No item found with id ${id} to delete.`);
    }
    return result;
  } catch (error) {
    console.error('Error deleting vocabulary item:', error);
    throw error;
  }
};

// --- Export functions ---
export { openDB, initializeDatabase, addVocabularyItem, updateVocabularyItem, deleteVocabularyItem, getAllVocabularyItems, getDueVocabularyItems, findVocabularyItemByFrontWord };

// Note: initializeDatabase() should be called at app startup. 