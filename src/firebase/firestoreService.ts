import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  onSnapshot,
  collection,
  getDocs
} from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, analytics } from './config';
import type { UserProfile } from '../types';

const PROFILES_COLLECTION = 'profiles';

/**
 * Fetch a profile document from Firestore by username
 */
export async function getProfileFromFirestore(username: string): Promise<UserProfile | null> {
  try {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const docRef = doc(db, PROFILES_COLLECTION, cleanUsername);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error) {
    console.warn('[Firebase] Could not fetch profile from Firestore, using local fallback:', error);
  }
  return null;
}

/**
 * Save or update a profile document in Firestore
 */
export async function saveProfileToFirestore(profile: UserProfile): Promise<boolean> {
  try {
    const cleanUsername = profile.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const docRef = doc(db, PROFILES_COLLECTION, cleanUsername);
    await setDoc(docRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
    
    // Log analytics event
    if (analytics) {
      logEvent(analytics, 'profile_updated', { username: cleanUsername });
    }
    return true;
  } catch (error) {
    console.warn('[Firebase] Could not save profile to Firestore:', error);
    return false;
  }
}

/**
 * Increment profile like count in Firestore
 */
export async function incrementProfileLikeInFirestore(username: string, delta: number = 1): Promise<void> {
  try {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const docRef = doc(db, PROFILES_COLLECTION, cleanUsername);
    await updateDoc(docRef, {
      'stats.likes': increment(delta),
    });

    if (analytics && delta > 0) {
      logEvent(analytics, 'profile_liked', { username: cleanUsername });
    }
  } catch (error) {
    console.warn('[Firebase] Could not update likes in Firestore:', error);
  }
}

/**
 * Increment profile views and QR scans
 */
export async function incrementProfileViewInFirestore(username: string, isQr: boolean = false): Promise<void> {
  try {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const docRef = doc(db, PROFILES_COLLECTION, cleanUsername);
    const updates: Record<string, unknown> = {
      'stats.views': increment(1),
    };
    if (isQr) {
      updates['stats.qrScans'] = increment(1);
    }
    await updateDoc(docRef, updates);

    if (analytics) {
      logEvent(analytics, isQr ? 'profile_qr_scanned' : 'profile_viewed', { username: cleanUsername });
    }
  } catch (error) {
    // Suppress silently or log warning if doc doesn't exist yet
    console.warn('[Firebase] Could not record view in Firestore:', error);
  }
}

/**
 * Increment link click count in Firestore
 */
export async function incrementLinkClickInFirestore(username: string, linkId: string): Promise<void> {
  try {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const docRef = doc(db, PROFILES_COLLECTION, cleanUsername);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const updatedLinks = data.links.map(l => {
        if (l.id === linkId) {
          return { ...l, clicks: (l.clicks || 0) + 1 };
        }
        return l;
      });
      await updateDoc(docRef, { links: updatedLinks });
    }

    if (analytics) {
      logEvent(analytics, 'link_clicked', { username: cleanUsername, link_id: linkId });
    }
  } catch (error) {
    console.warn('[Firebase] Could not record link click in Firestore:', error);
  }
}

/**
 * Subscribe to real-time profile changes from Firestore
 */
export function subscribeToProfileFromFirestore(
  username: string, 
  callback: (profile: UserProfile) => void
): () => void {
  try {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const docRef = doc(db, PROFILES_COLLECTION, cleanUsername);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      }
    }, (error) => {
      console.warn('[Firebase] Firestore subscription notice:', error.message);
    });
  } catch (error) {
    console.warn('[Firebase] Subscription failed to initialize:', error);
    return () => {};
  }
}

/**
 * Fetch all public profiles from Firestore
 */
export async function fetchAllProfilesFromFirestore(): Promise<Record<string, UserProfile>> {
  const result: Record<string, UserProfile> = {};
  try {
    const colRef = collection(db, PROFILES_COLLECTION);
    const snaps = await getDocs(colRef);
    snaps.forEach((doc) => {
      const p = doc.data() as UserProfile;
      if (p.username) {
        result[p.username] = p;
      }
    });
  } catch (error) {
    console.warn('[Firebase] Could not fetch all profiles from Firestore:', error);
  }
  return result;
}
