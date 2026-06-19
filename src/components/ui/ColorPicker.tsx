import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { HUES, SHADES, COLOR_MAP } from '../../utils/colors';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeColorDef = COLOR_MAP[value] || COLOR_MAP['blue-500'];

  const handleSelectColor = (colorKey: string) => {
    onChange(colorKey);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 text-left relative">
      {label && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider animate-fade-in">
          {label}
        </span>
      )}
      
      {/* Selected Color Trigger Button - Styled as a compact color swatch icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-800 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm flex items-center justify-center flex-shrink-0 relative ${activeColorDef.bg}`}
        title="Choose project color"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-black/35 shadow-xs" />
      </button>

      {/* Grid Popover Panel */}
      {isOpen && (
        <>
          {/* Overlay mask to close when clicking outside */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          
          {/* Floating Grid Container (Aligned right to prevent clipping on boundaries) */}
          <div className="absolute top-full right-0 mt-1.5 glass-panel p-3 rounded-xl shadow-xl z-40 animate-fade-in flex flex-col gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-w-[210px]">
            <div className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <Palette size={10} />
              Select Color
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
                      className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 hover:scale-120 active:scale-90 flex items-center justify-center border border-black/5 dark:border-white/5 ${itemDef.bg} ${
                        isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-105 shadow-md' : ''
                      }`}
                      title={colorKey}
                    >
                      {isSelected && (
                        <Check
                          size={10}
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
        </>
      )}
    </div>
  );
};
