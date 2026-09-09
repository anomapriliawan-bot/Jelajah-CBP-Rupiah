import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Star,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Flame,
  Share2,
} from 'lucide-react';
import { Mission, Badge, StudentProgress } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import { Footer } from '../../components/Footer';

interface MissionResultPageProps {
  missionId: string;
  onBackToJourney: () => void;
  onGoToNextMission: (nextMissionId: string) => void;
}

export const MissionResultPage: React.FC<MissionResultPageProps> = ({
  missionId,
  onBackToJourney,
  onGoToNextMission,
}) => {
  const currentUser = db.getCurrentUser();
  const effectiveStudentId = currentUser?.id || 'std_01';

  const [mission, setMission] = useState<Mission | undefined>(undefined);
  const [badge, setBadge] = useState<Badge | undefined>(undefined);
  const [progress, setProgress] = useState<StudentProgress | undefined>(undefined);
  const [nextMission, setNextMission] = useState<Mission | undefined>(undefined);

  useEffect(() => {
    sounds.playLevelUp();
    const m = db.getMissionById(missionId);
    setMission(m);
    if (m) {
      setBadge(db.getBadgeByMission(m.id));
      setProgress(db.getStudentMissionProgress(m.id, effectiveStudentId));

      const allMissions = db.getMissions().sort((a, b) => a.orderIndex - b.orderIndex);
      const nextM = allMissions.find((item) => item.orderIndex === m.orderIndex + 1);
      setNextMission(nextM);
    }
  }, [missionId]);

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <p className="text-base font-bold text-slate-700">Hasil misi tidak ditemukan.</p>
          <button
            onClick={onBackToJourney}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-xs cursor-pointer"
          >
            Kembali ke Peta Petualangan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-200 selection:text-blue-900 flex flex-col justify-between">
      {/* Confetti & Glow Background */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 w-full py-8 flex-1 flex items-center justify-center">
        <div className="rounded-3xl bg-white border-2 border-emerald-200/80 shadow-2xl shadow-emerald-900/10 p-6 sm:p-10 text-center space-y-6 relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-100 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-100 rounded-full blur-3xl pointer-events-none" />

          {/* Top Celebration Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-xl shadow-emerald-500/30 text-white animate-bounce">
              <Award className="w-12 h-12" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 animate-spin" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              Misi Berhasil Dituntaskan!
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Selamat, Kamu Menyelesaikan {mission.title}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              Kamu telah membuktikan pemahaman dan komitmen tinggi sebagai Duta Cilik Rupiah yang hebat!
            </p>
          </div>

          {/* Unlocked Badge Card Showcase */}
          {badge && (
            <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-50/80 via-yellow-50/60 to-white border-2 border-amber-200/90 shadow-md flex items-center gap-4 text-left">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: badge.bgColor, borderColor: badge.borderColor }}
              >
                <Award className="w-9 h-9" style={{ color: badge.color }} />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  Lencana Baru Terbuka!
                </span>
                <h3 className="text-base font-black text-slate-900 truncate">{badge.name}</h3>
                <p className="text-xs text-slate-600 font-medium leading-snug line-clamp-2">
                  {badge.description}
                </p>
              </div>
            </div>
          )}

          {/* Reward Badges Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-amber-800 block">Total Hadiah XP</span>
                <span className="text-sm font-black text-amber-950">+{mission.xpReward} XP</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-blue-800 block">Nilai Latihan</span>
                <span className="text-sm font-black text-blue-950">
                  {progress?.lastAttemptScore || progress?.score || 100} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Next Mission Unlocked Alert */}
          {nextMission && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase text-blue-700 block">Misi Selanjutnya Terbuka</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                  {nextMission.title} ({nextMission.code})
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.playPop();
                onBackToJourney();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Peta Petualangan</span>
            </button>

            {nextMission && (
              <button
                onClick={() => {
                  sounds.playPop();
                  onGoToNextMission(nextMission.id);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer group transition-all"
              >
                <span>Lanjut ke Misi Berikutnya</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Footer Credit */}
      <Footer />
    </div>
  );
};
