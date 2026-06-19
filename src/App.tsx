import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { RedirectGuard } from './components/Layout/RedirectGuard';
import { HomeView } from './views/HomeView';
import { BoardView } from './views/BoardView';
import { GlobalView } from './views/GlobalView';
import { SettingsView } from './views/SettingsView';
import { useKanbanStore } from './store/useKanbanStore';
import { useTranslation } from 'react-i18next';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const ShortcutManager = () => {
  useKeyboardShortcuts();
  return null;
};

function App() {
  const { i18n } = useTranslation();
  const language = useKanbanStore((s) => s.language);

  // Synchronize the persistent language from Zustand store to i18next
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ShortcutManager />
      <RedirectGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/project/:id" element={<BoardView />} />
            <Route path="/global" element={<GlobalView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </Layout>
      </RedirectGuard>
    </BrowserRouter>
  );
}

export default App;
