import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShortcutRow } from '../../ui/ShortcutRow';

export const ShortcutsTab: React.FC = () => {
  const { t } = useTranslation();

  return (
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

      <div className="h-2" />

      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">
          {t('keyboard_shortcuts')}
        </h4>
        <p className="text-2xs text-slate-500 dark:text-slate-400 mb-2 font-sans">
          {t('shortcut_hint')}
        </p>
        <div className="flex flex-col gap-2 font-mono text-xs">
          <ShortcutRow keys="Ctrl + Alt + H" description={t('nav_home')} />
          <ShortcutRow keys="Ctrl + Alt + G" description={t('nav_global')} />
          <ShortcutRow keys="Ctrl + Alt + S" description={t('open_settings')} />
          <ShortcutRow keys="Ctrl + Alt + N" description={t('new_board_task')} isLast={true} />
        </div>
      </div>
    </div>
  );
};
