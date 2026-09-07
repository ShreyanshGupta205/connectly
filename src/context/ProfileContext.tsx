import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { UserProfile, SocialLink, AuthUser, ActiveTab, AnalyticsData } from '../types';
import { INITIAL_PROFILES, getMockAnalyticsForProfile } from '../data/initialProfiles';
import { 
  saveProfileToFirestore, 
  subscribeToProfileFromFirestore, 
  incrementProfileLikeInFirestore, 
  incrementProfileViewInFirestore, 
  incrementLinkClickInFirestore,
  getProfileFromFirestore
} from '../firebase/firestoreService';
import { 
  signInWithGoogle, 
  signInWithGoogleRedirect,
  checkRedirectAuthResult,
  logoutUserFromFirebase, 
  onAuthListener 
} from '../firebase/authService';
import {
  apiFetchAllProfiles,
  apiCreateProfile,
  apiUpdateProfile,
  apiDeleteProfile,
  apiLikeProfile,
  apiRecordProfileView,
  apiRecordLinkClick,
  apiToggleVerification
} from '../services/apiService';

export const ADMIN_EMAIL = 'shreyanshg2005@gmail.com';

export const isUserAdmin = (user: AuthUser | null): boolean => {
  if (!user?.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

interface ProfileContextType {
  profiles: Record<string, UserProfile>;
  currentProfile: UserProfile;
  currentUser: AuthUser | null;
  isAdmin: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  likedProfileIds: string[];
  analytics: AnalyticsData;
  isCloudConnected: boolean;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGoogleRedirect: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => void;
  updateAnyProfile: (username: string, updates: Partial<UserProfile>) => void;
  toggleVerification: (username: string) => void;
  deleteProfile: (username: string) => void;
  addSocialLink: (link: Omit<SocialLink, 'id' | 'clicks' | 'position'>) => void;
  updateSocialLink: (linkId: string, updates: Partial<SocialLink>) => void;
  deleteSocialLink: (linkId: string) => void;
  reorderSocialLinks: (sourceIndex: number, destinationIndex: number) => void;
  toggleLikeProfile: (username: string) => boolean; // returns true if now liked
  recordLinkClick: (username: string, linkId: string) => void;
  recordProfileView: (username: string, isQr?: boolean) => void;
  switchProfile: (username: string) => void;
  createNewProfile: (username: string, name: string, email?: string) => boolean;
  loginAs: (username: string) => void;
  loginAsAdminDemo: () => void;
  logout: () => void;
  resetToDemo: () => void;
  isUsernameAvailable: (username: string) => boolean;
  exportAllData: () => string;
}

const STORAGE_KEY = 'connectly_profiles_v4';
const AUTH_KEY = 'connectly_auth_user_v2';
const LIKES_KEY = 'connectly_liked_profiles_v2';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved profiles', e);
    }
    return INITIAL_PROFILES;
  });

  const [currentUsername, setCurrentUsername] = useState<string>('shreyansh');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse auth user', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [likedProfileIds, setLikedProfileIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LIKES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const isInitialSyncDone = useRef<Record<string, boolean>>({});

  // Real-time Firestore synchronization for active profile
  useEffect(() => {
    if (!currentUsername) return;

    // Check if initial cloud seed is needed
    if (!isInitialSyncDone.current[currentUsername]) {
      getProfileFromFirestore(currentUsername).then((cloudProfile) => {
        if (cloudProfile) {
          setProfiles(prev => ({
            ...prev,
            [currentUsername]: {
              ...prev[currentUsername],
              ...cloudProfile,
            }
          }));
        } else {
          // Upload local default to Firestore if it doesn't exist yet
          const localProfile = profiles[currentUsername] || INITIAL_PROFILES[currentUsername];
          if (localProfile) {
            saveProfileToFirestore(localProfile);
          }
        }
        isInitialSyncDone.current[currentUsername] = true;
      }).catch(() => {
        setIsCloudConnected(false);
      });
    }

    // Subscribe to real-time changes
    const unsubscribe = subscribeToProfileFromFirestore(currentUsername, (cloudProfile) => {
      setIsCloudConnected(true);
      if (cloudProfile && cloudProfile.username) {
        setProfiles(prev => ({
          ...prev,
          [cloudProfile.username]: {
            ...prev[cloudProfile.username],
            ...cloudProfile,
          }
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUsername]);

  // Check for returning redirect auth result (if sign in via redirect was used)
  useEffect(() => {
    checkRedirectAuthResult().then((authResult) => {
      if (authResult) {
        const { user, profile } = authResult;
        setProfiles(prev => ({
          ...prev,
          [profile.username]: profile
        }));
        setCurrentUsername(profile.username);
        setCurrentUser(user);
      }
    }).catch(err => {
      console.warn('[Auth] Check redirect result error:', err);
    });
  }, []);

  // Listen to Firebase persistent Auth state
  useEffect(() => {
    const unsubAuth = onAuthListener(async (fbUser) => {
      if (fbUser) {
        const isShreyanshAdmin = fbUser.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const emailPrefix = fbUser.email ? fbUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
        const cleanName = fbUser.displayName || emailPrefix || 'Creator';
        const cleanUsername = isShreyanshAdmin ? 'shreyansh' : (emailPrefix || ('user_' + fbUser.uid.substring(0, 6)));

        const authUser: AuthUser = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: isShreyanshAdmin ? 'Shreyansh Gupta' : cleanName,
          username: cleanUsername,
          avatarUrl: fbUser.photoURL || (isShreyanshAdmin ? INITIAL_PROFILES.shreyansh.avatarUrl : `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`),
          plan: isShreyanshAdmin ? 'pro' : 'free',
        };

        setCurrentUser(authUser);

        // Auto-create profile if does not exist for this user
        setProfiles(prev => {
          if (prev[cleanUsername]) {
            return prev;
          }

          const newProfile: UserProfile = {
            id: 'user-' + fbUser.uid,
            username: cleanUsername,
            name: cleanName,
            tagline: 'Digital Creator & Builder',
            bio: `Welcome to my Connectly link space! Explore my projects and links below.`,
            avatarUrl: authUser.avatarUrl,
            isVerified: isShreyanshAdmin,
            themeId: 'aurora-glass',
            plan: isShreyanshAdmin ? 'pro' : 'free',
            createdAt: new Date().toISOString(),
            email: fbUser.email || '',
            stats: { views: 1, likes: 0, shares: 0, qrScans: 0 },
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
                id: 'link-init-1',
                platform: 'website',
                title: 'My Website & Portfolio',
                subtitle: 'Check out my latest projects and creations',
                url: 'https://example.com',
                position: 1,
                isVisible: true,
                clicks: 0,
              },
              {
                id: 'link-init-2',
                platform: 'github',
                title: 'GitHub Repositories',
                subtitle: 'Open source work and code',
                url: 'https://github.com',
                position: 2,
                isVisible: true,
                clicks: 0,
              },
              {
                id: 'link-init-3',
                platform: 'linkedin',
                title: 'LinkedIn Network',
                subtitle: 'Connect with me professionally',
                url: 'https://linkedin.com',
                position: 3,
                isVisible: true,
                clicks: 0,
              }
            ],
          };

          saveProfileToFirestore(newProfile);
          apiCreateProfile(newProfile);

          return {
            ...prev,
            [cleanUsername]: newProfile,
          };
        });

        setCurrentUsername(cleanUsername);
      } else {
        // Logged out
        setCurrentUser(null);
      }
    });

    return () => unsubAuth();
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles to localStorage', e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(likedProfileIds));
    } catch (e) {
      console.error(e);
    }
  }, [likedProfileIds]);

  const currentProfile = profiles[currentUsername] || profiles['shreyansh'] || INITIAL_PROFILES['shreyansh'];

  const isAdmin = isUserAdmin(currentUser);
  const analytics = getMockAnalyticsForProfile(currentProfile);

  // Real-time PostgreSQL Backend & Firestore synchronization
  useEffect(() => {
    apiFetchAllProfiles().then(dbProfiles => {
      if (dbProfiles && Object.keys(dbProfiles).length > 0) {
        setProfiles(prev => ({
          ...prev,
          ...dbProfiles,
        }));
      }
    }).catch(() => {
      // Local fallback active
    });
  }, []);

  const updateCurrentProfile = (updates: Partial<UserProfile>) => {
    setProfiles(prev => {
      const existing = prev[currentUsername] || prev['shreyansh'];
      const updated = { ...existing, ...updates };
      // Async sync to Firestore & PostgreSQL
      saveProfileToFirestore(updated);
      apiUpdateProfile(currentUsername, updated);
      return {
        ...prev,
        [currentUsername]: updated,
      };
    });
  };

  const updateAnyProfile = (username: string, updates: Partial<UserProfile>) => {
    setProfiles(prev => {
      const existing = prev[username];
      if (!existing) return prev;
      const updated = { ...existing, ...updates };
      saveProfileToFirestore(updated);
      apiUpdateProfile(username, updated);
      return {
        ...prev,
        [username]: updated,
      };
    });
  };

  const toggleVerification = (username: string) => {
    const profile = profiles[username];
    if (profile) {
      const newStatus = !profile.isVerified;
      updateAnyProfile(username, { isVerified: newStatus });
      apiToggleVerification(username, newStatus);
    }
  };

  const deleteProfile = (username: string) => {
    setProfiles(prev => {
      const next = { ...prev };
      delete next[username];
      return next;
    });
    apiDeleteProfile(username);
    if (currentUsername === username) {
      const firstKey = Object.keys(profiles).find(k => k !== username) || 'shreyansh';
      setCurrentUsername(firstKey);
    }
  };

  const loginAsAdminDemo = () => {
    // In production, bypass is strictly disabled. Authentication requires verified Google Sign-In as shreyanshg2005@gmail.com
    console.warn('[Security] Simulated admin bypass is disabled. Please authenticate via Google as shreyanshg2005@gmail.com');
  };

  const exportAllData = (): string => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      superAdmin: ADMIN_EMAIL,
      totalProfiles: Object.keys(profiles).length,
      profiles,
    };
    return JSON.stringify(payload, null, 2);
  };

  const addSocialLink = (linkData: Omit<SocialLink, 'id' | 'clicks' | 'position'>) => {
    const newLink: SocialLink = {
      ...linkData,
      id: 'link-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      clicks: 0,
      position: currentProfile.links.length + 1,
    };

    const updatedLinks = [...currentProfile.links, newLink];
    updateCurrentProfile({
      links: updatedLinks,
    });
  };

  const updateSocialLink = (linkId: string, updates: Partial<SocialLink>) => {
    const updatedLinks = currentProfile.links.map(l => {
      if (l.id === linkId) {
        return { ...l, ...updates };
      }
      return l;
    });

    updateCurrentProfile({ links: updatedLinks });
  };

  const deleteSocialLink = (linkId: string) => {
    const updatedLinks = currentProfile.links.filter(l => l.id !== linkId);
    updateCurrentProfile({ links: updatedLinks });
  };

  const reorderSocialLinks = (sourceIndex: number, destinationIndex: number) => {
    const newLinks = Array.from(currentProfile.links);
    const [removed] = newLinks.splice(sourceIndex, 1);
    newLinks.splice(destinationIndex, 0, removed);
    // update positions
    const normalized = newLinks.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
    updateCurrentProfile({ links: normalized });
  };

  const toggleLikeProfile = (username: string): boolean => {
    const profile = profiles[username];
    if (!profile) return false;

    const alreadyLiked = likedProfileIds.includes(username);

    if (!alreadyLiked) {
      // Trigger festive confetti explosion
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#f59e0b'],
      });

      setLikedProfileIds(prev => [...prev, username]);
      setProfiles(prev => {
        const target = prev[username];
        if (!target) return prev;
        return {
          ...prev,
          [username]: {
            ...target,
            stats: {
              ...target.stats,
              likes: target.stats.likes + 1,
            },
          },
        };
      });

      // Increment in Firestore & PostgreSQL Backend
      incrementProfileLikeInFirestore(username, 1);
      apiLikeProfile(username, 1);
      return true;
    } else {
      // Unlike
      setLikedProfileIds(prev => prev.filter(id => id !== username));
      setProfiles(prev => {
        const target = prev[username];
        if (!target) return prev;
        return {
          ...prev,
          [username]: {
            ...target,
            stats: {
              ...target.stats,
              likes: Math.max(0, target.stats.likes - 1),
            },
          },
        };
      });

      // Decrement in Firestore & PostgreSQL Backend
      incrementProfileLikeInFirestore(username, -1);
      apiLikeProfile(username, -1);
      return false;
    }
  };

  const recordLinkClick = (username: string, linkId: string) => {
    setProfiles(prev => {
      const target = prev[username];
      if (!target) return prev;
      const updatedLinks = target.links.map(l => {
        if (l.id === linkId) {
          return { ...l, clicks: l.clicks + 1 };
        }
        return l;
      });
      return {
        ...prev,
        [username]: {
          ...target,
          links: updatedLinks,
        },
      };
    });

    // Firestore & PostgreSQL record
    incrementLinkClickInFirestore(username, linkId);
    apiRecordLinkClick(username, linkId);
  };

  const recordProfileView = (username: string, isQr = false) => {
    setProfiles(prev => {
      const target = prev[username];
      if (!target) return prev;
      return {
        ...prev,
        [username]: {
          ...target,
          stats: {
            ...target.stats,
            views: target.stats.views + 1,
            qrScans: isQr ? target.stats.qrScans + 1 : target.stats.qrScans,
          },
        },
      };
    });

    // Firestore & PostgreSQL record
    incrementProfileViewInFirestore(username, isQr);
    apiRecordProfileView(username, isQr);
  };

  const isUsernameAvailable = (username: string): boolean => {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return false;
    if (clean === currentUsername) return true;
    return !profiles[clean];
  };

  const switchProfile = (username: string) => {
    if (profiles[username]) {
      setCurrentUsername(username);
    }
  };

  const createNewProfile = (username: string, name: string, email?: string): boolean => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || profiles[cleanUsername]) {
      return false;
    }

    const newProfile: UserProfile = {
      id: 'user-' + cleanUsername,
      username: cleanUsername,
      name: name.trim() || cleanUsername,
      tagline: 'Digital Creator & Builder',
      bio: 'Welcome to my digital space. Check out my links and projects below!',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      isVerified: false,
      themeId: 'aurora-glass',
      plan: 'free',
      createdAt: new Date().toISOString(),
      email: email || `${cleanUsername}@example.com`,
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
        customText: `Scan to connect with ${name}`,
      },
      links: [
        {
          id: 'link-default-1',
          platform: 'website',
          title: 'My Portfolio / Blog',
          subtitle: 'Check out my recent works and writing',
          url: 'https://example.com',
          position: 1,
          isVisible: true,
          clicks: 0,
        },
        {
          id: 'link-default-2',
          platform: 'github',
          title: 'GitHub Projects',
          subtitle: 'Code repositories and open source',
          url: 'https://github.com',
          position: 2,
          isVisible: true,
          clicks: 0,
        }
      ],
    };

    // Save to Firestore & PostgreSQL backend
    saveProfileToFirestore(newProfile);
    apiCreateProfile(newProfile);

    setProfiles(prev => ({
      ...prev,
      [cleanUsername]: newProfile,
    }));

    setCurrentUsername(cleanUsername);
    setCurrentUser({
      id: newProfile.id,
      email: newProfile.email || '',
      name: newProfile.name,
      username: cleanUsername,
      avatarUrl: newProfile.avatarUrl,
      plan: 'free',
    });

    return true;
  };

  const loginAs = (username: string) => {
    const profile = profiles[username];
    if (profile) {
      setCurrentUsername(username);
      setCurrentUser({
        id: profile.id,
        email: profile.email || '',
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        plan: profile.plan,
      });
    }
  };

  // Google sign-in implementation
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const authResult = await signInWithGoogle();
      if (!authResult) return false;

      const { user, profile } = authResult;

      setProfiles(prev => ({
        ...prev,
        [profile.username]: profile
      }));

      setCurrentUsername(profile.username);
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('[Auth] Error in loginWithGoogle:', error);
      throw error;
    }
  };

  const loginWithGoogleRedirect = async (): Promise<void> => {
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error('[Auth] Error in loginWithGoogleRedirect:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUserFromFirebase();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  const resetToDemo = () => {
    setProfiles(INITIAL_PROFILES);
    setCurrentUsername('shreyansh');
    setCurrentUser(null);
    setLikedProfileIds([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LIKES_KEY);
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        currentProfile,
        currentUser,
        isAdmin,
        activeTab,
        setActiveTab,
        likedProfileIds,
        analytics,
        isCloudConnected,
        loginWithGoogle,
        loginWithGoogleRedirect,
        updateCurrentProfile,
        updateAnyProfile,
        toggleVerification,
        deleteProfile,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        reorderSocialLinks,
        toggleLikeProfile,
        recordLinkClick,
        recordProfileView,
        switchProfile,
        createNewProfile,
        loginAs,
        loginAsAdminDemo,
        logout,
        resetToDemo,
        isUsernameAvailable,
        exportAllData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
