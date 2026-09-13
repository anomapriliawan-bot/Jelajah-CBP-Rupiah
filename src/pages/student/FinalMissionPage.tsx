import React, { useState, useEffect } from 'react';
import {
  Compass,
  Trophy,
  Award,
  Star,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Clock,
  Eye,
  Download,
  Printer,
  X,
  Share2,
  Check,
  CheckSquare,
  Image as ImageIcon,
  Flame,
  Crown,
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  Unlock,
} from 'lucide-react';
import { db } from '../../services/db';
import {
  FinalMissionQuestion,
  FinalMissionClassification,
  FinalMissionStage,
  FinalMissionProgress,
  FinalMissionAttempt,
  FinalMissionStageAccessConfig,
} from '../../types';
import { STAGES, CLASSIFICATION_LABELS } from '../../services/finalMissionData';
import { Footer } from '../../components/Footer';
import {
  LikertEmoticon,
  LIKERT_SCALE_ITEMS,
  detectLikertVariant,
  getLikertScaleItems,
} from '../../components/LikertEmoticon';
import {
  MatrixQuestionView,
  parseMatrixQuestionOptions,
} from '../../components/MatrixQuestionView';
import { VisualMatrixQuestionView } from '../../components/VisualMatrixQuestionView';
import { SafeImage } from '../../components/common/SafeImage';
import { sounds } from '../../utils/audio';

interface FinalMissionPageProps {
  onBack: () => void;
  onNavigateHome?: () => void;
  onOpenMissions?: () => void;
  onOpenAdmin?: () => void;
}

export const FinalMissionPage: React.FC<FinalMissionPageProps> = ({
  onBack,
  onNavigateHome,
  onOpenMissions,
  onOpenAdmin,
}) => {
  const currentUser = db.getCurrentUser();
  const schoolSettings = db.getSchoolSettings();

  // Detect appropriate classification from user's ageCategory or fallback to grade/role
  const determineInitialClassification = (): FinalMissionClassification => {
    if (currentUser?.ageCategory) {
      return currentUser.ageCategory;
    }
    if (currentUser?.grade) {
      const g = currentUser.grade.toLowerCase();
      if (g.includes('guru') || g.includes('dewasa') || g.includes('umum') || g.includes('admin')) {
        return 'dewasa';
      }
      if (g.includes('mahasiswa') || g.includes('sma') || g.includes('smk') || g.includes('remaja')) {
        return 'remaja';
      }
    }
    if (currentUser?.role && ['teacher', 'admin', 'superadmin', 'reviewer'].includes(currentUser.role)) {
      return 'dewasa';
    }
    return 'anak';
  };

  const [classification, setClassification] = useState<FinalMissionClassification>(determineInitialClassification());
  const [progress, setProgress] = useState<FinalMissionProgress>(() =>
    db.getFinalMissionProgress(currentUser?.id || 'USR-TESTER', classification)
  );

  // Stage Access & Testing Bypass configuration
  const [stageAccess, setStageAccess] = useState<FinalMissionStageAccessConfig>(() =>
    db.getFinalMissionStageAccess()
  );

  const isFinalMissionUnlocked = db.isFinalMissionUnlocked(currentUser?.id, currentUser);
  const completedMissionsCount = db.getCompletedMissionsCount(currentUser?.id);
  const eventStatus = db.getFinalMissionEventStatus(currentUser?.id, currentUser);

  const isGuest = currentUser?.isGuest || currentUser?.id === 'USR-GUEST' || db.isCurrentGuest();
  const isAdminOrTeacher =
    !isGuest &&
    (currentUser?.role === 'admin' ||
    currentUser?.role === 'teacher' ||
    currentUser?.id === 'USR-TESTER' ||
    currentUser?.email?.toLowerCase().includes('tester'));

  // Active Challenge State
  const [activeStage, setActiveStage] = useState<FinalMissionStage | null>(null);
  const [stageQuestions, setStageQuestions] = useState<FinalMissionQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results State
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<FinalMissionAttempt | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Refresh progress when classification changes or DB updates
  useEffect(() => {
    const p = db.getFinalMissionProgress(currentUser?.id || 'USR-TESTER', classification);
    setProgress(p);
    setStageAccess(db.getFinalMissionStageAccess());

    const unsub = db.subscribe(() => {
      setProgress(db.getFinalMissionProgress(currentUser?.id || 'USR-TESTER', classification));
      setStageAccess(db.getFinalMissionStageAccess());
      if (activeStage) {
        const stageName =
          activeStage === 'pemula' ? STAGES.PEMULA : activeStage === 'terampil' ? STAGES.TERAMPIL : STAGES.MASTER;
        const fresh = db.getFinalMissionQuestions(classification, stageName);
        if (fresh.length > 0) {
          setStageQuestions(fresh);
        }
      }
    });
    return unsub;
  }, [classification, currentUser?.id, activeStage]);

  // Stage unlock verification helper with Admin bypass support
  const isStageUnlocked = (stage: FinalMissionStage) => {
    return db.isFinalMissionStageUnlocked(stage, progress, currentUser);
  };

  const isBypassedByAdmin = (stage: FinalMissionStage) => {
    if (stage === 'pemula') return false;
    if (stage === 'terampil') {
      return !progress.stage1Completed && isStageUnlocked('terampil');
    }
    if (stage === 'master') {
      return !progress.stage2Completed && isStageUnlocked('master');
    }
    return false;
  };

  const handleToggleUnlockAll = () => {
    sounds.playPop();
    const newUnlockAll = !stageAccess.unlockAll;
    const updated = db.saveFinalMissionStageAccess({
      unlockAll: newUnlockAll,
      unlockedStages: {
        pemula: true,
        terampil: newUnlockAll ? true : stageAccess.unlockedStages.terampil,
        master: newUnlockAll ? true : stageAccess.unlockedStages.master,
      },
    });
    setStageAccess(updated);
  };

  const handleToggleStage = (stage: 'terampil' | 'master') => {
    sounds.playPop();
    const nextVal = !stageAccess.unlockedStages[stage];
    const updatedStages = {
      ...stageAccess.unlockedStages,
      [stage]: nextVal,
    };
    const updated = db.saveFinalMissionStageAccess({
      unlockAll: false,
      unlockedStages: updatedStages,
    });
    setStageAccess(updated);
  };

  const handleResetMyProgress = () => {
    sounds.playPop();
    if (
      window.confirm(
        `Reset skor dan progres Misi Akhir Anda pada klasifikasi ${classification.toUpperCase()}? Fitur ini khusus pengujian.`
      )
    ) {
      const resetProgress: FinalMissionProgress = {
        id: `${currentUser?.id || 'USR-TESTER'}_${classification}`,
        userId: currentUser?.id || 'USR-TESTER',
        classification,
        stage1Completed: false,
        stage1Score: 0,
        stage2Completed: false,
        stage2Score: 0,
        stage3Completed: false,
        stage3Score: 0,
        grandTitleAwarded: false,
      };
      db.saveFinalMissionProgress(resetProgress);
      setProgress(resetProgress);
    }
  };

  // Timer for active quiz
  useEffect(() => {
    let timer: any = null;
    if (activeStage && !showResultModal) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeStage, quizStartTime, showResultModal]);

  const stagesConfig: {
    stage: FinalMissionStage;
    title: string;
    stageName: string;
    tagline: string;
    icon: any;
    color: string;
    bgGradient: string;
    borderColor: string;
    isCompleted: boolean;
    isLocked: boolean;
    isBypassed: boolean;
    score: number;
    passingGrade: number;
  }[] = [
    {
      stage: 'pemula',
      title: 'Tahap 1',
      stageName: STAGES.PEMULA,
      tagline: 'Mengenal Ciri Fisik, Nilai Pecahan, & Peran Dasar Uang Rupiah',
      icon: Compass,
      color: 'text-amber-700',
      bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-300',
      isCompleted: progress.stage1Completed,
      isLocked: !isStageUnlocked('pemula'),
      isBypassed: false,
      score: progress.stage1Score,
      passingGrade: db.getFinalMissionPassingGrade('pemula'),
    },
    {
      stage: 'terampil',
      title: 'Tahap 2',
      stageName: STAGES.TERAMPIL,
      tagline: 'Merawat Rupiah (5J), Mengenali Keaslian (3D), & Membela Kedaulatan',
      icon: ShieldCheck,
      color: 'text-sky-700',
      bgGradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
      borderColor: 'border-sky-300',
      isCompleted: progress.stage2Completed,
      isLocked: !isStageUnlocked('terampil'),
      isBypassed: isBypassedByAdmin('terampil'),
      score: progress.stage2Score,
      passingGrade: db.getFinalMissionPassingGrade('terampil'),
    },
    {
      stage: 'master',
      title: 'Tahap 3 (Puncak)',
      stageName: STAGES.MASTER,
      tagline: 'Fungsi Uang, Literasi Digital Tunai/Non-Tunai, & Bijak Mengelola Keuangan',
      icon: Crown,
      color: 'text-purple-700',
      bgGradient: 'from-purple-500/15 via-amber-500/10 to-transparent',
      borderColor: 'border-purple-300 shadow-lg shadow-purple-500/10',
      isCompleted: progress.stage3Completed,
      isLocked: !isStageUnlocked('master'),
      isBypassed: isBypassedByAdmin('master'),
      score: progress.stage3Score,
      passingGrade: db.getFinalMissionPassingGrade('master'),
    },
  ];

  const handleStartStage = (stage: FinalMissionStage) => {
    sounds.playPop();

    if (!isStageUnlocked(stage)) {
      if (!isFinalMissionUnlocked) {
        if (!eventStatus.hasCompleted9Missions) {
          alert(
            `🔒 Misi Akhir masih terkunci!\n\nAnda baru menyelesaikan ${completedMissionsCount} dari 9 misi utama. Selesaikan seluruh 9 misi di Dunia Cinta, Bangga, dan Paham Rupiah terlebih dahulu sebagai syarat wajib untuk membuka Misi Akhir.`
          );
        } else if (eventStatus.isEventMode && !eventStatus.isWithinSchedule) {
          alert(
            `🔒 Sesi Main Bareng Belum/Tidak Aktif!\n\n${eventStatus.message}\n\nAdmin Sekolah menetapkan pengerjaan Misi Akhir secara bersama-sama sesuai jadwal yang ditentukan.`
          );
        } else {
          alert(
            `🔒 Misi Akhir masih terkunci!\n\nSelesaikan seluruh 9 misi utama terlebih dahulu untuk membuka Misi Akhir.`
          );
        }
      } else {
        alert('🔒 Tahap ini masih terkunci! Selesaikan dan lulus tahap sebelumnya terlebih dahulu.');
      }
      return;
    }

    const stageName =
      stage === 'pemula' ? STAGES.PEMULA : stage === 'terampil' ? STAGES.TERAMPIL : STAGES.MASTER;

    const effectiveClassification: FinalMissionClassification =
      (currentUser?.role === 'student' && currentUser?.ageCategory)
        ? currentUser.ageCategory
        : classification;

    const questions = db.getFinalMissionQuestions(effectiveClassification, stageName);
    if (questions.length === 0) {
      alert(`Belum ada butir soal untuk ${stageName} pada klasifikasi ${effectiveClassification}. Silakan tambahkan soal di menu Admin.`);
      return;
    }

    setStageQuestions(questions);
    setActiveStage(stage);
    setCurrentQIndex(0);
    setUserAnswers({});
    setQuizStartTime(Date.now());
    setElapsedTime(0);
    setShowResultModal(false);
  };

  const handleSelectAnswer = (qId: string, answer: any) => {
    sounds.playPop();
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: answer,
    }));
  };

  const handleToggleCheckboxAnswer = (qId: string, optionValue: string) => {
    sounds.playPop();
    setUserAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[qId]) ? prev[qId] : [];
      const exists = currentList.includes(optionValue);
      const nextList = exists
        ? currentList.filter((item) => item !== optionValue)
        : [...currentList, optionValue];
      return {
        ...prev,
        [qId]: nextList,
      };
    });
  };

  const calculateQuizScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;
    const details: Array<{ questionId: string; selectedAnswer: any; isCorrect: boolean }> = [];

    stageQuestions.forEach((q) => {
      const selected = userAnswers[q.id];
      const cleanCorrect = String(q.correctAnswer || '').trim().toLowerCase();
      const qType = String(q.questionType || '').toLowerCase();
      const isScale1to5 = qType.includes('skala') || qType.includes('1-5') || cleanCorrect.includes('skor');

      const hasCustomPoints = Array.isArray(q.optionPoints) && q.optionPoints.length > 0;

      // Max points: if custom optionPoints provided, max is highest point in array, else standard calculation
      let maxPts = 10;
      if (hasCustomPoints) {
        maxPts = Math.max(...q.optionPoints!, q.points || 0);
      } else if (isScale1to5) {
        maxPts = q.points && q.points <= 5 ? q.points : 5;
      } else {
        maxPts = q.points || 10;
      }
      totalPoints += maxPts;

      const isCheckbox =
        qType.includes('checkbox') ||
        qType.includes('multi-select') ||
        qType.includes('kompleks') ||
        q.id === 'Q31a' ||
        q.id === 'Q31b' ||
        q.id === 'Q52a' ||
        q.id === 'Q52b';

      let isCorrect = false;

      if (isCheckbox) {
        // Soal Checkbox / Multi-Pilihan
        let selectedList: string[] = [];
        if (Array.isArray(selected)) {
          selectedList = selected;
        } else if (typeof selected === 'string' && selected.trim() !== '') {
          try {
            const parsed = JSON.parse(selected);
            if (Array.isArray(parsed)) selectedList = parsed;
            else selectedList = selected.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
          } catch {
            selectedList = selected.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
          }
        }

        const checkedCount = selectedList.length;

        // Cek apakah kuesioner bergaya survei (semua pilihan bernilai poin, misal Q52a & Q52b Media Habit)
        const isSurveyStyle =
          cleanCorrect.includes('semua pilihan benar') ||
          cleanCorrect.includes('poin per pilihan') ||
          cleanCorrect.includes('semua benar') ||
          q.id === 'Q52a' ||
          q.id === 'Q52b';

        if (isSurveyStyle) {
          // Setiap pilihan bernilai 2 poin (atau sesuai optionPoints, default 2 poin, maksimal maxPts)
          const ptsPerChoice = hasCustomPoints ? q.optionPoints![0] : 2;
          const ptsEarned = Math.min(maxPts, checkedCount * ptsPerChoice);
          earnedPoints += ptsEarned;
          // Dianggap tuntas jika siswa memilih minimal 1 opsi
          isCorrect = checkedCount > 0;
        } else {
          // Soal memiliki target kunci jawaban benar spesifik (misal Q31a, Q31b)
          let targetCorrectList: string[] = [];
          if (Array.isArray(q.correctAnswer)) {
            targetCorrectList = q.correctAnswer.map((s) => String(s).trim().toLowerCase());
          } else {
            targetCorrectList = String(q.correctAnswer || '')
              .split(/[,;\n]/)
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean);
          }

          const matchCorrect = (chosen: string) => {
            const cleanChosen = chosen.trim().toLowerCase();
            return targetCorrectList.some((target) => {
              if (target === cleanChosen) return true;
              const chosenWithoutPrefix = cleanChosen.replace(/^[a-z0-9]\.\s*/i, '').trim();
              const targetWithoutPrefix = target.replace(/^[a-z0-9]\.\s*/i, '').trim();
              return (
                (chosenWithoutPrefix && targetWithoutPrefix && chosenWithoutPrefix === targetWithoutPrefix) ||
                cleanChosen.includes(target) ||
                target.includes(cleanChosen)
              );
            });
          };

          const correctSelectedCount = selectedList.filter((opt) => matchCorrect(opt)).length;
          const wrongSelectedCount = selectedList.length - correctSelectedCount;
          const totalCorrectRequired = Math.max(1, targetCorrectList.length);

          let ptsEarned = 0;
          if (correctSelectedCount > 0) {
            const pointsPerCorrect = maxPts / totalCorrectRequired;
            const rawPoints = correctSelectedCount * pointsPerCorrect;
            // Penalti minor jika memilih opsi salah agar tidak mencentang semua opsi secara sembarangan
            const penaltyPerWrong = pointsPerCorrect * 0.5;
            ptsEarned = Math.max(0, Math.round(rawPoints - wrongSelectedCount * penaltyPerWrong));
          }

          earnedPoints += ptsEarned;
          // Dianggap benar jika memperoleh setidaknya 50% skor dari soal tersebut
          isCorrect = ptsEarned >= Math.ceil(maxPts * 0.5);
        }
      } else if (hasCustomPoints) {
        // [OPSI 2]: Evaluasi perolehan skor langsung berdasarkan bobot poin per opsi yang dipilih
        let awardedPoints = 0;

        if (isScale1to5) {
          let numVal = 0;
          if (typeof selected === 'number') {
            numVal = selected;
          } else if (selected !== undefined && selected !== null) {
            const parsed = parseInt(String(selected).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
              numVal = parsed;
            }
          }
          if (numVal >= 1 && numVal <= 5) {
            const optIdx = numVal - 1;
            awardedPoints = q.optionPoints![optIdx] !== undefined ? q.optionPoints![optIdx] : 0;
          }
        } else {
          // Multiple choice, Ya/Tidak, Benar/Salah, dsb.
          const rawOpts = Array.isArray(q.options)
            ? q.options
            : String(q.options || '').split(/[,;\n]/).filter(Boolean);

          let selectedIndex = -1;
          if (typeof selected === 'number' && selected >= 0 && selected < rawOpts.length) {
            selectedIndex = selected;
          } else if (selected !== undefined && selected !== null) {
            const cleanSelected = String(selected).trim().toLowerCase();
            selectedIndex = rawOpts.findIndex((opt, idx) => {
              const cleanOpt = String(opt).trim().toLowerCase();
              const letter = String.fromCharCode(97 + idx); // 'a', 'b', ...
              if (cleanSelected === cleanOpt) return true;
              if (cleanSelected === letter || cleanSelected === `${letter}.`) return true;
              if (cleanSelected.startsWith(`${letter}.`) || cleanSelected.startsWith(`${letter}:`)) return true;
              const textWithoutPrefix = cleanOpt.replace(new RegExp(`^(\\[?${letter}\\]?|[a-z0-9])\\.\\s*`, 'i'), '').trim();
              if (textWithoutPrefix && cleanSelected === textWithoutPrefix) return true;
              return cleanOpt.includes(cleanSelected) || cleanSelected.includes(cleanOpt);
            });
          }

          if (selectedIndex >= 0 && q.optionPoints![selectedIndex] !== undefined) {
            awardedPoints = q.optionPoints![selectedIndex];
          }
        }

        earnedPoints += awardedPoints;
        // Dianggap benar jika mendapat skor tertinggi atau setidaknya 60%
        isCorrect = maxPts > 0 && (awardedPoints === maxPts || (maxPts > 2 && awardedPoints >= Math.ceil(maxPts * 0.6)));
      } else if (isScale1to5) {
        // Skala Sikap / Karakter (1 sampai 5)
        // Nilai mengikuti angka yang dipilih: 1=1 poin, 2=2 poin, 3=3 poin, 4=4 poin, 5=5 poin
        let numVal = 0;
        if (typeof selected === 'number') {
          numVal = selected;
        } else if (selected !== undefined && selected !== null) {
          const parsed = parseInt(String(selected).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
            numVal = parsed;
          }
        }

        if (numVal > 0) {
          if (cleanCorrect.includes('dibalik') || cleanCorrect.includes('5-1') || cleanCorrect.includes('reverse')) {
            // Skala negatif / reverse
            const reversed = 6 - numVal;
            earnedPoints += reversed;
            isCorrect = reversed >= 3;
          } else {
            // Skala standar: perolehan poin persis sama dengan angka yang dipilih (1 s.d. 5)
            earnedPoints += numVal;
            isCorrect = numVal >= 3;
          }
        }
      } else if (Array.isArray(q.matrixItems) && q.matrixItems.length > 0) {
        // Soal Pengelompokan Gambar (Visual Matrix Grid / Q38)
        const items = q.matrixItems;
        const totalItems = items.length;
        let correctItemCount = 0;

        if (typeof selected === 'object' && selected !== null) {
          items.forEach((item) => {
            const userChoice = String(selected[item.id] || selected[item.label] || '').trim().toLowerCase();
            const correctCat = String(item.correctCategory || '').trim().toLowerCase();
            if (userChoice && userChoice === correctCat) {
              correctItemCount++;
            }
          });
        }

        const ptsEarned = totalItems > 0 ? Math.round((correctItemCount / totalItems) * maxPts) : 0;
        earnedPoints += ptsEarned;
        isCorrect = totalItems > 0 && correctItemCount >= Math.ceil(totalItems * 0.6);
      } else if (qType.includes('matriks') || qType.includes('tabel')) {
        // Soal Matriks / Tabel Checklist (seperti 5T Merawat Rupiah)
        const parsedMatrix = parseMatrixQuestionOptions(q.options, q.question);
        const stmts = parsedMatrix.statements;
        const totalRows = stmts.length;
        let matchedRows = 0;

        if (typeof selected === 'object' && selected !== null) {
          stmts.forEach((st) => {
            const userChoice = String(selected[st.text] || '').trim().toLowerCase();
            // Default kuesioner sikap positif (seperti cara merawat): "Ya" / "1" bernilai poin
            if (cleanCorrect.includes('tidak') || cleanCorrect.includes('2')) {
              if (userChoice === 'tidak' || userChoice === '2' || userChoice.startsWith('tidak')) {
                matchedRows++;
              }
            } else {
              // Default kuncinya adalah "Ya" / "1"
              if (userChoice === 'ya' || userChoice === '1' || userChoice.startsWith('ya')) {
                matchedRows++;
              }
            }
          });
        }

        const ptsEarned = totalRows > 0 ? Math.round((matchedRows / totalRows) * maxPts) : 0;
        earnedPoints += ptsEarned;
        // Benar jika setidaknya 60% baris terpenuhi
        isCorrect = totalRows > 0 && matchedRows >= Math.ceil(totalRows * 0.6);
      } else if (cleanCorrect.includes('dibalik')) {
        // Reversed general
        earnedPoints += maxPts;
        isCorrect = true;
      } else if (selected !== undefined && selected !== null) {
        const cleanSelected = String(selected).trim().toLowerCase();

        // Exact match or prefix match (e.g. "A" matches "A. Rp 1.000")
        if (cleanSelected === cleanCorrect) {
          isCorrect = true;
        } else if (
          (cleanCorrect.startsWith('a') && cleanSelected.startsWith('a')) ||
          (cleanCorrect.startsWith('b') && cleanSelected.startsWith('b')) ||
          (cleanCorrect.startsWith('c') && cleanSelected.startsWith('c')) ||
          (cleanCorrect.startsWith('d') && cleanSelected.startsWith('d')) ||
          (cleanCorrect.startsWith('e') && cleanSelected.startsWith('e')) ||
          (cleanCorrect.startsWith('f') && cleanSelected.startsWith('f'))
        ) {
          isCorrect = true;
        } else if (cleanCorrect.includes(cleanSelected) || cleanSelected.includes(cleanCorrect)) {
          isCorrect = true;
        }

        if (isCorrect) {
          earnedPoints += maxPts;
        }
      }

      if (isCorrect) {
        correctCount++;
      }

      details.push({
        questionId: q.id,
        selectedAnswer: selected,
        isCorrect,
      });
    });

    const stagePassingGrade = activeStage
      ? db.getFinalMissionPassingGrade(activeStage)
      : (stageAccess.passingGrade || 80);
    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = finalScore >= stagePassingGrade;

    return { finalScore, totalPoints, earnedPoints, correctCount, passed, stagePassingGrade, details };
  };

  const handleSubmitQuiz = () => {
    setIsSubmitting(true);
    sounds.playPop();

    const { finalScore, correctCount, passed, details } = calculateQuizScore();
    const stageName =
      activeStage === 'pemula'
        ? STAGES.PEMULA
        : activeStage === 'terampil'
        ? STAGES.TERAMPIL
        : STAGES.MASTER;

    const attempt: FinalMissionAttempt = {
      id: `FMA_${Date.now()}`,
      userId: currentUser?.id || 'USR-TESTER',
      classification,
      stage: activeStage!,
      stageTitle: stageName,
      score: finalScore,
      totalQuestions: stageQuestions.length,
      correctCount,
      passed,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsedTime || Math.max(1, Math.floor((Date.now() - quizStartTime) / 1000)),
      details,
    };

    db.recordFinalMissionAttempt(attempt);
    setLastAttempt(attempt);

    if (passed) {
      sounds.playFanfare();
    }

    setIsSubmitting(false);
    setShowResultModal(true);
  };

  const currentQ = stageQuestions[currentQIndex];
  const questionImage = currentQ ? db.getFinalMissionQuestionImage(currentQ) : '';

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-100 font-sans flex flex-col">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl overflow-hidden">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Gambar Perbesaran Soal"
              className="w-full h-full object-contain rounded-2xl max-h-[80vh]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Kembali ke Peta Petualangan"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                <Crown className="w-5 h-5 fill-amber-950 text-amber-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                    <span>Misi Akhir:</span>
                    <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                      Sang Penjelajah Rupiah
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  Puncak Pembuktian Literasi Cinta, Bangga, & Paham Rupiah
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {progress.grandTitleAwarded && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Lihat E-Sertifikat</span>
                <span className="sm:hidden">Sertifikat</span>
              </button>
            )}

            {onOpenMissions && (
              <button
                onClick={onOpenMissions}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
              >
                Peta Misi 1-9
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {!activeStage ? (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8 animate-in fade-in duration-300">
          {/* Hero Grand Finale Card */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/70 via-slate-900 to-purple-950/80 border border-indigo-500/30 p-5 sm:p-7 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Evaluasi Akhir Bank Indonesia
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Uji Kompetensi{' '}
                  <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                    Sang Penjelajah Rupiah
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Selesaikan 3 tingkatan evaluasi untuk meraih gelar tertinggi dan mengunduh E-Sertifikat resmi.
                </p>
              </div>

              {/* Status Badge Widget */}
              <div className="w-full md:w-auto shrink-0 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center gap-1.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gelar Saat Ini</div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-yellow-300">
                      {progress.grandTitleAwarded
                        ? '👑 Sang Penjelajah Rupiah'
                        : progress.stage2Completed
                        ? '🥈 Penjelajah Terampil'
                        : progress.stage1Completed
                        ? '🥉 Penjelajah Pemula'
                        : 'Calon Penjelajah'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {progress.grandTitleAwarded ? 'Semua 3 Tahap Tuntas' : 'Selesaikan tahap di bawah'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Event Status / Locked Notice Banner */}
          {eventStatus.isEventMode && eventStatus.isWithinSchedule && isFinalMissionUnlocked && (
            <section className="bg-gradient-to-r from-emerald-950/80 via-teal-900/60 to-slate-900 border-2 border-emerald-400/60 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">
                      {eventStatus.eventSchedule?.title || 'Sesi Main Bareng Misi Akhir'}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 shadow-sm">
                      Sedang Berlangsung 🟢
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 mt-1">
                    Admin Sekolah telah membuka sesi pengerjaan bersama. Buktikan hasil belajarmu sekarang dan raih posisi juara di papan peringkat!
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Akses Khusus Bypass Sekolah Banner */}
          {!eventStatus.isEventMode && isFinalMissionUnlocked && eventStatus.isBypassed && !eventStatus.hasCompleted9Missions && (
            <section className="bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-900 border-2 border-blue-400/60 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">
                      Akses Khusus Sekolah Aktif
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-400 text-slate-950 shadow-sm">
                      Izin Langsung Admin Sekolah 🚀
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/90 mt-1">
                    Admin Sekolah telah memberikan akses langsung ke Misi Akhir. Kamu dapat langsung memulai pengerjaan Tahap 1 tanpa harus menuntaskan 9 misi petualangan terlebih dahulu.
                  </p>
                </div>
              </div>
            </section>
          )}

          {!isFinalMissionUnlocked && (
            <section className="bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-yellow-500/20 border-2 border-amber-400/60 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">
                      {!eventStatus.hasCompleted9Missions
                        ? 'Misi Akhir Masih Terkunci'
                        : 'Menunggu Jadwal Main Bareng Sekolah'}
                    </h3>
                    {!eventStatus.hasCompleted9Missions ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        {completedMissionsCount}/9 Misi Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-400 text-slate-950">
                        Syarat 9 Misi Tuntas ✅
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-200/90 mt-1">
                    {!eventStatus.hasCompleted9Missions
                      ? 'Untuk membuka Misi Akhir dan meraih E-Sertifikat resmi Bank Indonesia, selesaikan seluruh 9 misi petualangan di Dunia Cinta, Bangga, dan Paham Rupiah terlebih dahulu.'
                      : eventStatus.message ||
                        'Admin Sekolah telah mengatur jadwal pengerjaan bersama Misi Akhir. Sesi akan terbuka secara otomatis sesuai jadwal yang telah ditentukan.'}
                  </p>
                </div>
              </div>

              {!eventStatus.hasCompleted9Missions && onOpenMissions && (
                <button
                  type="button"
                  onClick={onOpenMissions}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Buka Peta 9 Misi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </section>
          )}

          {/* Classification Selection Tabs (Anak-Anak, Remaja, Dewasa) */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Klasifikasi Kategori Umur Peserta</span>
                </h3>
                {currentUser?.ageCategory && (
                  <p className="text-xs text-amber-300 font-semibold mt-0.5">
                    Kategori profil Anda:{' '}
                    <span className="text-white font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400/40">
                      {currentUser.ageCategory === 'dewasa'
                        ? 'Dewasa (31-55 th)'
                        : currentUser.ageCategory === 'remaja'
                        ? 'Remaja (18-30 th)'
                        : 'Anak-anak (10-17 th)'}
                    </span>{' '}
                    (Soal Misi Akhir disesuaikan secara otomatis)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Anak-Anak */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setClassification('anak');
                }}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  classification === 'anak'
                    ? 'bg-gradient-to-br from-blue-600/30 to-indigo-900/60 border-blue-400 ring-2 ring-blue-400/30 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 mb-2.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {classification === 'anak' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Aktif
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-white">Anak - Anak</h4>
                <p className="text-xs text-blue-300/90 font-semibold mt-0.5">Usia 10 - 17 Tahun (SD s.d SMA)</p>
              </button>

              {/* Option 2: Remaja */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setClassification('remaja');
                }}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  classification === 'remaja'
                    ? 'bg-gradient-to-br from-purple-600/30 to-indigo-900/60 border-purple-400 ring-2 ring-purple-400/30 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 mb-2.5">
                    <Flame className="w-5 h-5" />
                  </div>
                  {classification === 'remaja' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Aktif
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-white">Remaja</h4>
                <p className="text-xs text-purple-300/90 font-semibold mt-0.5">Usia 18 - 30 Tahun (Mahasiswa & Pemuda)</p>
              </button>

              {/* Option 3: Dewasa */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setClassification('dewasa');
                }}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  classification === 'dewasa'
                    ? 'bg-gradient-to-br from-emerald-600/30 to-indigo-900/60 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-2.5">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  {classification === 'dewasa' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Aktif
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-white">Dewasa</h4>
                <p className="text-xs text-emerald-300/90 font-semibold mt-0.5">Usia 31 - 55 Tahun (Profesional & Umum)</p>
              </button>
            </div>
          </section>

          {/* Admin Stage Access Control Banner (for testing) */}
          {(isAdminOrTeacher ||
            stageAccess.unlockAll ||
            stageAccess.unlockedStages.terampil ||
            stageAccess.unlockedStages.master) && (
            <section className="bg-gradient-to-r from-slate-900/95 via-indigo-950/80 to-slate-900/95 rounded-2xl border-2 border-amber-400/40 p-4 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        Kontrol Gembok Tahapan (Akses Uji Coba Admin/Guru)
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        Admin Tool
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Buka semua atau tahapan tertentu untuk menguji langsung soal Misi Akhir tanpa harus lulus tahap sebelumnya.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetMyProgress}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600 transition-colors cursor-pointer"
                    title="Reset skor & status kelulusan akun penguji saat ini"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Nilai Saya</span>
                  </button>

                  {currentUser?.role === 'admin' && onOpenAdmin && (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      title="Kembali ke menu pengelolaan bank soal admin"
                    >
                      <span>Bank Soal Admin</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                {/* Unlock All Toggle */}
                <button
                  type="button"
                  onClick={handleToggleUnlockAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                    stageAccess.unlockAll
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {stageAccess.unlockAll ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Buka Semua Tahap (1, 2, & 3)</span>
                </button>

                {/* Stage 2 Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleStage('terampil')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    stageAccess.unlockAll || stageAccess.unlockedStages.terampil
                      ? 'bg-sky-950 text-sky-300 border-sky-500/60 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {stageAccess.unlockAll || stageAccess.unlockedStages.terampil ? (
                    <Unlock className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Tahap 2: Terampil</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      stageAccess.unlockAll || stageAccess.unlockedStages.terampil
                        ? 'bg-sky-500/30 text-sky-200'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {stageAccess.unlockAll || stageAccess.unlockedStages.terampil ? 'Terbuka' : 'Gembok Normal'}
                  </span>
                </button>

                {/* Stage 3 Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleStage('master')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    stageAccess.unlockAll || stageAccess.unlockedStages.master
                      ? 'bg-purple-950 text-purple-300 border-purple-500/60 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {stageAccess.unlockAll || stageAccess.unlockedStages.master ? (
                    <Unlock className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Tahap 3: Master</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      stageAccess.unlockAll || stageAccess.unlockedStages.master
                        ? 'bg-purple-500/30 text-purple-200'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {stageAccess.unlockAll || stageAccess.unlockedStages.master ? 'Terbuka' : 'Gembok Normal'}
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* 3 Sequential Stages Path */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>3 Tahapan Misi Akhir</span>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {stagesConfig.map((item, index) => {
                const IconComponent = item.icon;
                const questionCount = db.getFinalMissionQuestions(classification, item.stageName).length;

                return (
                  <div
                    key={item.stage}
                    className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all overflow-hidden ${
                      item.isLocked
                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-70'
                        : item.isCompleted
                        ? 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                        : item.isBypassed
                        ? 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-sky-400/60 shadow-lg shadow-sky-500/10'
                        : `bg-gradient-to-b from-slate-800/90 to-slate-900/90 ${item.borderColor}`
                    }`}
                  >
                    {/* Background Glow */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.bgGradient} rounded-full blur-2xl pointer-events-none`} />

                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-black shadow-md ${
                              item.isCompleted
                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                                : item.isLocked
                                ? 'bg-slate-800 border-slate-700 text-slate-500'
                                : item.isBypassed
                                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                                : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                            }`}
                          >
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                              {item.title}
                            </span>
                            <h4 className="text-lg font-black text-white tracking-tight leading-snug">
                              {item.stageName}
                            </h4>
                          </div>
                        </div>

                        {item.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-xs font-black">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lulus ({item.score}%)
                          </span>
                        ) : item.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            Terkunci
                          </span>
                        ) : item.isBypassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-black">
                            <Unlock className="w-3.5 h-3.5 text-sky-400" />
                            Akses Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                            Siap Diuji
                          </span>
                        )}
                      </div>

                      {/* Tagline / Description */}
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">{item.tagline}</p>

                      {/* Question Count & Passing Grade Meta */}
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80 mb-6 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                            {questionCount} Soal
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            ~{Math.max(5, Math.ceil(questionCount * 0.8))} Mnt
                          </span>
                        </div>
                        <span className="flex items-center gap-1 font-bold text-amber-300 text-[11px] bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                          <Award className="w-3 h-3 text-amber-400" />
                          Batas Lulus: {item.passingGrade}%
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {item.isLocked ? (
                        <button
                          type="button"
                          onClick={() => handleStartStage(item.stage)}
                          className="w-full py-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span>
                            {!isFinalMissionUnlocked
                              ? `Terkunci: Butuh 9 Misi (${completedMissionsCount}/9)`
                              : index === 0
                              ? 'Terkunci'
                              : 'Tuntaskan Tahap Sebelumnya'}
                          </span>
                        </button>
                      ) : item.isCompleted ? (
                        <button
                          onClick={() => handleStartStage(item.stage)}
                          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Uji Ulang / Perbaiki Skor</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartStage(item.stage)}
                          className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                            item.isBypassed
                              ? 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white shadow-sky-500/20'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Mulai Tantangan {item.stageName}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      ) : (
        /* ================= ACTIVE QUIZ ASSESSMENT RUNNER ================= */
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-4 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm('Apakah kamu yakin ingin keluar dari pengujian? Jawaban belum disimpan.')) {
                    setActiveStage(null);
                  }
                }}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                title="Keluar"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {CLASSIFICATION_LABELS[classification]}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {activeStage === 'pemula'
                    ? STAGES.PEMULA
                    : activeStage === 'terampil'
                    ? STAGES.TERAMPIL
                    : STAGES.MASTER}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatSeconds(elapsedTime)}</span>
              </div>
              <div className="text-xs text-slate-300 font-bold hidden sm:block">
                Soal <span className="text-yellow-300 font-black">{currentQIndex + 1}</span> dari{' '}
                {stageQuestions.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              style={{
                width: `${((currentQIndex + 1) / stageQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Card */}
          {currentQ && (
            <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Question Dimension Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wide">
                  {currentQ.dimension || 'Cinta Rupiah'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Tipe: <span className="text-slate-200 font-bold">{currentQ.questionType}</span> • Bobot:{' '}
                  <span className="text-amber-300 font-bold">{currentQ.points || 10} Poin</span>
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQ.question}
              </h2>

              {/* Question Image (safely rendered; collapses cleanly with 0 space if absent or failed) */}
              {(!currentQ.matrixItems || currentQ.matrixItems.length === 0) && Boolean(questionImage) && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/80 p-2 flex flex-col items-center justify-center group">
                  <SafeImage
                    src={questionImage}
                    alt={currentQ.imageFileName || 'Gambar Soal'}
                    lookupKeys={[
                      `fm_q_${currentQ.id}`,
                      `fm_q_${currentQ.id?.toLowerCase()}`,
                      currentQ.id,
                      currentQ.imageFileName || '',
                      currentQ.imageFileName ? currentQ.imageFileName.toLowerCase() : '',
                    ]}
                    hideOnError={true}
                    className="max-h-72 w-auto object-contain rounded-xl transition-transform group-hover:scale-[1.01]"
                  />
                  <button
                    onClick={() => setLightboxImage(questionImage)}
                    className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-600 text-xs font-bold text-slate-200 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Perbesar Gambar</span>
                  </button>
                </div>
              )}

              {/* Interactive Options Rendering based on Question Type */}
              <div className="pt-2">
                {/* 0. Visual Matrix Grid (Pengelompokan Gambar - Soal 38) */}
                {(Array.isArray(currentQ.matrixItems) && currentQ.matrixItems.length > 0) ||
                String(currentQ.questionType).toLowerCase().includes('pengelompokan') ? (
                  <VisualMatrixQuestionView
                    question={currentQ}
                    userAnswer={userAnswers[currentQ.id]}
                    onChange={(newAns) => handleSelectAnswer(currentQ.id, newAns)}
                    onPreviewImage={(img) => setLightboxImage(img)}
                  />
                ) : /* 1. Scale 1-5 (Likert Scale with Emotion Icons) */
                String(currentQ.questionType).toLowerCase().includes('skala') ? (() => {
                  const variant = detectLikertVariant(currentQ.question, currentQ.options);
                  const currentScaleItems = getLikertScaleItems(variant);

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                        <span>Pilih ekspresi / sikap yang paling menggambarkan Adik:</span>
                        <span className="text-[11px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                          ⭐ Penilaian Sikap
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2 sm:gap-3.5">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isSelected = userAnswers[currentQ.id] === num || userAnswers[currentQ.id] === String(num);
                          const itemConfig = currentScaleItems[num] || currentScaleItems[3];
                          
                          // Default label: jika varian kesal -> Sangat Tidak Kesal s.d. Sangat Kesal
                          // jika varian senang -> Sangat tidak Senang s.d. Sangat Senang
                          let labelText = itemConfig.defaultLabel;

                          if (Array.isArray(currentQ.options) && currentQ.options.length === 5) {
                            const rawOpt = currentQ.options[num - 1] || '';
                            const clean = rawOpt.replace(/^[0-9]\.\s*/, '').trim();
                            if (clean) labelText = clean;
                          }

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleSelectAnswer(currentQ.id, num)}
                              className={`py-3.5 sm:py-4 px-1.5 sm:px-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[135px] cursor-pointer group ${
                                isSelected
                                  ? `${itemConfig.bgCardActive} ${itemConfig.borderActive} scale-[1.04]`
                                  : 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/90 hover:border-slate-500 text-slate-200'
                              }`}
                            >
                              {/* Emoticon Icon with proper variant */}
                              <div className="flex items-center justify-center">
                                <LikertEmoticon
                                  level={num}
                                  variant={variant}
                                  size={48}
                                  className={`transition-transform duration-200 ${
                                    isSelected ? 'scale-110 drop-shadow-md' : 'group-hover:scale-105 opacity-90'
                                  }`}
                                />
                              </div>

                              {/* Label Teks Emosi / Sikap */}
                              <div className="flex flex-col items-center justify-center text-center px-0.5">
                                <span
                                  className={`text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 ${
                                    isSelected ? itemConfig.textActive : 'text-slate-300'
                                  }`}
                                >
                                  {labelText}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })() : /* 2. Matriks / Tabel Checklist (seperti 5T Merawat Rupiah) */
                String(currentQ.questionType).toLowerCase().includes('matriks') ||
                String(currentQ.questionType).toLowerCase().includes('tabel') ? (
                  <MatrixQuestionView
                    options={currentQ.options}
                    questionTitle={currentQ.question}
                    userAnswer={userAnswers[currentQ.id]}
                    onChange={(newAns) => handleSelectAnswer(currentQ.id, newAns)}
                  />
                ) : /* 3. Hotspot Pilihan 1-7 */
                String(currentQ.questionType).toLowerCase().includes('1-7') ? (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 font-medium">Pilih nomor letak pada gambar:</div>
                    <div className="grid grid-cols-7 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7'].map((num) => {
                        const isSelected = String(userAnswers[currentQ.id]) === num;
                        return (
                          <button
                            key={num}
                            onClick={() => handleSelectAnswer(currentQ.id, num)}
                            className={`py-4 rounded-2xl border text-center transition-all flex items-center justify-center font-black text-lg cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                                : 'bg-slate-900 border-slate-700 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : /* 3. Yes/No, True/False, Tunai/Non-Tunai, Tahu/Tidak */
                ['ya/tidak', 'tahu/tidak', 'benar/salah', 'tunai/non-tunai'].some((t) =>
                    String(currentQ.questionType).toLowerCase().includes(t)
                  ) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Array.isArray(currentQ.options) ? currentQ.options : ['A. Ya', 'B. Tidak']).map((opt, idx) => {
                      const isSelected = userAnswers[currentQ.id] === opt;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(currentQ.id, opt)}
                          className={`p-4 sm:p-5 rounded-2xl border text-left font-bold text-sm sm:text-base flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-400/20 border-amber-400 text-yellow-200 ring-2 ring-amber-400/30'
                              : 'bg-slate-900/80 border-slate-700 hover:bg-slate-700/80 text-slate-200'
                          }`}
                        >
                          <span>{opt}</span>
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : /* 4. Checkbox / Multi-Select (Pilihan Ganda Kompleks - e.g. Q31a, Q31b, Q52a, Q52b) */
                String(currentQ.questionType).toLowerCase().includes('checkbox') ||
                String(currentQ.questionType).toLowerCase().includes('multi-select') ||
                String(currentQ.questionType).toLowerCase().includes('kompleks') ||
                currentQ.id === 'Q31a' ||
                currentQ.id === 'Q31b' ||
                currentQ.id === 'Q52a' ||
                currentQ.id === 'Q52b' ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 p-2.5 rounded-xl">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Pilihan Ganda Kompleks: Boleh memilih lebih dari satu jawaban</span>
                      </span>
                      <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-sm">
                        {currentQ.id === 'Q52a' || currentQ.id === 'Q52b'
                          ? '+2 Poin per Pilihan (Maks 10 Poin)'
                          : 'Centang 1 atau Lebih Jawaban'}
                      </span>
                    </div>

                    {(Array.isArray(currentQ.options)
                      ? currentQ.options
                      : String(currentQ.options || '').split(',')
                    ).map((opt, idx) => {
                      const cleanOpt = String(opt).trim();
                      if (!cleanOpt) return null;
                      const currentSelectedList: string[] = Array.isArray(userAnswers[currentQ.id])
                        ? userAnswers[currentQ.id]
                        : typeof userAnswers[currentQ.id] === 'string' && userAnswers[currentQ.id]
                        ? [userAnswers[currentQ.id]]
                        : [];
                      const isChecked = currentSelectedList.includes(cleanOpt);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleCheckboxAnswer(currentQ.id, cleanOpt)}
                          className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left font-medium text-sm sm:text-base flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-gradient-to-r from-amber-500/25 to-yellow-400/20 border-amber-400 text-yellow-200 ring-2 ring-amber-400/30 shadow-md scale-[1.01]'
                              : 'bg-slate-900/80 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-slate-200'
                          }`}
                        >
                          <span className="leading-relaxed">{cleanOpt}</span>
                          <div
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'border-amber-400 bg-amber-400 text-slate-950 font-black shadow-sm'
                                : 'border-slate-600 bg-slate-800/80 text-transparent'
                            }`}
                          >
                            {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* 5. Standard Multiple Choice (Pilihan Ganda) */
                  <div className="space-y-3">
                    {(Array.isArray(currentQ.options)
                      ? currentQ.options
                      : String(currentQ.options || '').split(',')
                    ).map((opt, idx) => {
                      const cleanOpt = String(opt).trim();
                      if (!cleanOpt) return null;
                      const isSelected = userAnswers[currentQ.id] === cleanOpt;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(currentQ.id, cleanOpt)}
                          className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left font-medium text-sm sm:text-base flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-400/20 border-amber-400 text-yellow-200 ring-2 ring-amber-400/30 shadow-md'
                              : 'bg-slate-900/80 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-slate-200'
                          }`}
                        >
                          <span className="leading-relaxed">{cleanOpt}</span>
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-700/80">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => {
                    sounds.playPop();
                    setCurrentQIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors ${
                    currentQIndex === 0
                      ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentQIndex < stageQuestions.length - 1 ? (
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setCurrentQIndex((prev) => prev + 1);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim & Selesaikan Ujian</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ================= RESULTS MODAL ================= */}
      {showResultModal && lastAttempt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="flex justify-center">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-xl ${
                  lastAttempt.passed
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-300 border-yellow-200 text-slate-950 shadow-amber-500/30'
                    : 'bg-rose-500/20 border-rose-400 text-rose-400'
                }`}
              >
                {lastAttempt.passed ? (
                  <Trophy className="w-10 h-10 stroke-[2.5]" />
                ) : (
                  <RotateCcw className="w-10 h-10 stroke-[2.5]" />
                )}
              </div>
            </div>

            {(() => {
              const attemptPassingGrade = db.getFinalMissionPassingGrade(lastAttempt.stage);

              return (
                <>
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hasil Pengujian {lastAttempt.stageTitle}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      {lastAttempt.passed ? '🎉 Selamat, Kamu Lulus!' : 'Belum Memenuhi Syarat Kelulusan'}
                    </h2>
                    <p className="text-xs text-slate-300">
                      {lastAttempt.passed
                        ? `Kamu berhasil menuntaskan ${lastAttempt.stageTitle} dengan skor ${lastAttempt.score}%, melampaui batas minimal kelulusan (${attemptPassingGrade}%).`
                        : `Skor kamu ${lastAttempt.score}%. Batas minimal kelulusan untuk tahap ini adalah ${attemptPassingGrade}%. Jangan berkecil hati, pelajari materi dan coba lagi!`}
                    </p>
                  </div>

                  {/* Score Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-2xl border border-slate-800 p-4">
                    <div className="text-center border-r border-slate-800">
                      <div className="text-xs text-slate-400 font-bold">Skor Akhir</div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">{lastAttempt.score}%</div>
                    </div>
                    <div className="text-center border-r border-slate-800">
                      <div className="text-xs text-slate-400 font-bold">Batas Lulus</div>
                      <div className="text-2xl sm:text-3xl font-black text-indigo-300 mt-0.5">{attemptPassingGrade}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 font-bold">Soal Sesuai</div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                        {lastAttempt.correctCount} / {lastAttempt.totalQuestions}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Next Step / Actions */}
            <div className="space-y-3 pt-2">
              {lastAttempt.passed && lastAttempt.stage === 'master' ? (
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setActiveStage(null);
                    setShowCertificateModal(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Crown className="w-5 h-5 fill-slate-950" />
                  <span>Klaim E-Sertifikat Sang Penjelajah Rupiah</span>
                </button>
              ) : lastAttempt.passed ? (
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setActiveStage(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>Lanjutkan ke Tahap Berikutnya</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    handleStartStage(lastAttempt.stage);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Coba Lagi Ujian Ini</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowResultModal(false);
                  setActiveStage(null);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Kembali ke Beranda Misi Akhir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= E-CERTIFICATE MODAL ================= */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Certificate Frame */}
            <div
              id="printable-certificate"
              className="relative rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border-8 border-double border-amber-700 p-8 sm:p-12 text-slate-900 shadow-2xl text-center space-y-6 overflow-hidden"
            >
              {/* Watermark Logo BI */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Crown className="w-96 h-96 text-amber-900" />
              </div>

              {/* Header Certificate */}
              <div className="space-y-1">
                <div className="text-[11px] font-black tracking-[0.25em] text-amber-800 uppercase">
                  BANK INDONESIA • PROGRAM EDUKASI CBP RUPIAH
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-950 tracking-tight">
                  SERTIFIKAT KELULUSAN
                </h2>
                <div className="w-24 h-0.5 bg-amber-600 mx-auto mt-2" />
              </div>

              {/* Certificate Body */}
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">Diberikan secara terhormat kepada:</p>
                <div className="text-2xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight underline decoration-amber-400 decoration-2 underline-offset-8">
                  {currentUser?.name || 'Siswa Berprestasi'}
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  {currentUser?.school || 'Satuan Pendidikan'} • Kelas {currentUser?.grade || 'V'}
                </p>
              </div>

              <div className="space-y-2 max-w-xl mx-auto">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Telah berhasil menyelesaikan seluruh 3 tahapan pengujian literasi keuangan dan dinobatkan dengan gelar
                  kehormatan tertinggi:
                </p>
                <div className="inline-block px-6 py-2 rounded-2xl bg-amber-500/20 border-2 border-amber-600 text-amber-950 font-black text-base sm:text-lg tracking-tight">
                  👑 SANG PENJELAJAH RUPIAH 👑
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Kategori: {CLASSIFICATION_LABELS[classification]}
                </p>
              </div>

              {/* Signatures & QR */}
              <div className="pt-6 border-t border-amber-300/80 flex items-center justify-between gap-4 text-left">
                <div>
                  <div className="text-[10px] text-slate-500">Tanggal Terbit:</div>
                  <div className="text-xs font-bold text-slate-800">
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">ID: JR-CERT-{Date.now().toString().slice(-8)}</div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-bold text-slate-900">{currentUser?.school ? `Kepala ${currentUser.school}` : 'Kepala Satuan Pendidikan'}</div>
                  <div className="text-[10px] text-slate-500">Pembina Edukasi CBP Rupiah</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Footer Credit */}
      <div className="mt-auto pt-16">
        <Footer variant="dark" />
      </div>
    </div>
  );
};
