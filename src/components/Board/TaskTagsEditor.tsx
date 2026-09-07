import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface TaskTagsEditorProps {
  tags: string[];
  onChangeTags: (tags: string[]) => void;
}

export const TaskTagsEditor: React.FC<TaskTagsEditorProps> = ({
  tags,
  onChangeTags,
}) => {
  const { t } = useTranslation();
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTag.trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      onChangeTags([...tags, cleanTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChangeTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <Tag size={13} />
        {t('tags')}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-1 max-h-24 overflow-y-auto">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border"
            style={{
              borderColor: 'color-mix(in srgb, var(--project-color, var(--color-blue-500)) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--project-color, var(--color-blue-500)) 10%, transparent)',
              color: 'var(--project-color, var(--color-blue-600))',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(idx)}
              className="hover:text-red-500 rounded-full cursor-pointer inline-flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={handleAddTag} className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder={t('add_tag')}
          className="glass-input flex-1 px-3 py-1.5 rounded-lg text-xs"
        />
        <Button type="submit" variant="secondary" size="sm">
          <Plus size={14} />
        </Button>
      </form>
    </div>
  );
};
