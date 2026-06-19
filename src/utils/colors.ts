export const HUES = [
  'slate',
  'red',
  'orange',
  'amber',
  'emerald',
  'blue',
  'indigo',
  'violet',
] as const;

export type Hue = typeof HUES[number];

export const SHADES = [
  '400',
  '500',
  '600',
  '700',
  '800',
] as const;

export type Shade = typeof SHADES[number];

export interface ColorDefinition {
  bg: string;
  text: string;
  border: string;
  ring: string;
  bgLight: string; // for light translucent layouts
}

// Complete static map of all 40 combinations to guarantee bundling in Tailwind CSS v4
export const COLOR_MAP: Record<string, ColorDefinition> = {
  // Slate
  'slate-400': {
    bg: 'bg-slate-400',
    text: 'text-slate-400',
    border: 'border-slate-400',
    ring: 'focus:ring-slate-400/30 ring-slate-400',
    bgLight: 'bg-slate-400/10',
  },
  'slate-500': {
    bg: 'bg-slate-500',
    text: 'text-slate-500',
    border: 'border-slate-500',
    ring: 'focus:ring-slate-500/30 ring-slate-500',
    bgLight: 'bg-slate-500/10',
  },
  'slate-600': {
    bg: 'bg-slate-600',
    text: 'text-slate-600',
    border: 'border-slate-600',
    ring: 'focus:ring-slate-600/30 ring-slate-600',
    bgLight: 'bg-slate-600/10',
  },
  'slate-700': {
    bg: 'bg-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-700',
    ring: 'focus:ring-slate-700/30 ring-slate-700',
    bgLight: 'bg-slate-700/10',
  },
  'slate-800': {
    bg: 'bg-slate-800',
    text: 'text-slate-800',
    border: 'border-slate-800',
    ring: 'focus:ring-slate-800/30 ring-slate-800',
    bgLight: 'bg-slate-800/10',
  },

  // Red
  'red-400': {
    bg: 'bg-red-400',
    text: 'text-red-400',
    border: 'border-red-400',
    ring: 'focus:ring-red-400/30 ring-red-400',
    bgLight: 'bg-red-400/10',
  },
  'red-500': {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    ring: 'focus:ring-red-500/30 ring-red-500',
    bgLight: 'bg-red-500/10',
  },
  'red-600': {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    ring: 'focus:ring-red-600/30 ring-red-600',
    bgLight: 'bg-red-600/10',
  },
  'red-700': {
    bg: 'bg-red-700',
    text: 'text-red-700',
    border: 'border-red-700',
    ring: 'focus:ring-red-700/30 ring-red-700',
    bgLight: 'bg-red-700/10',
  },
  'red-800': {
    bg: 'bg-red-800',
    text: 'text-red-800',
    border: 'border-red-800',
    ring: 'focus:ring-red-800/30 ring-red-800',
    bgLight: 'bg-red-800/10',
  },

  // Orange
  'orange-400': {
    bg: 'bg-orange-400',
    text: 'text-orange-400',
    border: 'border-orange-400',
    ring: 'focus:ring-orange-400/30 ring-orange-400',
    bgLight: 'bg-orange-400/10',
  },
  'orange-500': {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    ring: 'focus:ring-orange-500/30 ring-orange-500',
    bgLight: 'bg-orange-500/10',
  },
  'orange-600': {
    bg: 'bg-orange-600',
    text: 'text-orange-600',
    border: 'border-orange-600',
    ring: 'focus:ring-orange-600/30 ring-orange-600',
    bgLight: 'bg-orange-600/10',
  },
  'orange-700': {
    bg: 'bg-orange-700',
    text: 'text-orange-700',
    border: 'border-orange-700',
    ring: 'focus:ring-orange-700/30 ring-orange-700',
    bgLight: 'bg-orange-700/10',
  },
  'orange-800': {
    bg: 'bg-orange-800',
    text: 'text-orange-800',
    border: 'border-orange-800',
    ring: 'focus:ring-orange-800/30 ring-orange-800',
    bgLight: 'bg-orange-800/10',
  },

  // Amber
  'amber-400': {
    bg: 'bg-amber-400',
    text: 'text-amber-500', // Using 500 for text contrast
    border: 'border-amber-400',
    ring: 'focus:ring-amber-400/30 ring-amber-400',
    bgLight: 'bg-amber-400/10',
  },
  'amber-500': {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    border: 'border-amber-500',
    ring: 'focus:ring-amber-500/30 ring-amber-500',
    bgLight: 'bg-amber-500/10',
  },
  'amber-600': {
    bg: 'bg-amber-600',
    text: 'text-amber-600',
    border: 'border-amber-600',
    ring: 'focus:ring-amber-600/30 ring-amber-600',
    bgLight: 'bg-amber-600/10',
  },
  'amber-700': {
    bg: 'bg-amber-700',
    text: 'text-amber-700',
    border: 'border-amber-700',
    ring: 'focus:ring-amber-700/30 ring-amber-700',
    bgLight: 'bg-amber-700/10',
  },
  'amber-800': {
    bg: 'bg-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-800',
    ring: 'focus:ring-amber-800/30 ring-amber-800',
    bgLight: 'bg-amber-800/10',
  },

  // Emerald
  'emerald-400': {
    bg: 'bg-emerald-400',
    text: 'text-emerald-400',
    border: 'border-emerald-400',
    ring: 'focus:ring-emerald-400/30 ring-emerald-400',
    bgLight: 'bg-emerald-400/10',
  },
  'emerald-500': {
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    border: 'border-emerald-500',
    ring: 'focus:ring-emerald-500/30 ring-emerald-500',
    bgLight: 'bg-emerald-500/10',
  },
  'emerald-600': {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-600',
    ring: 'focus:ring-emerald-600/30 ring-emerald-600',
    bgLight: 'bg-emerald-600/10',
  },
  'emerald-700': {
    bg: 'bg-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-700',
    ring: 'focus:ring-emerald-700/30 ring-emerald-700',
    bgLight: 'bg-emerald-700/10',
  },
  'emerald-800': {
    bg: 'bg-emerald-800',
    text: 'text-emerald-800',
    border: 'border-emerald-800',
    ring: 'focus:ring-emerald-800/30 ring-emerald-800',
    bgLight: 'bg-emerald-800/10',
  },

  // Blue
  'blue-400': {
    bg: 'bg-blue-400',
    text: 'text-blue-400',
    border: 'border-blue-400',
    ring: 'focus:ring-blue-400/30 ring-blue-400',
    bgLight: 'bg-blue-400/10',
  },
  'blue-500': {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    ring: 'focus:ring-blue-500/30 ring-blue-500',
    bgLight: 'bg-blue-500/10',
  },
  'blue-600': {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-600',
    ring: 'focus:ring-blue-600/30 ring-blue-600',
    bgLight: 'bg-blue-600/10',
  },
  'blue-700': {
    bg: 'bg-blue-700',
    text: 'text-blue-700',
    border: 'border-blue-700',
    ring: 'focus:ring-blue-700/30 ring-blue-700',
    bgLight: 'bg-blue-700/10',
  },
  'blue-800': {
    bg: 'bg-blue-800',
    text: 'text-blue-800',
    border: 'border-blue-800',
    ring: 'focus:ring-blue-800/30 ring-blue-800',
    bgLight: 'bg-blue-800/10',
  },

  // Indigo
  'indigo-400': {
    bg: 'bg-indigo-400',
    text: 'text-indigo-400',
    border: 'border-indigo-400',
    ring: 'focus:ring-indigo-400/30 ring-indigo-400',
    bgLight: 'bg-indigo-400/10',
  },
  'indigo-500': {
    bg: 'bg-indigo-500',
    text: 'text-indigo-500',
    border: 'border-indigo-500',
    ring: 'focus:ring-indigo-500/30 ring-indigo-500',
    bgLight: 'bg-indigo-500/10',
  },
  'indigo-600': {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-600',
    ring: 'focus:ring-indigo-600/30 ring-indigo-600',
    bgLight: 'bg-indigo-600/10',
  },
  'indigo-700': {
    bg: 'bg-indigo-700',
    text: 'text-indigo-700',
    border: 'border-indigo-700',
    ring: 'focus:ring-indigo-700/30 ring-indigo-700',
    bgLight: 'bg-indigo-700/10',
  },
  'indigo-800': {
    bg: 'bg-indigo-800',
    text: 'text-indigo-800',
    border: 'border-indigo-800',
    ring: 'focus:ring-indigo-800/30 ring-indigo-800',
    bgLight: 'bg-indigo-800/10',
  },

  // Violet
  'violet-400': {
    bg: 'bg-violet-400',
    text: 'text-violet-400',
    border: 'border-violet-400',
    ring: 'focus:ring-violet-400/30 ring-violet-400',
    bgLight: 'bg-violet-400/10',
  },
  'violet-500': {
    bg: 'bg-violet-500',
    text: 'text-violet-500',
    border: 'border-violet-500',
    ring: 'focus:ring-violet-500/30 ring-violet-500',
    bgLight: 'bg-violet-500/10',
  },
  'violet-600': {
    bg: 'bg-violet-600',
    text: 'text-violet-600',
    border: 'border-violet-600',
    ring: 'focus:ring-violet-600/30 ring-violet-600',
    bgLight: 'bg-violet-600/10',
  },
  'violet-700': {
    bg: 'bg-violet-700',
    text: 'text-violet-700',
    border: 'border-violet-700',
    ring: 'focus:ring-violet-700/30 ring-violet-700',
    bgLight: 'bg-violet-700/10',
  },
  'violet-800': {
    bg: 'bg-violet-800',
    text: 'text-violet-800',
    border: 'border-violet-800',
    ring: 'focus:ring-violet-800/30 ring-violet-800',
    bgLight: 'bg-violet-800/10',
  },
};

export const getColorStyles = (colorKey: string): ColorDefinition => {
  return (
    COLOR_MAP[colorKey] || {
      bg: 'bg-blue-500',
      text: 'text-blue-500',
      border: 'border-blue-500',
      ring: 'focus:ring-blue-500/30 ring-blue-500',
      bgLight: 'bg-blue-500/10',
    }
  );
};
