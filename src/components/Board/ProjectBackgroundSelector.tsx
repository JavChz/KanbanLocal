import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ImageOff } from 'lucide-react';
import { Input } from '../ui/Input';
import { BACKGROUND_IMAGES } from '../../utils/backgrounds';
import type { ProjectBackground } from '../../types/kanban';

interface ProjectBackgroundSelectorProps {
  bgType: ProjectBackground['type'];
  bgValue: string;
  onChangeType: (type: ProjectBackground['type']) => void;
  onChangeValue: (value: string) => void;
}

export const ProjectBackgroundSelector: React.FC<ProjectBackgroundSelectorProps> = ({
  bgType,
  bgValue,
  onChangeType,
  onChangeValue,
}) => {
  const { t } = useTranslation();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasPreviewError = Boolean(bgValue) && failedUrl === bgValue;

  const handleSelectType = (type: ProjectBackground['type']) => {
    onChangeType(type);
    if (type === 'theme') {
      onChangeValue('');
    } else if (type === 'solid' && !bgValue.startsWith('#')) {
      onChangeValue('#3b82f6');
    } else if (type === 'image' && !(bgValue in BACKGROUND_IMAGES)) {
      onChangeValue('sunset');
    } else if (type === 'custom' && bgValue.startsWith('#')) {
      onChangeValue('');
    }
  };

  return (
    <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-200/70 dark:border-white/8">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        {t('project_background') || 'Project Background'}
      </label>

      {/* Segmented control for Type */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/70 dark:border-white/8">
        {(['theme', 'solid', 'image', 'custom'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleSelectType(type)}
            className={`py-1.5 px-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
              bgType === type
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {type === 'theme' && (t('theme') || 'Theme')}
            {type === 'solid' && (t('solid') || 'Solid')}
            {type === 'image' && (t('image') || 'Image')}
            {type === 'custom' && (t('custom') || 'URL')}
          </button>
        ))}
      </div>

      {/* Sub-inputs based on Type */}
      {bgType === 'theme' && (
        <p className="text-2xs text-slate-500 dark:text-slate-400 italic">
          {t('reset_bg_desc')}
        </p>
      )}

      {bgType === 'solid' && (
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs hover:scale-105 active:scale-95 transition-transform">
            <input
              type="color"
              value={bgValue.startsWith('#') ? bgValue : '#3b82f6'}
              onChange={(e) => onChangeValue(e.target.value)}
              className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
            />
          </div>
          <div className="flex-1">
            <Input
              value={bgValue}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder="#3b82f6"
              className="font-mono text-xs"
            />
          </div>
        </div>
      )}

      {bgType === 'image' && (
        <div className="flex flex-col gap-2.5 animate-fade-in">
          <div className="grid grid-cols-3 gap-2 max-h-[168px] overflow-y-auto p-0.5">
            {Object.entries(BACKGROUND_IMAGES).map(([name, url]) => {
              const isSelected = bgValue === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChangeValue(name)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-150 active:scale-95 shadow-xs group bg-slate-200 dark:bg-slate-800 ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  title={name}
                >
                  <img
                    src={url}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/65 py-0.5 text-center">
                    <span className="text-4xs font-bold text-white uppercase tracking-wider truncate block px-0.5">
                      {name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xs">
                      <Check size={8} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-2xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap mt-0.5">
            <span>{t('unsplash_profile_hint')}</span>
            <a
              href="https://unsplash.com/@javchz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>@javchz</span>
            </a>
          </p>
        </div>
      )}

      {bgType === 'custom' && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <Input
            label={t('custom_img_url')}
            value={bgValue}
            onChange={(e) => {
              setFailedUrl(null);
              onChangeValue(e.target.value);
            }}
            placeholder={t('custom_img_placeholder')}
            required
          />
          {bgValue && (
            <div className="mt-1 rounded-xl border border-slate-200/70 dark:border-white/8 p-1.5 bg-slate-100/60 dark:bg-slate-900/40 flex items-center justify-center min-h-[64px] max-h-[120px] overflow-hidden">
              {hasPreviewError ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 py-3">
                  <ImageOff size={14} />
                  <span>{t('url_preview')}</span>
                </div>
              ) : (
                <img
                  src={bgValue}
                  alt={t('url_preview')}
                  decoding="async"
                  onError={() => setFailedUrl(bgValue)}
                  className="max-h-[100px] rounded-lg object-contain"
                />
              )}
            </div>
          )}
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
            <span>{t('unsplash_profile_credit')}</span>
            <a
              href="https://unsplash.com/@javchz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Unsplash (@javchz)
            </a>
          </p>
        </div>
      )}
    </div>
  );
};
