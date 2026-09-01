import React from 'react';

interface ClaudeIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ClaudeIcon: React.FC<ClaudeIconProps> = ({
  className = '',
  size = 24,
  color = '#DA7756'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2.5V21.5M2.5 12H21.5M5.278 5.278L18.722 18.722M18.722 5.278L5.278 18.722M3.73 8.35L20.27 15.65M8.35 3.73L15.65 20.27M20.27 8.35L3.73 15.65M15.65 3.73L8.35 20.27"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const ClaudeBurstIcon: React.FC<ClaudeIconProps> = ({
  className = '',
  size = 28,
  color = '#DA7756'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 8-pointed smooth rounded sunburst */}
      <g stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="16" y1="3" x2="16" y2="29" />
        <line x1="3" y1="16" x2="29" y2="16" />
        <line x1="6.8" y1="6.8" x2="25.2" y2="25.2" />
        <line x1="25.2" y1="6.8" x2="6.8" y2="25.2" />
        <line x1="4.5" y1="11.2" x2="27.5" y2="20.8" />
        <line x1="11.2" y1="4.5" x2="20.8" y2="27.5" />
        <line x1="27.5" y1="11.2" x2="4.5" y2="20.8" />
        <line x1="20.8" y1="4.5" x2="11.2" y2="27.5" />
      </g>
    </svg>
  );
};
