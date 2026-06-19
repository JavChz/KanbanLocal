import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import { Home, Globe, Settings, Menu, X, Kanban, Plus, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../../utils/colors';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { projects } = useKanbanStore();
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navItems = [
    { to: '/', icon: <Home size={18} />, label: t('home'), end: true },
    { to: '/global', icon: <Globe size={18} />, label: t('global_view') },
    { to: '/settings', icon: <Settings size={18} />, label: t('settings') },
  ];

  const handleCreateProjectClick = () => {
    closeSidebar();
    navigate('/?action=new-project');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
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
        className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/30 z-50 transform md:transform-none transition-transform duration-300 md:sticky md:top-0 md:h-screen flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/30 flex items-center gap-2.5">
          <Kanban size={22} className="text-blue-500" />
          <span className="font-bold text-slate-800 dark:text-slate-50 text-lg tracking-wide">
            {t('app_title')}
          </span>
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
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
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
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t('projects')}
              </span>
              <button
                onClick={handleCreateProjectClick}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                title={t('add_project')}
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 px-2 italic">
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
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
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
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/30 text-2xs text-slate-400 dark:text-slate-500 font-mono text-center">
          v1.0.0-alpha
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden relative min-h-[calc(100vh-53px)] md:min-h-screen">
        <div id="modal-root" /> {/* Render target for portals */}
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};
