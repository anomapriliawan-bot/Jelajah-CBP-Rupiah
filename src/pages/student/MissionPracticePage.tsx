import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Star,
  Award,
  BookOpen,
  Info,
  Check,
} from 'lucide-react';
import { PracticeQuestion, Mission, PracticeAttempt } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';

interface MissionPracticePageProps {
  missionId: string;
  onBackToDetail: (missionId: string) => void;
  onContinueToReflection: (missionId: string) => void;
}

export const MissionPracticePage: React.FC<MissionPracticePageProps> = ({
  missionId,
  onBackToDetail,
  onContinueToReflection,
}) => {
  const currentUser = db.getCurrentUser();
  const effectiveStudentId = currentUser?.id || 'std_01';

  const [mission, setMission] = useState<Mission | undefined>(undefined);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answersMap, setAnswersMap] = useState<Record<string, { selected: string; isCorrect: boolean }>>({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());

  const initQuestions = () => {
    const m = db.getMissionById(missionId);
    setMission(m);
    if (m) {
      const qList = db.getPracticeQuestionsByMission(m.id);
      // Randomize questions
      const randomized = [...qList].sort(() => Math.random() - 0.5);
      const displayCount = m.questionDisplayCount || 5;
      const sliced = randomized.slice(0, Math.min(displayCount, randomized.length));
      setQuestions(sliced);
      setCurrentIdx(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAnswersMap({});
      setIsQuizFinished(false);
      setStartedAt(new Date().toISOString());
    }
  };

  useEffect(() => {
    initQuestions();
  }, [missionId]);

  if (!mission || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <p className="text-base font-bold text-slate-700">Soal latihan sedang disiapkan.</p>
          <button
            onClick={() => onBackToDetail(missionId)}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-xs cursor-pointer"
          >
            Kembali ke Detail Misi
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    sounds.playPop();
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;
    const selectedIdx = currentQ.options.indexOf(selectedOption);
    const isCorrect =
      selectedIdx === currentQ.correctAnswerIndex ||
      selectedOption === (currentQ as any).correctAnswer ||
      selectedOption === currentQ.options[currentQ.correctAnswerIndex];

    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playPop();
    }

    setIsAnswerSubmitted(true);
    setAnswersMap((prev) => ({
      ...prev,
      [currentQ.id]: { selected: selectedOption, isCorrect },
    }));
  };

  const handleNextQuestion = () => {
    sounds.playPop();
    if (!isLastQuestion) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Calculate final score
      const answersList: { selected: string; isCorrect: boolean }[] = Object.values(answersMap);
      const correctCount = answersList.filter((a) => a.isCorrect).length;
      const scoreCalc = Math.round((correctCount / questions.length) * 100);
      setFinalScore(scoreCalc);
      setIsQuizFinished(true);

      // Save attempt to DB
      const existingAttempts = db.getPracticeAttemptsByMission(mission.id, effectiveStudentId);
      const attemptDetails = questions.map((q) => {
        const ans = answersMap[q.id];
        return {
          questionId: q.id,
          selectedAnswer: q.options.indexOf(ans?.selected || ''),
          isCorrect: !!ans?.isCorrect,
        };
      });

      db.recordPracticeAttempt({
        studentId: effectiveStudentId,
        missionId: mission.id,
        attemptNumber: existingAttempts.length + 1,
        score: scoreCalc,
        totalQuestions: questions.length,
        correctCount,
        startedAt,
        completedAt: new Date().toISOString(),
        details: attemptDetails,
      });

      db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'practice');
    }
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
            <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
              Tahap 3: Latihan Pemahaman
            </span>
          </div>

          <div className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-mono">
            Soal {currentIdx + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {!isQuizFinished ? (
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8 space-y-6">
            {/* Question Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${Math.round(((currentIdx + 1) / questions.length) * 100)}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pertanyaan {currentIdx + 1}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                {currentQ.question || (currentQ as any).questionText}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOption === opt;
                const isCorrectOption =
                  oIdx === currentQ.correctAnswerIndex ||
                  opt === (currentQ as any).correctAnswer ||
                  opt === currentQ.options[currentQ.correctAnswerIndex];

                let optionStyle = 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-800';
                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold';
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = 'bg-rose-50 border-rose-300 text-rose-950';
                  } else {
                    optionStyle = 'bg-slate-50/50 border-slate-200 opacity-60 text-slate-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-2 ring-blue-100';
                }

                return (
                  <div
                    key={oIdx}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-snug">{opt}</span>
                    </div>

                    {isAnswerSubmitted && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation / Pembahasan */}
            {isAnswerSubmitted && currentQ.explanation && (
              <div className="p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-800">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Penjelasan Edukatif:</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-950 font-bold leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Pilih satu jawaban terbaik, lalu klik periksa.
              </span>

              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  Periksa Jawaban
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-extrabold text-xs rounded-full shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>{isLastQuestion ? 'Lihat Nilai Latihan' : 'Soal Berikutnya'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz Results Score Card */
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8 space-y-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 text-white">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Hasil Latihan Soal
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {finalScore >= 80 ? 'Luar Biasa, Pemahamanmu Sangat Baik!' : 'Hebat, Terus Tingkatkan Pemahamanmu!'}
              </h2>
            </div>

            {/* Score Box with Strict "Nilai Latihan" label */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 max-w-sm mx-auto space-y-2">
              <span className="text-xs font-bold uppercase text-slate-500 block">Nilai Latihan</span>
              <div className="text-5xl font-black text-blue-600 font-mono">{finalScore}</div>
              <span className="text-xs font-extrabold text-slate-600 block">
                {Object.values(answersMap).filter((a: { selected: string; isCorrect: boolean }) => a.isCorrect).length} dari {questions.length} Soal Terjawab Benar
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              Catatan latihanmu telah disimpan ke sistem. Sekarang lanjutkan ke tahap refleksi untuk menyelesaikan misi ini!
            </p>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={initQuestions}
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Latihan Soal</span>
              </button>

              <button
                onClick={() => {
                  sounds.playSuccess();
                  onContinueToReflection(mission.id);
                }}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut ke Refleksi Misi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
