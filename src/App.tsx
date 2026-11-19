import { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { RedirectGuard } from './components/Layout/RedirectGuard';
import { useKanbanStore } from './store/useKanbanStore';
import { useTranslation } from 'react-i18next';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useThemeSync } from './hooks/useTheme';

const HomeView = lazy(() => import('./views/HomeView').then((m) => ({ default: m.HomeView })));
const BoardView = lazy(() => import('./views/BoardView').then((m) => ({ default: m.BoardView })));
const GlobalView = lazy(() => import('./views/GlobalView').then((m) => ({ default: m.GlobalView })));
const MatrixView = lazy(() => import('./views/MatrixView').then((m) => ({ default: m.MatrixView })));

const ShortcutManager = () => {
  useKeyboardShortcuts();
  return null;
};

const ViewSkeleton = () => (
  <div className="flex flex-col gap-6 h-full animate-pulse" aria-hidden="true">
    <div className="h-14 rounded-xl bg-slate-200/70 dark:bg-slate-800/50" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
      <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40" />
      <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40" />
      <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40" />
    </div>
  </div>
);

function App() {
  useThemeSync();
  const { i18n } = useTranslation();
  const language = useKanbanStore((s) => s.language);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <HashRouter>
      <ShortcutManager />
      <RedirectGuard>
        <Layout>
          <Suspense fallback={<ViewSkeleton />}>
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/project/:id" element={<BoardView />} />
              <Route path="/global" element={<GlobalView />} />
              <Route path="/matrix" element={<MatrixView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </RedirectGuard>
    </HashRouter>
  );
}

export default App;
