import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useKanbanStore } from '../../../store/useKanbanStore';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { Upload } from 'lucide-react';
import type { FeedbackState } from './SettingsFeedbackBanner';

interface ImportTabProps {
  onFeedback: (feedback: FeedbackState) => void;
}

export const ImportTab: React.FC<ImportTabProps> = ({ onFeedback }) => {
  const { importState } = useKanbanStore();
  const { t } = useTranslation();
  const [importJson, setImportJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportText = () => {
    if (!importJson.trim()) return;
    const success = importState(importJson);
    if (success) {
      onFeedback({ type: 'success', message: t('import_success') });
      setImportJson('');
    } else {
      onFeedback({ type: 'error', message: t('import_error') });
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
          onFeedback({ type: 'success', message: t('import_success') });
        } else {
          onFeedback({ type: 'error', message: t('import_error') });
        }
      }
    };
    reader.onerror = () => {
      onFeedback({ type: 'error', message: 'File read error.' });
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-left">
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

        {/* Manual JSON Paste Textarea */}
        <div className="flex flex-col gap-2 pt-2">
          <Textarea
            label={t('paste_json')}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='{ "projects": [...], "tasks": [...] }'
            rows={4}
            className="font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleImportText}
              disabled={!importJson.trim()}
              size="sm"
            >
              {t('import_data')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
