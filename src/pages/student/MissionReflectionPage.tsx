import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Heart,
  Award,
  CheckCircle2,
  Send,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { Mission, Reflection } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';

interface MissionReflectionPageProps {
  missionId: string;
  onBackToDetail: (missionId: string) => void;
  onFinishMission: (missionId: string) => void;
}

export const MissionReflectionPage: React.FC<MissionReflectionPageProps> = ({
  missionId,
  onBackToDetail,
  onFinishMission,
}) => {
  const currentUser = db.getCurrentUser();
  const effectiveStudentId = currentUser?.id || 'std_01';

  const [mission, setMission] = useState<Mission | undefined>(undefined);
  const [reflection, setReflection] = useState<Reflection | undefined>(undefined);
  const [selectedMood, setSelectedMood] = useState<string>('Sangat Paham & Semangat');
  const [reflectionAnswer, setReflectionAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const m = db.getMissionById(missionId);
    setMission(m);
    if (m) {
      const r = db.getReflectionByMission(m.id);
      setReflection(r);
      const existingProg = db.getStudentMissionProgress(m.id, effectiveStudentId);
      if (existingProg?.reflectionAnswer) {
        setReflectionAnswer(existingProg.reflectionAnswer);
      }
    }
  }, [missionId]);

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <p className="text-base font-bold text-slate-700">Misi tidak ditemukan.</p>
          <button
            onClick={() => onBackToDetail(missionId)}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-xs cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const moods = [
    { emoji: '🤩', label: 'Sangat Paham & Semangat' },
    { emoji: '😊', label: 'Senang & Mengerti' },
    { emoji: '💡', label: 'Dapat Ilmu Baru' },
    { emoji: '💪', label: 'Siap Praktikkan' },
  ];

  const handleSubmit = () => {
    if (!reflectionAnswer.trim()) return;
    setIsSubmitting(true);
    sounds.playLevelUp();

    const progress = db.getStudentMissionProgress(mission.id, effectiveStudentId);
    const finalScore = progress?.lastAttemptScore || progress?.score || 100;

    // Complete mission, unlock badge, award XP/Points, unlock next mission
    db.completeMission(mission.id, effectiveStudentId, finalScore, `[Perasaan: ${selectedMood}] ${reflectionAnswer}`);

    setTimeout(() => {
      onFinishMission(mission.id);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800 antialiased selection:bg-blue-200 selection:text-blue-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              sounds.playPop();
              onBackToDetail(missionId);
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Detail Misi</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-900 px-3 py-1 rounded-full border border-rose-200">
              Tahap 4: Refleksi & Kesimpulan
            </span>
          </div>

          <div className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Tahap Akhir
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-extrabold border border-rose-200">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Refleksi Duta Cilik Rupiah</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {reflection?.prompt || `Apa hal paling berharga yang kamu pelajari dari ${mission.title}?`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Tuliskan refleksi dan komitmen kebiasaan baikmu untuk menyelesaikan misi dan meraih lencana resmi!
            </p>
          </div>

          {/* Mood / Feeling Picker */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Bagaimana perasaanmu setelah mempelajari materi ini?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {moods.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedMood(m.label);
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                    selectedMood === m.label
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-100 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guided Questions Accordion */}
          {((reflection?.guideQuestions && reflection.guideQuestions.length > 0) || ((reflection as any)?.guidedQuestions && (reflection as any).guidedQuestions.length > 0)) && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Pertanyaan Pemandu:</span>
              </div>
              <ul className="space-y-1">
                {(reflection?.guideQuestions || (reflection as any)?.guidedQuestions || []).map((gq: string, gIdx: number) => (
                  <li key={gIdx} className="text-xs sm:text-sm font-bold text-amber-950 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <span>{gq}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reflection Input Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Tuliskan refleksi & komitmenmu di sini:
            </label>
            <textarea
              rows={4}
              value={reflectionAnswer}
              onChange={(e) => setReflectionAnswer(e.target.value)}
              placeholder="Contoh: Saya berjanji akan selalu menyimpan uang rupiah di dalam dompet tanpa melipatnya, dan akan teliti menghitung kembalian saat berbelanja di kantin..."
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white text-xs sm:text-sm text-slate-800 font-medium leading-relaxed resize-none transition-all outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Jawabanmu akan disimpan sebagai catatan prestasi siswa.
            </span>

            <button
              onClick={handleSubmit}
              disabled={!reflectionAnswer.trim() || isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{isSubmitting ? 'Menyimpan...' : 'Selesaikan Misi & Buka Lencana'}</span>
              <Award className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
