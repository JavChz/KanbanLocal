import React, { useState, useRef } from 'react';
import { useKanbanStore } from '../store/useKanbanStore';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Download, Upload, CheckCircle, AlertCircle, Globe } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage, exportState, importState } = useKanbanStore();

  const [importJson, setImportJson] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLanguageChange = (lang: 'en' | 'fr' | 'ja' | 'es') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleExport = () => {
    try {
      const stateString = exportState();
      const blob = new Blob([stateString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personalkanban-state-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
    // Reset file input value to allow uploading same file again
    if (e.target) e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const languages: { code: 'en' | 'fr' | 'ja' | 'es'; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'ja', label: '日本語', flag: 'JA' },
    { code: 'es', label: 'Español', flag: 'ES' },
  ];

  return (
    <div className="flex flex-col gap-8 h-full animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 md:text-4xl">
          {t('settings')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure application parameters, themes, languages, and import or export offline workspace backups.
        </p>
      </div>

      {/* Alert Banner feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-500/25 dark:border-green-900/30'
              : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-500/25 dark:border-red-900/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Grid Settings Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Panel Left: Preferences */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 pb-2.5 border-b border-slate-200/50 dark:border-slate-800/30">
              Preferences
            </h3>

            {/* Language Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={13} />
                {t('language')}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {languages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-600 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500 dark:text-blue-400 font-semibold'
                          : 'bg-transparent border-slate-200/50 dark:border-slate-800/30 text-slate-600 dark:text-slate-300 hover:bg-slate-200/35 dark:hover:bg-slate-900/10'
                      }`}
                    >
                      <span className="text-sm font-mono tracking-wider mb-0.5">{lang.flag}</span>
                      <span className="text-xs">{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Toggle Selector */}
            <ThemeToggle />
          </div>
        </div>

        {/* Panel Right: Data Sync */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 pb-2.5 border-b border-slate-200/50 dark:border-slate-800/30">
              Offline Data Management
            </h3>

            {/* Export block */}
            <div className="flex flex-col gap-2 items-start text-left">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t('export_data')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Download a JSON copy of all project definitions, tasks, language preferences, and state.
              </p>
              <Button onClick={handleExport} className="flex items-center gap-2">
                <Download size={15} />
                {t('export_data')}
              </Button>
            </div>

            <hr className="border-slate-200/50 dark:border-slate-800/30" />

            {/* Import block */}
            <div className="flex flex-col gap-4 text-left">
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t('import_data')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Restore backup workspace state. Warning: importing will replace all current browser tasks and boards.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={triggerFileInput}
                className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-slate-200/15 dark:hover:bg-slate-900/10"
              >
                <Upload size={20} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Upload backup JSON file
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
                  - Or paste raw JSON -
                </span>
                <Textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{"tasks": [], "projects": []}'
                  rows={4}
                  className="font-mono text-xs"
                />
                <Button
                  onClick={handleImportText}
                  variant="secondary"
                  disabled={!importJson.trim()}
                  className="self-end"
                >
                  Import Paste
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
