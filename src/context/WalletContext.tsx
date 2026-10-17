import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wallet } from '../types';
import { useAuth } from './AuthContext';
import { subscribeToWallet, getWallet } from '../services/walletService';

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthReady } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!currentUser) {
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Realtime listener
    const unsubscribe = subscribeToWallet(currentUser.uid, (w) => {
      setWallet(w);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, isAuthReady]);

  const refreshWallet = async () => {
    if (currentUser) {
      const w = await getWallet(currentUser.uid);
      setWallet(w);
    }
  };

  return (
    <WalletContext.Provider value={{ wallet, loading, refreshWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
