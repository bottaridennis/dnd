
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OperationType } from './characterService';

export type HomebrewType = 'spell' | 'weapon' | 'feat';

export interface HomebrewItem {
  id?: string;
  name: string;
  type: HomebrewType;
  userId: string;
  data: any;
  createdAt?: any;
}

/**
 * Enhanced error handler for homebrew operations
 */
function handleHomebrewError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      // @ts-ignore - access internal database name for debug
      databaseId: db._databaseId?.database || '(unknown)'
    },
    operationType,
    path
  };
  const jsonError = JSON.stringify(errInfo, null, 2);
  console.error('Firestore Error Details: ', jsonError);
  throw new Error(jsonError);
}

/**
 * Service to manage custom homebrew content created by users.
 */
export const homebrewService = {
  async saveHomebrewItem(userId: string, itemType: HomebrewType, itemData: any) {
    const subCollection = itemType === 'spell' ? 'homebrewSpells' : 
                         itemType === 'weapon' ? 'homebrewWeapons' : 
                         'homebrewFeats';
    const path = `users/${userId}/${subCollection}`;
    
    try {
      const docRef = await addDoc(collection(db, 'users', userId, subCollection), {
        ...itemData,
        userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleHomebrewError(error, OperationType.WRITE, path);
    }
  },

  async getUserHomebrew(userId: string) {
    if (!userId) return { spells: [], weapons: [], feats: [] };

    const results: Record<string, any[]> = {
      spells: [],
      weapons: [],
      feats: []
    };

    const collectionsMap = {
      'homebrewSpells': 'spells',
      'homebrewWeapons': 'weapons',
      'homebrewFeats': 'feats'
    };

    // Sequential fetch to isolate errors
    for (const [colName, resultKey] of Object.entries(collectionsMap)) {
      const path = `users/${userId}/${colName}`;
      try {
        const q = query(collection(db, 'users', userId, colName));
        const snapshot = await getDocs(q);
        results[resultKey] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        // Log the exact database we are trying to talk to
        console.warn(`Fetch failed for ${path} on database ID: ${ (db as any)._databaseId?.database || '(default)' }`);
        handleHomebrewError(error, OperationType.LIST, path);
      }
    }

    return results;
  }
};
