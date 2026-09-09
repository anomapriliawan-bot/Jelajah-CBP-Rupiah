import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Sparkles,
  Heart,
  Flag,
  Lightbulb,
  ArrowRight,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  FileText,
  HelpCircle,
  Award,
  History,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Realm, Mission, Lesson, Activity, PracticeQuestion, Reflection } from '../types';
import { db } from '../services/db';
import { careSimulatorRules } from '../data/mockData';
import { sounds } from '../utils/audio';

interface MissionModalProps {
  realm: Realm | null;
  initialStep?: number;
  onClose: () => void;
  onCompleteStep: (points: number, xp: number) => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  realm,
  initialStep = 1,
  onClose,
  onCompleteStep,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep - 1);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [reflection, setReflection] = useState<Reflection | null>(null);

  // Active view inside modal: 'overview' | 'lesson' | 'activity' | 'quiz' | 'reflection' | 'simulator'
  const [activeTab, setActiveTab] = useState<'overview' | 'lesson' | 'activity' | 'quiz' | 'reflection'>('overview');
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [selectedActivityIdx, setSelectedActivityIdx] = useState(0);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // 5J Simulator state for Cinta
  const [simulatorIndex, setSimulatorIndex] = useState(0);

  useEffect(() => {
    if (!realm) return;
    const loadData = () => {
      const worldMissions = db.getMissionsByWorld(realm.id);
      setMissions(worldMissions);
      const selected = worldMissions[currentStepIndex] || worldMissions[0];
      setCurrentMission(selected || null);

      if (selected) {
        setLessons(db.getLessonsByMission(selected.id));
        setActivities(db.getActivitiesByMission(selected.id));
        setPracticeQuestions(db.getPracticeQuestionsByMission(selected.id));
        setReflection(db.getReflectionByMission(selected.id) || null);
      }
    };

    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, [realm, currentStepIndex]);

  if (!realm || !currentMission) return null;

  const handleSelectMissionStep = (stepIdx: number) => {
    sounds.playPop();
    setCurrentStepIndex(stepIdx);
    const m = missions[stepIdx];
    if (m) {
      setCurrentMission(m);
      setLessons(db.getLessonsByMission(m.id));
      setActivities(db.getActivitiesByMission(m.id));
      setPracticeQuestions(db.getPracticeQuestionsByMission(m.id));
      setReflection(db.getReflectionByMission(m.id) || null);
      setActiveTab('overview');
      setQuizIdx(0);
      setIsAnswered(false);
      setSelectedOption(null);
    }
  };

  const handleSimChoice = (ruleId: string, isGood: boolean) => {
    sounds.playSuccess();
    if (simulatorIndex < careSimulatorRules.length - 1) {
      setSimulatorIndex((prev) => prev + 1);
    } else {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'],
      });
      onCompleteStep(150, 100);
      sounds.playFanfare();
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const q = practiceQuestions[quizIdx];
    if (q && optionIdx === q.correctAnswerIndex) {
      sounds.playSuccess();
      setQuizScore((s) => s + 100);
    } else {
      sounds.playPop();
    }
  };

  const handleNextQuestion = () => {
    if (quizIdx < practiceQuestions.length - 1) {
      setQuizIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      sounds.playFanfare();
      confetti({ particleCount: 70, spread: 60 });
      onCompleteStep(quizScore + 100, 150);
    }
  };

  const getThemeStyles = () => {
    switch (realm.id) {
      case 'cinta':
        return {
          bg: 'from-rose-50 to-white',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          btn: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/25',
          iconBg: 'bg-rose-500 text-white',
          accent: 'text-rose-600',
          navActive: 'bg-rose-600 text-white',
        };
      case 'bangga':
        return {
          bg: 'from-blue-50 to-white',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          btn: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25',
          iconBg: 'bg-blue-600 text-white',
          accent: 'text-blue-600',
          navActive: 'bg-blue-600 text-white',
        };
      case 'paham':
      default:
        return {
          bg: 'from-amber-50 to-white',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          btn: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25',
          iconBg: 'bg-amber-500 text-white',
          accent: 'text-amber-600',
          navActive: 'bg-amber-600 text-white',
        };
    }
  };

  const styles = getThemeStyles();
  const currentRule = careSimulatorRules[simulatorIndex];
  const activeLesson = lessons[selectedLessonIdx] || lessons[0];
  const activeActivity = activities[selectedActivityIdx] || activities[0];
  const activeQuestion = practiceQuestions[quizIdx] || practiceQuestions[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`relative w-full max-w-3xl bg-gradient-to-b ${styles.bg} rounded-3xl p-5 sm:p-7 border-2 ${styles.border} shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto`}>
        
        {/* Close button */}
        <button
          onClick={() => {
            sounds.playPop();
            onClose();
          }}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className={`w-13 h-13 rounded-2xl ${styles.iconBg} flex items-center justify-center shadow-md shrink-0`}>
            {realm.id === 'cinta' && <Heart className="w-6 h-6 fill-white" />}
            {realm.id === 'bangga' && <Flag className="w-6 h-6 fill-white" />}
            {realm.id === 'paham' && <Lightbulb className="w-6 h-6 fill-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${styles.badge}`}>
                {currentMission.code} • Misi Level {currentMission.levelNumber}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                World {realm.title}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {currentMission.title}
            </h2>
            <p className="text-xs text-slate-600">{currentMission.subtitle}</p>
          </div>
        </div>

        {/* Step Selector for the 3 Missions in this World */}
        <div className="flex items-center gap-2 mb-4 bg-white/80 p-1.5 rounded-2xl border border-slate-200/80">
          {missions.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => handleSelectMissionStep(idx)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                currentStepIndex === idx
                  ? `${styles.navActive} shadow-xs`
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Langkah {idx + 1}:</span>
              <span className="truncate max-w-[120px]">{m.title}</span>
            </button>
          ))}
        </div>

        {/* Inner Feature Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 mb-4 overflow-x-auto">
          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('overview');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ringkasan Misi</span>
          </button>

          {lessons.length > 0 && (
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('lesson');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'lesson' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Materi Belajar ({lessons.length})</span>
            </button>
          )}

          {activities.length > 0 && (
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('activity');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'activity' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Aktivitas Interaktif ({activities.length})</span>
            </button>
          )}

          {practiceQuestions.length > 0 && (
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('quiz');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quiz' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kuis Latihan ({practiceQuestions.length})</span>
            </button>
          )}

          {reflection && (
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('reflection');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reflection' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Refleksi Mandiri</span>
            </button>
          )}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                Tujuan & Ringkasan Misi
              </h4>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                {currentMission.summary}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Poin Utama Pembelajaran:
                </span>
                {currentMission.learningPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick 5J Simulator if in Cinta */}
            {realm.id === 'cinta' && (
              <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Simulasi 5J: {currentRule.title} ({simulatorIndex + 1}/5)</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    +150 Poin
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">{currentRule.desc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleSimChoice(currentRule.id, false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-left transition-all text-xs"
                  >
                    <ThumbsDown className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-semibold text-slate-800">{currentRule.badAction}</span>
                  </button>
                  <button
                    onClick={() => handleSimChoice(currentRule.id, true)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition-all text-xs"
                  >
                    <ThumbsUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-800">{currentRule.goodAction}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATERI / LESSONS */}
        {activeTab === 'lesson' && activeLesson && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {activeLesson.code} • Durasi Baca: {activeLesson.readTimeMinutes} Menit
              </span>
              {lessons.length > 1 && (
                <div className="flex items-center gap-1">
                  {lessons.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedLessonIdx(idx)}
                      className={`w-6 h-6 rounded-full text-xs font-bold ${
                        selectedLessonIdx === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">{activeLesson.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{activeLesson.summary}</p>
            
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-200 whitespace-pre-line font-sans">
              {activeLesson.content}
            </div>

            {activeLesson.keyTakeaways && activeLesson.keyTakeaways.length > 0 && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-950">
                <span className="font-bold block">Poin Kunci (Key Takeaways):</span>
                {activeLesson.keyTakeaways.map((k, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{k}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AKTIVITAS */}
        {activeTab === 'activity' && activeActivity && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                {activeActivity.code} • Tipe: {activeActivity.type}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{activeActivity.pointReward} Poin • +{activeActivity.xpReward} XP
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{activeActivity.title}</h3>
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Petunjuk Pelaksanaan Aktivitas:</span>
              <p className="leading-relaxed whitespace-pre-line">{activeActivity.instruction}</p>
            </div>

            <button
              onClick={() => {
                sounds.playSuccess();
                confetti({ particleCount: 60, spread: 50 });
                onCompleteStep(activeActivity.pointReward, activeActivity.xpReward);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
            >
              Tandai Aktivitas Selesai & Klaim Poin
            </button>
          </div>
        )}

        {/* TAB 4: QUIZ / PRACTICE QUESTIONS */}
        {activeTab === 'quiz' && activeQuestion && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Soal {quizIdx + 1} dari {practiceQuestions.length} ({activeQuestion.code})
              </span>
              <span className="text-xs font-mono font-bold text-purple-700">
                Skor: {quizScore}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {activeQuestion.question}
            </h4>

            <div className="space-y-2">
              {activeQuestion.options.map((opt, idx) => {
                let btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';
                if (isAnswered) {
                  if (idx === activeQuestion.correctAnswerIndex) {
                    btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-bold';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleQuizAnswer(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left text-xs font-medium ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isAnswered && idx === activeQuestion.correctAnswerIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && idx === selectedOption && idx !== activeQuestion.correctAnswerIndex && (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 leading-relaxed">
                <span className="font-bold block mb-0.5">Penjelasan Edukasi:</span>
                {activeQuestion.explanation}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                disabled={!isAnswered}
                onClick={handleNextQuestion}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all ${
                  isAnswered
                    ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{quizIdx < practiceQuestions.length - 1 ? 'Soal Berikutnya' : 'Selesai Latihan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: REFLECTION */}
        {activeTab === 'reflection' && reflection && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4 max-h-[50vh] overflow-y-auto">
            <span className="text-[10px] font-black font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              {reflection.code} • Refleksi Sikap Karakter
            </span>
            <h3 className="text-base font-bold text-slate-900">{reflection.prompt}</h3>

            {reflection.guideQuestions && reflection.guideQuestions.length > 0 && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Pertanyaan Panduan:</span>
                {reflection.guideQuestions.map((g, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">{i + 1}.</span>
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            )}

            <textarea
              placeholder="Tuliskan refleksimu di sini..."
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-blue-500"
            />

            <button
              onClick={() => {
                sounds.playSuccess();
                confetti({ particleCount: 50 });
                onCompleteStep(100, 50);
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Simpan Refleksi & Ambil Hadiah
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200/60">
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-5 py-2 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>

          <button
            onClick={() => {
              sounds.playFanfare();
              confetti({ particleCount: 70, spread: 60 });
              onCompleteStep(currentMission.pointReward, currentMission.xpReward);
              onClose();
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r ${styles.btn} text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer`}
          >
            <span>Selesaikan Misi (+{currentMission.xpReward} XP)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
