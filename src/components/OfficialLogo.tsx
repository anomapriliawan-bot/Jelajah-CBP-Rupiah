import React from 'react';

interface OfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  className = '',
  size = 'lg',
  showSubtitle = true,
}) => {
  const sizeClasses = {
    sm: 'w-40 sm:w-48 md:w-56',
    md: 'w-48 sm:w-56 md:w-64',
    lg: 'w-56 sm:w-68 md:w-80 lg:w-92',
    xl: 'w-64 sm:w-80 md:w-96 lg:w-[420px]',
  };

  const subtitleClasses = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-base sm:text-xl md:text-2xl',
    xl: 'text-lg sm:text-2xl md:text-3xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {showSubtitle && (
        <div className={`flex items-center gap-1.5 font-['Caveat',_'Comfortaa',_cursive,_sans-serif] font-bold text-slate-800 tracking-wide mb-0.5 drop-shadow-xs ${subtitleClasses[size]}`}>
          <span className="text-[#1E3A8A]">Cinta</span>
          <span className="text-[#1E3A8A] mx-0.5">•</span>
          <span className="text-[#2563EB]">Bangga</span>
          <span className="text-[#1E3A8A] mx-0.5">•</span>
          <span className="text-[#EA580C]">Paham</span>
        </div>
      )}

      {/* SVG rendering of the official Rupiah typography with Heart in 'R', Thumbs up on 'i', Lightbulb in 'h' */}
      <svg
        viewBox="0 0 500 150"
        className={`${sizeClasses[size]} h-auto overflow-visible filter drop-shadow-md`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="officialLogoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id="officialLogoRedThumbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* --- LETTER R with Heart cutout --- */}
        <g id="letter-R" transform="translate(6, 20)">
          {/* Main R shape with prominent vertical stem, curved bowl, and distinct diagonal leg */}
          <path
            d="M 10 10
               L 58 10
               C 78 10, 90 22, 90 38
               C 90 53, 80 63, 62 64
               L 88 110
               L 65 110
               L 42 68
               L 30 68
               L 30 110
               L 10 110
               Z"
            fill="url(#officialLogoBlueGrad)"
          />
          {/* White Heart prominently featured in the upper bowl */}
          <path
            d="M 56 22
               C 50 16, 40 18, 40 27
               C 40 37, 56 47, 56 47
               C 56 47, 72 37, 72 27
               C 72 18, 62 16, 56 22
               Z"
            fill="#FFFFFF"
          />
        </g>

        {/* --- LETTER u --- */}
        <g id="letter-u" transform="translate(95, 48)">
          <path
            d="M8 0 L26 0 L26 50 C26 62 34 68 44 68 C54 68 62 62 62 50 L62 0 L80 0 L80 82 L62 82 L62 70 C56 78 46 82 34 82 C14 82 8 68 8 48 Z"
            fill="url(#officialLogoBlueGrad)"
          />
        </g>

        {/* --- LETTER p --- */}
        <g id="letter-p" transform="translate(178, 48)">
          <path
            d="M8 0 L26 0 L26 12 C32 4 42 0 54 0 C74 0 86 16 86 42 C86 68 72 82 52 82 C42 82 32 78 26 70 L26 112 L8 112 Z M26 42 C26 58 34 66 46 66 C58 66 66 56 66 42 C66 26 58 16 46 16 C34 16 26 24 26 42 Z"
            fill="url(#officialLogoBlueGrad)"
          />
        </g>

        {/* --- LETTER i with Red Thumbs-up Dot --- */}
        <g id="letter-i" transform="translate(268, 16)">
          {/* Lower stem of i */}
          <path
            d="M6 32 L22 32 L22 114 L6 114 Z"
            fill="url(#officialLogoBlueGrad)"
          />
          {/* Thumbs Up as the dot */}
          <g transform="translate(-2, -6) scale(0.95)">
            {/* White outline backdrop for pop */}
            <path
              d="M16 26 C12 26 8 23 8 18 C8 15 10 13 12 12 C10 11 9 9 9 7 C9 4 11 2 15 2 C16 2 17 2.3 18 3 C19 1.5 21 0 24 0 C28 0 31 3 31 7 C31 8.5 30 10 29 11 C32 12 34 15 34 18 C34 23 30 26 26 26 Z"
              fill="#FFFFFF"
            />
            {/* Red Thumbs up Hand */}
            <path
              d="M18 24 C14 24 11 21 11 18 C11 15.5 12.5 14 14 13 C12.5 12 11.5 10.5 11.5 8.5 C11.5 6 13 4 16.5 4 C17.5 4 18.2 4.3 19 5 C19.8 3.5 21.5 2 24.5 2 C27.5 2 29.5 4.5 29.5 8 C29.5 9.2 28.8 10.5 28 11.2 C30.5 12 32 14.5 32 17.5 C32 21.5 28.5 24 24.5 24 Z"
              fill="url(#officialLogoRedThumbGrad)"
            />
            {/* Thumb finger pointing upward */}
            <path
              d="M19 14 C19 14 16 10 16 5.5 C16 3 17.5 1.5 19.5 1.5 C21.5 1.5 22 3.5 22 6 L22 11 Z"
              fill="url(#officialLogoRedThumbGrad)"
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            {/* Hand palm inner contour */}
            <path
              d="M15 17 C17 19 22 19 25 17"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* --- LETTER a --- */}
        <g id="letter-a" transform="translate(305, 48)">
          <path
            d="M8 42 C8 16 26 0 50 0 C68 0 78 10 82 22 L82 0 L98 0 L98 82 L82 82 L82 72 C76 80 66 84 50 84 C26 84 8 68 8 42 Z M80 42 C80 26 70 16 54 16 C38 16 26 26 26 42 C26 58 38 68 54 68 C70 68 80 58 80 42 Z"
            fill="url(#officialLogoBlueGrad)"
          />
        </g>

        {/* --- LETTER h with Lightbulb inside --- */}
        <g id="letter-h" transform="translate(410, 20)">
          {/* Main h shape */}
          <path
            d="M6 0 L24 0 L24 40 C30 32 40 28 54 28 C74 28 86 42 86 64 L86 110 L68 110 L68 68 C68 54 60 46 48 46 C36 46 24 54 24 68 L24 110 L6 110 Z"
            fill="url(#officialLogoBlueGrad)"
          />
          {/* Lightbulb Cutout in counter of h */}
          <g transform="translate(34, 52) scale(0.9)">
            {/* Bulb Glow/White body */}
            <circle cx="20" cy="18" r="14" fill="#FFFFFF" />
            <path d="M12 24 L28 24 L25 35 L15 35 Z" fill="#FFFFFF" />
            {/* Bulb Filament & Base */}
            <path
              d="M17 18 C17 14 18 12 20 12 C22 12 23 14 23 18"
              stroke="#1E3A8A"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line x1="18" y1="20" x2="22" y2="20" stroke="#1E3A8A" strokeWidth="1.5" />
            <line x1="16" y1="30" x2="24" y2="30" stroke="#1E3A8A" strokeWidth="2" />
            <line x1="17" y1="34" x2="23" y2="34" stroke="#1E3A8A" strokeWidth="2" />
            {/* Light Rays */}
            <line x1="20" y1="0" x2="20" y2="3" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="7" y1="6" x2="9" y2="8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="33" y1="6" x2="31" y2="8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  );
};
