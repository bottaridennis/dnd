
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
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
 * Service to manage custom homebrew content created by users.
 */
export const homebrewService = {
  /**
   * Save a new homebrew item to a subcollection in the user's document.
   * Path example: /users/{userId}/homebrewSpells
   */
  async saveHomebrewItem(userId: string, itemType: HomebrewType, itemData: any) {
    const subCollection = itemType === 'spell' ? 'homebrewSpells' : 
                         itemType === 'weapon' ? 'homebrewWeapons' : 
                         'homebrewFeats';
    
    try {
      const docRef = await addDoc(collection(db, 'users', userId, subCollection), {
        ...itemData,
        userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error saving homebrew ${itemType}:`, error);
      throw error;
    }
  },

  /**
   * Fetch all homebrew content for a specific user.
   */
  async getUserHomebrew(userId: string) {
    try {
      const collections = ['homebrewSpells', 'homebrewWeapons', 'homebrewFeats'];
      const results: Record<string, any[]> = {
        spells: [],
        weapons: [],
        feats: []
      };

      for (const colName of collections) {
        const q = query(collection(db, 'users', userId, colName), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (colName === 'homebrewSpells') results.spells = items;
        else if (colName === 'homebrewWeapons') results.weapons = items;
        else if (colName === 'homebrewFeats') results.feats = items;
      }

      return results;
    } catch (error) {
      console.error("Error fetching user homebrew:", error);
      throw error;
    }
  }
};
