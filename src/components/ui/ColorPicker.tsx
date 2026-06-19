import React from 'react';
import { Check } from 'lucide-react';
import { HUES, SHADES, COLOR_MAP } from '../../utils/colors';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="flex flex-col gap-2 text-left">
      {label && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      )}
      
      {/* 8x5 Compact Color Grid */}
      <div className="glass-panel p-4 rounded-xl flex justify-center">
        <div className="grid grid-cols-5 gap-2.5 max-w-[170px]">
          {HUES.flatMap((hue) =>
            SHADES.map((shade) => {
              const colorKey = `${hue}-${shade}`;
              const isSelected = value === colorKey;
              const def = COLOR_MAP[colorKey];

              return (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => onChange(colorKey)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-200 hover:scale-115 active:scale-90 flex items-center justify-center border border-black/5 dark:border-white/5 ${def.bg} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-105 shadow-md' : ''
                  }`}
                  title={colorKey}
                >
                  {isSelected && (
                    <Check
                      size={12}
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
    </div>
  );
};
