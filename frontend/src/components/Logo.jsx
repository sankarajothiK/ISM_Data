import React from 'react';
import logoImg from '../assets/logo.jpg';

/**
 * ISM Data Technology Logo Component
 * Renders the user's exact corporate logo image.
 * @param {string} variant 'light' or 'dark' or 'sidebar'
 * @param {string} className Additional container class names
 */
const Logo = ({ variant = 'dark', className = '' }) => {
  // If we are on a light background, we can add a subtle dark background wrapper to make the black logo pop
  const isLightBg = variant === 'light';

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="ISM Data Technology"
        className={`h-11 w-auto object-contain rounded-xl transition-all ${
          isLightBg ? 'bg-slate-950 p-1 border border-slate-800 shadow-sm' : ''
        }`}
      />
    </div>
  );
};

export default Logo;
