import React from 'react';
import {
  Heart,
  Flag,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Shield,
  Users,
  ShoppingCart,
  PiggyBank,
  Crown,
  Lock,
} from 'lucide-react';
import { Realm } from '../types';
import { sounds } from '../utils/audio';
import { db } from '../services/db';

interface RealmCardsProps {
  realms: Realm[];
  onSelectRealm: (realm: Realm) => void;
  onSelectStep: (realm: Realm, stepId: number) => void;
  onOpenFinalMission?: () => void;
}

export const RealmCards: React.FC<RealmCardsProps> = ({
  realms = [],
  onSelectRealm,
  onSelectStep,
  onOpenFinalMission,
}) => {
  const [lockedMsg, setLockedMsg] = React.useState<string | null>(null);

  const currentUser = db.getCurrentUser();
  const isFinalMissionUnlocked = db.isFinalMissionUnlocked(currentUser?.id, currentUser);
  const completedMissionsCount = db.getCompletedMissionsCount(currentUser?.id);

  const handleFinalMissionClick = () => {
    sounds.playPop();
    if (!isFinalMissionUnlocked) {
      setLockedMsg(
        `🔒 Misi Akhir masih terkunci! Anda baru menyelesaikan ${completedMissionsCount} dari 9 misi. Selesaikan seluruh misi di Dunia Cinta, Bangga, dan Paham Rupiah terlebih dahulu.`
      );
      setTimeout(() => setLockedMsg(null), 5000);
      return;
    }
    if (onOpenFinalMission) onOpenFinalMission();
  };

  const cintaRealm = realms.find((r) => r.id === 'cinta') || realms[0] || {
    id: 'cinta',
    title: 'Cinta Rupiah',
    tagline: 'Kenali keaslian dan rawat fisik Rupiah.',
    themeColor: 'red' as const,
    icon: 'heart',
    buttonLabel: 'Mulai Misi Cinta',
    description: 'Kenali keaslian 3D dan rawat fisik Rupiah 5J.',
    learningPoints: [],
    steps: [],
  };

  const banggaRealm = realms.find((r) => r.id === 'bangga') || realms[1] || {
    id: 'bangga',
    title: 'Bangga Rupiah',
    tagline: 'Simbol kedaulatan dan pemersatu bangsa.',
    themeColor: 'blue' as const,
    icon: 'flag',
    buttonLabel: 'Mulai Misi Bangga',
    description: 'Rupiah sebagai simbol kedaulatan dan pemersatu bangsa.',
    learningPoints: [],
    steps: [],
  };

  const pahamRealm = realms.find((r) => r.id === 'paham') || realms[2] || {
    id: 'paham',
    title: 'Paham Rupiah',
    tagline: 'Bijak bertransaksi, berhemat, dan menabung.',
    themeColor: 'orange' as const,
    icon: 'lightbulb',
    buttonLabel: 'Mulai Misi Paham',
    description: 'Bijak bertransaksi, berhemat, dan menabung.',
    learningPoints: [],
    steps: [],
  };

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ========================================================================= */}
        {/* CARD 1: CINTA RUPIAH (Theme: Coral / Rose Red) */}
        {/* ========================================================================= */}
        <div
          id="card-cinta-rupiah"
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 border-rose-100/90 shadow-xl shadow-rose-500/5 hover:shadow-2xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
        >
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-rose-100/60 to-transparent rounded-tr-3xl pointer-events-none" />

          <div>
            {/* Header: Clean Icon & Title */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 shrink-0">
                  <Heart className="w-6 h-6 fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-rose-600 tracking-tight leading-tight">
                    Cinta Rupiah
                  </h3>
                </div>
              </div>

              {/* Subtle Decorative SVG */}
              <div className="w-8 h-8 shrink-0 opacity-80 pointer-events-none">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <path
                    d="M 32,20 C 28,11 16,14 16,24 C 16,35 32,44 32,44 C 32,44 48,35 48,24 C 48,14 36,11 32,20 Z"
                    fill="#F43F5E"
                  />
                  <path d="M 12,44 Q 22,40 28,44" stroke="#FB7185" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 52,44 Q 42,40 36,44" stroke="#FB7185" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* 3 Step Milestone Badges */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {/* Step 1: Mengenal */}
              <div
                onClick={() => onSelectStep(cintaRealm, 1)}
                className="bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-rose-500 leading-none mb-1">1</span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                    Mengenal
                  </span>
                </div>
              </div>

              {/* Step 2: Merawat (5J) */}
              <div
                onClick={() => onSelectStep(cintaRealm, 2)}
                className="bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-rose-500 leading-none mb-1">2</span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                    Merawat
                  </span>
                </div>
              </div>

              {/* Step 3: Menjaga */}
              <div
                onClick={() => onSelectStep(cintaRealm, 3)}
                className="bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-rose-500 leading-none mb-1">3</span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                    Menjaga
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            id="btn-mulai-misi-cinta"
            onClick={() => {
              sounds.playPop();
              onSelectRealm(cintaRealm);
            }}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 flex items-center justify-center gap-2 transition-all cursor-pointer group whitespace-nowrap"
          >
            <span>Mulai Misi Cinta</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>


        {/* ========================================================================= */}
        {/* CARD 2: BANGGA RUPIAH (Theme: Royal Blue) */}
        {/* ========================================================================= */}
        <div
          id="card-bangga-rupiah"
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 border-blue-100/90 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-100/60 to-transparent rounded-tr-3xl pointer-events-none" />

          <div>
            {/* Header: Clean Icon & Title */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                  <Flag className="w-6 h-6 fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-blue-600 tracking-tight leading-tight">
                    Bangga Rupiah
                  </h3>
                </div>
              </div>

              {/* Subtle Decorative Flag SVG */}
              <div className="w-8 h-8 shrink-0 opacity-80 pointer-events-none">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <line x1="16" y1="12" x2="16" y2="52" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="16" cy="12" r="3" fill="#F59E0B" />
                  <path d="M 18,14 Q 32,10 46,16 L 46,28 Q 32,24 18,28 Z" fill="#EF4444" />
                  <path d="M 18,28 Q 32,24 46,28 L 46,40 Q 32,36 18,40 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
                </svg>
              </div>
            </div>

            {/* 3 Step Milestone Badges */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {/* Step 1: Simbol Kedaulatan */}
              <div
                onClick={() => onSelectStep(banggaRealm, 1)}
                className="bg-blue-50/70 hover:bg-blue-100/80 border border-blue-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <Shield className="w-4 h-4 fill-amber-500 text-amber-600" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-blue-600 leading-none mb-1">1</span>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 leading-tight">
                    <span className="block">Simbol</span>
                    <span className="block">Kedaulatan</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Pembayaran Sah */}
              <div
                onClick={() => onSelectStep(banggaRealm, 2)}
                className="bg-blue-50/70 hover:bg-blue-100/80 border border-blue-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-extrabold text-xs shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <span className="font-mono bg-amber-200 text-amber-900 px-1 py-0.2 rounded text-[9px] font-black border border-amber-300">Rp</span>
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-blue-600 leading-none mb-1">2</span>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 leading-tight">
                    <span className="block">Pembayaran</span>
                    <span className="block">Sah</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Pemersatu Bangsa */}
              <div
                onClick={() => onSelectStep(banggaRealm, 3)}
                className="bg-blue-50/70 hover:bg-blue-100/80 border border-blue-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-blue-600 leading-none mb-1">3</span>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 leading-tight">
                    <span className="block">Pemersatu</span>
                    <span className="block">Bangsa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            id="btn-mulai-misi-bangga"
            onClick={() => {
              sounds.playPop();
              onSelectRealm(banggaRealm);
            }}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 flex items-center justify-center gap-2 transition-all cursor-pointer group whitespace-nowrap"
          >
            <span>Mulai Misi Bangga</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>


        {/* ========================================================================= */}
        {/* CARD 3: PAHAM RUPIAH (Theme: Amber / Gold) */}
        {/* ========================================================================= */}
        <div
          id="card-paham-rupiah"
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 border-amber-100/90 shadow-xl shadow-amber-500/5 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-100/60 to-transparent rounded-tr-3xl pointer-events-none" />

          <div>
            {/* Header: Clean Icon & Title */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0">
                  <Lightbulb className="w-6 h-6 fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-amber-600 tracking-tight leading-tight">
                    Paham Rupiah
                  </h3>
                </div>
              </div>

              {/* Subtle Decorative Study SVG */}
              <div className="w-8 h-8 shrink-0 opacity-80 pointer-events-none">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <rect x="18" y="24" width="28" height="26" rx="4" fill="#0284C7" />
                  <rect x="24" y="10" width="4" height="18" fill="#EF4444" />
                  <polygon points="24,10 28,10 26,4" fill="#FACC15" />
                  <rect x="32" y="8" width="4" height="20" fill="#F59E0B" />
                  <polygon points="32,8 36,8 34,2" fill="#FEF08A" />
                </svg>
              </div>
            </div>

            {/* 3 Step Milestone Badges */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {/* Step 1: Bertransaksi */}
              <div
                onClick={() => onSelectStep(pahamRealm, 1)}
                className="bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <span className="bg-emerald-200 text-emerald-900 px-1 py-0.2 rounded text-[9px] font-black border border-emerald-300 font-mono">Rp</span>
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-amber-500 leading-none mb-1">1</span>
                  <span className="text-[10.5px] sm:text-xs font-bold text-slate-800 leading-tight">
                    Bertransaksi
                  </span>
                </div>
              </div>

              {/* Step 2: Berbelanja */}
              <div
                onClick={() => onSelectStep(pahamRealm, 2)}
                className="bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-amber-500 leading-none mb-1">2</span>
                  <span className="text-[10.5px] sm:text-xs font-bold text-slate-800 leading-tight">
                    Berbelanja
                  </span>
                </div>
              </div>

              {/* Step 3: Berhemat */}
              <div
                onClick={() => onSelectStep(pahamRealm, 3)}
                className="bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[110px]"
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shadow-2xs group-hover:scale-110 transition-transform mb-1">
                  <PiggyBank className="w-4 h-4 text-rose-500" />
                </div>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-[13px] font-black text-amber-500 leading-none mb-1">3</span>
                  <span className="text-[10.5px] sm:text-xs font-bold text-slate-800 leading-tight">
                    Berhemat
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            id="btn-mulai-misi-paham"
            onClick={() => {
              sounds.playPop();
              onSelectRealm(pahamRealm);
            }}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 flex items-center justify-center gap-2 transition-all cursor-pointer group whitespace-nowrap"
          >
            <span>Mulai Misi Paham</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* CARD 4: MISI AKHIR SANG PENJELAJAH RUPIAH (Theme: Amber / Gold) */}
      {/* Placed centered directly below Cinta, Bangga, and Paham */}
      {/* ========================================================================= */}
      {onOpenFinalMission && (
        <div className="mt-6 flex flex-col items-center">
          {/* Notification Toast if clicked while locked */}
          {lockedMsg && (
            <div className="mb-3 max-w-md w-full p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-amber-300">
              <Lock className="w-4 h-4 shrink-0 text-slate-950" />
              <span>{lockedMsg}</span>
            </div>
          )}

          <div
            id="card-misi-akhir-rupiah"
            className={`w-full md:max-w-md relative bg-white/95 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
              isFinalMissionUnlocked
                ? 'border-amber-200/90 shadow-xl shadow-amber-500/5 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1'
                : 'border-slate-200 shadow-md shadow-slate-900/5 opacity-95'
            }`}
          >
            {/* Subtle decorative background glow */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-100/60 to-transparent rounded-tr-3xl pointer-events-none" />

            <div>
              {/* Header: Clean Icon & Title */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isFinalMissionUnlocked
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isFinalMissionUnlocked ? (
                      <Crown className="w-6 h-6 fill-slate-950 text-slate-950" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-lg sm:text-xl font-black tracking-tight leading-tight ${
                          isFinalMissionUnlocked ? 'text-amber-600' : 'text-slate-800'
                        }`}
                      >
                        Misi Akhir Jelajah Rupiah
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5 line-clamp-1">
                      {isFinalMissionUnlocked
                        ? 'Uji pemahaman & raih gelar Sang Penjelajah.'
                        : `Selesaikan 9 misi utama (${completedMissionsCount}/9 selesai)`}
                    </p>
                  </div>
                </div>

                {/* Lock or Trophy Badge */}
                {!isFinalMissionUnlocked ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    <Lock className="w-3 h-3" />
                    <span>{completedMissionsCount}/9 Misi</span>
                  </span>
                ) : (
                  <div className="w-8 h-8 shrink-0 opacity-80 pointer-events-none">
                    <svg viewBox="0 0 64 64" className="w-full h-full">
                      <rect x="22" y="50" width="20" height="6" rx="2" fill="#D97706" />
                      <rect x="28" y="42" width="8" height="8" fill="#F59E0B" />
                      <path d="M 18,18 L 46,18 L 42,38 C 42,44 22,44 22,38 Z" fill="#FACC15" />
                      <polygon points="32,24 34,29 39,29 35,32 37,37 32,34 27,37 29,32 25,29 30,29" fill="#FFFFFF" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 3 Step Milestone Badges */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-4">
                {/* Step 1: Penjelajah Pemula */}
                <div
                  onClick={handleFinalMissionClick}
                  className={`border rounded-2xl px-1 sm:px-1.5 py-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[96px] overflow-hidden ${
                    isFinalMissionUnlocked
                      ? 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-100'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform mb-1 ${
                      isFinalMissionUnlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isFinalMissionUnlocked ? <BookOpen className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="w-full flex flex-col items-center justify-center">
                    <span className="text-[9.5px] font-black text-amber-600 leading-none mb-0.5">1</span>
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-800 leading-tight w-full px-0.5 break-words">
                      Penjelajah Pemula
                    </span>
                  </div>
                </div>

                {/* Step 2: Penjelajah Terampil */}
                <div
                  onClick={handleFinalMissionClick}
                  className={`border rounded-2xl px-1 sm:px-1.5 py-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[96px] overflow-hidden ${
                    isFinalMissionUnlocked
                      ? 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-100'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform mb-1 ${
                      isFinalMissionUnlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isFinalMissionUnlocked ? <Sparkles className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="w-full flex flex-col items-center justify-center">
                    <span className="text-[9.5px] font-black text-amber-600 leading-none mb-0.5">2</span>
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-800 leading-tight w-full px-0.5 break-words">
                      Penjelajah Terampil
                    </span>
                  </div>
                </div>

                {/* Step 3: Sang Penjelajah Rupiah */}
                <div
                  onClick={handleFinalMissionClick}
                  className={`border rounded-2xl px-1 sm:px-1.5 py-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:scale-102 group min-h-[96px] overflow-hidden ${
                    isFinalMissionUnlocked
                      ? 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-100'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform mb-1 ${
                      isFinalMissionUnlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isFinalMissionUnlocked ? <Crown className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="w-full flex flex-col items-center justify-center">
                    <span className="text-[9.5px] font-black text-amber-600 leading-none mb-0.5">3</span>
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-800 leading-tight w-full px-0.5 break-words">
                      Sang Penjelajah Rupiah
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              id="btn-mulai-misi-akhir"
              onClick={handleFinalMissionClick}
              className={`w-full mt-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group whitespace-nowrap ${
                isFinalMissionUnlocked
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35'
                  : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-300'
              }`}
            >
              {isFinalMissionUnlocked ? (
                <>
                  <span>Mulai Misi Akhir</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Selesaikan 9 Misi untuk Membuka ({completedMissionsCount}/9)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
