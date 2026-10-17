import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, testConnection } from '../lib/firebase';
import { UserProfile } from '../types';
import {
  syncUserProfile,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  signOut as authSignOut,
  resetPassword,
  PRIMARY_ADMIN_EMAIL,
} from '../services/authService';
import { claimReferralBonusIfApplicable } from '../services/referralService';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthReady: boolean;
  loginWithGoogleProvider: (referralCode?: string) => Promise<void>;
  loginWithEmailPass: (email: string, pass: string) => Promise<void>;
  registerWithEmailPass: (email: string, pass: string, username: string, referralCode?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  showWelcomeBonusModal: boolean;
  dismissWelcomeBonusModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showWelcomeBonusModal, setShowWelcomeBonusModal] = useState(false);
  const { showToast } = useToast();

  const referralParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref') || undefined
    : undefined;

  const [isAdminState, setIsAdminState] = useState(false);

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        const cleanEmail = (fbUser.email || '').toLowerCase().trim();
        const isSuper = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
        if (isSuper) {
          setIsAdminState(true);
        }

        try {
          const res = await syncUserProfile(fbUser, referralParam);
          setUserProfile(res.profile);
          if (res.profile.role === 'admin' || isSuper) {
            setIsAdminState(true);
          }

          if (res.awardedWelcomeBonus) {
            setShowWelcomeBonusModal(true);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.5 },
            });
            showToast('Registration Bonus: +1,000 Coins and +1 Diamond credited to your vault!', 'success');
          }
        } catch (err) {
          console.error('Failed to sync profile on auth change:', err);
        }
      } else {
        setUserProfile(null);
        setIsAdminState(false);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [referralParam, showToast]);

  const loginWithGoogleProvider = async (customReferralCode?: string) => {
    try {
      setLoading(true);
      const codeToUse = customReferralCode || referralParam;
      const res = await loginWithGoogle(codeToUse);
      setUserProfile(res.profile);
      if (res.awardedWelcomeBonus) {
        setShowWelcomeBonusModal(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      }
      showToast(`Welcome back, ${res.profile.username}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPass = async (email: string, pass: string) => {
    try {
      setLoading(true);
      const res = await loginWithEmail(email, pass);
      setUserProfile(res.profile);
      showToast(`Welcome back, ${res.profile.username}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to sign in', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmailPass = async (
    email: string,
    pass: string,
    username: string,
    customReferralCode?: string
  ) => {
    try {
      setLoading(true);
      const codeToUse = customReferralCode || referralParam;
      const res = await registerWithEmail(email, pass, username, codeToUse);
      setUserProfile(res.profile);
      setShowWelcomeBonusModal(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      showToast(`Account created! Welcome to Nexora, ${res.profile.username}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
      showToast('Password reset link sent to your email.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset email', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authSignOut();
      setUserProfile(null);
      showToast('Signed out safely', 'info');
    } catch (err: any) {
      showToast('Error signing out', 'error');
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const res = await syncUserProfile(auth.currentUser);
      setUserProfile(res.profile);
    }
  };

  const dismissWelcomeBonusModal = () => {
    setShowWelcomeBonusModal(false);
  };

  const cleanEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin =
    cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'admin' ||
    isAdminState;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        isAuthReady,
        loginWithGoogleProvider,
        loginWithEmailPass,
        registerWithEmailPass,
        sendPasswordReset,
        logout,
        refreshProfile,
        showWelcomeBonusModal,
        dismissWelcomeBonusModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
