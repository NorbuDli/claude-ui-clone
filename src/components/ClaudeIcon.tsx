import React from 'react';
import claudeLogoSvg from '../assets/claude-logo.svg';

interface ClaudeIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ClaudeIcon: React.FC<ClaudeIconProps> = ({
  className = '',
  size = 24
}) => {
  return (
    <img
      src={claudeLogoSvg}
      alt="Claude"
      width={size}
      height={size}
      className={`object-contain select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
};

export const ClaudeBurstIcon: React.FC<ClaudeIconProps> = ({
  className = '',
  size = 28
}) => {
  return (
    <img
      src={claudeLogoSvg}
      alt="Claude"
      width={size}
      height={size}
      className={`object-contain select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
};
