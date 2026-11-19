import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { SettingsFeedbackBanner, type FeedbackState } from './SettingsModal/SettingsFeedbackBanner';
import { PreferencesTab } from './SettingsModal/PreferencesTab';
import { ExportTab } from './SettingsModal/ExportTab';
import { ImportTab } from './SettingsModal/ImportTab';
import { ShortcutsTab } from './SettingsModal/ShortcutsTab';
import { AboutTab } from './SettingsModal/AboutTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'preferences' | 'export' | 'import' | 'usage' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('preferences');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setFeedback(null);
  };

  const handleClose = () => {
    setFeedback(null);
    onClose();
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'preferences', label: t('preferences') },
    { key: 'export', label: t('export') },
    { key: 'import', label: t('import') },
    { key: 'usage', label: t('usage_shortcuts') },
    { key: 'about', label: t('about_license') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('settings_about')}
      size="lg"
    >
      <div className="flex flex-col md:flex-row gap-6 min-h-[360px]">
        {/* Vertical Tabs List */}
        <div className="flex md:flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-200/70 dark:border-white/8 pb-3 md:pb-0 md:pr-4 min-w-[160px]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-slate-900/[0.07] dark:bg-white/[0.09] text-slate-950 dark:text-white font-semibold shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content Pane */}
        <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex flex-col gap-4">
          <SettingsFeedbackBanner feedback={feedback} />

          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'export' && <ExportTab onFeedback={setFeedback} />}
          {activeTab === 'import' && <ImportTab onFeedback={setFeedback} />}
          {activeTab === 'usage' && <ShortcutsTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </Modal>
  );
};
