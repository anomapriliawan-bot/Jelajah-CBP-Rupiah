import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Gamepad2,
  HelpCircle,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  Play,
  Flame,
  Star,
  Compass,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Mission, Badge, Lesson, Activity, PracticeQuestion, Reflection } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import { RupiCharacter } from '../../components/RupiCharacter';
import { Footer } from '../../components/Footer';

interface MissionDetailPageProps {
  missionId: string;
  onBackToJourney: () => void;
  onStartLearn: (missionId: string) => void;
  onStartActivity: (missionId: string) => void;
  onStartPractice: (missionId: string) => void;
  onStartReflection: (missionId: string) => void;
  onViewResult: (missionId: string) => void;
}

export const MissionDetailPage: React.FC<MissionDetailPageProps> = ({
  missionId,
  onBackToJourney,
  onStartLearn,
  onStartActivity,
  onStartPractice,
  onStartReflection,
  onViewResult,
}) => {
  const currentUser = db.getCurrentUser();
  const effectiveStudentId = currentUser?.id || 'std_01';
  const isTester =
    effectiveStudentId === 'USR-TESTER' ||
    currentUser?.id === 'USR-TESTER' ||
    currentUser?.email?.toLowerCase().includes('tester') ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'teacher';

  const [mission, setMission] = useState<Mission | undefined>(undefined);
  const [badge, setBadge] = useState<Badge | undefined>(undefined);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [reflection, setReflection] = useState<Reflection | undefined>(undefined);
  const [state, setState] = useState<'locked' | 'available' | 'in_progress' | 'completed'>('available');
  const [progress, setProgress] = useState(db.getStudentMissionProgress(missionId, effectiveStudentId));
  const [mascotGender, setMascotGender] = useState<'male' | 'female'>(() => {
    return currentUser?.gender === 'female' || currentUser?.gender === ('perempuan' as any) ? 'female' : 'male';
  });

  const loadData = () => {
    const m = db.getMissionById(missionId);
    setMission(m);
    if (m) {
      setBadge(db.getBadgeByMission(m.id));
      setLessons(db.getLessonsByMission(m.id));
      setActivities(db.getActivitiesByMission(m.id));
      setQuestions(db.getPracticeQuestionsByMission(m.id));
      setReflection(db.getReflectionByMission(m.id));
      setState(db.getMissionState(m.id, effectiveStudentId));
      setProgress(db.getStudentMissionProgress(m.id, effectiveStudentId));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, [missionId]);

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <p className="text-base font-bold text-slate-700">Misi tidak ditemukan.</p>
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

  const completedSections = progress?.completedSections || [];
  const isLearnDone = completedSections.includes('learn');
  const isActivityDone = completedSections.includes('activity');
  const isPracticeDone = completedSections.includes('practice');
  const isReflectionDone = completedSections.includes('reflection');

  const getWorldBadge = (worldId: string) => {
    switch (worldId) {
      case 'cinta':
        return { label: 'Dunia Cinta Rupiah', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'bangga':
        return { label: 'Dunia Bangga Rupiah', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'paham':
      default:
        return { label: 'Dunia Paham Rupiah', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
  };

  const wBadge = getWorldBadge(mission.worldId);

  // Resume or start target
  const handlePrimaryAction = () => {
    sounds.playPop();
    db.startMission(mission.id, effectiveStudentId);
    if (!isLearnDone) {
      onStartLearn(mission.id);
    } else if (!isActivityDone) {
      onStartActivity(mission.id);
    } else if (!isPracticeDone) {
      onStartPractice(mission.id);
    } else if (!isReflectionDone) {
      onStartReflection(mission.id);
    } else {
      onViewResult(mission.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-200 selection:text-blue-900 flex flex-col">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              sounds.playPop();
              onBackToJourney();
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Peta Petualangan</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${wBadge.color}`}>
              {wBadge.label}
            </span>
            <span className="text-[11px] font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              Level {mission.levelNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Mission Overview Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-900/5 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                {mission.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {mission.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                {mission.subtitle}
              </p>
            </div>

            {/* Target Reward Pill */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl text-xs font-black text-amber-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>+{mission.xpReward} XP</span>
              </div>
              {badge && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>{badge.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Big Question Highlight Box */}
          {mission.bigQuestion && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 mt-0.5">
                <Compass className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                  Pertanyaan Pemantik Misi
                </span>
                <p className="text-sm sm:text-base font-extrabold text-blue-950 leading-snug">
                  "{mission.bigQuestion}"
                </p>
              </div>
            </div>
          )}

          {/* Opening Story & Mascot Guide (Rupi / Raya) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-6 border-t border-slate-100">
            <div className="md:col-span-6 flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-b from-sky-50/80 via-blue-50/40 to-white border-2 border-sky-100 shadow-xs">
              {/* Mascot Character Display */}
              <RupiCharacter
                size="md"
                gender={mascotGender}
                speechText={
                  mascotGender === 'female'
                    ? 'Halo! Aku Raya, siap mendampingi misimu!'
                    : 'Halo! Aku Rupi, siap mendampingi misimu!'
                }
                onClick={() => {
                  sounds.playPop();
                  setMascotGender((prev) => (prev === 'male' ? 'female' : 'male'));
                }}
              />

              {/* Character Selector Toggle (Rupi Laki-Laki / Raya Perempuan) */}
              <div className="mt-4 flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setMascotGender('male');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    mascotGender === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>👦 Rupi</span>
                  <span className="text-[10px] font-medium opacity-90">(Laki-Laki)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setMascotGender('female');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    mascotGender === 'female'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>👧 Raya</span>
                  <span className="text-[10px] font-medium opacity-90">(Perempuan)</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-6 space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Kisah Pembuka Misi</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                {mission.openingStory ||
                  `Selamat datang dalam petualangan ini! Bersama ${
                    mascotGender === 'female' ? 'Raya' : 'Rupi'
                  }, kamu akan mempelajari hal-hal penting seputar Rupiah melalui kartu materi seru, simulasi interaktif, dan latihan uji pemahaman.`}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-amber-500 font-bold">💡 Tips:</span>
                <span>Kamu bisa mengganti pemandumu antara <strong>Rupi (Laki-Laki)</strong> dan <strong>Raya (Perempuan)</strong> kapan saja!</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Interactive Journey Steps */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-900/5 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Tahapan Pembelajaran Misi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Selesaikan 4 tahapan berurutan untuk menuntaskan misi dan meraih lencana
              </p>
            </div>

            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {completedSections.length} / 4 Selesai
            </span>
          </div>

          <div className="space-y-3.5">
            {/* STEP 1: MATERI BACAAN */}
            <div
              onClick={() => {
                sounds.playPop();
                onStartLearn(mission.id);
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                isLearnDone
                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                  : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isLearnDone ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Tahap 1
                    </span>
                    {isLearnDone && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                        Selesai
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Materi Belajar Interaktif
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {lessons.length} Kartu Bacaan bergambar & konsep penting
                  </p>
                </div>
              </div>

              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                {isLearnDone ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>

            {/* STEP 2: AKTIVITAS INTERAKTIF */}
            <div
              onClick={() => {
                sounds.playPop();
                onStartActivity(mission.id);
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                isActivityDone
                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                  : isLearnDone
                  ? 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isActivityDone
                      ? 'bg-emerald-600 text-white'
                      : isLearnDone
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Tahap 2
                    </span>
                    {isActivityDone && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                        Selesai
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Aktivitas & Simulasi Praktik
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {activities.length > 0 ? activities[0].title : 'Aktivitas eksplorasi konsep'}
                  </p>
                </div>
              </div>

              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                {isActivityDone ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>

            {/* STEP 3: LATIHAN SOAL */}
            <div
              onClick={() => {
                sounds.playPop();
                onStartPractice(mission.id);
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                isPracticeDone
                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                  : isActivityDone
                  ? 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isPracticeDone
                      ? 'bg-emerald-600 text-white'
                      : isActivityDone
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Tahap 3
                    </span>
                    {isPracticeDone && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                        Nilai Latihan: {progress?.lastAttemptScore || progress?.score || 100}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Latihan Pemahaman
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {questions.length} Soal Pilihan Ganda dengan pembahasan ramah anak
                  </p>
                </div>
              </div>

              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                {isPracticeDone ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>

            {/* STEP 4: REFLEKSI */}
            <div
              onClick={() => {
                sounds.playPop();
                onStartReflection(mission.id);
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                isReflectionDone
                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                  : isPracticeDone
                  ? 'bg-white border-rose-200 hover:border-rose-400 hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isReflectionDone
                      ? 'bg-emerald-600 text-white'
                      : isPracticeDone
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Tahap 4
                    </span>
                    {isReflectionDone && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                        Tercatat
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Refleksi & Komitmen Duta Rupiah
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Tuliskan kesan dan kebiasaan baik yang akan kamu lakukan
                  </p>
                </div>
              </div>

              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                {isReflectionDone ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Big Action Button */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Progress tersimpan otomatis di perangkatmu.
            </div>

            <button
              onClick={handlePrimaryAction}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>
                {progress?.status === 'completed'
                  ? 'Lihat Lencana & Hasil Misi'
                  : progress?.status === 'in_progress'
                  ? 'Lanjutkan Petualangan'
                  : 'Mulai Petualangan Misi'}
              </span>
              <Play className="w-4 h-4 fill-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* System Footer Credit */}
      <div className="mt-auto pt-16">
        <Footer />
      </div>
    </div>
  );
};
