import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const db = getFirestore(app, databaseId);
export const googleProvider = new GoogleAuthProvider();
