import React from 'react';

export type LikertVariant = 'senang' | 'kesal';

interface LikertEmoticonProps {
  level: number; // 1 to 5
  size?: number;
  className?: string;
  variant?: LikertVariant;
}

export interface LikertScaleItem {
  value: number;
  defaultLabel: string;
  fillColor: string;
  borderActive: string;
  bgCardActive: string;
  textActive: string;
  badgeClass: string;
}

// Skala Standar / Positif (Senang): 1 = Merah (cemberut) -> 5 = Hijau Tua (senyum)
export const LIKERT_SCALE_ITEMS: Record<number, LikertScaleItem> = {
  1: {
    value: 1,
    defaultLabel: 'Sangat Tidak Senang',
    fillColor: '#dc2626', // Merah
    borderActive: 'border-rose-500 ring-2 ring-rose-400/50',
    bgCardActive: 'bg-gradient-to-b from-rose-950/80 via-red-900/60 to-rose-900/80 shadow-lg shadow-rose-950/50',
    textActive: 'text-rose-200',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  2: {
    value: 2,
    defaultLabel: 'Tidak Senang',
    fillColor: '#ea580c', // Oranye
    borderActive: 'border-orange-500 ring-2 ring-orange-400/50',
    bgCardActive: 'bg-gradient-to-b from-orange-950/80 via-orange-900/60 to-amber-950/80 shadow-lg shadow-orange-950/50',
    textActive: 'text-orange-200',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  3: {
    value: 3,
    defaultLabel: 'Biasa saja',
    fillColor: '#eab308', // Kuning
    borderActive: 'border-amber-400 ring-2 ring-amber-300/50',
    bgCardActive: 'bg-gradient-to-b from-amber-950/80 via-yellow-900/50 to-amber-900/80 shadow-lg shadow-amber-950/50',
    textActive: 'text-amber-200',
    badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
  },
  4: {
    value: 4,
    defaultLabel: 'Senang',
    fillColor: '#84cc16', // Hijau muda (Lime)
    borderActive: 'border-lime-500 ring-2 ring-lime-400/50',
    bgCardActive: 'bg-gradient-to-b from-lime-950/80 via-lime-900/60 to-emerald-950/80 shadow-lg shadow-lime-950/50',
    textActive: 'text-lime-200',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
  },
  5: {
    value: 5,
    defaultLabel: 'Sangat Senang',
    fillColor: '#16a34a', // Hijau tua
    borderActive: 'border-emerald-400 ring-2 ring-emerald-300/50',
    bgCardActive: 'bg-gradient-to-b from-emerald-950/80 via-emerald-900/70 to-teal-950/80 shadow-lg shadow-emerald-950/50',
    textActive: 'text-emerald-100',
    badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
  },
};

// Skala Kategori Kesal: 1 = Sangat Tidak Kesal (Hijau Tua) -> 5 = Sangat Kesal (Merah)
export const LIKERT_KESAL_SCALE_ITEMS: Record<number, LikertScaleItem> = {
  1: {
    value: 1,
    defaultLabel: 'Sangat Tidak Kesal',
    fillColor: '#16a34a', // Hijau tua (senyum lebar / sangat tidak kesal)
    borderActive: 'border-emerald-400 ring-2 ring-emerald-300/50',
    bgCardActive: 'bg-gradient-to-b from-emerald-950/80 via-emerald-900/70 to-teal-950/80 shadow-lg shadow-emerald-950/50',
    textActive: 'text-emerald-100',
    badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
  },
  2: {
    value: 2,
    defaultLabel: 'Tidak Kesal',
    fillColor: '#84cc16', // Hijau muda (senyum manis / tidak kesal)
    borderActive: 'border-lime-500 ring-2 ring-lime-400/50',
    bgCardActive: 'bg-gradient-to-b from-lime-950/80 via-lime-900/60 to-emerald-950/80 shadow-lg shadow-lime-950/50',
    textActive: 'text-lime-200',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
  },
  3: {
    value: 3,
    defaultLabel: 'Biasa saja',
    fillColor: '#eab308', // Kuning (netral / biasa saja)
    borderActive: 'border-amber-400 ring-2 ring-amber-300/50',
    bgCardActive: 'bg-gradient-to-b from-amber-950/80 via-yellow-900/50 to-amber-900/80 shadow-lg shadow-amber-950/50',
    textActive: 'text-amber-200',
    badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
  },
  4: {
    value: 4,
    defaultLabel: 'Kesal',
    fillColor: '#ea580c', // Oranye (cemberut / kesal)
    borderActive: 'border-orange-500 ring-2 ring-orange-400/50',
    bgCardActive: 'bg-gradient-to-b from-orange-950/80 via-orange-900/60 to-amber-950/80 shadow-lg shadow-orange-950/50',
    textActive: 'text-orange-200',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  5: {
    value: 5,
    defaultLabel: 'Sangat Kesal',
    fillColor: '#dc2626', // Merah (cemberut tajam / sangat kesal)
    borderActive: 'border-rose-500 ring-2 ring-rose-400/50',
    bgCardActive: 'bg-gradient-to-b from-rose-950/80 via-red-900/60 to-rose-900/80 shadow-lg shadow-rose-950/50',
    textActive: 'text-rose-200',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

/**
 * Deteksi otomatis apakah soal atau kumpulan opsi menggunakan kategori "Kesal"
 */
export function detectLikertVariant(questionText?: string, options?: string | string[]): LikertVariant {
  const qStr = String(questionText || '').toLowerCase();
  const optStr = Array.isArray(options) ? options.join(' ').toLowerCase() : String(options || '').toLowerCase();
  if (qStr.includes('kesal') || optStr.includes('kesal')) {
    return 'kesal';
  }
  return 'senang';
}

/**
 * Ambil item konfigurasi skala (Senang atau Kesal)
 */
export function getLikertScaleItems(variant: LikertVariant = 'senang'): Record<number, LikertScaleItem> {
  return variant === 'kesal' ? LIKERT_KESAL_SCALE_ITEMS : LIKERT_SCALE_ITEMS;
}

export const LikertEmoticon: React.FC<LikertEmoticonProps> = ({
  level,
  size = 44,
  className = '',
  variant = 'senang',
}) => {
  // Untuk varian 'kesal', ekspresi visual dibalik:
  // Level 1 (Sangat Tidak Kesal) -> visual senyum lebar (5)
  // Level 2 (Tidak Kesal) -> visual senyum manis (4)
  // Level 3 (Biasa saja) -> visual netral (3)
  // Level 4 (Kesal) -> visual cemberut (2)
  // Level 5 (Sangat Kesal) -> visual cemberut dalam (1)
  const visualLevel = variant === 'kesal' ? (6 - level) : level;
  const itemsDict = variant === 'kesal' ? LIKERT_KESAL_SCALE_ITEMS : LIKERT_SCALE_ITEMS;
  const item = itemsDict[level] || itemsDict[3];

  const eyeRadius = Math.max(1.8, size * 0.05);
  const strokeWidth = Math.max(2.2, size * 0.07);

  // SVG dimensions: viewBox 0 0 48 48
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform ${className}`}
    >
      {/* Outer Face Circle with subtle border */}
      <circle
        cx="24"
        cy="24"
        r="22"
        fill={item.fillColor}
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      {/* Eyes */}
      <circle cx="17" cy="18" r={eyeRadius * 1.5} fill="#0f172a" />
      <circle cx="31" cy="18" r={eyeRadius * 1.5} fill="#0f172a" />

      {/* Mouth Expressions matching visualLevel */}
      {visualLevel === 1 && (
        // Cemberut tajam
        <path
          d="M 14 34 C 17 24, 31 24, 34 34"
          stroke="#0f172a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {visualLevel === 2 && (
        // Cemberut sedang
        <path
          d="M 15 32 C 18 26, 30 26, 33 32"
          stroke="#0f172a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {visualLevel === 3 && (
        // Biasa saja / Netral: Garis datar horizontal
        <line
          x1="16"
          y1="30"
          x2="32"
          y2="30"
          stroke="#0f172a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}

      {visualLevel === 4 && (
        // Senyum manis ke atas
        <path
          d="M 15 28 C 18 35, 30 35, 33 28"
          stroke="#0f172a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {visualLevel === 5 && (
        // Senyum lebar ke atas
        <path
          d="M 13 26 C 17 38, 31 38, 35 26"
          stroke="#0f172a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
};
