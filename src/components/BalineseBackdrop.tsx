import React from 'react';
import templePanorama from '../assets/images/balinese_hindu_temple_panorama_1786867182167.jpg';

interface BalineseBackdropProps {
  variant?: 'hero' | 'full';
}

export const BalineseBackdrop: React.FC<BalineseBackdropProps> = ({
  variant = 'hero',
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Base Atmospheric Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7dd3fc]/60 via-[#bae6fd]/40 to-sky-100/30" />

      {/* Panoramic Balinese Hindu Temple Cartoon Landscape */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={templePanorama}
          alt="Latar Belakang Pura dan Candi Tradisional Hindu Bali"
          className={`w-full h-full object-cover filter contrast-105 transition-opacity duration-500 ${
            variant === 'full'
              ? 'object-center opacity-85 sm:opacity-90'
              : 'object-bottom opacity-75 sm:opacity-85'
          }`}
          referrerPolicy="no-referrer"
        />
      </div>

      {variant === 'hero' ? (
        <>
          {/* Center Readability Mask - Gentle translucent radial glow behind the text & logo */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-sky-100/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-radial from-white/90 via-white/70 to-transparent blur-xl pointer-events-none" />
        </>
      ) : (
        <>
          {/* Full Screen View: Clean, atmospheric overlay keeping temple art vivid and contrasting */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/10 via-white/20 to-sky-950/20" />
          <div className="absolute inset-0 bg-radial from-transparent via-white/20 to-white/50" />
        </>
      )}

      {/* Top Warm Balinese Golden Sunlight Glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-radial from-amber-200/50 via-sky-100/30 to-transparent blur-3xl rounded-full" />
    </div>
  );
};
