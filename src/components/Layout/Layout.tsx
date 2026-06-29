import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import { Home, Globe, Settings, Menu, X, Kanban, Plus, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../../utils/colors';
import { SettingsModal } from './SettingsModal';

import catImg from '../../assets/bg-images/cat.jpg';
import cocodrileImg from '../../assets/bg-images/cocodrile.jpg';
import fieldsImg from '../../assets/bg-images/fields.jpg';
import moonImg from '../../assets/bg-images/moon.jpg';
import sunsetImg from '../../assets/bg-images/sunset.jpg';
import sunshinesImg from '../../assets/bg-images/sunshines.jpg';

export const BACKGROUND_IMAGES: Record<string, string> = {
  cat: catImg,
  cocodrile: cocodrileImg,
  fields: fieldsImg,
  moon: moonImg,
  sunset: sunsetImg,
  sunshines: sunshinesImg,
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { projects } = useKanbanStore();
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navigate = useNavigate();
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

  // Synchronize background settings with document.body to avoid stacking context issues for backdrop-filter
  useEffect(() => {
    const bgConfig = activeProject?.background;
    const isBgImage = bgConfig && (bgConfig.type === 'image' || bgConfig.type === 'custom');

    if (activeProject && bgConfig && bgConfig.type !== 'theme') {
      if (bgConfig.type === 'solid') {
        document.body.style.backgroundColor = bgConfig.value;
        document.body.style.removeProperty('--body-bg-image');
      } else {
        document.body.style.backgroundColor = '';
        const imgUrl = bgConfig.type === 'image' 
          ? BACKGROUND_IMAGES[bgConfig.value] 
          : bgConfig.value;
        if (imgUrl) {
          document.body.style.setProperty('--body-bg-image', `url(${imgUrl})`);
        } else {
          document.body.style.removeProperty('--body-bg-image');
        }
      }
      
      // Always keep body background image clear as we now render it via body::before
      document.body.style.backgroundImage = 'none';

      if (isBgImage) {
        document.body.classList.add('has-bg-image');
        document.body.classList.remove('has-bg-solid');
      } else {
        document.body.classList.add('has-bg-solid');
        document.body.classList.remove('has-bg-image');
      }
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.removeProperty('--body-bg-image');
      document.body.classList.remove('has-bg-image', 'has-bg-solid');
    }

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.removeProperty('--body-bg-image');
      document.body.classList.remove('has-bg-image', 'has-bg-solid');
    };
  }, [activeProject, projects, location.pathname]);

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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navItems = [
    { to: '/', icon: <Home size={18} />, label: t('home'), end: true },
    { to: '/global', icon: <Globe size={18} />, label: t('global_view') },
  ];

  const handleCreateProjectClick = () => {
    closeSidebar();
    navigate('/?action=new-project');
  };

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
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel border-b border-slate-200/50 dark:border-slate-800/30 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <Kanban size={20} className="text-blue-500" />
          <span className="tracking-wide">{t('app_title')}</span>
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/30 z-50 transform transition-all duration-300 md:sticky md:top-0 md:h-screen flex flex-col overflow-hidden ${
          isSidebarOpen
            ? 'translate-x-0 w-64'
            : isSidebarCollapsed
            ? '-translate-x-full md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0'
            : '-translate-x-full md:translate-x-0 md:w-64 md:opacity-100'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Kanban size={22} className="text-blue-500" />
            <span className="font-bold text-slate-800 dark:text-slate-50 text-lg tracking-wide">
              {t('app_title')}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/55 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            aria-label="Collapse Sidebar"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Main Links */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Projects Submenu */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('projects')}
              </span>
              <button
                onClick={handleCreateProjectClick}
                className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                title={t('add_project')}
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 px-2 italic">
                  {t('no_projects')}
                </p>
              ) : (
                projects.map((proj) => {
                  const colorStyles = getColorStyles(proj.color);
                  return (
                    <NavLink
                      key={proj.id}
                      to={`/project/${proj.id}`}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
                        }`
                      }
                    >
                      <Circle size={8} className={`fill-current ${colorStyles.text}`} />
                      <span className="truncate flex-1">{proj.name}</span>
                    </NavLink>
                  );
                })
              )}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/30">
          <button
            onClick={() => {
              setIsAboutOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 hover:bg-slate-200/55 dark:hover:bg-slate-800/40 text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-200 active:scale-97 cursor-pointer"
            title={t('settings')}
          >
            <Settings size={14} className="text-slate-500 dark:text-slate-400" />
            <span>{t('settings')}</span>
          </button>
        </div>
      </aside>

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
