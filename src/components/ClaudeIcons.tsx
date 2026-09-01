import React from 'react';
import claudeLogoSvg from '../assets/claude-logo.svg';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// 1. Claude Official Starburst Logo (user's SVG file)
export const ClaudeStarburst: React.FC<IconProps> = ({
  className = '',
  size = 28,
}) => (
  <img
    src={claudeLogoSvg}
    alt="Claude"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    draggable={false}
  />
);

// 2. Claude Official Top-Right Mascot Avatar Icon (seen in screenshot top right)
export const ClaudeHeaderAvatar: React.FC<IconProps> = ({
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
    <line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="2.5" />
    <line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="2.5" />
    <path d="M9 15C10 16 14 16 15 15" />
  </svg>
);

// 3. Claude Official Projects Icon (Matching Image: Top 2 rounded pill lines + bottom container)
export const ClaudeProjectsIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Top short pill */}
    <line x1="8" y1="4" x2="16" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Middle medium pill */}
    <line x1="6" y1="7.5" x2="18" y2="7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Bottom bucket / container */}
    <path
      d="M4.5 11H19.5L17.8 19.3C17.6 20.3 16.7 21 15.7 21H8.3C7.3 21 6.4 20.3 6.2 19.3L4.5 11Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

// 4. Claude Official Artifacts Icon (Matching Image: Circle + Square + Semicircle wedge)
export const ClaudeArtifactsIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Bottom-left circle */}
    <circle cx="7.2" cy="15.2" r="4.2" stroke={color} strokeWidth="1.8" />
    {/* Bottom-right rounded square */}
    <rect x="12.5" y="11" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
    {/* Top semicircle / dome wedge */}
    <path
      d="M8.2 11.5 L16.8 7.2 A 6 6 0 0 0 8.2 11.5 Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

// 5. Claude Official Code Icon (Sidebar)
export const ClaudeCodeIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
  color = 'currentColor'
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
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

// 6. Claude Official Customize Icon (Matching Image: Briefcase / Toolbox with rounded handle & slotted divider)
export const ClaudeCustomizeIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Handle on top */}
    <path
      d="M8.5 7V4.5C8.5 3.67 9.17 3 10 3H14C14.83 3 15.5 3.67 15.5 4.5V7"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Briefcase rounded body */}
    <rect
      x="3.5"
      y="7"
      width="17"
      height="13.5"
      rx="3.5"
      stroke={color}
      strokeWidth="1.8"
    />
    {/* Middle slotted divider line */}
    <line x1="3.5" y1="13.5" x2="7.5" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="9.8" y1="13.5" x2="14.2" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <line x1="16.5" y1="13.5" x2="20.5" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 7. Claude Official New Chat Plus Circle Icon (Matching uploaded image)
export const ClaudeNewChatIcon: React.FC<IconProps> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Dark filled circle base */}
    <circle cx="12" cy="12" r="11" fill="#2C2B29" />
    {/* Clean white plus */}
    <path
      d="M12 7.2V16.8M7.2 12H16.8"
      stroke="#ECEBE7"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// 8. Claude Official Design / Palette Icon (Matching uploaded image)
export const ClaudeDesignIcon: React.FC<IconProps> = ({
  className = '',
  size = 20,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Smooth palette outline with bottom thumb notch */}
    <path
      d="M12 3C6.48 3 2 7.03 2 12C2 15.68 4.25 18.84 7.54 20.27C8.24 20.57 9 20.08 9 19.33V18.2C9 16.99 9.99 16 11.2 16H13C16.31 16 19 13.31 19 10C19 9.45 19.45 9 20 9H20.4C21.28 9 22 8.28 22 7.4C22 4.97 17.52 3 12 3Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* 4 Paint spots */}
    <circle cx="8.5" cy="8.5" r="1.4" fill={color} />
    <circle cx="13" cy="7.2" r="1.4" fill={color} />
    <circle cx="16.5" cy="11" r="1.4" fill={color} />
    <circle cx="7.8" cy="13.2" r="1.4" fill={color} />
  </svg>
);

// 9. Claude Chat Bullet Icon (the subtle hollow circle next to each chat in screenshot)
export const ClaudeChatBullet: React.FC<IconProps> = ({
  className = '',
  size = 8,
  color = '#7E7C76'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 8 8"
    fill="none"
    className={className}
  >
    <circle cx="4" cy="4" r="2.8" stroke={color} strokeWidth="1.2" />
  </svg>
);

// 10. Claude Design Workspace Target Circle Icon
export const ClaudeWorkspaceTarget: React.FC<IconProps> = ({
  className = '',
  size = 16,
  color = '#DA7756'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" fill={color} />
  </svg>
);

// 9. Claude Waveform / Audio Call Icon (Inside Prompt Bar)
export const ClaudeWaveform: React.FC<IconProps> = ({
  className = '',
  size = 18,
  color = '#9C9A92'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" y1="10" x2="4" y2="14" />
    <line x1="8" y1="6" x2="8" y2="18" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="16" y1="7" x2="16" y2="17" />
    <line x1="20" y1="10" x2="20" y2="14" />
  </svg>
);

// 10. Claude Microphone Icon
export const ClaudeMic: React.FC<IconProps> = ({
  className = '',
  size = 18,
  color = '#9C9A92'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 10C5 13.866 8.13401 17 12 17C15.866 17 19 13.866 19 10" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);
