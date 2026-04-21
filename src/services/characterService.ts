import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CharacterData, InventoryItem } from '../contexts/CharacterContext';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

const COLLECTION_NAME = 'characters';

/**
 * Clean data object by recursively removing undefined values,
 * which Firestore does not support.
 */
function cleanData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(v => cleanData(v));
  } else if (data !== null && typeof data === 'object' && !(data instanceof Timestamp)) {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        cleaned[key] = cleanData(data[key]);
      }
    });
    return cleaned;
  }
  return data;
}

export const characterService = {
  async saveCharacter(character: CharacterData) {
    if (!auth.currentUser) throw new Error('User must be logged in to save characters');
    const path = `${COLLECTION_NAME}/${character.id}`;
    try {
      const data = cleanData({
        ...character,
        userId: auth.currentUser.uid,
        updatedAt: Timestamp.now(),
        createdAt: character.createdAt || Timestamp.now()
      });
      await setDoc(doc(db, COLLECTION_NAME, character.id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateCharacter(characterId: string, updates: Partial<CharacterData>) {
    const path = `${COLLECTION_NAME}/${characterId}`;
    try {
      const data = cleanData({
        ...updates,
        updatedAt: Timestamp.now()
      });
      await updateDoc(doc(db, COLLECTION_NAME, characterId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteCharacter(characterId: string) {
    const path = `${COLLECTION_NAME}/${characterId}`;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, characterId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getUserCharacters(userId: string) {
    const path = COLLECTION_NAME;
    try {
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as CharacterData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  subscribeToCharacters(userId: string, callback: (characters: CharacterData[]) => void) {
    const path = COLLECTION_NAME;
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    
    return onSnapshot(q, (snapshot) => {
      const characters = snapshot.docs.map(doc => doc.data() as CharacterData);
      callback(characters);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async addStandardItemToInventory(characterId: string, item: any, containerId: string | null = null) {
    const path = `${COLLECTION_NAME}/${characterId}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, characterId);
      const characterDoc = await getDoc(docRef);
      if (!characterDoc.exists()) throw new Error('Character not found');

      const data = characterDoc.data() as CharacterData;
      const inventoryItems = data.inventoryItems || [];
      
      // Handle quantity in name (e.g. "Daga (2)")
      let itemName = item.name;
      let quantity = 1;
      const quantityMatch = itemName.match(/\((\d+)\)$/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
        itemName = itemName.replace(/\s*\(\d+\)$/, '').trim();
      }

      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        name: itemName,
        weight: item.weight || 0,
        quantity: quantity,
        isAttuned: false,
        isMagical: false,
        isEquipped: false,
        containerId: containerId,
        // Weapon details
        damage: item.damage,
        damageType: item.damageType,
        properties: item.properties,
        mastery: item.mastery
      };

      await updateDoc(docRef, {
        inventoryItems: [...inventoryItems, newItem],
        updatedAt: Timestamp.now()
      });
      return newItem;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
