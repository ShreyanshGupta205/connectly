import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration (reads from environment variables with fallback)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDzLeInqesBxkHaTnNgxbAHJHWWDQ3vfu8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "connectly-in.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "connectly-in",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "connectly-in.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "541934951833",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:541934951833:web:05e6a324dad0e8511e4708",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0QX2HTSV7Y"
};

// Initialize Firebase safely (avoiding duplicate init)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics if supported in environment (browser only)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported or blocked by ad-blocker
  });
}
