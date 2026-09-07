import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyDzLeInqesBxkHaTnNgxbAHJHWWDQ3vfu8",
  authDomain: "connectly-in.firebaseapp.com",
  projectId: "connectly-in",
  storageBucket: "connectly-in.firebasestorage.app",
  messagingSenderId: "541934951833",
  appId: "1:541934951833:web:05e6a324dad0e8511e4708",
  measurementId: "G-0QX2HTSV7Y"
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
