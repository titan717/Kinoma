import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'motion/react';
import { SWRConfig } from 'swr';
import { localCache } from './lib/localCache';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Details } from './pages/Details';
import { Watch } from './pages/Watch';
import { Library } from './pages/Library';
import { WhatsNew } from './pages/WhatsNew';
import { AuthProvider } from './lib/AuthContext';
import { AuthModal } from './components/ui/AuthModal';
import { AppearanceProvider } from './lib/AppearanceContext';
import { TVModeProvider, useTVMode } from './lib/TVModeContext';
import { SettingsModal } from './components/ui/SettingsModal';
import { AndroidTVModal } from './components/ui/AndroidTVModal';
import { TVExperiencePrompt } from './components/ui/TVExperiencePrompt';
import { IntroSplash } from './components/ui/IntroSplash';
import { TVApp } from './pages/TVApp';

function AnimatedRoutes() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex-1 flex flex-col will-change-transform"
      >
        <Switch location={location}>
          <Route path="/" component={Home} />
          <Route path="/tv" component={TVApp} />
          <Route path="/search" component={Search} />
          <Route path="/explore" component={Search} />
          <Route path="/whats-new" component={WhatsNew} />
          <Route path="/details/:id" component={Details} />
          <Route path="/watch/:id" component={Watch} />
          <Route path="/library" component={Library} />
          <Route>
            <div className="flex min-h-[60vh] items-center justify-center text-gray-500 font-medium">
              404 - Page Not Found
            </div>
          </Route>
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function MainAppShell() {
  const { isTVMode } = useTVMode();
  const [location] = useLocation();

  // If in TV Mode or on /tv, render the dedicated 10-foot Android TV layout
  if (isTVMode || location === '/tv') {
    if (location.startsWith('/watch/')) {
      return (
        <div className="w-full min-h-screen bg-black">
          <Watch />
        </div>
      );
    }
    return <TVApp />;
  }

  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
}

export default function App() {
  return (
    <SWRConfig 
      value={{ 
        provider: localCache.getSwrStorageProvider(),
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 30000
      }}
    >
      <AuthProvider>
        <AppearanceProvider>
          <TVModeProvider>
            <IntroSplash />
            <MainAppShell />
            <AuthModal />
            <SettingsModal />
            <AndroidTVModal />
            <TVExperiencePrompt />
          </TVModeProvider>
        </AppearanceProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
