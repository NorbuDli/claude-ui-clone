import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Original Aether AI Geometric Celestial Prism Logo
 */
export const AetherLogoIcon: React.FC<LogoProps> = ({
  className = '',
  size = 24,
  color = '#DA7756'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Geometric Compass Starburst */}
    <g stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2L19.5 12.5L30 16L19.5 19.5L16 30L12.5 19.5L2 16L12.5 12.5L16 2Z" fill="none" />
      <circle cx="16" cy="16" r="3" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
      <line x1="16" y1="7" x2="16" y2="25" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.6" />
      <line x1="7" y1="16" x2="25" y2="16" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.6" />
    </g>
  </svg>
);

/**
 * Ambient Aura Starburst for Greetings
 */
export const AetherAuraBurst: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  color = '#DA7756'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="3" x2="18" y2="33" />
      <line x1="3" y1="18" x2="33" y2="18" />
      <line x1="7.5" y1="7.5" x2="28.5" y2="28.5" strokeWidth="1.8" />
      <line x1="28.5" y1="7.5" x2="7.5" y2="28.5" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="4" fill={color} fillOpacity="0.2" />
    </g>
  </svg>
);

/**
 * Top Header Mascot Avatar
 */
export const AetherAvatar: React.FC<LogoProps> = ({
  className = '',
  size = 20,
  color = '#9C9A92'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="4" width="16" height="16" rx="5" />
    <circle cx="9" cy="10" r="1" fill={color} />
    <circle cx="15" cy="10" r="1" fill={color} />
    <path d="M9 15C10 16 14 16 15 15" />
  </svg>
);
