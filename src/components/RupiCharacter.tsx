import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import rupiBoyImage from '../assets/images/rupi_balinese_mascot_1786867001424.jpg';
import rupiGirlImage from '../assets/images/rupi_girl_single_large_1786867587791.jpg';

interface RupiCharacterProps {
  className?: string;
  speechText?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  gender?: 'male' | 'female' | 'laki-laki' | 'perempuan';
  name?: string;
}

export const RupiCharacter: React.FC<RupiCharacterProps> = ({
  className = '',
  speechText = 'Yuk, jadi Generasi Cerdas Rupiah!',
  onClick,
  size = 'md',
  gender = 'male',
  name,
}) => {
  const isFemale = gender === 'female' || gender === 'perempuan';
  const currentImage = isFemale ? rupiGirlImage : rupiBoyImage;
  const characterDisplayName = name || (isFemale ? 'Raya' : 'Rupi');
  const imageAlt = isFemale
    ? 'Raya - Maskot Cerdas Anak Bali Perempuan Berkebaya Putih Rupiah'
    : 'Rupi - Maskot Cerdas Anak Bali Laki-Laki Berbaju Putih Rupiah';

  const sizeConfig = {
    sm: {
      card: 'w-28 h-28 sm:w-32 sm:h-32',
      image: 'w-full h-full object-cover object-top scale-105',
      badge: 'text-[10px] px-2.5 py-0.5 -bottom-2.5',
      speech: 'max-w-[200px] text-xs px-3 py-1',
    },
    md: {
      card: 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52',
      image: 'w-full h-full object-cover object-top scale-105',
      badge: 'text-xs sm:text-sm px-3 py-0.5 -bottom-3',
      speech: 'max-w-[240px] sm:max-w-xs text-xs sm:text-sm px-3.5 py-1.5',
    },
    lg: {
      card: 'w-48 h-48 sm:w-56 sm:h-56 md:w-68 md:h-68 xl:w-76 xl:h-76',
      image: 'w-full h-full object-cover object-top scale-105',
      badge: 'text-xs sm:text-sm px-4 py-1 -bottom-3.5',
      speech: 'max-w-xs sm:max-w-sm text-xs sm:text-sm md:text-base px-4 py-2',
    },
  }[size];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Speech Bubble */}
      {speechText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-3 z-30 pointer-events-none"
        >
          <div className={`relative bg-white/95 backdrop-blur-md border-2 ${isFemale ? 'border-pink-400 text-pink-950' : 'border-sky-400 text-sky-950'} font-black rounded-2xl shadow-lg ${isFemale ? 'shadow-pink-900/15' : 'shadow-sky-900/15'} text-center leading-tight ${sizeConfig.speech}`}>
            <div className="flex items-center justify-center gap-1">
              <span>{speechText}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 inline-block animate-pulse" />
            </div>
            {/* Speech Bubble Tail */}
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-b-2 border-r-2 ${isFemale ? 'border-pink-400' : 'border-sky-400'} transform rotate-45 shadow-xs`} />
          </div>
        </motion.div>
      )}

      {/* Rupi Mascot Cartoon Child Frame */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="relative group-hover:scale-105 transition-transform duration-300"
      >
        {/* Decorative Glowing Backdrop Ring */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${isFemale ? 'from-pink-300 via-amber-200 to-rose-400' : 'from-amber-300 via-sky-300 to-blue-400'} blur-md opacity-40 group-hover:opacity-70 transition-opacity`} />

        {/* Mascot Avatar Card Container */}
        <div className={`relative ${sizeConfig.card} rounded-full p-1.5 sm:p-2 bg-gradient-to-b ${isFemale ? 'from-white via-pink-50 to-amber-50 border-3 border-pink-300/90' : 'from-white via-sky-50 to-amber-50 border-3 border-amber-300/90'} shadow-xl shadow-blue-950/15 overflow-hidden flex items-center justify-center`}>
          
          {/* Inner Light Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-b ${isFemale ? 'from-pink-100/60 via-amber-50/40 to-white' : 'from-sky-100/60 via-amber-50/40 to-white'}`} />

          {/* Authentic Balinese Child Cartoon Rupi */}
          <img
            src={currentImage}
            alt={imageAlt}
            className={`${sizeConfig.image} relative z-10 filter drop-shadow-md rounded-full transform group-hover:scale-110 transition-transform duration-300`}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Mascot Name Badge (Rupi / Raya) */}
        <div className={`absolute left-1/2 -translate-x-1/2 ${sizeConfig.badge} z-20 bg-gradient-to-r ${isFemale ? 'from-[#9D174D] via-[#DB2777] to-[#9D174D] border-2 border-pink-200' : 'from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] border-2 border-amber-300'} text-white font-black rounded-full shadow-md shadow-blue-900/30 flex items-center gap-1 whitespace-nowrap`}>
          <span className="text-amber-300">★</span>
          <span>{characterDisplayName}</span>
          <span className="text-amber-300">★</span>
        </div>
      </motion.div>
    </div>
  );
};


