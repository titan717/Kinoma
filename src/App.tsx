import React, { lazy, Suspense, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'motion/react';
import { SWRConfig } from 'swr';
import { localCache } from './lib/localCache';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Terms } from './pages/Terms';
import { About } from './pages/About';
import { Profile } from './pages/Profile';
import { Privacy } from './pages/Privacy';
import { Contact } from './pages/Contact';
import { Docs } from './pages/Docs';

// Route-level code splitting keeps the initial bundle focused on the landing/home experience.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Details = lazy(() => import('./pages/Details').then(m => ({ default: m.Details })));
const Watch = lazy(() => import('./pages/Watch').then(m => ({ default: m.Watch })));
const Library = lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const WhatsNew = lazy(() => import('./pages/WhatsNew').then(m => ({ default: m.WhatsNew })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
import { AuthProvider } from './lib/AuthContext';
import { AuthModal } from './components/ui/AuthModal';
import { AppearanceProvider } from './lib/AppearanceContext';
import { SettingsModal } from './components/ui/SettingsModal';
import { IntroSplash } from './components/ui/IntroSplash';
import { trackPageView } from './lib/analytics';

function AnimatedRoutes() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    trackPageView(location);
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
        <Suspense
          fallback={
            <div className="min-h-[55vh] w-full flex items-center justify-center bg-[var(--kinoma-bg)]">
              <div className="h-8 w-8 rounded-full border-2 border-white/15 border-t-white/80 animate-spin" aria-label="Loading Kinoma" />
            </div>
          }
        >
          <Switch location={location}>
          <Route path="/" component={Landing} />
          <Route path="/browse" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/contact" component={Contact} />
          <Route path="/docs" component={Docs} />
          <Route path="/profile" component={Profile} />
          <Route path="/about" component={About} />
          <Route path="/admin" component={Admin} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/search" component={Search} />
          <Route path="/explore" component={Search} />
          <Route path="/whats-new" component={WhatsNew} />
          <Route path="/details/:id" component={Details} />
          <Route path="/watch/:id" component={Watch} />
          <Route path="/library" component={Library} />
          <Route path="/history" component={Library} />
          <Route>
            <div className="flex min-h-[60vh] items-center justify-center text-gray-500 font-medium">
              404 - Page Not Found
            </div>
          </Route>
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function MainAppShell() {
  const [location] = useLocation();

  if (location === '/') return <Landing />;

  return <Layout><AnimatedRoutes /></Layout>;
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
          <IntroSplash />
          <MainAppShell />
          <AuthModal />
          <SettingsModal />
        </AppearanceProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
