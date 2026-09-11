import React from 'react';

/**
 * MineIntelIcon
 * 
 * Standalone brand icon: Geometric "Strata M" mark
 * Visually communicates: Coal + Mining + Intelligence + Data
 * - Upper Stratum: Geological overburden / earth surface
 * - Core Stratum: Industrial copper coal seam & data insight chevron
 * - Foundation Stratum: Bedrock excavation base pillars
 */
export const MineIntelIcon = ({ 
  size = 32, 
  className = '', 
  accentColor = '#C05621',
  title = 'MineIntel AI Logo'
}) => {
  const numericSize = typeof size === 'number' 
    ? size 
    : { sm: 24, md: 32, lg: 36, xl: 44 }[size] || 32;

  return (
    <svg 
      width={numericSize} 
      height={numericSize} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      
      {/* Stratum 1 (Top / Overburden) — Graphite in light, crisp slate in dark */}
      <path 
        d="M 5 6 L 13 6 L 20 13 L 27 6 L 35 6 L 35 13 L 27 13 L 20 20 L 13 13 L 5 13 Z" 
        className="fill-[#1E232A] dark:fill-[#CBD5E1] transition-colors duration-200"
      />
      
      {/* Stratum 2 (Core / Coal Seam & Intelligence Insight) — Muted industrial copper */}
      <path 
        d="M 5 15.5 L 13 15.5 L 20 22.5 L 27 15.5 L 35 15.5 L 35 22.5 L 27 22.5 L 20 29.5 L 13 22.5 L 5 22.5 Z" 
        fill={accentColor} 
      />
      
      {/* Stratum 3 (Foundation / Bedrock Base Pillars) — Solid anchor blocks */}
      <rect 
        x="5" 
        y="25" 
        width="8" 
        height="9" 
        rx="1" 
        className="fill-[#475569] dark:fill-[#475569] transition-colors duration-200" 
      />
      <rect 
        x="27" 
        y="25" 
        width="8" 
        height="9" 
        rx="1" 
        className="fill-[#475569] dark:fill-[#475569] transition-colors duration-200" 
      />
    </svg>
  );
};

/**
 * MineIntelLogo
 * 
 * Full unified brand lockup:
 * - Icon ("Strata M")
 * - Wordmark: "MineIntel AI"
 * - Subtitle: "Coal & Mining Intelligence"
 * 
 * Variants:
 * - 'full': Standard horizontal lockup with icon, wordmark, and subtitle
 * - 'compact': Horizontal lockup with icon and wordmark (no subtitle)
 * - 'stacked': Vertical centered lockup (for login/auth cards)
 * - 'icon-only': Only the standalone icon
 */
export const MineIntelLogo = ({
  size = 32,
  variant = 'full',
  className = '',
  iconClassName = '',
  textClassName = '',
  subtitle = 'Coal & Mining Intelligence',
  onClick
}) => {
  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} onClick={onClick}>
        <MineIntelIcon size={size} className={iconClassName} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div 
        className={`flex flex-col items-center text-center select-none ${className}`}
        onClick={onClick}
      >
        <div className="mb-3">
          <MineIntelIcon size={size || 44} className={iconClassName} />
        </div>
        <div className="flex items-baseline justify-center tracking-tight">
          <span className={`text-2xl font-bold text-slate-900 dark:text-white ${textClassName}`}>
            MineIntel
          </span>
          <span className="text-2xl font-bold text-[#C05621] ml-1">
            AI
          </span>
        </div>
        {subtitle && (
          <span className="text-[11px] font-medium tracking-wide uppercase text-slate-500 dark:text-[#94A3B8] mt-1">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Horizontal Lockups ('full' or 'compact')
  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      onClick={onClick}
    >
      <MineIntelIcon size={size} className={iconClassName} />
      
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-baseline tracking-tight leading-none">
          <span className={`text-base font-bold text-slate-900 dark:text-[#F1F5F9] tracking-tight ${textClassName}`}>
            MineIntel
          </span>
          <span className="text-base font-bold text-[#C05621] ml-1">
            AI
          </span>
        </div>
        
        {variant === 'full' && subtitle && (
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-[#94A3B8] mt-1 leading-none truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default MineIntelLogo;
