import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 * We use VITE_ environment variables which are the standard for Vite projects.
 * This allows the app to work with GitHub Secrets and local .env files.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Database ID often defaults to "(default)" unless specified
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';

// Validation to help debugging when secrets are missing
if (!firebaseConfig.apiKey && import.meta.env.MODE !== 'test') {
  console.warn(
    "Firebase API Key is missing. If you are in AI Studio, make sure to add " +
    "VITE_FIREBASE_API_KEY to the Secrets panel."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
/**
 * Cache locale persistente: personaggi, campagne e homebrew già aperti restano consultabili senza rete
 * e le modifiche fatte offline vengono inviate al ritorno della connessione.
 */
function createDb(): Firestore {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }, databaseId);
  } catch (error) {
    console.warn('Cache offline non disponibile, uso la sola memoria:', error);
    return getFirestore(app, databaseId);
  }
}
export const db = createDb();
export const googleProvider = new GoogleAuthProvider();
