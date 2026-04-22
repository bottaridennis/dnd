import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: any;
  updatedAt: any;
}

export const userService = {
  async ensureUserProfile(user: { uid: string, email: string | null, displayName: string | null, photoURL: string | null }) {
    if (!user.uid) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const newProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Adventurer',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    } else {
      // Optional: sync profile info if changed
      const existing = userDoc.data();
      if (existing.email !== user.email || existing.displayName !== user.displayName) {
        await updateDoc(userDocRef, {
          email: user.email || existing.email,
          displayName: user.displayName || existing.displayName,
          photoURL: user.photoURL || existing.photoURL,
          updatedAt: serverTimestamp()
        });
      }
      return existing;
    }
  }
};
