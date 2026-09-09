import React from 'react';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { RupiCharacter } from './RupiCharacter';
import { BalineseBackdrop } from './BalineseBackdrop';
import { sounds } from '../utils/audio';

interface HeroSectionProps {
  onStartLearning: () => void;
  onExploreMissions: () => void;
  onRupiClick?: () => void;
  gender?: 'male' | 'female' | 'laki-laki' | 'perempuan';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartLearning,
  onExploreMissions,
  onRupiClick,
  gender = 'male',
}) => {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#e0f2fe]/90 via-[#f0f9ff] to-white pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-sky-100 shadow-inner">
      {/* Visual Balinese & Cultural Environmental Art */}
      <BalineseBackdrop />

      <div className="relative z-10 max-w-7xl mx-auto min-h-[320px] md:min-h-[400px] flex items-center justify-center">
        {/* Main Content Layout: Side-by-side on desktop (xl+), stacked on mobile & tablet */}
        <div className="w-full flex flex-col xl:flex-row items-center justify-center xl:gap-8 2xl:gap-14">
          
          {/* Left Side (Desktop xl+): Mascot Rupi in full Balinese traditional attire (in flow, never overlaps text) */}
          <div className="hidden xl:flex xl:shrink-0 items-center justify-center">
            <RupiCharacter
              size="md"
              gender={gender}
              speechText="Yuk, jadi Generasi Cerdas Rupiah!"
              onClick={() => {
                sounds.playPop();
                if (onRupiClick) onRupiClick();
              }}
            />
          </div>

          {/* Center Column: Official Logo, Welcome Typography & Invitations */}
          <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl flex flex-col items-center text-center space-y-3 sm:space-y-4 md:space-y-5 px-3">
            
            {/* Mascot Rupi for Mobile, Tablet & Compact Screens (< xl: stacked & proportionally sized) */}
            <div className="block xl:hidden mb-3 pt-1">
              <RupiCharacter
                size="sm"
                gender={gender}
                speechText="Yuk, jadi Generasi Cerdas Rupiah!"
                onClick={() => {
                  sounds.playPop();
                  if (onRupiClick) onRupiClick();
                }}
              />
            </div>

            {/* Main Welcome Heading & Official CBP Rupiah Logo */}
            <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#1E3A8A] tracking-tight drop-shadow-xs leading-tight">
                Jelajah
              </h1>

              {/* The Official "Cinta • Bangga • Paham Rupiah" Logo */}
              <div className="transform hover:scale-102 transition-transform duration-300">
                <OfficialLogo size="lg" />
              </div>
            </div>

            {/* Interactive Call to Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 pt-1 w-full sm:w-auto px-4 sm:px-0">
              <button
                id="hero-mulai-belajar"
                onClick={() => {
                  sounds.playPop();
                  onStartLearning();
                }}
                className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold text-xs sm:text-sm md:text-base shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white group-hover:scale-110 transition-transform" />
                <span>Mulai Belajar</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-lanjutkan-petualangan"
                onClick={() => {
                  sounds.playPop();
                  onExploreMissions();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-white/95 hover:bg-sky-50 text-[#1E3A8A] border-2 border-sky-200 font-bold text-xs sm:text-sm md:text-base shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span>Lanjutkan Petualangan</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

