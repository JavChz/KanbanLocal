import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Plus, X, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';

interface TaskLinksEditorProps {
  links: string[];
  onChangeLinks: (links: string[]) => void;
}

export const TaskLinksEditor: React.FC<TaskLinksEditorProps> = ({
  links,
  onChangeLinks,
}) => {
  const { t } = useTranslation();
  const [newLink, setNewLink] = useState('');

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLink = newLink.trim();
    if (cleanLink && !links.includes(cleanLink)) {
      let formattedLink = cleanLink;
      if (!/^https?:\/\//i.test(cleanLink)) {
        formattedLink = `https://${cleanLink}`;
      }
      onChangeLinks([...links, formattedLink]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (indexToRemove: number) => {
    onChangeLinks(links.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <Link2 size={13} />
        {t('links')}
      </label>
      <div className="space-y-1.5 max-h-24 overflow-y-auto mb-1">
        {links.map((link, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30"
          >
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1.5 truncate pr-2 font-semibold"
              style={{ color: 'var(--project-color, var(--color-blue-600))' }}
            >
              <ExternalLink size={11} className="flex-shrink-0" />
              <span className="truncate">{link}</span>
            </a>
            <button
              type="button"
              onClick={() => handleRemoveLink(idx)}
              className="text-slate-400 hover:text-red-500 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddLink} className="flex gap-2">
        <input
          type="text"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="example.com"
          className="glass-input flex-1 px-3 py-1.5 rounded-lg text-xs"
        />
        <Button type="submit" variant="secondary" size="sm">
          <Plus size={14} />
        </Button>
      </form>
    </div>
  );
};
