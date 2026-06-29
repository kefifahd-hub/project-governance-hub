import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import GovernanceWizard from './pages/GovernanceWizard';
import WorkflowBuilder from './pages/WorkflowBuilder';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

const PageTransition = ({ children, k }) => (
  <motion.div
    key={k}
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    style={{ minHeight: '100%' }}
  >
    {children}
  </motion.div>
);

const DarkModeDetector = () => {
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (isDark) => {
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply(mql.matches);
    const handler = (e) => apply(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <PageTransition k="main">
              <MainPage />
            </PageTransition>
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <PageTransition k={path}>
                  <Page />
                </PageTransition>
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/GovernanceWizard" element={
          <LayoutWrapper currentPageName="GovernanceWizard">
            <PageTransition k="GovernanceWizard">
              <GovernanceWizard />
            </PageTransition>
          </LayoutWrapper>
        } />
        <Route path="/WorkflowBuilder" element={
          <LayoutWrapper currentPageName="WorkflowBuilder">
            <PageTransition k="WorkflowBuilder">
              <WorkflowBuilder />
            </PageTransition>
          </LayoutWrapper>
        } />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return <AnimatedRoutes />;
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <DarkModeDetector />
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App