import React from 'react';
import { useTranslation } from 'react-i18next';
import { Kanban } from 'lucide-react';

export const AboutTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-left">
      <div className="flex items-center gap-3">
        <Kanban size={32} className="text-blue-500" />
        <div>
          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight">
            KanbanLocal
          </h4>
        </div>
      </div>
      <p>{t('about_desc')}</p>
      <div className="pt-2 flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400 font-sans">
          {t('created_by')} Javier Garcia Chavez:{' '}
        </span>
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
            <svg
              className="w-3.5 h-3.5 inline"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
          of this software and associated documentation files (the &quot;Software&quot;), to deal
          in the Software without restriction, including without limitation the rights
          to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:
        </p>
      </div>
    </div>
  );
};
