import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';
import { Home, Globe, Settings, Menu, X, Kanban, Plus, Circle, ChevronLeft, ChevronRight, Download, Upload, CheckCircle, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getColorStyles } from '../../utils/colors';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { ThemeToggle } from '../ui/ThemeToggle';

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
  const { tasks, projects, language, setLanguage, lastOpenedProject, importState } = useKanbanStore();
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeAboutTab, setActiveAboutTab] = useState<'preferences' | 'export' | 'import' | 'usage' | 'about'>('preferences');
  const navigate = useNavigate();
  const location = useLocation();

  const match = location.pathname.match(/^\/project\/([^/]+)/);
  const activeProjectId = match ? match[1] : null;
  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : null;

  const [importJson, setImportJson] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [selectedExportBoardIds, setSelectedExportBoardIds] = useState<string[]>([]);

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
        document.body.style.backgroundImage = 'none';
      } else if (bgConfig.type === 'image') {
        const imgUrl = BACKGROUND_IMAGES[bgConfig.value];
        if (imgUrl) {
          document.body.style.backgroundImage = `url(${imgUrl})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundAttachment = 'fixed';
          document.body.style.backgroundRepeat = 'no-repeat';
        }
      } else if (bgConfig.type === 'custom' && bgConfig.value) {
        document.body.style.backgroundImage = `url(${bgConfig.value})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
      }

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
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundRepeat = '';
      document.body.classList.remove('has-bg-image', 'has-bg-solid');
    }

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundRepeat = '';
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

  // Keep selectedExportBoardIds in sync when projects change
  useEffect(() => {
    if (isAboutOpen) {
      setSelectedExportBoardIds(projects.map((p) => p.id));
    }
  }, [isAboutOpen, projects]);

  // Listen to custom trigger event to open settings modal
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsAboutOpen(true);
      setActiveAboutTab('preferences');
    };
    window.addEventListener('trigger-open-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('trigger-open-settings', handleOpenSettings);
    };
  }, []);

  const handleLanguageChange = (lang: 'en' | 'fr' | 'ja' | 'es') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleExportFiltered = () => {
    try {
      const selectedProjects = projects.filter((p) => selectedExportBoardIds.includes(p.id));
      const selectedTasks = tasks.filter((t) => selectedExportBoardIds.includes(t.projectId));
      const stateToExport = {
        projects: selectedProjects,
        tasks: selectedTasks,
        language,
        lastOpenedProject: selectedProjects.some((p) => p.id === lastOpenedProject)
          ? lastOpenedProject
          : null,
      };
      const stateString = JSON.stringify(stateToExport, null, 2);

      const blob = new Blob([stateString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personalkanban-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'Backup exported successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to export backup.' });
    }
  };

  const handleImportText = () => {
    if (!importJson.trim()) return;
    const success = importState(importJson);
    if (success) {
      setFeedback({ type: 'success', message: t('import_success') });
      setImportJson('');
    } else {
      setFeedback({ type: 'error', message: t('import_error') });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = importState(result);
        if (success) {
          setFeedback({ type: 'success', message: t('import_success') });
        } else {
          setFeedback({ type: 'error', message: t('import_error') });
        }
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'File read error.' });
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const languages: { code: 'en' | 'fr' | 'ja' | 'es'; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸 🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷 🇨🇦' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'es', label: 'Español', flag: '🇪🇸 🇲🇽' },
  ];

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
              setActiveAboutTab('preferences');
              setFeedback(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-slate-700 dark:text-slate-205 hover:bg-slate-200/50 dark:hover:bg-slate-800/55 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-200 active:scale-97 cursor-pointer"
            title="Settings"
          >
            <Settings size={14} className="text-slate-500 dark:text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Settings & About Modal */}
      <Modal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title={t('settings_about')}
        size="lg"
      >
        <div className="flex flex-col md:flex-row gap-6 min-h-[360px]">
          {/* Vertical Tabs List */}
          <div className="flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/30 pb-3 md:pb-0 md:pr-4 min-w-[160px]">
            <button
              onClick={() => {
                setActiveAboutTab('preferences');
                setFeedback(null);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                activeAboutTab === 'preferences'
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {t('preferences')}
            </button>
            <button
              onClick={() => {
                setActiveAboutTab('export');
                setFeedback(null);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                activeAboutTab === 'export'
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {t('export')}
            </button>
            <button
              onClick={() => {
                setActiveAboutTab('import');
                setFeedback(null);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                activeAboutTab === 'import'
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {t('import')}
            </button>
            <button
              onClick={() => {
                setActiveAboutTab('usage');
                setFeedback(null);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                activeAboutTab === 'usage'
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {t('usage_shortcuts')}
            </button>
            <button
              onClick={() => {
                setActiveAboutTab('about');
                setFeedback(null);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                activeAboutTab === 'about'
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {t('about_license')}
            </button>
          </div>

          {/* Active Tab Content Pane */}
          <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex flex-col gap-4">

            {/* Feedback Alert Banner */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2.5 border animate-fade-in ${
                  feedback.type === 'success'
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-500/20 dark:border-green-900/30'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-900/30'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span className="text-xs font-semibold">{feedback.message}</span>
              </div>
            )}

            {activeAboutTab === 'preferences' && (
              <div className="flex flex-col gap-5 animate-fade-in text-left">
                {/* Language Selector Dropdown */}
                <div className="flex flex-col gap-2 text-left relative">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={13} />
                    {t('language')}
                  </span>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all font-medium cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex gap-1.5 items-center">
                        {language === 'en' && (
                          <>
                            <img src="https://flagcdn.com/w20/us.png" alt="US" className="h-3 object-contain rounded-xs" />
                            <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="h-3 object-contain rounded-xs" />
                          </>
                        )}
                        {language === 'fr' && (
                          <>
                            <img src="https://flagcdn.com/w20/fr.png" alt="FR" className="h-3 object-contain rounded-xs" />
                            <img src="https://flagcdn.com/w20/ca.png" alt="CA" className="h-3 object-contain rounded-xs" />
                          </>
                        )}
                        {language === 'es' && (
                          <>
                            <img src="https://flagcdn.com/w20/es.png" alt="ES" className="h-3 object-contain rounded-xs" />
                            <img src="https://flagcdn.com/w20/mx.png" alt="MX" className="h-3 object-contain rounded-xs" />
                          </>
                        )}
                        {language === 'ja' && (
                          <img src="https://flagcdn.com/w20/jp.png" alt="JP" className="h-3 object-contain rounded-xs" />
                        )}
                      </div>
                      <span>
                        {language === 'en' && 'English'}
                        {language === 'fr' && 'Français'}
                        {language === 'es' && 'Español'}
                        {language === 'ja' && '日本語'}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options */}
                  {isLangDropdownOpen && (
                    <>
                      {/* Backdrop overlay to close when clicking outside */}
                      <div className="fixed inset-0 z-30" onClick={() => setIsLangDropdownOpen(false)} />

                      <div className="absolute top-full left-0 right-0 mt-1.5 glass-panel p-1.5 rounded-xl shadow-xl z-40 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fade-in flex flex-col gap-1">
                        {languages.map((lang) => {
                          const isSelected = language === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                handleLanguageChange(lang.code);
                                setIsLangDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex gap-1.5 items-center w-9 justify-center flex-shrink-0">
                                  {lang.code === 'en' && (
                                    <>
                                      <img src="https://flagcdn.com/w20/us.png" alt="US" className="h-2.5 object-contain rounded-xs" />
                                      <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="h-2.5 object-contain rounded-xs" />
                                    </>
                                  )}
                                  {lang.code === 'fr' && (
                                    <>
                                      <img src="https://flagcdn.com/w20/fr.png" alt="FR" className="h-2.5 object-contain rounded-xs" />
                                      <img src="https://flagcdn.com/w20/ca.png" alt="CA" className="h-2.5 object-contain rounded-xs" />
                                    </>
                                  )}
                                  {lang.code === 'es' && (
                                    <>
                                      <img src="https://flagcdn.com/w20/es.png" alt="ES" className="h-2.5 object-contain rounded-xs" />
                                      <img src="https://flagcdn.com/w20/mx.png" alt="MX" className="h-2.5 object-contain rounded-xs" />
                                    </>
                                  )}
                                  {lang.code === 'ja' && (
                                    <img src="https://flagcdn.com/w20/jp.png" alt="JP" className="h-2.5 object-contain rounded-xs" />
                                  )}
                                </div>
                                <span>{lang.label}</span>
                              </div>
                              {isSelected && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Theme Toggle Selector */}
                <ThemeToggle />
              </div>
            )}

            {activeAboutTab === 'export' && (
              <div className="flex flex-col gap-5 animate-fade-in text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t('export_data')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {t('export_desc')}
                  </p>
                </div>

                {/* Selective Boards Grid */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {t('select_boards')}
                    </span>
                    <div className="flex gap-2 text-2xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setSelectedExportBoardIds(projects.map(p => p.id))}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {t('select_all')}
                      </button>
                      <span className="text-slate-300 dark:text-slate-850">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportBoardIds([])}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {t('unselect_all')}
                      </button>
                    </div>
                  </div>

                  {projects.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                      {t('no_boards_export')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {projects.map((proj) => {
                        const isSelected = selectedExportBoardIds.includes(proj.id);
                        const colorStyles = getColorStyles(proj.color);
                        return (
                          <label
                            key={proj.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500/40 text-slate-850 dark:text-slate-100'
                                : 'border-slate-200/50 dark:border-slate-800/30 hover:bg-slate-200/25 dark:hover:bg-slate-900/10 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Circle size={8} className={`fill-current ${colorStyles.text}`} />
                              <span className="text-xs font-semibold truncate">{proj.name}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedExportBoardIds(selectedExportBoardIds.filter(id => id !== proj.id));
                                } else {
                                  setSelectedExportBoardIds([...selectedExportBoardIds, proj.id]);
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/30 flex justify-end">
                  <Button
                    onClick={handleExportFiltered}
                    disabled={selectedExportBoardIds.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download size={14} />
                    {t('export_data')}
                  </Button>
                </div>
              </div>
            )}

            {activeAboutTab === 'import' && (
              <div className="flex flex-col gap-5 animate-fade-in text-left">
                {/* Import block */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {t('import_data')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('import_desc')}
                    </p>
                  </div>

                  {/* Upload Dropzone */}
                  <div
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-slate-200/15 dark:hover:bg-slate-900/10"
                  >
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t('upload_backup')}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                  </div>

                  {/* Textarea fallback */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
                      {t('or_paste_json')}
                    </span>
                    <Textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder='{"tasks": [], "projects": []}'
                      rows={3}
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={handleImportText}
                      variant="secondary"
                      size="sm"
                      disabled={!importJson.trim()}
                      className="self-end"
                    >
                      {t('import_paste')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeAboutTab === 'usage' && (
              <div className="flex flex-col gap-4 animate-fade-in text-left">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">
                    {t('board_tasks_flow')}
                  </h4>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>{t('flow_step_1')}</p>
                    <p>{t('flow_step_2')}</p>
                    <p>{t('flow_step_3')}</p>
                    <p>{t('flow_step_4')}</p>
                  </div>
                </div>

                <hr className="border-slate-200/50 dark:border-slate-800/30" />

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">
                    {t('keyboard_shortcuts')}
                  </h4>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mb-2 font-sans">
                    {t('shortcut_hint')}
                  </p>
                  <div className="flex flex-col gap-2 font-mono text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Ctrl + Alt + H</span>
                      <span className="text-slate-500 dark:text-slate-400 font-sans">{t('nav_home')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Ctrl + Alt + G</span>
                      <span className="text-slate-500 dark:text-slate-400 font-sans">{t('nav_global')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Ctrl + Alt + S</span>
                      <span className="text-slate-500 dark:text-slate-400 font-sans">{t('open_settings')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Ctrl + Alt + N</span>
                      <span className="text-slate-500 dark:text-slate-400 font-sans text-right">{t('new_board_task')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeAboutTab === 'about' && (
              <div className="flex flex-col gap-4 animate-fade-in text-left">
                <div className="flex items-center gap-3">
                  <Kanban size={32} className="text-blue-500" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight">
                      PersonalKanban
                    </h4>
                  </div>
                </div>
                <p>
                  {t('about_desc')}
                </p>
                <div className="border-t border-slate-200/50 dark:border-slate-800/30 pt-3 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 font-sans">{t('created_by')}</span>
                  <div className="flex gap-3">
                    <a
                      href="https://unsplash.com/@javchz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      title="Unsplash Profile"
                    >
                      <span>Unsplash</span>
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a
                      href="https://github.com/JavChz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>Javier Garcia Chavez</span>
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="font-mono text-3xs leading-relaxed bg-slate-100 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 overflow-x-auto max-h-[140px]">
                  <p className="mb-1 font-bold">MIT License</p>
                  <p className="mb-2">Copyright (c) 2026 JavChz</p>
                  <p>
                    Permission is hereby granted, free of charge, to any person obtaining a copy
                    of this software and associated documentation files (the "Software"), to deal
                    in the Software without restriction, including without limitation the rights
                    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                    copies of the Software, and to permit persons to whom the Software is
                    furnished to do so, subject to the following conditions:
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

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

