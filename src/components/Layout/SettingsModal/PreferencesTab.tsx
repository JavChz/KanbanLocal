import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from '../../ui/ThemeToggle';

export const PreferencesTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in text-left">
      <LanguageSelector />
      <ThemeToggle />
    </div>
  );
};
