import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from './config';
import { getProfileFromFirestore, saveProfileToFirestore } from './firestoreService';
import type { AuthUser, UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Trigger Firebase Google Sign-In Popup
 */
export async function signInWithGoogle(): Promise<{ user: AuthUser; profile: UserProfile } | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Derive a clean handle from email or displayName
    const emailPrefix = fbUser.email ? fbUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
    const cleanName = fbUser.displayName || emailPrefix || 'Creator';
    const cleanUsername = emailPrefix || ('user_' + fbUser.uid.substring(0, 6));

    const authUser: AuthUser = {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: cleanName,
      username: cleanUsername,
      avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      plan: 'pro',
    };

    // Check if profile exists in Firestore
    let profile = await getProfileFromFirestore(cleanUsername);

    if (!profile) {
      // Create new profile for this Google user
      profile = {
        id: fbUser.uid,
        username: cleanUsername,
        name: cleanName,
        tagline: 'Digital Creator & Builder',
        bio: `Hey there! I am ${cleanName}. Welcome to my verified Connectly link hub.`,
        avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        isVerified: true,
        themeId: 'aurora-glass',
        plan: 'pro',
        createdAt: new Date().toISOString(),
        email: fbUser.email || '',
        stats: {
          views: 1,
          likes: 0,
          shares: 0,
          qrScans: 0,
        },
        qrSettings: {
          fgColor: '#8b5cf6',
          bgColor: '#0d1117',
          includeAvatar: true,
          style: 'minimal',
          dotType: 'rounded',
          customText: `Connect with ${cleanName}`,
        },
        links: [
          {
            id: 'link-g-1',
            platform: 'website',
            title: 'My Website / Portfolio',
            subtitle: 'Check out my latest work and creations',
            url: 'https://example.com',
            position: 1,
            isVisible: true,
            clicks: 0,
          },
          {
            id: 'link-g-2',
            platform: 'github',
            title: 'GitHub Profile',
            subtitle: 'Open source projects and repositories',
            url: 'https://github.com',
            position: 2,
            isVisible: true,
            clicks: 0,
          },
          {
            id: 'link-g-3',
            platform: 'linkedin',
            title: 'LinkedIn Network',
            subtitle: 'Connect professionally with me',
            url: 'https://linkedin.com',
            position: 3,
            isVisible: true,
            clicks: 0,
          }
        ],
      };

      // Save initial profile to Firestore
      await saveProfileToFirestore(profile);
    }

    return { user: authUser, profile };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      console.log('[Auth] Google sign-in was closed by user');
      return null;
    }
    console.error('[Auth] Google sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out current Firebase user
 */
export async function logoutUserFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Auth] Error signing out:', error);
  }
}

/**
 * Listen for persistent Firebase auth state changes
 */
export function onAuthListener(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
