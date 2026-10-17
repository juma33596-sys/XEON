import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { CatalogView } from './features/catalog/CatalogView';
import { TopupView } from './features/topup/TopupView';
import { ExchangeView } from './features/exchange/ExchangeView';
import { LibraryView } from './features/library/LibraryView';
import { CasinoView } from './features/casino/CasinoView';
import { XoraView } from './features/xora/XoraView';
import { XoraFloatingButton } from './features/xora/XoraFloatingButton';
import { HostingView } from './features/hosting/HostingView';
import { HostedSiteViewer } from './features/hosting/HostedSiteViewer';
import { AdminView } from './features/admin/AdminView';
import { Shield, Server } from 'lucide-react';

export function normalizeTab(rawTab?: string | null): string {
  if (!rawTab) return 'catalog';
  let clean = String(rawTab).trim().toLowerCase();

  // If full URL was passed, extract the pathname
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const parsed = new URL(clean);
      clean = parsed.pathname;
    } catch {
      clean = clean.replace(/^https?:\/\/[^/]+/i, '');
    }
  }

  // Strip leading and trailing slashes and hash characters
  clean = clean.replace(/^[/#\s]+|[/#\s]+$/g, '');

  if (clean.startsWith('hosts/')) return 'hosts_viewer';
  if (clean === 'hosting') return 'hosting';
  if (clean === 'admin') return 'admin';
  if (clean === 'exchange') return 'exchange';
  if (clean === 'topup') return 'topup';
  if (clean === 'library') return 'library';
  if (clean === 'casino') return 'casino';
  if (clean === 'xora') return 'xora';
  if (clean === 'catalog' || clean === '') return 'catalog';

  return clean;
}

function getTabFromUrl(): string {
  if (typeof window === 'undefined') return 'catalog';
  const path = window.location.pathname;
  const hash = window.location.hash;
  return normalizeTab(hash || path);
}

function getSlugFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  if (path.startsWith('/hosts/')) {
    return path.replace(/^\/hosts\//, '').split('/')[0].split('?')[0];
  }
  return '';
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>(getTabFromUrl);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { isAdmin } = useAuth();

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (rawTab: string) => {
    const tab = normalizeTab(rawTab);
    setCurrentTab(tab);

    if (typeof window !== 'undefined') {
      const targetPath = tab === 'catalog' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        try {
          window.history.pushState(null, '', targetPath);
        } catch (err) {
          // Gracefully ignore pushState restriction in sandboxed iframes
          console.warn('Navigation pushState bypassed:', err);
        }
      }
    }
    // Scroll to top on navigation
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20 md:pb-12">
        {currentTab === 'catalog' && (
          <CatalogView
            onNavigateTab={handleSelectTab}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'topup' && (
          <TopupView onOpenAuth={() => setAuthModalOpen(true)} />
        )}

        {currentTab === 'exchange' && (
          <ExchangeView
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateTab={handleSelectTab}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            onNavigateTab={handleSelectTab}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'casino' && (
          <CasinoView
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateTab={handleSelectTab}
          />
        )}

        {currentTab === 'hosting' && (
          <HostingView
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateTab={handleSelectTab}
          />
        )}

        {currentTab === 'hosts_viewer' && (
          <HostedSiteViewer
            slug={getSlugFromUrl()}
            onBackToApp={() => handleSelectTab('hosting')}
          />
        )}

        {currentTab === 'xora' && (
          <XoraView
            onNavigateTab={handleSelectTab}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView onNavigateTab={handleSelectTab} />
        )}
      </main>

      {/* Floating Xora AI Assistant Button */}
      {currentTab !== 'hosts_viewer' && (
        <XoraFloatingButton
          currentTab={currentTab}
          onOpenXora={() => handleSelectTab('xora')}
        />
      )}

      {/* Footer with Subtle Admin Portal Link for Authorized Operators */}
      <footer className="hidden md:block border-t border-white/5 py-6 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-zinc-400">NEXORA MARKETPLACE</span>
            <span>•</span>
            <span>Dual-Currency Premium Digital Trading Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSelectTab('hosting')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-semibold flex items-center gap-1"
            >
              <Server className="w-3.5 h-3.5" />
              <span>NEXORA Hosting</span>
            </button>
            <button
              onClick={() => handleSelectTab('xora')}
              className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-semibold flex items-center gap-1"
            >
              <span>Xora AI Assistant</span>
            </button>
            <button
              onClick={() => handleSelectTab('casino')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Nexora Casino
            </button>
            <button
              onClick={() => handleSelectTab('exchange')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Exchange Coins & Diamonds
            </button>
            <button
              onClick={() => handleSelectTab('topup')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Mobile Money Top-Up
            </button>
            {isAdmin && (
              <button
                onClick={() => handleSelectTab('admin')}
                className="flex items-center gap-1 text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer font-semibold"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Terminal</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onNavigateAdmin={() => handleSelectTab('admin')}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <WalletProvider>
            <AppContent />
          </WalletProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
