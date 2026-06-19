import React from 'react';

interface ShortcutRowProps {
  keys: string;
  description: string;
  isLast?: boolean;
}

export const ShortcutRow: React.FC<ShortcutRowProps> = ({ keys, description, isLast = false }) => {
  return (
    <div className={`flex justify-between items-center py-1.5 ${isLast ? '' : 'border-b border-slate-100 dark:border-slate-900'}`}>
      <span className="font-semibold text-slate-800 dark:text-slate-200">{keys}</span>
      <span className="text-slate-500 dark:text-slate-400 font-sans">{description}</span>
    </div>
  );
};
