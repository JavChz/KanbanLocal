import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HUES, SHADES, COLOR_MAP } from '../../utils/colors';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const POPOVER_WIDTH = 224;
const POPOVER_EST_HEIGHT = 186;

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeColorDef = COLOR_MAP[value] || COLOR_MAP['blue-500'];

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredLeft = rect.right - POPOVER_WIDTH;
      const left = Math.max(12, Math.min(preferredLeft, viewportWidth - POPOVER_WIDTH - 12));
      const openAbove =
        rect.bottom + 6 + POPOVER_EST_HEIGHT > viewportHeight - 12 &&
        rect.top - POPOVER_EST_HEIGHT - 6 > 12;
      const top = openAbove ? rect.top - POPOVER_EST_HEIGHT - 6 : rect.bottom + 6;
      setCoords({ top, left });
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelectColor = (colorKey: string) => {
    onChange(colorKey);
    setIsOpen(false);
  };

  // Capture Escape so closing the color popover doesn't dismiss the parent modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsOpen(false);
      }
    };

    const handleViewportChange = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(
        12,
        Math.min(rect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - 12)
      );
      const openAbove =
        rect.bottom + 6 + POPOVER_EST_HEIGHT > window.innerHeight - 12 &&
        rect.top - POPOVER_EST_HEIGHT - 6 > 12;
      const top = openAbove ? rect.top - POPOVER_EST_HEIGHT - 6 : rect.bottom + 6;
      setCoords({ top, left });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('scroll', handleViewportChange, { capture: true, passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-1.5 text-left relative">
      {label && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* Selected Color Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-9 h-9 rounded-lg border border-slate-300/90 dark:border-white/15 cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center flex-shrink-0 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${activeColorDef.bg}`}
        title={t('project_color', 'Choose project color')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 dark:bg-black/35 shadow-xs" />
      </button>

      {/* Portaled Grid Popover Panel */}
      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[var(--z-popover)]"
              onClick={() => setIsOpen(false)}
            />
            <div
              style={{ top: `${coords.top}px`, left: `${coords.left}px`, width: `${POPOVER_WIDTH}px` }}
              className="fixed glass-panel p-3 rounded-xl shadow-2xl z-[var(--z-popover)] animate-popover-in flex flex-col gap-2 border border-slate-200/90 dark:border-white/12 bg-white dark:bg-slate-900"
            >
              <div className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/70 dark:border-slate-800 pb-1.5">
                <Palette size={11} />
                <span>{t('project_color', 'Select Color')}</span>
              </div>

              {/* 8-column, 5-row Grid (Hues x Shades) */}
              <div className="grid grid-cols-8 gap-1.5">
                {SHADES.map((shade) =>
                  HUES.map((hue) => {
                    const colorKey = `${hue}-${shade}`;
                    const isSelected = value === colorKey;
                    const itemDef = COLOR_MAP[colorKey];

                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => handleSelectColor(colorKey)}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-90 flex items-center justify-center border border-black/10 dark:border-white/10 ${itemDef.bg} ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-105 shadow-sm'
                            : ''
                        }`}
                        title={colorKey}
                        aria-label={colorKey}
                      >
                        {isSelected && (
                          <Check
                            size={10}
                            strokeWidth={3}
                            className={
                              shade === '400' && hue === 'amber'
                                ? 'text-slate-900'
                                : 'text-white'
                            }
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
