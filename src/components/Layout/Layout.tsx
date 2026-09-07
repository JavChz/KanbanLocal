import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import { ChevronRight } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';
import { useProjectBackground } from '../../hooks/useProjectBackground';

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

  // Synchronize active project background with document.body
  useProjectBackground(activeProject);

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
    ? isBgImage ? 'has-bg-image' : 'has-bg-solid'
    : 'bg-slate-50 dark:bg-slate-950';

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row ${containerBgClass} text-slate-900 dark:text-slate-100 transition-all duration-300`}
    >
      {/* Mobile Top Header */}
      <MobileHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden relative min-h-[calc(100vh-53px)] md:min-h-screen transition-all duration-300">
        <div id="modal-root" /> {/* Render target for portals */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="hidden md:flex absolute top-8 left-8 p-2 rounded-xl glass-panel border border-slate-200/50 dark:border-slate-800/30 text-slate-600 dark:text-slate-350 hover:bg-slate-200/55 dark:hover:bg-slate-800/40 transition-all duration-200 shadow-md hover:scale-105 active:scale-95 z-30 cursor-pointer"
            aria-label="Expand Sidebar"
            title="Expand Sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
        <div className={`max-w-7xl mx-auto h-full flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-12' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
