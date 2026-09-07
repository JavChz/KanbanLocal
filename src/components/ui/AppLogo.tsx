import React, { useId } from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'badge' | 'glyph';
  accentColor?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 24,
  className = '',
  style,
  variant = 'badge',
  accentColor,
}) => {
  const reactId = useId();
  const gradId = `kl-logo-grad-${reactId.replace(/[^a-zA-Z0-9-_]/g, '')}`;

  if (variant === 'glyph') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill={accentColor || 'currentColor'}
        className={className}
        style={style}
        aria-hidden="true"
      >
        {/* Column 1: Vertical spine of the K (2 cards) */}
        <rect x="5" y="5" width="6" height="9.5" rx="1.8" />
        <rect x="5" y="16.5" width="6" height="10.5" rx="1.8" opacity="0.85" />

        {/* Column 2: Center node of the K with soft shades */}
        <rect x="13" y="5" width="6" height="4.5" rx="1.8" opacity="0.18" />
        <rect x="13" y="11.5" width="6" height="9" rx="1.8" />
        <rect x="13" y="22.5" width="6" height="4.5" rx="1.8" opacity="0.18" />

        {/* Column 3: Upper arm & lower leg of the K */}
        <rect x="21" y="5" width="6" height="8.5" rx="1.8" />
        <rect x="21" y="15.5" width="6" height="3.5" rx="1.8" opacity="0.18" />
        <rect x="21" y="21" width="6" height="6" rx="1.8" opacity="0.9" />
      </svg>
    );
  }

  // Default color palette is a warm greige (stone / titanium) hue rather than purple
  const stop0 = accentColor
    ? `color-mix(in srgb, ${accentColor} 85%, white)`
    : '#68625d';
  const stop50 = accentColor || '#44403c';
  const stop100 = accentColor
    ? `color-mix(in srgb, ${accentColor} 75%, black)`
    : '#262423';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={stop0} />
          <stop offset="50%" stopColor={stop50} />
          <stop offset="100%" stopColor={stop100} />
        </linearGradient>
      </defs>

      {/* Crisp square exterior container (no rounded corners) */}
      <rect width="32" height="32" fill={`url(#${gradId})`} />
      <rect x="0.5" y="0.5" width="31" height="31" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* Column 1: Vertical spine of the K (2 stacked Kanban cards) */}
      <rect x="5" y="5" width="6" height="9.5" rx="1.8" fill="#ffffff" fillOpacity="0.95" />
      <rect x="5" y="16.5" width="6" height="10.5" rx="1.8" fill="#ffffff" fillOpacity="0.85" />

      {/* Column 2: Ghost card slots + bright center K node */}
      <rect x="13" y="5" width="6" height="4.5" rx="1.8" fill="#ffffff" fillOpacity="0.18" />
      <rect x="13" y="11.5" width="6" height="9" rx="1.8" fill="#ffffff" fillOpacity="1" />
      <rect x="13" y="22.5" width="6" height="4.5" rx="1.8" fill="#ffffff" fillOpacity="0.18" />

      {/* Column 3: K upper arm, ghost slot, K lower leg */}
      <rect x="21" y="5" width="6" height="8.5" rx="1.8" fill="#ffffff" fillOpacity="0.95" />
      <rect x="21" y="15.5" width="6" height="3.5" rx="1.8" fill="#ffffff" fillOpacity="0.18" />
      <rect x="21" y="21" width="6" height="6" rx="1.8" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  );
};
