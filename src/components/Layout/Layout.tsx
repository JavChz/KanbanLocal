import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import { ChevronRight } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';
import { useProjectBackground } from '../../hooks/useProjectBackground';
import { ToastContainer } from '../ui/ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { projects } = useKanbanStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const location = useLocation();

  const match = location.pathname.match(/^\/project\/([^/]+)/);
  const activeProjectId = match ? match[1] : null;
  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : null;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Pass primitive background fields so task updates never tear down active background
  useProjectBackground(activeProject?.background?.type, activeProject?.background?.value);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
    } catch (e) {
      console.error('Failed to save sidebar state to localStorage', e);
    }
  }, [isSidebarCollapsed]);

  // Listen to custom trigger event to open settings modal
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsAboutOpen(true);
    };
    window.addEventListener('trigger-open-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('trigger-open-settings', handleOpenSettings);
    };
  }, []);

  const bgConfig = activeProject?.background;
  const hasCustomBg = bgConfig && bgConfig.type !== 'theme';
  const isBgImage = bgConfig && (bgConfig.type === 'image' || bgConfig.type === 'custom');

  const containerBgClass = hasCustomBg
    ? isBgImage
      ? 'has-bg-image'
      : 'has-bg-solid'
    : 'bg-[#f4f6f9] dark:bg-[#090d16]';

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row ${containerBgClass} text-slate-900 dark:text-slate-100 transition-colors duration-200`}
    >
      {/* Mobile Top Header */}
      <MobileHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Animated Mobile Sidebar Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/35 dark:bg-slate-950/60 backdrop-blur-xs z-[var(--z-drawer-backdrop)] md:hidden transition-opacity duration-200 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      {/* Sidebar Panel */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onCollapseSidebar={() => setIsSidebarCollapsed(true)}
        onOpenSettings={() => setIsAboutOpen(true)}
      />

      {/* Settings & About Modal */}
      <SettingsModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 md:px-8 md:py-6 overflow-x-hidden relative min-h-[calc(100vh-53px)] md:min-h-screen">
        <div id="modal-root" />
        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            className="hidden md:flex fixed top-5 left-5 p-2 rounded-xl glass-panel text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-all duration-150 shadow-sm active:scale-95 z-[var(--z-sticky)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            aria-label="Expand Sidebar"
            title="Expand Sidebar"
          >
            <ChevronRight size={17} />
          </button>
        )}
        <div
          className={`max-w-7xl mx-auto h-full flex flex-col transition-[padding] duration-200 ease-[var(--ease-out-expo)] ${
            isSidebarCollapsed ? 'md:pl-12' : ''
          }`}
        >
          {children}
        </div>
      </main>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
