import React, { useState, useEffect } from 'react';
import {
  Heart,
  Shield,
  Lightbulb,
  Lock,
  CheckCircle2,
  Play,
  Award,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Flame,
  Star,
  Info,
  Zap,
  RotateCcw,
  Crown,
  Compass,
} from 'lucide-react';
import { Mission, World, Badge, User } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import { Footer } from '../../components/Footer';

interface JourneyPageProps {
  onSelectMission: (missionId: string) => void;
  onBackToHome: () => void;
  onOpenBadgeShowcase?: () => void;
  onOpenFinalMission?: () => void;
}

export const JourneyPage: React.FC<JourneyPageProps> = ({
  onSelectMission,
  onBackToHome,
  onOpenBadgeShowcase,
  onOpenFinalMission,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());
  const [worlds, setWorlds] = useState<World[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState(() => db.getStudentOverallStats());
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);

  const effectiveStudentId = currentUser?.id || 'std_01';
  const isGuest = currentUser?.isGuest || currentUser?.id === 'USR-GUEST' || db.isCurrentGuest();
  const isTester =
    !isGuest &&
    (effectiveStudentId === 'USR-TESTER' ||
    currentUser?.id === 'USR-TESTER' ||
    currentUser?.email?.toLowerCase().includes('tester') ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'teacher');

  const loadData = () => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    const effId = user?.id || 'std_01';
    setWorlds(db.getWorlds());
    setMissions(db.getMissions());
    setBadges(db.getBadges());
    setStats(db.getStudentOverallStats(effId));
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, []);

  const getWorldColor = (code: string) => {
    switch (code) {
      case 'cinta':
        return {
          bg: 'bg-rose-500',
          lightBg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          gradient: 'from-rose-500 to-red-600',
          accentGradient: 'from-rose-50 via-red-50/50 to-white',
          badgeBg: 'bg-rose-100 text-rose-800',
          nodeBg: 'bg-rose-500 text-white',
          nodeBorder: 'border-rose-300 ring-rose-200',
          icon: <Heart className="w-5 h-5 text-white" />,
        };
      case 'bangga':
        return {
          bg: 'bg-blue-600',
          lightBg: 'bg-sky-50',
          border: 'border-sky-200',
          text: 'text-blue-700',
          gradient: 'from-blue-600 to-indigo-700',
          accentGradient: 'from-sky-50 via-blue-50/50 to-white',
          badgeBg: 'bg-sky-100 text-blue-800',
          nodeBg: 'bg-blue-600 text-white',
          nodeBorder: 'border-blue-300 ring-blue-200',
          icon: <Shield className="w-5 h-5 text-white" />,
        };
      case 'paham':
      default:
        return {
          bg: 'bg-amber-500',
          lightBg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          gradient: 'from-amber-500 to-orange-600',
          accentGradient: 'from-amber-50 via-orange-50/50 to-white',
          badgeBg: 'bg-amber-100 text-amber-900',
          nodeBg: 'bg-amber-500 text-white',
          nodeBorder: 'border-amber-300 ring-amber-200',
          icon: <Lightbulb className="w-5 h-5 text-white" />,
        };
    }
  };

  const handleMissionClick = (m: Mission, state: 'locked' | 'available' | 'in_progress' | 'completed') => {
    sounds.playPop();
    if (state === 'locked' && !isTester) {
      const prevMission = missions.find((item) => item.orderIndex === m.orderIndex - 1);
      setLockedTooltip(
        `Misi ini masih terkunci! Selesaikan "${prevMission?.title || 'Misi sebelumnya'}" terlebih dahulu untuk membukanya.`
      );
      setTimeout(() => setLockedTooltip(null), 4000);
      return;
    }
    onSelectMission(m.id);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 antialiased selection:bg-blue-200 selection:text-blue-900">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playPop();
                onBackToHome();
              }}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Beranda</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Peta Misi Jelajah Rupiah
              </h1>
            </div>
          </div>

          {/* Quick Summary Pill in Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenFinalMission && (
              <button
                onClick={() => {
                  sounds.playPop();
                  onOpenFinalMission();
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 border border-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Misi Akhir</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{stats.completedMissionsCount} / 9 Misi</span>
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                if (onOpenBadgeShowcase) onOpenBadgeShowcase();
              }}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-800 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>{stats.unlockedBadgesCount} / 9 Lencana</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tester Active Mode Banner */}
      {isTester && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide">
                🚀 Mode Penguji Aktif ({currentUser?.name || 'Tester'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  db.unlockAllMissionsForStudent(effectiveStudentId);
                  loadData();
                }}
                className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-md border border-white/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-yellow-200" />
                <span>Buka Semua</span>
              </button>
              <button
                onClick={() => {
                  db.resetStudentProgress(effectiveStudentId);
                  loadData();
                }}
                className="px-2.5 py-0.5 bg-black/20 hover:bg-black/30 text-white text-xs font-bold rounded-md border border-black/20 flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-white/80" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Tooltip Pop-up */}
      {lockedTooltip && (
        <div className="max-w-md mx-auto px-4 mt-4 animate-bounce">
          <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{lockedTooltip}</span>
          </div>
        </div>
      )}

      {/* HERO BANNER SECTION */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 sm:p-7 text-white shadow-xl shadow-blue-950/10 relative overflow-hidden">
          {/* Background Ambient Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-8 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Petualangan Siswa</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Petualangan 3 Dunia Rupiah
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-lg">
                Selesaikan 9 misi bertahap untuk mengumpulkan lencana dan membuka Misi Akhir.
              </p>
            </div>

            {/* Overall Progress Arc */}
            <div className="md:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-100">Total Progres</span>
                <span className="text-xs font-black text-cyan-200">
                  {Math.round(((stats?.completedMissionsCount || 0) / (stats?.totalMissions || 9)) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-300 transition-all duration-700"
                  style={{ width: `${Math.round(((stats?.completedMissionsCount || 0) / (stats?.totalMissions || 9)) * 100)}%` }}
                />
              </div>

              {/* 3 Worlds Mini Status */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center">
                <div className="bg-white/10 rounded-lg py-1 px-1">
                  <span className="text-[9.5px] font-bold text-rose-200 block">Cinta</span>
                  <span className="text-xs font-black text-white">
                    {stats?.worldStats?.cinta?.completed ?? 0}/3
                  </span>
                </div>
                <div className="bg-white/10 rounded-lg py-1 px-1">
                  <span className="text-[9.5px] font-bold text-blue-200 block">Bangga</span>
                  <span className="text-xs font-black text-white">
                    {stats?.worldStats?.bangga?.completed ?? 0}/3
                  </span>
                </div>
                <div className="bg-white/10 rounded-lg py-1 px-1">
                  <span className="text-[9.5px] font-bold text-amber-200 block">Paham</span>
                  <span className="text-xs font-black text-white">
                    {stats?.worldStats?.paham?.completed ?? 0}/3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 WORLDS PATH SECTION */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-12">
        {worlds.map((world, worldIdx) => {
          const wColor = getWorldColor(world.code);
          const worldMissions = missions
            .filter((m) => m.worldId === world.code)
            .sort((a, b) => a.orderIndex - b.orderIndex);
          const worldCompCount = worldMissions.filter(
            (m) => db.getMissionState(m.id, effectiveStudentId) === 'completed'
          ).length;

          return (
            <div
              key={world.id}
              className="rounded-3xl bg-white border border-slate-200/90 shadow-md shadow-slate-900/5 overflow-hidden transition-all"
            >
              {/* World Header Banner */}
              <div
                className={`p-5 sm:p-6 bg-gradient-to-r ${wColor.gradient} text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                    {wColor.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                        Dunia {worldIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-white/90 font-mono">
                        {worldCompCount} / 3 Misi Selesai
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight">{world.title}</h3>
                    <p className="text-xs text-white/85 font-medium mt-0.5">{world.tagline}</p>
                  </div>
                </div>

                {/* World Progress Pill */}
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full self-start sm:self-auto shrink-0 border border-white/15 text-xs font-bold">
                  <span>Progres:</span>
                  <div className="w-16 h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((worldCompCount / 3) * 100)}%` }}
                    />
                  </div>
                  <span>{Math.round((worldCompCount / 3) * 100)}%</span>
                </div>
              </div>

              {/* 3 Missions Grid / Journey Path for this World */}
              <div className="p-4 sm:p-6 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {worldMissions.map((mission, mIdx) => {
                    const state = db.getMissionState(mission.id, effectiveStudentId);
                    const prog = db.getStudentMissionProgress(mission.id, effectiveStudentId);
                    const badge = badges.find((b) => b.missionId === mission.id);

                    const isCompleted = state === 'completed';
                    const isInProgress = state === 'in_progress';
                    const isAvailable = state === 'available';
                    const isLocked = state === 'locked' && !isTester;

                    return (
                      <div
                        key={mission.id}
                        onClick={() => handleMissionClick(mission, state)}
                        className={`group relative rounded-2xl sm:rounded-3xl p-5 border-2 transition-all flex flex-col justify-between cursor-pointer ${
                          isCompleted
                            ? 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-lg shadow-emerald-900/5'
                            : isInProgress
                            ? 'bg-white border-blue-400 hover:border-blue-500 hover:shadow-lg shadow-blue-900/10 ring-2 ring-blue-100'
                            : isAvailable
                            ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-lg shadow-amber-900/10'
                            : 'bg-slate-100/80 border-slate-200 opacity-75 hover:opacity-90'
                        }`}
                      >
                        {/* Top Mission Header: Level & State Badge */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isInProgress
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : isAvailable
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              Level {mission.levelNumber} • {mission.code}
                            </span>

                            {/* Status Pill */}
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Selesai</span>
                              </span>
                            )}
                            {isInProgress && (
                              <span className="flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                                <Flame className="w-3 h-3 text-blue-600" />
                                <span>Lanjutkan</span>
                              </span>
                            )}
                            {isAvailable && (
                              <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Siap Mulai</span>
                              </span>
                            )}
                            {isLocked && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Terkunci</span>
                              </span>
                            )}
                          </div>

                          {/* Mission Title & Subtitle */}
                          <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
                            {mission.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-snug line-clamp-2">
                            {mission.subtitle}
                          </p>

                          {/* Target Badge Thumbnail */}
                          {badge && (
                            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60">
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: isCompleted || badge.unlocked ? badge.bgColor : '#F1F5F9',
                                }}
                              >
                                <Award
                                  className="w-3 h-3"
                                  style={{
                                    color: isCompleted || badge.unlocked ? badge.color : '#94A3B8',
                                  }}
                                />
                              </div>
                              <span className="truncate">{badge.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Mission Action Footer Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>+{mission.xpReward} XP</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold">
                            {isCompleted ? (
                              <span className="text-emerald-700 font-black flex items-center gap-1 group-hover:underline">
                                <span>Ulangi</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            ) : isInProgress ? (
                              <span className="text-blue-600 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>Lanjutkan</span>
                                <Play className="w-3 h-3 fill-blue-600 text-blue-600" />
                              </span>
                            ) : isAvailable ? (
                              <span className="text-amber-700 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>Mulai</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1">
                                <span>Terkunci</span>
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* WORLD 4 / GRAND FINALE: MISI AKHIR SANG PENJELAJAH RUPIAH */}
        {/* Styled identically to Dunia 1 (Cinta), Dunia 2 (Bangga), and Dunia 3 (Paham) */}
        {/* ========================================================================= */}
        {(() => {
          const isFinalUnlocked = db.isFinalMissionUnlocked(effectiveStudentId, currentUser);
          const completedMissionsCount = db.getCompletedMissionsCount(effectiveStudentId);
          const finalMissionProg = db.getFinalMissionProgress(effectiveStudentId, ((currentUser as any)?.classification as any) || 'anak');
          const stage1Completed = finalMissionProg?.stage1Completed || false;
          const stage2Completed = finalMissionProg?.stage2Completed || false;
          const stage3Completed = finalMissionProg?.stage3Completed || false;
          const finalMissionStagesCompleted = (stage1Completed ? 1 : 0) + (stage2Completed ? 1 : 0) + (stage3Completed ? 1 : 0);

          const handleFinalStageClick = () => {
            sounds.playPop();
            if (!isFinalUnlocked) {
              setLockedTooltip(
                `🔒 Misi Akhir masih terkunci! Anda baru menyelesaikan ${completedMissionsCount} dari 9 misi. Selesaikan seluruh 9 misi di Dunia Cinta, Bangga, dan Paham Rupiah terlebih dahulu untuk membukanya.`
              );
              setTimeout(() => setLockedTooltip(null), 5000);
              return;
            }
            if (onOpenFinalMission) onOpenFinalMission();
          };

          return (
            <div
              id="world-misi-akhir"
              className={`rounded-3xl bg-white border shadow-md shadow-slate-900/5 overflow-hidden transition-all ${
                isFinalUnlocked ? 'border-amber-200/90' : 'border-slate-200 opacity-95'
              }`}
            >
              {/* World Header Banner */}
              <div
                className={`p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isFinalUnlocked
                    ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500'
                    : 'bg-gradient-to-r from-slate-800 via-slate-800 to-amber-950/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
                      isFinalUnlocked ? 'bg-white/20 backdrop-blur-md' : 'bg-slate-700'
                    }`}
                  >
                    {isFinalUnlocked ? <Crown className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-amber-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                        Evaluasi Puncak
                      </span>
                      {isFinalUnlocked ? (
                        <span className="text-xs font-bold text-white/90 font-mono">
                          {finalMissionStagesCompleted} / 3 Tahap Selesai
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Terkunci: Butuh 9 Misi ({completedMissionsCount}/9)
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight">
                      Misi Akhir: Sang Penjelajah Rupiah
                    </h3>
                    <p className="text-xs text-white/85 font-medium mt-0.5">
                      {isFinalUnlocked
                        ? 'Uji kompetensi bertahap untuk memperoleh E-Sertifikat resmi Bank Indonesia.'
                        : `Selesaikan seluruh 9 misi di Dunia Cinta, Bangga, dan Paham terlebih dahulu (${completedMissionsCount}/9 selesai).`}
                    </p>
                  </div>
                </div>

                {/* Progress Pill & CTA */}
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  {isFinalUnlocked && (
                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-bold">
                      <span>Progres:</span>
                      <div className="w-16 h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((finalMissionStagesCompleted / 3) * 100)}%` }}
                        />
                      </div>
                      <span>{Math.round((finalMissionStagesCompleted / 3) * 100)}%</span>
                    </div>
                  )}

                  <button
                    onClick={handleFinalStageClick}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                      isFinalUnlocked
                        ? 'bg-white text-slate-900 hover:bg-yellow-50'
                        : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    }`}
                  >
                    {isFinalUnlocked ? (
                      <>
                        <span>Mulai Misi Akhir</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Terkunci ({completedMissionsCount}/9)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3 Step Cards Grid for Misi Akhir */}
              <div className="p-4 sm:p-6 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Step 1: Penjelajah Pemula */}
                  <div
                    onClick={handleFinalStageClick}
                    className={`group relative rounded-2xl sm:rounded-3xl p-5 border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      !isFinalUnlocked
                        ? 'bg-slate-50/80 border-slate-200 hover:border-amber-300 opacity-80'
                        : stage1Completed
                        ? 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-lg shadow-emerald-900/5'
                        : 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-lg shadow-amber-900/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Tahap 1 • Level 10
                        </span>

                        {!isFinalUnlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Terkunci</span>
                          </span>
                        ) : stage1Completed ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Selesai</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Siap Mulai</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                        Tahap 1: Penjelajah Pemula
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-snug line-clamp-2">
                        Pengenalan keaslian 3D dan pedoman 5J merawat fisik Rupiah.
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-amber-100">
                          <Award className="w-3 h-3 text-amber-600" />
                        </div>
                        <span className="truncate">Penjelajah Pemula</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>+100 XP</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                        <span>{!isFinalUnlocked ? 'Terkunci' : stage1Completed ? 'Ulangi' : 'Mulai'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Penjelajah Terampil */}
                  <div
                    onClick={handleFinalStageClick}
                    className={`group relative rounded-2xl sm:rounded-3xl p-5 border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      !isFinalUnlocked
                        ? 'bg-slate-50/80 border-slate-200 hover:border-amber-300 opacity-80'
                        : stage2Completed
                        ? 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-lg shadow-emerald-900/5'
                        : 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-lg shadow-amber-900/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Tahap 2 • Level 11
                        </span>

                        {!isFinalUnlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Terkunci</span>
                          </span>
                        ) : stage2Completed ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Selesai</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Siap Mulai</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                        Tahap 2: Penjelajah Terampil
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-snug line-clamp-2">
                        Kedaulatan NKRI, sejarah uang, dan simbol pemersatu bangsa.
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-amber-100">
                          <Award className="w-3 h-3 text-amber-600" />
                        </div>
                        <span className="truncate">Penjelajah Terampil</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>+150 XP</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                        <span>{!isFinalUnlocked ? 'Terkunci' : stage2Completed ? 'Ulangi' : 'Mulai'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Sang Penjelajah Rupiah */}
                  <div
                    onClick={handleFinalStageClick}
                    className={`group relative rounded-2xl sm:rounded-3xl p-5 border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      !isFinalUnlocked
                        ? 'bg-slate-50/80 border-slate-200 hover:border-amber-300 opacity-80'
                        : stage3Completed
                        ? 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-lg shadow-emerald-900/5'
                        : 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-lg shadow-amber-900/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Tahap 3 • Level 12
                        </span>

                        {!isFinalUnlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Terkunci</span>
                          </span>
                        ) : stage3Completed ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Selesai</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Siap Mulai</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                        Tahap 3: Sang Penjelajah Rupiah
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-snug line-clamp-2">
                        Literasi bertransaksi bijak, menabung, & perolehan E-Sertifikat.
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-amber-100">
                          <Crown className="w-3 h-3 text-amber-600" />
                        </div>
                        <span className="truncate">Sang Penjelajah Rupiah</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>+200 XP</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                        <span>{!isFinalUnlocked ? 'Terkunci' : stage3Completed ? 'Ulangi' : 'Mulai'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="mt-auto pt-16">
        <Footer />
      </div>
    </div>
  );
};
