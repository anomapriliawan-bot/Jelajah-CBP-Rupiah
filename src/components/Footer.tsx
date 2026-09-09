import React from 'react';

interface FooterProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ variant = 'light', className = '' }) => {
  const isDark = variant === 'dark';

  return (
    <footer
      id="app-footer-credit"
      className={`w-full py-3.5 px-4 text-center text-[11px] sm:text-xs select-none transition-colors ${
        isDark
          ? 'text-slate-400 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-xs'
          : 'text-slate-500 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 flex-wrap font-medium">
        <span>Jelajah Cinta Bangga Paham Rupiah</span>
        <span className="opacity-40">•</span>
        <span>Developed by I Gede Anom Apriliawan.</span>
      </div>
    </footer>
  );
};

export default Footer;
