import React from 'react';

interface CleanIllustrationProps {
  name: string;
  themeColor?: 'red' | 'blue' | 'orange' | 'purple' | 'emerald';
  className?: string;
}

export const CleanIllustration: React.FC<CleanIllustrationProps> = ({
  name,
  themeColor = 'blue',
  className = 'w-full h-48 sm:h-56',
}) => {
  const getGradients = () => {
    switch (themeColor) {
      case 'red':
        return { bg: 'from-rose-50 to-red-100', stroke: '#EF4444', fill: '#FCA5A5', accent: '#DC2626' };
      case 'blue':
        return { bg: 'from-sky-50 to-blue-100', stroke: '#2563EB', fill: '#93C5FD', accent: '#1D4ED8' };
      case 'orange':
        return { bg: 'from-amber-50 to-orange-100', stroke: '#F59E0B', fill: '#FCD34D', accent: '#D97706' };
      case 'purple':
        return { bg: 'from-purple-50 to-indigo-100', stroke: '#8B5CF6', fill: '#C4B5FD', accent: '#7C3AED' };
      case 'emerald':
        return { bg: 'from-emerald-50 to-teal-100', stroke: '#10B981', fill: '#6EE7B7', accent: '#059669' };
      default:
        return { bg: 'from-slate-50 to-blue-100', stroke: '#3B82F6', fill: '#93C5FD', accent: '#1D4ED8' };
    }
  };

  const g = getGradients();

  // Clean SVG vector scenes designed specifically for Jelajah Rupiah
  const renderContent = () => {
    switch (name) {
      case 'method_3d':
      case 'MIS-01':
      case 'MAT-001':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <defs>
              <linearGradient id="noteGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEE2E2" />
                <stop offset="100%" stopColor="#FECACA" />
              </linearGradient>
              <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
              </filter>
            </defs>
            {/* Background elements */}
            <circle cx="200" cy="120" r="90" fill="#FEF2F2" />
            <circle cx="200" cy="120" r="70" fill="#FEE2E2" opacity="0.6" />
            
            {/* Rupiah Banknote */}
            <rect x="90" y="60" width="220" height="110" rx="12" fill="url(#noteGrad1)" stroke="#EF4444" strokeWidth="2.5" filter="url(#softShadow)" />
            {/* Guilloche & security patterns */}
            <rect x="100" y="70" width="200" height="90" rx="8" fill="none" stroke="#F87171" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
            <circle cx="140" cy="115" r="24" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
            {/* Watermark Hero Silhouette */}
            <path d="M 134,124 Q 134,106 140,106 Q 146,106 146,124 Z" fill="#EF4444" opacity="0.4" />
            <circle cx="140" cy="103" r="5" fill="#EF4444" opacity="0.4" />
            
            {/* Security Thread */}
            <line x1="220" y1="60" x2="220" y2="170" stroke="#DC2626" strokeWidth="4" strokeDasharray="6 4" />
            
            {/* Nominal Rp100.000 */}
            <text x="245" y="95" fill="#DC2626" fontSize="16" fontWeight="900" fontFamily="sans-serif">100.000</text>
            <text x="245" y="115" fill="#EF4444" fontSize="10" fontWeight="700" fontFamily="sans-serif">BANK INDONESIA</text>
            
            {/* 3D Magnifying Glass & Eye & Touch */}
            {/* Dilihat (Eye) */}
            <g transform="translate(60, 40)">
              <circle cx="20" cy="20" r="18" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2" filter="url(#softShadow)" />
              <path d="M 10,20 Q 20,12 30,20 Q 20,28 10,20 Z" fill="none" stroke="#DC2626" strokeWidth="2" />
              <circle cx="20" cy="20" r="4" fill="#DC2626" />
              <text x="20" y="48" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="800">1. DILIHAT</text>
            </g>
            
            {/* Diraba (Hand / Touch) */}
            <g transform="translate(180, 20)">
              <circle cx="20" cy="20" r="18" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2" filter="url(#softShadow)" />
              <path d="M 14,24 L 14,16 Q 14,14 17,14 Q 20,14 20,17 L 20,15 Q 20,13 23,13 Q 26,13 26,16 L 26,24 Z" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1.5" />
              <text x="20" y="48" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="800">2. DIRABA</text>
            </g>
            
            {/* Diterawang (Light Rays) */}
            <g transform="translate(300, 40)">
              <circle cx="20" cy="20" r="18" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2" filter="url(#softShadow)" />
              <circle cx="20" cy="20" r="7" fill="#F59E0B" />
              <path d="M 20,6 L 20,10 M 20,30 L 20,34 M 6,20 L 10,20 M 30,20 L 34,20 M 10,10 L 13,13 M 27,27 L 30,30 M 10,30 L 13,27 M 27,13 L 30,10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
              <text x="20" y="48" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="800">3. DITERAWANG</text>
            </g>
          </svg>
        );

      case 'care_5j':
      case 'MIS-02':
      case 'MAT-004':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <defs>
              <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="120" r="95" fill="#ECFDF5" />
            
            {/* Wallet containing crisp straight banknotes */}
            <rect x="80" y="70" width="240" height="120" rx="16" fill="url(#walletGrad)" stroke="#10B981" strokeWidth="3" />
            <rect x="100" y="50" width="200" height="80" rx="8" fill="#A7F3D0" stroke="#059669" strokeWidth="2" />
            <rect x="110" y="40" width="180" height="80" rx="8" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
            
            {/* 5J Shield Badges around */}
            <g transform="translate(60, 30)">
              <circle cx="16" cy="16" r="14" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
              <path d="M 10,10 L 22,22 M 22,10 L 10,22" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              <text x="16" y="38" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="800">Jangan Lipat</text>
            </g>
            
            <g transform="translate(310, 30)">
              <circle cx="16" cy="16" r="14" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
              <path d="M 10,10 L 22,22 M 22,10 L 10,22" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              <text x="16" y="38" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="800">Jangan Coret</text>
            </g>
            
            <g transform="translate(200, 155)">
              <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#10B981" />
              <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">PRINSIP 5J BERSIH</text>
            </g>
          </svg>
        );

      case 'currency_condition':
      case 'MIS-03':
      case 'MAT-007':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <circle cx="130" cy="120" r="70" fill="#EFF6FF" />
            <circle cx="270" cy="120" r="70" fill="#FEF2F2" />
            
            {/* ULE (Clean note) */}
            <rect x="70" y="80" width="120" height="65" rx="8" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
            <circle cx="100" cy="112" r="12" fill="#93C5FD" />
            <text x="130" y="170" textAnchor="middle" fill="#1D4ED8" fontSize="12" fontWeight="800">ULE (Layak Edar)</text>
            <path d="M 115,108 L 125,118 L 145,98" fill="none" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
            
            {/* UTLE (Torn / damaged note) */}
            <rect x="210" y="80" width="120" height="65" rx="8" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M 270,80 L 265,110 L 275,145" stroke="#991B1B" strokeWidth="3" fill="none" />
            <text x="270" y="170" textAnchor="middle" fill="#B91C1C" fontSize="12" fontWeight="800">UTLE (Tukar ke BI)</text>
          </svg>
        );

      case 'sovereignty':
      case 'MIS-04':
      case 'MIS-05':
      case 'MAT-010':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <defs>
              <linearGradient id="goldShield" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="120" r="90" fill="#F5F3FF" />
            
            {/* Garuda & Indonesian Flag Colors */}
            <rect x="130" y="55" width="140" height="40" rx="4" fill="#EF4444" />
            <rect x="130" y="95" width="140" height="40" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            
            {/* Golden Shield */}
            <path d="M 200,60 L 245,85 L 235,145 Q 200,175 200,175 Q 165,145 155,85 Z" fill="url(#goldShield)" stroke="#854D0E" strokeWidth="2" />
            
            <circle cx="200" cy="115" r="18" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1.5" />
            <text x="200" y="120" textAnchor="middle" fill="#854D0E" fontSize="11" fontWeight="900">NKRI</text>
            <text x="200" y="200" textAnchor="middle" fill="#6D28D9" fontSize="12" fontWeight="800">RUPIAH KEDAULATAN BANGSA</text>
          </svg>
        );

      case 'culture_heroes':
      case 'MIS-06':
      case 'MAT-016':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <circle cx="200" cy="120" r="90" fill="#FFFBEB" />
            {/* Archipelago Islands Map Outline */}
            <path d="M 90,140 Q 110,130 130,135 Q 150,145 170,135 Q 200,145 230,130 Q 270,140 310,130" fill="none" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            
            {/* Cultural Dancers / Landmark Icons */}
            <circle cx="120" cy="100" r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            <circle cx="200" cy="85" r="26" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
            <circle cx="280" cy="100" r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            
            <text x="120" y="104" textAnchor="middle" fill="#B45309" fontSize="10" fontWeight="800">Tari</text>
            <text x="200" y="90" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="900">Pahlawan</text>
            <text x="280" y="104" textAnchor="middle" fill="#B45309" fontSize="10" fontWeight="800">Alam</text>
            
            <text x="200" y="185" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="800">Rupiah Pemersatu Nusantara</text>
          </svg>
        );

      case 'qris_digital':
      case 'MIS-07':
      case 'MAT-019':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <circle cx="200" cy="120" r="90" fill="#FDF2F8" />
            
            {/* Phone screen with QR Code */}
            <rect x="145" y="45" width="110" height="150" rx="16" fill="#1E293B" stroke="#EC4899" strokeWidth="3" />
            <rect x="155" y="60" width="90" height="120" rx="8" fill="#FFFFFF" />
            
            {/* QR Pattern */}
            <rect x="165" y="70" width="24" height="24" fill="#0F172A" />
            <rect x="169" y="74" width="16" height="16" fill="#FFFFFF" />
            <rect x="173" y="78" width="8" height="8" fill="#0F172A" />
            
            <rect x="211" y="70" width="24" height="24" fill="#0F172A" />
            <rect x="215" y="74" width="16" height="16" fill="#FFFFFF" />
            <rect x="219" y="78" width="8" height="8" fill="#0F172A" />
            
            <rect x="165" y="116" width="24" height="24" fill="#0F172A" />
            <rect x="169" y="120" width="16" height="16" fill="#FFFFFF" />
            <rect x="173" y="124" width="8" height="8" fill="#0F172A" />
            
            {/* QRIS Logo Box */}
            <rect x="165" y="150" width="70" height="18" rx="4" fill="#BE185D" />
            <text x="200" y="163" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">QRIS</text>
            
            {/* Security Shield Check */}
            <circle cx="265" cy="80" r="18" fill="#10B981" />
            <path d="M 258,80 L 263,85 L 273,75" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            
            <text x="200" y="215" textAnchor="middle" fill="#BE185D" fontSize="12" fontWeight="800">CeMUAMAH: Cepat, Mudah, Aman</text>
          </svg>
        );

      case 'needs_vs_wants':
      case 'MIS-08':
      case 'MAT-020':
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <circle cx="130" cy="120" r="70" fill="#F0FDFA" />
            <circle cx="270" cy="120" r="70" fill="#FEF3C7" />
            
            {/* Needs (Kebutuhan) - Books & Apple */}
            <g transform="translate(90, 80)">
              <rect x="10" y="30" width="60" height="16" rx="4" fill="#14B8A6" />
              <rect x="14" y="16" width="52" height="16" rx="4" fill="#0D9488" />
              <rect x="18" y="2" width="44" height="16" rx="4" fill="#5EEAD4" />
              <text x="40" y="65" textAnchor="middle" fill="#0F766E" fontSize="11" fontWeight="800">KEBUTUHAN</text>
              <text x="40" y="78" textAnchor="middle" fill="#14B8A6" fontSize="9" fontWeight="700">Wajib & Utama</text>
            </g>
            
            {/* Wants (Keinginan) - Toy Robot / Candy */}
            <g transform="translate(230, 80)">
              <circle cx="40" cy="20" r="16" fill="#FBBF24" />
              <rect x="26" y="34" width="28" height="20" rx="4" fill="#F59E0B" />
              <text x="40" y="65" textAnchor="middle" fill="#B45309" fontSize="11" fontWeight="800">KEINGINAN</text>
              <text x="40" y="78" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="700">Dapat Ditunda</text>
            </g>
          </svg>
        );

      case 'savings_simpel':
      case 'MIS-09':
      case 'MAT-023':
      default:
        return (
          <svg viewBox="0 0 400 240" className="w-full h-full">
            <defs>
              <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="120" r="90" fill="#FEFCE8" />
            
            {/* Tabungan SimPel Buku Rekening Pelajar */}
            <rect x="110" y="70" width="105" height="120" rx="12" fill="#2563EB" stroke="#1D4ED8" strokeWidth="3" />
            <rect x="120" y="80" width="85" height="40" rx="6" fill="#FFFFFF" />
            <text x="162" y="105" textAnchor="middle" fill="#1D4ED8" fontSize="13" fontWeight="900">SimPel</text>
            <text x="162" y="145" textAnchor="middle" fill="#93C5FD" fontSize="9" fontWeight="700">Tabungan Pelajar</text>
            <text x="162" y="165" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">BANK INDONESIA</text>
            
            {/* Rupiah Coins Stack */}
            <g transform="translate(230, 95)">
              <ellipse cx="30" cy="70" rx="32" ry="12" fill="#EAB308" stroke="#CA8A04" strokeWidth="2" />
              <ellipse cx="30" cy="58" rx="32" ry="12" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
              <ellipse cx="30" cy="46" rx="32" ry="12" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
              <ellipse cx="30" cy="34" rx="32" ry="12" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
              <text x="30" y="38" textAnchor="middle" fill="#854D0E" fontSize="11" fontWeight="900">Rp</text>
            </g>
            
            {/* Dropping Coin Sparkle */}
            <g transform="translate(245, 30)">
              <circle cx="15" cy="15" r="14" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
              <text x="15" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">Rp</text>
            </g>
            
            <text x="200" y="215" textAnchor="middle" fill="#854D0E" fontSize="12" fontWeight="800">Cerdas Menabung Sejak Dini</text>
          </svg>
        );
    }
  };

  return (
    <div className={`relative rounded-2xl sm:rounded-3xl bg-gradient-to-b ${g.bg} p-3 sm:p-4 flex items-center justify-center overflow-hidden border border-slate-200/80 shadow-xs ${className}`}>
      {renderContent()}
    </div>
  );
};
