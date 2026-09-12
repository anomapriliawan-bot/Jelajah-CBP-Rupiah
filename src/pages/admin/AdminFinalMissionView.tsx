import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Crown,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  X,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowDownAZ,
  Lock,
  Unlock,
  Play,
  Users,
  RotateCcw,
  Target,
  ShieldCheck,
  CheckSquare,
  Calendar,
  CloudLightning,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { db } from '../../services/db';
import { FinalMissionEventManagement } from '../../components/admin/FinalMissionEventManagement';
import {
  FinalMissionQuestion,
  FinalMissionMatrixItem,
  FinalMissionClassification,
  FinalMissionStage,
  FinalMissionStageAccessConfig,
} from '../../types';
import {
  STAGES,
  CLASSIFICATIONS,
  CLASSIFICATION_LABELS,
  seedFinalMissionQuestionsAnak,
  seedFinalMissionQuestionsRemaja,
  seedFinalMissionQuestionsDewasa,
  allSeedFinalMissionQuestions,
} from '../../services/finalMissionData';
import {
  SVG_UANG_KERTAS_100K,
  SVG_KARTU_DEBIT_GPN,
  SVG_EWALLET_SERVER,
  SVG_EMONEY_KARTU,
  SVG_UANG_LOGAM_RUPIAH,
} from '../../data/q38Assets';
import {
  parseFinalMissionExcelOrCsv,
  generateFinalMissionExcel,
} from '../../services/finalMissionExcel';
import { sounds } from '../../utils/audio';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
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
import { uploadDataUrlToServer } from '../../services/uploadService';

interface AdminFinalMissionViewProps {
  onNavigateToMissions?: () => void;
  onPlayAsStudent?: () => void;
}

export const AdminFinalMissionView: React.FC<AdminFinalMissionViewProps> = ({
  onNavigateToMissions,
  onPlayAsStudent,
}) => {
  const [selectedClassification, setSelectedClassification] =
    useState<FinalMissionClassification>('anak');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'questions' | 'event'>('questions');

  const [questions, setQuestions] = useState<FinalMissionQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<FinalMissionQuestion | null>(null);

  // Stage Access & Lock settings (Admin Testing Mode)
  const [stageAccess, setStageAccess] = useState<FinalMissionStageAccessConfig>(() =>
    db.getFinalMissionStageAccess()
  );

  useEffect(() => {
    setStageAccess(db.getFinalMissionStageAccess());
    const unsub = db.subscribe(() => {
      setStageAccess(db.getFinalMissionStageAccess());
    });
    return unsub;
  }, []);

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
    showToast(
      newUnlockAll
        ? 'Semua tahap Misi Akhir berhasil dibuka untuk pengujian!'
        : 'Gembok Misi Akhir dikembalikan ke pengaturan bertahap normal.',
      'success'
    );
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
    showToast(
      `Tahap ${stage === 'terampil' ? '2 (Terampil)' : '3 (Master)'} ${
        nextVal ? 'berhasil dibuka untuk pengujian!' : 'berhasil dikunci kembali.'
      }`,
      'success'
    );
  };

  const handleToggleScope = () => {
    sounds.playPop();
    const nextScope = !stageAccess.unlockForEveryone;
    const updated = db.saveFinalMissionStageAccess({
      unlockForEveryone: nextScope,
    });
    setStageAccess(updated);
    showToast(
      nextScope
        ? 'Akses pembukaan tahap diaktifkan untuk SEMUA siswa.'
        : 'Akses pembukaan tahap dikhususkan untuk akun Admin / Penguji.',
      'info'
    );
  };

  const handleResetStageAccess = () => {
    sounds.playPop();
    const reset = db.resetFinalMissionStageAccess();
    setStageAccess(reset);
    setPassingGradeInput(reset.passingGrade || 80);
    showToast('Pengaturan akses tahap direset ke kondisi gembok awal standar.', 'info');
  };

  const [passingGradeInput, setPassingGradeInput] = useState<number>(() => stageAccess.passingGrade || 80);

  useEffect(() => {
    setPassingGradeInput(stageAccess.passingGrade || 80);
  }, [stageAccess.passingGrade]);

  const handleUpdatePassingGrade = (newVal: number) => {
    sounds.playPop();
    const val = Math.max(1, Math.min(100, newVal));
    setPassingGradeInput(val);
    const updated = db.saveFinalMissionStageAccess({
      passingGrade: val,
      stagePassingGrades: {
        pemula: val,
        terampil: val,
        master: val,
      },
    });
    setStageAccess(updated);
    showToast(`Batas bawah nilai kelulusan (KKM) berhasil disetel ke ${val}%.`, 'success');
  };

  const handleOpenStudentMission = () => {
    sounds.playPop();
    if (onPlayAsStudent) {
      onPlayAsStudent();
    } else {
      window.location.hash = 'final-mission';
    }
  };

  // Modals
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);
  const [originalEditingId, setOriginalEditingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showBulkImageModal, setShowBulkImageModal] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Confirmations
  const [confirmDeleteAll, setConfirmDeleteAll] = useState<boolean>(false);
  const [confirmResetDefault, setConfirmResetDefault] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Upload Confirmations & Success Dialog State
  const [pendingExcelFile, setPendingExcelFile] = useState<File | null>(null);
  const [pendingSingleImage, setPendingSingleImage] = useState<{ file: File; questionId: string } | null>(null);
  const [pendingBulkImages, setPendingBulkImages] = useState<File[] | null>(null);
  const [uploadSuccessDialogMsg, setUploadSuccessDialogMsg] = useState<string | null>(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState<FinalMissionQuestion | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  // File Inputs
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const singleImageInputRef = useRef<HTMLInputElement>(null);
  const bulkImagesInputRef = useRef<HTMLInputElement>(null);
  const matrixItemImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetQuestionId, setUploadTargetQuestionId] = useState<string | null>(null);
  const [uploadTargetMatrixItemId, setUploadTargetMatrixItemId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [classificationCounts, setClassificationCounts] = useState<Record<FinalMissionClassification, number>>({
    anak: 0,
    remaja: 0,
    dewasa: 0,
  });

  const refreshData = () => {
    const data = db.getFinalMissionQuestions(selectedClassification);
    setQuestions(data);
    const all = db.getFinalMissionQuestions();
    setClassificationCounts({
      anak: all.filter((q) => q.classification === 'anak').length,
      remaja: all.filter((q) => q.classification === 'remaja').length,
      dewasa: all.filter((q) => q.classification === 'dewasa').length,
    });
  };

  const [isPersistingMaster, setIsPersistingMaster] = useState(false);

  const handlePersistFinalMissionMaster = async () => {
    sounds.playPop();
    setIsPersistingMaster(true);
    try {
      const res = await db.persistFinalMissionMaster('Super Admin');
      if (res.success) {
        sounds.playFanfare();
        showToast(
          `✅ Misi Akhir Berhasil Disimpan Permanen! (${res.questionsCount} soal). Tersimpan di Disk Server ${
            res.serverDiskSaved ? '✓' : ''
          } & Cloud Firestore ${res.cloudSynced ? '✓' : ''}. Tersedia di seluruh perangkat & akun!`
        );
      } else {
        showToast('Penyimpanan lokal berhasil, sinkronisasi cloud sedang berjalan di latar belakang.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan ke cloud', 'error');
    } finally {
      setIsPersistingMaster(false);
    }
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, [selectedClassification]);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    // Stage Filter
    if (selectedStageFilter !== 'all') {
      const qStage = String(q.stage || '').toLowerCase();
      const filter = selectedStageFilter.toLowerCase();
      if (filter === 'pemula' && !qStage.includes('pemula')) return false;
      if (filter === 'terampil' && !qStage.includes('terampil')) return false;
      if (filter === 'master' && !qStage.includes('master') && !qStage.includes('sang')) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = q.id.toLowerCase().includes(query);
      const matchQ = q.question.toLowerCase().includes(query);
      const matchDim = (q.dimension || '').toLowerCase().includes(query);
      const matchImg = (q.imageFileName || '').toLowerCase().includes(query);
      return matchId || matchQ || matchDim || matchImg;
    }

    return true;
  });

  // Sorting State (Default: Urutkan ID Soal secara natural Q1, Q2... Q52)
  const [sortField, setSortField] = useState<'id' | 'stage' | 'points'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper for stage order ranking (Pemula -> Terampil -> Master)
  const getStageRank = (st?: string) => {
    const s = String(st || '').toLowerCase();
    if (s.includes('pemula')) return 1;
    if (s.includes('terampil')) return 2;
    return 3;
  };

  // Natural tokenized question ID comparison helper (e.g. Q1_1 < Q2_1 < Q10_1 < Q37a)
  const compareNaturalQuestionIds = (idA: string = '', idB: string = '') => {
    const regex = /(\d+|\D+)/g;
    const partsA = (idA || '').match(regex) || [];
    const partsB = (idB || '').match(regex) || [];

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const pA = partsA[i] || '';
      const pB = partsB[i] || '';

      const isNumA = /^\d+$/.test(pA);
      const isNumB = /^\d+$/.test(pB);

      if (isNumA && isNumB) {
        const diff = parseInt(pA, 10) - parseInt(pB, 10);
        if (diff !== 0) return diff;
      } else {
        const cmp = pA.localeCompare(pB, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
      }
    }
    return 0;
  };

  // Filtered & Sorted Questions (Menjamin ID Soal berurutan secara natural Q1_1, Q2_1, Q10_1 dst.)
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'id') {
      cmp = compareNaturalQuestionIds(a.id, b.id);
    } else if (sortField === 'stage') {
      cmp = getStageRank(a.stage) - getStageRank(b.stage);
      if (cmp === 0) {
        cmp = compareNaturalQuestionIds(a.id, b.id);
      }
    } else if (sortField === 'points') {
      cmp = (a.points || 0) - (b.points || 0);
      if (cmp === 0) {
        cmp = compareNaturalQuestionIds(a.id, b.id);
      }
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  // Stage counts for badges
  const pemulaCount = questions.filter((q) => String(q.stage || '').toLowerCase().includes('pemula')).length;
  const terampilCount = questions.filter((q) => String(q.stage || '').toLowerCase().includes('terampil')).length;
  const masterCount = questions.filter((q) => {
    const s = String(q.stage || '').toLowerCase();
    return s.includes('master') || s.includes('sang');
  }).length;

  // Single Question Image Selection Handler
  const handleSingleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetQuestionId) return;

    if (!file.type.startsWith('image/')) {
      showToast('File yang diunggah harus berformat gambar (PNG, JPG, WebP, dll).', 'error');
      return;
    }

    setPendingSingleImage({ file, questionId: uploadTargetQuestionId });
    e.target.value = '';
  };

  // Execute Single Question Image Upload after confirmation
  const executeSingleImageUpload = async () => {
    if (!pendingSingleImage) return;
    const { file, questionId } = pendingSingleImage;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Upload physical file to server disk (/public/images/final-mission/) with metadata
      const serverRes = await uploadDataUrlToServer(file.name, base64, 'final-mission', { questionId });
      const savedUrl = serverRes?.success && serverRes?.url ? serverRes.url : base64;

      await db.setFinalMissionQuestionImage(questionId, savedUrl, file.name);
      await db.persistFinalMissionMaster('Super Admin');

      sounds.playFanfare();
      const successMsg = `Gambar "${file.name}" untuk butir soal ${questionId} berhasil diunggah, disimpan di disk server, dan disinkronkan ke Cloud Firestore!`;
      showToast(`✨ ${successMsg}`);
      setUploadSuccessDialogMsg(successMsg);
      refreshData();
      if (selectedQuestion && selectedQuestion.id === questionId) {
        setSelectedQuestion({
          ...selectedQuestion,
          imageUrl: savedUrl,
          imageFileName: file.name,
        });
      }
      setPendingSingleImage(null);
    };
    reader.readAsDataURL(file);
  };

  // Matrix Item Image Selection Handler (for multi-image questions like Q38)
  const handleMatrixItemImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetMatrixItemId || !selectedQuestion) return;

    if (!file.type.startsWith('image/')) {
      showToast('File yang diunggah harus berformat gambar (PNG, JPG, WebP, dll).', 'error');
      return;
    }

    const itemId = uploadTargetMatrixItemId;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const serverRes = await uploadDataUrlToServer(file.name, base64, 'final-mission', {
        questionId: selectedQuestion.id,
        matrixItemId: itemId,
      });
      const savedUrl = serverRes?.success && serverRes?.url ? serverRes.url : base64;

      const updatedItems = (selectedQuestion.matrixItems || []).map((itm) => {
        if (itm.id === itemId) {
          return {
            ...itm,
            imageUrl: savedUrl,
            imageFileName: file.name,
          };
        }
        return itm;
      });

      setSelectedQuestion({
        ...selectedQuestion,
        matrixItems: updatedItems,
      });

      if (selectedQuestion.id) {
        await db.setFinalMissionMatrixItemImage(selectedQuestion.id, itemId, savedUrl, file.name);
        await db.persistFinalMissionMaster('Super Admin');
      }
      sounds.playPop();
      showToast(`Gambar "${file.name}" untuk item berhasil disimpan permanen ke server & cloud.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setUploadTargetMatrixItemId(null);
  };

  // Bulk Image Selection Handler (matches filenames to questions)
  const handleBulkImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPendingBulkImages(Array.from(files));
    e.target.value = '';
  };

  // Execute Bulk Image Upload after confirmation
  const executeBulkImagesUpload = async () => {
    if (!pendingBulkImages || pendingBulkImages.length === 0) return;

    let matchedCount = 0;
    for (const file of pendingBulkImages) {
      if (!file.type.startsWith('image/')) continue;

      const fileName = file.name.trim();
      const cleanFileName = fileName.toLowerCase();

      // Find question matching imageFileName or question ID
      const matchingQ = questions.find((q) => {
        const qImg = (q.imageFileName || '').toLowerCase();
        const qId = q.id.toLowerCase();
        return (
          qImg === cleanFileName ||
          qImg.replace(/\.[^/.]+$/, '') === cleanFileName.replace(/\.[^/.]+$/, '') ||
          cleanFileName.includes(qId)
        );
      });

      if (matchingQ) {
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result as string;
            const serverRes = await uploadDataUrlToServer(fileName, base64, 'final-mission', {
              questionId: matchingQ.id,
            });
            const savedUrl = serverRes?.success && serverRes?.url ? serverRes.url : base64;
            await db.setFinalMissionQuestionImage(matchingQ.id, savedUrl, fileName);
            matchedCount++;
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    // Persist all updated final mission questions & images to server disk and Cloud Firestore
    await db.persistFinalMissionMaster('Super Admin');

    sounds.playFanfare();
    const successMsg = `Berhasil mencocokkan dan menyimpan ${matchedCount} file gambar ke Bank Soal Misi Akhir (Server Disk & Cloud Firestore)!`;
    showToast(`📸 ${successMsg}`);
    setUploadSuccessDialogMsg(successMsg);
    refreshData();
    setShowBulkImageModal(false);
    setPendingBulkImages(null);
  };

  // Excel File Selection Handler
  const handleExcelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingExcelFile(file);
    e.target.value = '';
  };

  // Execute Excel Upload after confirmation
  const executeExcelUpload = () => {
    if (!pendingExcelFile) return;

    const file = pendingExcelFile;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const parseResult = parseFinalMissionExcelOrCsv(buffer, selectedClassification);

      if (!parseResult.success || parseResult.questions.length === 0) {
        showToast(
          `Gagal mengimpor file: ${parseResult.errors[0] || 'Tidak ada soal valid yang terbaca.'}`,
          'error'
        );
        setPendingExcelFile(null);
        return;
      }

      const importResult = db.bulkImportFinalMissionQuestions(
        parseResult.questions,
        true, // Replace questions for this classification
        selectedClassification
      );

      sounds.playFanfare();
      const successMsg = `Berhasil mengimpor ${importResult.added} butir soal ke kategori ${CLASSIFICATION_LABELS[selectedClassification]} dari file "${file.name}"!`;
      showToast(`✨ ${successMsg}`);
      setUploadSuccessDialogMsg(successMsg);
      refreshData();
      setShowImportModal(false);
      setPendingExcelFile(null);
    };
    reader.readAsArrayBuffer(file);
  };

  // Delete Question Image Handler
  const handleDeleteImage = async () => {
    if (!deleteImageTarget) return;
    const targetId = deleteImageTarget.id;
    await db.removeFinalMissionQuestionImage(targetId);
    await db.persistFinalMissionMaster('Super Admin');
    sounds.playPop();
    showToast(`Gambar untuk butir soal ${targetId} berhasil dihapus.`);
    refreshData();
    if (selectedQuestion && selectedQuestion.id === targetId) {
      setSelectedQuestion({
        ...selectedQuestion,
        imageUrl: undefined,
        imageFileName: '',
      });
    }
    setDeleteImageTarget(null);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      sounds.playPop();
      const bytes = await generateFinalMissionExcel(
        questions,
        `Misi Akhir - ${selectedClassification.toUpperCase()}`
      );
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bank_Soal_Misi_Akhir_${selectedClassification}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('File spreadsheet Bank Soal Misi Akhir berhasil diunduh.');
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      showToast('Gagal mengekspor file Excel: ' + (err?.message || String(err)), 'error');
    }
  };

  // Download Template Excel
  const handleDownloadTemplate = async () => {
    try {
      sounds.playPop();
      const sampleQuestions: FinalMissionQuestion[] = [
        {
          id: 'Q1_01',
          dimension: 'Cinta Rupiah - Pengetahuan',
          question: 'Berapakah nominal uang kertas pada gambar ini?',
          imageFileName: 'uang_kertas_1000.png',
          questionType: 'Pilihan Ganda',
          options: ['A. Rp 1.000', 'B. Rp 2.000', 'C. Rp 5.000', 'D. Rp 10.000'],
          correctAnswer: 'A. Rp 1.000',
          points: 10,
          stage: STAGES.PEMULA,
          classification: selectedClassification,
        },
        {
          id: 'Q2_01',
          dimension: 'Cinta Rupiah - Perilaku',
          question: 'Sebagai wujud merawat Rupiah (5J), kita Tidak Boleh melipat uang kertas.',
          imageFileName: 'jangan_dilipat.png',
          questionType: 'Ya/Tidak',
          options: ['A. Ya', 'B. Tidak'],
          correctAnswer: 'A. Ya',
          points: 10,
          stage: STAGES.TERAMPIL,
          classification: selectedClassification,
        },
        {
          id: 'Q3_01',
          dimension: 'Paham Rupiah - Pengetahuan',
          question: 'Metode pembayaran QRIS termasuk dalam kategori transaksi...',
          imageFileName: 'qris_merchant.png',
          questionType: 'Pilihan Ganda',
          options: ['A. Tunai', 'B. Non Tunai'],
          correctAnswer: 'B. Non Tunai',
          points: 10,
          stage: STAGES.MASTER,
          classification: selectedClassification,
        },
      ];

      const bytes = await generateFinalMissionExcel(sampleQuestions, 'Template Bank Soal Misi Akhir');
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Excel_Misi_Akhir_10_Kolom.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Template Excel 10 Kolom berhasil diunduh.');
    } catch (err: any) {
      console.error('Download template Excel failed:', err);
      showToast('Gagal mengunduh template Excel: ' + (err?.message || String(err)), 'error');
    }
  };

  // Save Single Question from Edit Modal
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    if (!selectedQuestion.question.trim()) {
      alert('Teks pertanyaan wajib diisi.');
      return;
    }

    // Mendukung penggantian/rename ID soal secara mulus
    db.saveFinalMissionQuestion(selectedQuestion, originalEditingId || undefined);
    showToast(`Soal ${selectedQuestion.id} berhasil disimpan.`);
    setShowEditModal(false);
    setOriginalEditingId(null);
    refreshData();
  };

  // Delete Single Question
  const handleDeleteQuestion = (id: string) => {
    db.deleteFinalMissionQuestion(id);
    showToast(`Soal ${id} telah dihapus.`, 'info');
    refreshData();
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={excelFileInputRef}
        onChange={handleExcelSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={singleImageInputRef}
        onChange={handleSingleImageSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={matrixItemImageInputRef}
        onChange={handleMatrixItemImageSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={bulkImagesInputRef}
        onChange={handleBulkImagesSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-blue-50 text-blue-900 border-blue-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl bg-white rounded-3xl p-4 shadow-2xl border border-slate-200">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Pratinjau Gambar"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Top Header Card - Compact & Space-Saving */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-3.5 sm:p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 shrink-0 shadow-inner"
              title="Grand Assessment"
            >
              <Crown className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
              Misi Akhir: Sang Penjelajah Rupiah
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playPop();
                setActiveMainTab(activeMainTab === 'event' ? 'questions' : 'event');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer ${
                activeMainTab === 'event'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30'
              }`}
              title="Atur jadwal Main Bareng Misi Akhir dan lihat Papan Peringkat Juara"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{activeMainTab === 'event' ? 'Kembali ke Bank Soal' : 'Main Bareng & Peringkat'}</span>
            </button>

            {/* Try as student quick action button */}
            <button
              onClick={handleOpenStudentMission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer group"
              title="Buka halaman Misi Akhir siswa untuk mencoba menjawab soal"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950 group-hover:scale-110 transition-transform" />
              <span>Coba Sebagai Siswa</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                excelFileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Unggah spreadsheet Excel bank soal 9 kolom"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                bulkImagesInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Unggah kumpulan file gambar soal secara massal (otomatis cocokkan berdasarkan nama file/nomor soal)"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Unggah Gambar Massal</span>
            </button>

            <button
              onClick={handlePersistFinalMissionMaster}
              disabled={isPersistingMaster}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Simpan permanen bank soal dan gambar ke disk server dan Cloud Firestore agar muncul di semua perangkat dan akun"
            >
              {isPersistingMaster ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudLightning className="w-3.5 h-3.5 text-amber-200" />
              )}
              <span>{isPersistingMaster ? 'Menyinkronkan...' : 'Simpan ke Server & Cloud'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              title="Ekspor seluruh butir soal ke Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              title="Unduh file format template Excel master 9 kolom"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Template</span>
            </button>
          </div>
        </div>
      </div>

      {activeMainTab === 'event' ? (
        <FinalMissionEventManagement onPlayAsStudent={handleOpenStudentMission} />
      ) : (
        <>
          {/* Classification Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['anak', 'remaja', 'dewasa'] as FinalMissionClassification[]).map((cls) => {
            const isSelected = selectedClassification === cls;
            const count = classificationCounts[cls] ?? 0;

            return (
              <button
                key={cls}
                onClick={() => {
                  sounds.playPop();
                  setSelectedClassification(cls);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span>
                  {cls === 'anak'
                    ? '👶 Anak-Anak (10-17 th)'
                    : cls === 'remaja'
                    ? '🧑 Remaja (18-30 th)'
                    : '👔 Dewasa (31-55 th)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedQuestion({
                id: `Q_${selectedClassification}_${Date.now().toString().slice(-4)}`,
                dimension: 'Cinta Rupiah - Pengetahuan',
                question: '',
                imageFileName: '',
                questionType: 'Pilihan Ganda',
                options: ['A. Pilihan 1', 'B. Pilihan 2', 'C. Pilihan 3', 'D. Pilihan 4'],
                correctAnswer: 'A. Pilihan 1',
                points: 10,
                stage: STAGES.PEMULA,
                classification: selectedClassification,
              });
              setIsEditingNew(true);
              setOriginalEditingId(null);
              setShowEditModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Stage Breakdown & Quick Filters with Streamlined Controls */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card: Semua Tahap */}
          <div
            onClick={() => setSelectedStageFilter('all')}
            className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedStageFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-700 shadow-sm ring-2 ring-slate-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Semua Tahap
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleUnlockAll();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  stageAccess.unlockAll
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                    : selectedStageFilter === 'all'
                    ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={stageAccess.unlockAll ? 'Semua tahap terbuka (Klik untuk kembali ke progres normal)' : 'Buka semua tahap sekaligus'}
              >
                {stageAccess.unlockAll ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{stageAccess.unlockAll ? 'Terbuka' : 'Buka Semua'}</span>
              </button>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <div className="text-lg font-black">{questions.length} Butir</div>
              <div className="text-[10px] opacity-75">Semua Soal</div>
            </div>
          </div>

          {/* Card: Tahap 1: Pemula */}
          <div
            onClick={() => setSelectedStageFilter('pemula')}
            className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedStageFilter === 'pemula'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm ring-2 ring-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                selectedStageFilter === 'pemula' ? 'text-slate-900/80' : 'text-amber-700'
              }`}>
                Tahap 1
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                selectedStageFilter === 'pemula' ? 'bg-black/15 text-slate-950' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <Unlock className="w-2.5 h-2.5" />
                <span>Terbuka</span>
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <div className="text-lg font-black">{pemulaCount} Butir</div>
              <div className={`text-[10px] font-medium ${
                selectedStageFilter === 'pemula' ? 'text-slate-900' : 'text-amber-800'
              }`}>
                Pemula
              </div>
            </div>
          </div>

          {/* Card: Tahap 2: Terampil */}
          {(() => {
            const isUnlocked = stageAccess.unlockAll || stageAccess.unlockedStages.terampil;
            return (
              <div
                onClick={() => setSelectedStageFilter('terampil')}
                className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStageFilter === 'terampil'
                    ? 'bg-sky-500 text-white border-sky-400 shadow-sm ring-2 ring-sky-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    selectedStageFilter === 'terampil' ? 'text-white/80' : 'text-sky-700'
                  }`}>
                    Tahap 2
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStage('terampil');
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      isUnlocked
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 shadow-2xs'
                        : selectedStageFilter === 'terampil'
                        ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                        : 'bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-900 border-slate-200'
                    }`}
                    title={isUnlocked ? 'Tahap 2 sedang dibuka Admin (Klik untuk kunci kembali)' : 'Klik untuk membuka akses langsung'}
                  >
                    {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{isUnlocked ? 'Terbuka' : 'Terkunci'}</span>
                  </button>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <div className="text-lg font-black">{terampilCount} Butir</div>
                  <div className={`text-[10px] font-medium ${
                    selectedStageFilter === 'terampil' ? 'text-sky-100' : 'text-sky-800'
                  }`}>
                    Terampil
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Card: Tahap 3: Master */}
          {(() => {
            const isUnlocked = stageAccess.unlockAll || stageAccess.unlockedStages.master;
            return (
              <div
                onClick={() => setSelectedStageFilter('master')}
                className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStageFilter === 'master'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm ring-2 ring-purple-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    selectedStageFilter === 'master' ? 'text-white/80' : 'text-purple-700'
                  }`}>
                    Tahap 3
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStage('master');
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      isUnlocked
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 shadow-2xs'
                        : selectedStageFilter === 'master'
                        ? 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                        : 'bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border-slate-200'
                    }`}
                    title={isUnlocked ? 'Tahap 3 sedang dibuka Admin (Klik untuk kunci kembali)' : 'Klik untuk membuka akses langsung'}
                  >
                    {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{isUnlocked ? 'Terbuka' : 'Terkunci'}</span>
                  </button>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <div className="text-lg font-black">{masterCount} Butir</div>
                  <div className={`text-[10px] font-medium ${
                    selectedStageFilter === 'master' ? 'text-purple-100' : 'text-purple-800'
                  }`}>
                    Master
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Streamlined Batas Kelulusan (Passing Grade) & Capaian Toolbar */}
        {(() => {
          const targetQuestions = filteredQuestions;
          const totalPointsPossible = targetQuestions.reduce((acc, q) => {
            if (Array.isArray(q.optionPoints) && q.optionPoints.length > 0) {
              const maxOpt = Math.max(...q.optionPoints);
              return acc + (maxOpt > 0 ? maxOpt : (q.points || 0));
            }
            const qType = String(q.questionType || '').toLowerCase();
            const isScale = qType.includes('skala') || qType.includes('1-5');
            return acc + (q.points !== undefined && q.points > 0 ? q.points : isScale ? 5 : 10);
          }, 0);

          const activeGrade = selectedStageFilter !== 'all'
            ? (stageAccess.stagePassingGrades?.[selectedStageFilter] ?? stageAccess.passingGrade ?? 80)
            : (stageAccess.passingGrade ?? 80);

          const minPointsNeeded = Math.ceil((totalPointsPossible * activeGrade) / 100);

          return (
            <div className="p-2.5 bg-amber-500/10 border border-amber-300/75 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Left: Passing Grade Controls & Target Stats */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 shrink-0">
                  <Target className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs">Batas Lulus (KKM):</span>
                </div>

                {/* Input & Apply */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2.5 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={passingGradeInput}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPassingGradeInput(isNaN(val) ? 80 : val);
                      }}
                      onBlur={() => handleUpdatePassingGrade(passingGradeInput)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdatePassingGrade(passingGradeInput);
                        }
                      }}
                      className="w-10 text-center text-xs font-bold text-slate-900 border-0 focus:outline-hidden p-0 bg-transparent"
                    />
                    <span className="text-xs font-bold text-amber-700">%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdatePassingGrade(passingGradeInput)}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Terapkan
                  </button>
                </div>

                {/* Divider on larger screens */}
                <div className="hidden sm:block h-4 w-px bg-amber-300/70" />

                {/* Compact Stats */}
                <div className="flex items-center gap-1.5 text-xs bg-white/90 px-2.5 py-1 rounded-lg border border-amber-200/80 text-slate-700 font-medium shadow-2xs">
                  <span>Maks: <strong>{totalPointsPossible} Poin</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-900 font-bold">Syarat Lulus: ≥ {minPointsNeeded} Poin ({activeGrade}%)</span>
                </div>
              </div>

              {/* Right: Scope & Reset Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Scope Target Button */}
                <button
                  type="button"
                  onClick={handleToggleScope}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                    stageAccess.unlockForEveryone
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Pilih apakah bypass gembok berlaku untuk semua siswa atau khusus penguji/admin"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{stageAccess.unlockForEveryone ? 'Semua Siswa' : 'Khusus Guru'}</span>
                </button>

                {/* Reset button */}
                {(stageAccess.unlockAll ||
                  stageAccess.unlockedStages.terampil ||
                  stageAccess.unlockedStages.master ||
                  stageAccess.unlockForEveryone) && (
                  <button
                    type="button"
                    onClick={handleResetStageAccess}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-red-50 transition-colors cursor-pointer shadow-2xs"
                    title="Kembalikan gembok ke progres bertahap normal"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID, pertanyaan, dimensi, gambar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => {
              db.sortAllFinalMissionQuestions();
              setSortField('id');
              setSortDirection('asc');
              refreshData();
              showToast('✨ Urutan ID Soal berhasil dirapikan (Q1 s.d Q52)!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Rapikan urutan seluruh ID soal (Q1 s.d Q52)"
          >
            <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-600" />
            <span>Urutkan ID Soal</span>
          </button>

          <button
            onClick={() => setConfirmResetDefault(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
            title="Reset ke Bank Soal Standar BI"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Default BI</span>
          </button>

          <button
            onClick={() => setConfirmDeleteAll(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            title="Kosongkan Soal Kategori Ini"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Kosongkan Soal</span>
          </button>
        </div>
      </div>

      {/* Question Table (9 Columns) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th
                  onClick={() => {
                    if (sortField === 'id') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('id');
                      setSortDirection('asc');
                    }
                  }}
                  className="py-3 px-3 w-24 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="Klik untuk urutkan berdasarkan ID Soal"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID Soal</span>
                    {sortField === 'id' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 shrink-0" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortField === 'stage') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('stage');
                      setSortDirection('asc');
                    }
                  }}
                  className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="Klik untuk urutkan berdasarkan Tahap (Pemula -> Terampil -> Master)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tahap</span>
                    {sortField === 'stage' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 w-32">Dimensi</th>
                <th className="py-3 px-4 min-w-[240px]">Pertanyaan</th>
                <th className="py-3 px-3 min-w-[155px]">Gambar</th>
                <th className="py-3 px-3 w-28">Tipe Soal</th>
                <th className="py-3 px-3 w-40">Kunci Jawaban</th>
                <th
                  onClick={() => {
                    if (sortField === 'points') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('points');
                      setSortDirection('asc');
                    }
                  }}
                  className="py-3 px-2 w-16 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="Klik untuk urutkan berdasarkan Poin"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Poin</span>
                    {sortField === 'points' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-50 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedQuestions.length > 0 ? (
                sortedQuestions.map((q, idx) => {
                  const imageSrc = db.getFinalMissionQuestionImage(q);
                  const isPemula = String(q.stage || '').toLowerCase().includes('pemula');
                  const isTerampil = String(q.stage || '').toLowerCase().includes('terampil');

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID Soal */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{q.id}</td>

                      {/* Tahap */}
                      <td className="py-3 px-3">
                        <select
                          value={q.stage}
                          onChange={(e) => {
                            const newStage = e.target.value;
                            const updated = { ...q, stage: newStage };
                            db.saveFinalMissionQuestion(updated);
                            showToast(`Soal ${q.id} berhasil dipindahkan ke ${newStage}`);
                            refreshData();
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer focus:outline-hidden transition-all ${
                            isPemula
                              ? 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-400'
                              : isTerampil
                              ? 'bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-400'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400'
                          }`}
                          title="Pindahkan Tahap Soal secara Cepat"
                        >
                          <option value={STAGES.PEMULA}>1. Pemula</option>
                          <option value={STAGES.TERAMPIL}>2. Terampil</option>
                          <option value={STAGES.MASTER}>3. Master</option>
                        </select>
                      </td>

                      {/* Dimensi */}
                      <td className="py-3 px-3 font-medium text-slate-600">
                        <span className="line-clamp-2">{q.dimension || 'Cinta Rupiah'}</span>
                      </td>

                      {/* Pertanyaan */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-snug line-clamp-2">{q.question}</p>
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              Opsi: {q.options.join(' • ')}
                            </p>
                            {Array.isArray(q.optionPoints) && q.optionPoints.length > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[9px]"
                                title="Bobot skor per opsi (Opsi 2)"
                              >
                                Bobot: [{q.optionPoints.join(', ')}]
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Nama File Gambar & Preview */}
                      <td className="py-3 px-3">
                        {Array.isArray(q.matrixItems) && q.matrixItems.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                              {q.matrixItems.slice(0, 3).map((item, i) => {
                                const itemImg = db.getFinalMissionMatrixItemImage(q.id, item) || item.imageUrl || '';
                                return itemImg ? (
                                  <img
                                    key={i}
                                    src={itemImg}
                                    alt={item.label}
                                    className="inline-block h-7 w-7 rounded-lg ring-1 ring-slate-300 object-contain bg-white shrink-0"
                                  />
                                ) : (
                                  <div
                                    key={i}
                                    className="inline-block h-7 w-7 rounded-lg ring-1 ring-slate-300 bg-slate-100 text-[9px] flex items-center justify-center font-bold text-slate-500 shrink-0"
                                  >
                                    {i + 1}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md shrink-0">
                              {q.matrixItems.length} Gbr
                            </span>
                          </div>
                        ) : imageSrc ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(imageSrc)}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 hover:opacity-80 transition-opacity cursor-pointer shadow-2xs"
                              title="Klik untuk perbesar pratinjau gambar"
                            >
                              <img
                                src={imageSrc}
                                alt={q.imageFileName || q.id}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                            <div className="flex flex-col gap-1 min-w-0">
                              <span
                                className="truncate max-w-[95px] text-[10px] text-slate-600 font-mono font-medium block"
                                title={q.imageFileName || 'Gambar tersimpan'}
                              >
                                {q.imageFileName || 'Tersimpan'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadTargetQuestionId(q.id);
                                    singleImageInputRef.current?.click();
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                                  title="Ganti / Upload Ulang Gambar"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Ganti</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteImageTarget(q)}
                                  className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-bold flex items-center cursor-pointer transition-colors"
                                  title="Hapus Gambar Soal Ini"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setUploadTargetQuestionId(q.id);
                                singleImageInputRef.current?.click();
                              }}
                              className="px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Upload Gambar untuk Soal Ini"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload</span>
                            </button>
                            {q.imageFileName && (
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[60px]" title={q.imageFileName}>
                                {q.imageFileName}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tipe Soal */}
                      <td className="py-3 px-3">
                        {q.questionType === 'Pengelompokan Gambar' || (Array.isArray(q.matrixItems) && q.matrixItems.length > 0) ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                            Pengelompokan ({q.matrixItems?.length || 0} Gambar)
                          </span>
                        ) : q.questionType === 'Checkbox' || q.id === 'Q31a' || q.id === 'Q31b' || q.id === 'Q52a' || q.id === 'Q52b' ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            {q.id === 'Q52a' || q.id === 'Q52b' ? 'Checkbox (+2 Pts/Centang)' : 'Checkbox (Multi-Jawaban)'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {q.questionType}
                          </span>
                        )}
                      </td>

                      {/* Kunci Jawaban */}
                      <td className="py-3 px-3">
                        {q.questionType === 'Pengelompokan Gambar' || (Array.isArray(q.matrixItems) && q.matrixItems.length > 0) ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md text-[10px]">
                            <span>{(q.categories || ['Tunai', 'Non Tunai']).join(' / ')}</span>
                          </span>
                        ) : String(q.questionType).toLowerCase().includes('skala') ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px]">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Skala 1–5 (Otomatis)</span>
                          </span>
                        ) : q.id === 'Q52a' || q.id === 'Q52b' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px]">
                            <span>Semua Benar (+2 Pts/Centang)</span>
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md line-clamp-1">
                            {q.correctAnswer}
                          </span>
                        )}
                      </td>

                      {/* Skor Poin */}
                      <td className="py-3 px-2 text-center font-bold text-slate-700">
                        {String(q.questionType).toLowerCase().includes('skala') ? (
                          <span className="text-amber-700 font-bold" title="Siswa mendapatkan 1 s.d. 5 poin sesuai pilihan">
                            {q.points || 5}
                          </span>
                        ) : (
                          q.points || 10
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setUploadTargetQuestionId(q.id);
                              singleImageInputRef.current?.click();
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Upload/Ganti Foto Gambar"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQuestion({
                                ...q,
                                options: Array.isArray(q.options) ? [...q.options] : q.options,
                              });
                              setOriginalEditingId(q.id);
                              setIsEditingNew(false);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit Soal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(q.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                    <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">Tidak ada butir soal yang cocok.</p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan tombol <strong>Import Excel</strong> atau <strong>Tambah Soal Baru</strong> untuk memasukkan data.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* EDIT / CREATE QUESTION MODAL */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="relative w-full max-w-2xl sm:max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {isEditingNew ? 'Tambah Butir Soal Baru' : `Edit Butir Soal (${selectedQuestion.id})`}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    {CLASSIFICATION_LABELS[selectedQuestion.classification]}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Atur tahap soal, pertanyaan, gambar, butir opsi jawaban, dan kunci penilaian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form onSubmit={handleSaveQuestion} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {/* PENGATURAN TAHAP SOAL / LEVEL (STAGE TRANSFER SELECTOR) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block font-bold text-slate-800 text-xs">
                      Pindahkan / Atur Tahap Soal:
                    </label>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Soal ini akan ditempatkan pada level berikut
                    </span>
                  </div>

                  {/* Stage Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuestion({ ...selectedQuestion, stage: STAGES.PEMULA })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedQuestion.stage === STAGES.PEMULA
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-blue-700">Tahap 1</span>
                        {selectedQuestion.stage === STAGES.PEMULA ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black">
                            AKTIF
                          </span>
                        ) : null}
                      </div>
                      <p className="font-bold text-[11px] leading-tight">Penjelajah Pemula</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tingkat Dasar (1-18)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedQuestion({ ...selectedQuestion, stage: STAGES.TERAMPIL })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedQuestion.stage === STAGES.TERAMPIL
                          ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 text-purple-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-purple-700">Tahap 2</span>
                        {selectedQuestion.stage === STAGES.TERAMPIL ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-black">
                            AKTIF
                          </span>
                        ) : null}
                      </div>
                      <p className="font-bold text-[11px] leading-tight">Penjelajah Terampil</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tingkat Menengah (19-36)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedQuestion({ ...selectedQuestion, stage: STAGES.MASTER })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedQuestion.stage === STAGES.MASTER
                          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 text-amber-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-amber-700">Tahap 3</span>
                        {selectedQuestion.stage === STAGES.MASTER ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-600 text-white text-[9px] font-black">
                            AKTIF
                          </span>
                        ) : null}
                      </div>
                      <p className="font-bold text-[11px] leading-tight">Sang Penjelajah</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tingkat Lanjutan (37-54)</p>
                    </button>
                  </div>
                </div>

                {/* ID Soal, Skor, dan Dimensi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ID Soal</label>
                    <input
                      type="text"
                      required
                      value={selectedQuestion.id}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, id: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Skor Poin</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQuestion.points || (selectedQuestion.questionType === 'Skala 1-5' ? 5 : 10)}
                      onChange={(e) =>
                        setSelectedQuestion({
                          ...selectedQuestion,
                          points: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Admin memegang kendali penuh menentukan poin soal ini tanpa batas maksimum.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dimensi CBP Rupiah</label>
                    <input
                      type="text"
                      value={selectedQuestion.dimension}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, dimension: e.target.value })
                      }
                      placeholder="Contoh: Cinta Rupiah - Pengetahuan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* Teks Pertanyaan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan / Soal</label>
                  <textarea
                    rows={3}
                    required
                    value={selectedQuestion.question}
                    onChange={(e) =>
                      setSelectedQuestion({ ...selectedQuestion, question: e.target.value })
                    }
                    placeholder="Tuliskan butir soal di sini..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                  />
                </div>

                {/* Tipe Soal & Nama File Gambar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipe Soal</label>
                    <select
                      value={selectedQuestion.questionType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        if (newType === 'Benar/Salah' || newType === 'Ya/Tidak' || newType === 'Tunai/Non-Tunai') {
                          const defaultA = newType === 'Benar/Salah' ? 'Benar' : newType === 'Ya/Tidak' ? 'Ya' : 'Tunai';
                          const defaultB = newType === 'Benar/Salah' ? 'Salah' : newType === 'Ya/Tidak' ? 'Tidak' : 'Non-Tunai';
                          setSelectedQuestion({
                            ...selectedQuestion,
                            questionType: newType,
                            options: [`A. ${defaultA}`, `B. ${defaultB}`],
                            correctAnswer: `A. ${defaultA}`,
                          });
                        } else if (newType === 'Skala 1-5') {
                          setSelectedQuestion({
                            ...selectedQuestion,
                            questionType: newType,
                            points: 5,
                            options: [
                              '1. Sangat tidak Senang',
                              '2. Tidak Senang',
                              '3. Biasa saja',
                              '4. Senang',
                              '5. Sangat Senang',
                            ],
                            correctAnswer: 'Skor Otomatis 1-5 Sesuai Pilihan Siswa',
                          });
                        } else if (newType === 'Matriks Ya/Tidak' || newType === 'Tabel Matriks') {
                          setSelectedQuestion({
                            ...selectedQuestion,
                            questionType: 'Matriks Ya/Tidak',
                            points: 10,
                            options: [
                              '[Kolom: Ya (1) | Tidak (2)]',
                              'Tidak Dilipat',
                              'Tidak Distapler',
                              'Tidak Diremas',
                              'Tidak Dibasahi',
                              'Tidak Dicoret',
                            ],
                            correctAnswer: 'Semua Ya (1)',
                          });
                        } else if (newType === 'Pengelompokan Gambar') {
                          setSelectedQuestion({
                            ...selectedQuestion,
                            questionType: 'Pengelompokan Gambar',
                            points: 10,
                            categories: selectedQuestion.categories || ['Tunai', 'Non Tunai'],
                            options: ['Tunai', 'Non Tunai'],
                            correctAnswer: 'Pengelompokan Sesuai Kategori',
                            matrixItems:
                              selectedQuestion.matrixItems && selectedQuestion.matrixItems.length > 0
                                ? selectedQuestion.matrixItems
                                : [
                                    {
                                      id: 'item_1',
                                      label: 'Uang Kertas (Rp 100.000)',
                                      imageFileName: 'uang_kertas_100k_tunai.png',
                                      imageUrl: SVG_UANG_KERTAS_100K,
                                      correctCategory: 'Tunai',
                                      points: 2,
                                    },
                                    {
                                      id: 'item_2',
                                      label: 'Kartu Debit (GPN)',
                                      imageFileName: 'debit_gpn.png',
                                      imageUrl: SVG_KARTU_DEBIT_GPN,
                                      correctCategory: 'Non Tunai',
                                      points: 2,
                                    },
                                    {
                                      id: 'item_3',
                                      label: 'Uang Elektronik berbasis server (OVO/Gopay/Dana/Shopeepay)',
                                      imageFileName: 'ewallet_server.png',
                                      imageUrl: SVG_EWALLET_SERVER,
                                      correctCategory: 'Non Tunai',
                                      points: 2,
                                    },
                                    {
                                      id: 'item_4',
                                      label: 'Uang Elektronik berbasis kartu (E-money/Flazz/Brizzi)',
                                      imageFileName: 'emoney_kartu.png',
                                      imageUrl: SVG_EMONEY_KARTU,
                                      correctCategory: 'Non Tunai',
                                      points: 2,
                                    },
                                    {
                                      id: 'item_5',
                                      label: 'Uang Logam Rupiah',
                                      imageFileName: 'uang_logam_rupiah.png',
                                      imageUrl: SVG_UANG_LOGAM_RUPIAH,
                                      correctCategory: 'Tunai',
                                      points: 2,
                                    },
                                  ],
                          });
                        } else {
                          setSelectedQuestion({ ...selectedQuestion, questionType: newType });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white"
                    >
                      <option value="Pilihan Ganda">Pilihan Ganda (Multiple Choice)</option>
                      <option value="Benar/Salah">Benar / Salah (A-B)</option>
                      <option value="Ya/Tidak">Ya / Tidak (A-B)</option>
                      <option value="Matriks Ya/Tidak">Matriks Ya/Tidak (Tabel Checklist 5T)</option>
                      <option value="Pengelompokan Gambar">Pengelompokan Gambar (Visual Matrix Grid - Multi Gambar)</option>
                      <option value="Tunai/Non-Tunai">Tunai / Non-Tunai (A-B)</option>
                      <option value="Tahu/Tidak">Tahu / Tidak</option>
                      <option value="Skala 1-5">Skala 1-5 (Likert Scale)</option>
                      <option value="Pilihan 1-7">Pilihan 1-7 (Hotspot Nomor)</option>
                      <option value="Checkbox">Kotak Centang / Checkbox (+2 Poin / Pilihan)</option>
                      <option value="Multi-Select">Multi-Select</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700 text-xs">Foto / Gambar Pendukung Soal</label>
                    {(() => {
                      const modalImg = selectedQuestion.imageUrl || db.getFinalMissionQuestionImage(selectedQuestion);
                      return (
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                          {modalImg ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(modalImg)}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 hover:opacity-80 transition-opacity cursor-pointer shadow-xs"
                                title="Klik untuk perbesar"
                              >
                                <img
                                  src={modalImg}
                                  alt={selectedQuestion.imageFileName || selectedQuestion.id}
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-mono font-bold text-slate-800 truncate block" title={selectedQuestion.imageFileName || 'Gambar tersimpan'}>
                                  {selectedQuestion.imageFileName || 'Gambar tersimpan'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUploadTargetQuestionId(selectedQuestion.id);
                                      singleImageInputRef.current?.click();
                                    }}
                                    className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Ganti Gambar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteImageTarget(selectedQuestion)}
                                    className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400 italic">Belum ada gambar yang diunggah</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadTargetQuestionId(selectedQuestion.id);
                                  singleImageInputRef.current?.click();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload Gambar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <input
                      type="text"
                      value={selectedQuestion.imageFileName || ''}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, imageFileName: e.target.value })
                      }
                      placeholder="Nama file gambar (cth: uang_kertas_1000.png)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 font-mono text-xs bg-white mt-1"
                    />
                  </div>
                </div>

                {/* KOLOM PILIHAN JAWABAN DINAMIS (A, B, C, D, ...) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block font-bold text-slate-800">
                        Pilihan Jawaban (Dinamis A, B, C, D, dst.)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Atur teks setiap opsi. Gunakan tombol hapus atau tambah untuk menyesuaikan jumlah pilihan.
                      </p>
                    </div>

                    {/* Preset Dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-1 sm:mt-0">
                      <span className="text-xs font-semibold text-slate-500 shrink-0">Preset:</span>
                      <select
                        id="preset-pilihan-select"
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          sounds.playPop();
                          if (val === 'ya_tidak_pos') {
                            const opts = ['A. Ya', 'B. Tidak'];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Ya/Tidak',
                              options: opts,
                              optionPoints: [2, 1],
                              points: 2,
                              correctAnswer: opts[0],
                            });
                          } else if (val === 'ya_tidak_neg') {
                            const opts = ['A. Ya', 'B. Tidak'];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Ya/Tidak',
                              options: opts,
                              optionPoints: [1, 2],
                              points: 2,
                              correctAnswer: opts[1],
                            });
                          } else if (val === 'benar_salah_pos') {
                            const opts = ['A. Benar', 'B. Salah'];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Benar/Salah',
                              options: opts,
                              optionPoints: [2, 1],
                              points: 2,
                              correctAnswer: opts[0],
                            });
                          } else if (val === 'benar_salah_neg') {
                            const opts = ['A. Benar', 'B. Salah'];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Benar/Salah',
                              options: opts,
                              optionPoints: [1, 2],
                              points: 2,
                              correctAnswer: opts[1],
                            });
                          } else if (val === 'opsi_4') {
                            const currentOpts = Array.isArray(selectedQuestion.options) ? selectedQuestion.options : [];
                            const getClean = (idx: number) => {
                              const raw = currentOpts[idx] || '';
                              const letter = String.fromCharCode(65 + idx);
                              return raw.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '');
                            };
                            const opts = [0, 1, 2, 3].map((i) => {
                              const letter = String.fromCharCode(65 + i);
                              const clean = getClean(i) || `Pilihan ${letter}`;
                              return `${letter}. ${clean}`;
                            });
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Pilihan Ganda',
                              options: opts,
                              optionPoints: [selectedQuestion.points || 10, 0, 0, 0],
                              correctAnswer: opts[0],
                            });
                          } else if (val === 'opsi_6') {
                            const currentOpts = Array.isArray(selectedQuestion.options) ? selectedQuestion.options : [];
                            const getClean = (idx: number) => {
                              const raw = currentOpts[idx] || '';
                              const letter = String.fromCharCode(65 + idx);
                              return raw.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '');
                            };
                            const opts = [0, 1, 2, 3, 4, 5].map((i) => {
                              const letter = String.fromCharCode(65 + i);
                              const clean = getClean(i) || `Pilihan ${letter}`;
                              return `${letter}. ${clean}`;
                            });
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Pilihan Ganda',
                              options: opts,
                              optionPoints: [selectedQuestion.points || 10, 0, 0, 0, 0, 0],
                              correctAnswer: opts[0],
                            });
                          } else if (val === 'skala_1_5_pos') {
                            const opts = [
                              '1. Sangat tidak Senang',
                              '2. Tidak Senang',
                              '3. Biasa saja',
                              '4. Senang',
                              '5. Sangat Senang',
                            ];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Skala 1-5',
                              points: 5,
                              options: opts,
                              optionPoints: [1, 2, 3, 4, 5],
                              correctAnswer: 'Skor Otomatis 1-5 Sesuai Pilihan Siswa',
                            });
                          } else if (val === 'skala_1_5_neg') {
                            const opts = [
                              '1. Sangat Tidak Kesal',
                              '2. Tidak Kesal',
                              '3. Biasa saja',
                              '4. Kesal',
                              '5. Sangat Kesal',
                            ];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Skala 1-5',
                              points: 5,
                              options: opts,
                              optionPoints: [5, 4, 3, 2, 1],
                              correctAnswer: 'Skor Otomatis 5-1 Sesuai Pilihan Siswa',
                            });
                          } else if (val === 'matriks_5t') {
                            const opts = [
                              '[Kolom: Ya (1) | Tidak (2)]',
                              'Tidak Dilipat',
                              'Tidak Distapler',
                              'Tidak Diremas',
                              'Tidak Dibasahi',
                              'Tidak Dicoret',
                            ];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Matriks Ya/Tidak',
                              points: 10,
                              options: opts,
                              correctAnswer: 'Semua Ya (1)',
                            });
                          } else if (val === 'pengelompokan_q38') {
                            setSelectedQuestion({
                              ...selectedQuestion,
                              questionType: 'Pengelompokan Gambar',
                              points: 10,
                              categories: ['Tunai', 'Non Tunai'],
                              options: ['Tunai', 'Non Tunai'],
                              correctAnswer: 'Pengelompokan Sesuai Kategori',
                              matrixItems: [
                                {
                                  id: 'item_1',
                                  label: 'Uang Kertas (Rp 100.000)',
                                  imageFileName: 'uang_kertas_100k_tunai.png',
                                  imageUrl: SVG_UANG_KERTAS_100K,
                                  correctCategory: 'Tunai',
                                  points: 2,
                                },
                                {
                                  id: 'item_2',
                                  label: 'Kartu Debit (GPN)',
                                  imageFileName: 'debit_gpn.png',
                                  imageUrl: SVG_KARTU_DEBIT_GPN,
                                  correctCategory: 'Non Tunai',
                                  points: 2,
                                },
                                {
                                  id: 'item_3',
                                  label: 'Uang Elektronik berbasis server (OVO/Gopay/Dana/Shopeepay)',
                                  imageFileName: 'ewallet_server.png',
                                  imageUrl: SVG_EWALLET_SERVER,
                                  correctCategory: 'Non Tunai',
                                  points: 2,
                                },
                                {
                                  id: 'item_4',
                                  label: 'Uang Elektronik berbasis kartu (E-money/Flazz/Brizzi)',
                                  imageFileName: 'emoney_kartu.png',
                                  imageUrl: SVG_EMONEY_KARTU,
                                  correctCategory: 'Non Tunai',
                                  points: 2,
                                },
                                {
                                  id: 'item_5',
                                  label: 'Uang Logam Rupiah',
                                  imageFileName: 'uang_logam_rupiah.png',
                                  imageUrl: SVG_UANG_LOGAM_RUPIAH,
                                  correctCategory: 'Tunai',
                                  points: 2,
                                },
                              ],
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 shadow-2xs cursor-pointer"
                      >
                        <option value="" disabled>-- Pilih Format Preset --</option>
                        <optgroup label="Ya / Tidak & Benar / Salah">
                          <option value="ya_tidak_pos">Ya/Tidak (+ : 2/1)</option>
                          <option value="ya_tidak_neg">Ya/Tidak (- : 1/2)</option>
                          <option value="benar_salah_pos">Benar/Salah (2/1)</option>
                          <option value="benar_salah_neg">Benar/Salah (- : 1/2)</option>
                        </optgroup>
                        <optgroup label="Pilihan Ganda">
                          <option value="opsi_4">A-D (4 Opsi)</option>
                          <option value="opsi_6">A-F (6 Opsi)</option>
                        </optgroup>
                        <optgroup label="Skala Likert (1 - 5)">
                          <option value="skala_1_5_pos">Skala 1-5 (1 s.d. 5)</option>
                          <option value="skala_1_5_neg">Skala 1-5 (Negatif: 5 s.d. 1)</option>
                        </optgroup>
                        <optgroup label="Format Khusus">
                          <option value="matriks_5t">Matriks 5T (Ya/Tidak)</option>
                          <option value="pengelompokan_q38">Pengelompokan Q38 (Tunai/Non-Tunai)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* PENGELOMPOKAN GAMBAR (VISUAL MATRIX GRID) EDITOR */}
                  {selectedQuestion.questionType === 'Pengelompokan Gambar' ||
                  (Array.isArray(selectedQuestion.matrixItems) && selectedQuestion.matrixItems.length > 0) ? (
                    <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span>Pengelompokan Gambar (Visual Matrix Grid - Multi Gambar)</span>
                          </div>
                          <p className="text-[11px] text-indigo-700/90 mt-0.5">
                            Dalam 1 soal ini Anda dapat menginput <strong>banyak gambar/item</strong> sekaligus. Setiap item memiliki tombol upload foto tersendiri dan siswa memilih kategorinya.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentItems = selectedQuestion.matrixItems || [];
                              const nextIdx = currentItems.length + 1;
                              const newItm: FinalMissionMatrixItem = {
                                id: `item_${Date.now()}`,
                                label: `Item Gambar ${nextIdx}`,
                                correctCategory: (selectedQuestion.categories && selectedQuestion.categories[0]) || 'Tunai',
                                points: 2,
                              };
                              setSelectedQuestion({
                                ...selectedQuestion,
                                matrixItems: [...currentItems, newItm],
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Tambah Item Gambar</span>
                          </button>
                        </div>
                      </div>

                      {/* Kategori Pilihan (misal: Tunai vs Non Tunai) */}
                      <div className="p-3 rounded-xl bg-white border border-indigo-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">Kategori Pengelompokan (Kolom Pilihan Siswa)</label>
                          <span className="text-[10px] text-slate-400">Default: Tunai & Non Tunai</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(selectedQuestion.categories || ['Tunai', 'Non Tunai']).map((cat, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${cIdx === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                                {cIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={cat}
                                onChange={(e) => {
                                  const cats = [...(selectedQuestion.categories || ['Tunai', 'Non Tunai'])];
                                  cats[cIdx] = e.target.value;
                                  setSelectedQuestion({
                                    ...selectedQuestion,
                                    categories: cats,
                                    options: cats,
                                  });
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-400"
                                placeholder={`Kategori ${cIdx + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Daftar Butir Item Gambar */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 block">
                          Daftar Butir Item & Foto Gambar ({(selectedQuestion.matrixItems || []).length} Item)
                        </label>

                        {(!selectedQuestion.matrixItems || selectedQuestion.matrixItems.length === 0) && (
                          <div className="p-6 rounded-xl border border-dashed border-indigo-200 text-center bg-white text-xs text-slate-500">
                            Belum ada item gambar. Klik tombol <strong>+ Tambah Item Gambar</strong> di atas atau gunakan tombol Preset Q38.
                          </div>
                        )}

                        {(selectedQuestion.matrixItems || []).map((item, idx) => {
                          const itemImg = db.getFinalMissionMatrixItemImage(selectedQuestion.id, item) || item.imageUrl || '';
                          const cats = selectedQuestion.categories || ['Tunai', 'Non Tunai'];

                          return (
                            <div
                              key={item.id || idx}
                              className="p-3 rounded-2xl bg-white border border-indigo-100 hover:border-indigo-300 shadow-2xs space-y-3 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-mono font-black flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => {
                                      const updated = (selectedQuestion.matrixItems || []).map((it, i) =>
                                        i === idx ? { ...it, label: e.target.value } : it
                                      );
                                      setSelectedQuestion({ ...selectedQuestion, matrixItems: updated });
                                    }}
                                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="Nama / Label Item (misal: Uang Kertas Rp 100.000)"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (selectedQuestion.matrixItems || []).filter((_, i) => i !== idx);
                                    setSelectedQuestion({ ...selectedQuestion, matrixItems: updated });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                  title="Hapus Item Gambar Ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Gambar & Kategori Benar */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                {/* Image Preview & Upload Button */}
                                <div className="sm:col-span-6 flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                  <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {itemImg ? (
                                      <img
                                        src={itemImg}
                                        alt={item.label}
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={() => setPreviewImage(itemImg)}
                                        title="Klik untuk perbesar"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <ImageIcon className="w-6 h-6 text-slate-300" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUploadTargetMatrixItemId(item.id);
                                          matrixItemImageInputRef.current?.click();
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                      >
                                        <Upload className="w-3 h-3" />
                                        <span>{itemImg ? 'Ganti Foto' : 'Upload Foto'}</span>
                                      </button>
                                      {itemImg && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = (selectedQuestion.matrixItems || []).map((it, i) =>
                                              i === idx ? { ...it, imageUrl: '', imageFileName: '' } : it
                                            );
                                            setSelectedQuestion({ ...selectedQuestion, matrixItems: updated });
                                          }}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px]"
                                          title="Hapus gambar item"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono truncate block" title={item.imageFileName || 'SVG/DataURI'}>
                                      {item.imageFileName || (itemImg ? 'Ilustrasi Tersedia' : 'Belum ada gambar')}
                                    </span>
                                  </div>
                                </div>

                                {/* Kategori Benar */}
                                <div className="sm:col-span-6 flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Kunci Kategori yang Benar:</span>
                                  <div className="flex items-center gap-1.5">
                                    {cats.map((cat, cIdx) => {
                                      const isSelected = item.correctCategory.toLowerCase() === cat.toLowerCase();
                                      const isNonTunai = cat.toLowerCase().includes('non');
                                      return (
                                        <button
                                          key={cIdx}
                                          type="button"
                                          onClick={() => {
                                            const updated = (selectedQuestion.matrixItems || []).map((it, i) =>
                                              i === idx ? { ...it, correctCategory: cat } : it
                                            );
                                            setSelectedQuestion({ ...selectedQuestion, matrixItems: updated });
                                          }}
                                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                            isSelected
                                              ? isNonTunai
                                                ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                                                : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          <span>{cat}</span>
                                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Option 2 Points Quick Action Bar & Option Rows */}
                  {(() => {
                    const currentOpts = Array.isArray(selectedQuestion.options) && selectedQuestion.options.length > 0
                      ? selectedQuestion.options
                      : ['A. Pilihan 1', 'B. Pilihan 2', 'C. Pilihan 3', 'D. Pilihan 4'];

                    // Determine which option is currently the correct answer
                    const isOptionCorrect = (optText: string, idx: number) => {
                      const letter = String.fromCharCode(65 + idx);
                      const rawCorrect = (selectedQuestion.correctAnswer || '').trim().toUpperCase();
                      if (!rawCorrect) return false;
                      const correctTokens = rawCorrect.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
                      return correctTokens.some((tok) => {
                        if (tok === letter || tok === `${letter}.`) return true;
                        if (tok.startsWith(`${letter}.`) || tok.startsWith(`${letter}:`)) return true;
                        if (optText.trim().toUpperCase() === tok) return true;
                        const cleanOpt = optText.replace(/^[A-Z0-9]\.\s*/i, '').trim().toUpperCase();
                        return cleanOpt && tok === cleanOpt;
                      });
                    };

                    // Compute current option points with smart fallbacks
                    const currentOptionPoints = (() => {
                      if (Array.isArray(selectedQuestion.optionPoints) && selectedQuestion.optionPoints.length === currentOpts.length) {
                        return selectedQuestion.optionPoints;
                      }
                      const isScale = String(selectedQuestion.questionType).toLowerCase().includes('skala') || String(selectedQuestion.questionType).toLowerCase().includes('1-5');
                      if (isScale && currentOpts.length === 5) {
                        return [1, 2, 3, 4, 5];
                      }
                      if (currentOpts.length === 2) {
                        const cleanCorrect = String(selectedQuestion.correctAnswer || '').trim().toLowerCase();
                        if (cleanCorrect.startsWith('b') || cleanCorrect.includes('tidak') || cleanCorrect.includes('salah')) {
                          return [1, 2];
                        }
                        return [2, 1];
                      }
                      return currentOpts.map((opt, i) => isOptionCorrect(opt, i) ? (selectedQuestion.points || 10) : 0);
                    })();

                    return (
                      <div className="space-y-2.5">
                        {/* Option 2 Banner & Controls */}
                        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2 text-indigo-950">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              2
                            </span>
                            <div>
                              <span className="text-xs font-black text-indigo-900">
                                Opsi 2: Bobot Nilai per Pilihan Jawaban
                              </span>
                              <p className="text-[10px] text-indigo-700/90 font-medium">
                                Siswa yang memilih opsi tersebut akan memperoleh poin sesuai kolom <strong className="text-indigo-900">Poin</strong> di bawah.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const reversed = [...currentOptionPoints].reverse();
                                setSelectedQuestion({
                                  ...selectedQuestion,
                                  optionPoints: reversed,
                                });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-300 text-indigo-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              title="Balik urutan perolehan poin (misal [1, 2] menjadi [2, 1] atau [1..5] menjadi [5..1])"
                            >
                              <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                              <span>⇄ Balik Poin (Reverse)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const seq = currentOpts.map((_, i) => i + 1);
                                setSelectedQuestion({
                                  ...selectedQuestion,
                                  optionPoints: seq,
                                });
                              }}
                              className="px-2 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold shadow-2xs cursor-pointer transition-colors"
                              title="Atur bobot berurutan 1, 2, 3 ... N"
                            >
                              1 s.d. {currentOpts.length}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const revSeq = currentOpts.map((_, i) => currentOpts.length - i);
                                setSelectedQuestion({
                                  ...selectedQuestion,
                                  optionPoints: revSeq,
                                });
                              }}
                              className="px-2 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold shadow-2xs cursor-pointer transition-colors"
                              title="Atur bobot berurutan N ... 2, 1 (soal negatif)"
                            >
                              {currentOpts.length} s.d. 1
                            </button>
                          </div>
                        </div>

                        {/* Option Rows */}
                        <div className="space-y-2">
                          {currentOpts.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            // Preserve spaces while typing by removing .trim()
                            const cleanText = opt.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '');
                            const isCorrect = isOptionCorrect(opt, idx);
                            const optPoints = currentOptionPoints[idx] !== undefined ? currentOptionPoints[idx] : (isCorrect ? (selectedQuestion.points || 10) : 0);

                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/50'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {/* Letter Badge */}
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {letter}
                                </div>

                                {/* Option Text Input (NO TRIM on onChange to allow typing spaces freely) */}
                                <input
                                  type="text"
                                  value={cleanText}
                                  onChange={(e) => {
                                    const newText = e.target.value;
                                    const updatedOpts = [...currentOpts];
                                    updatedOpts[idx] = `${letter}. ${newText}`;
                                    
                                    // If this option is the correct answer, update correctAnswer value in sync
                                    const updatedCorrect = isCorrect
                                      ? updatedOpts[idx]
                                      : selectedQuestion.correctAnswer;

                                    setSelectedQuestion({
                                      ...selectedQuestion,
                                      options: updatedOpts,
                                      optionPoints: currentOptionPoints,
                                      correctAnswer: updatedCorrect,
                                    });
                                  }}
                                  placeholder={`Tuliskan teks untuk Pilihan ${letter}...`}
                                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-transparent border-0 focus:outline-hidden font-medium"
                                />

                                {/* Option 2: Point Weight Input */}
                                <div
                                  className="flex items-center gap-1.5 shrink-0 bg-indigo-50/80 border border-indigo-200/90 rounded-xl px-2 py-1"
                                  title={`Bobot nilai perolehan jika siswa memilih Pilihan ${letter}`}
                                >
                                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase">Poin:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={optPoints}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      const nextPts = [...currentOptionPoints];
                                      nextPts[idx] = isNaN(val) ? 0 : val;
                                      setSelectedQuestion({
                                        ...selectedQuestion,
                                        optionPoints: nextPts,
                                      });
                                    }}
                                    className="w-14 px-1 py-0.5 text-center text-xs font-black text-indigo-900 bg-white border border-indigo-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>

                                {/* Right Badge / Status */}
                                {isCorrect && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap shrink-0">
                                    ✓ Kunci Benar
                                  </span>
                                )}

                                {/* Delete Option Button */}
                                <button
                                  type="button"
                                  disabled={currentOpts.length <= 2}
                                  onClick={() => {
                                    if (currentOpts.length <= 2) return;
                                    const updatedOpts = [...currentOpts];
                                    updatedOpts.splice(idx, 1);

                                    const updatedPoints = [...currentOptionPoints];
                                    updatedPoints.splice(idx, 1);

                                    // Re-index remaining options
                                    const reindexed = updatedOpts.map((o, i) => {
                                      const newLetter = String.fromCharCode(65 + i);
                                      const rawClean = o.replace(/^[A-Z0-9]\.\s*/i, '');
                                      return `${newLetter}. ${rawClean}`;
                                    });

                                    // Re-evaluate correct answer
                                    let newCorrect = selectedQuestion.correctAnswer;
                                    if (isCorrect || !reindexed.some((o) => o.includes(newCorrect))) {
                                      newCorrect = reindexed[0] || 'A. ';
                                    }

                                    setSelectedQuestion({
                                      ...selectedQuestion,
                                      options: reindexed,
                                      optionPoints: updatedPoints,
                                      correctAnswer: newCorrect,
                                    });
                                  }}
                                  title={currentOpts.length <= 2 ? 'Minimal 2 pilihan jawaban' : `Hapus Pilihan ${letter}`}
                                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                    currentOpts.length <= 2
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Option Button */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedOpts = [...currentOpts];
                              const nextIdx = updatedOpts.length;
                              const nextLetter = String.fromCharCode(65 + nextIdx);
                              updatedOpts.push(`${nextLetter}. `);
                              const nextPoints = [...currentOptionPoints, 0];
                              setSelectedQuestion({
                                ...selectedQuestion,
                                options: updatedOpts,
                                optionPoints: nextPoints,
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Tambah Pilihan Jawaban ({String.fromCharCode(65 + currentOpts.length)})</span>
                          </button>

                          <span className="text-[11px] text-slate-400">
                            Total: <strong>{currentOpts.length} pilihan</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* KUNCI JAWABAN DROPDOWN */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-800">
                    Kunci Jawaban (Pilih Opsi yang Benar)
                  </label>
                  {selectedQuestion.questionType === 'Pengelompokan Gambar' ||
                  (Array.isArray(selectedQuestion.matrixItems) && selectedQuestion.matrixItems.length > 0) ? (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Pengelompokan Gambar ({selectedQuestion.matrixItems?.length || 0} Gambar Item)</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-300">
                          Skor Otomatis per Item
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] text-indigo-900 font-medium">
                          Setiap gambar dinilai proporsional berdasarkan kategori kunci yang Anda tentukan di atas. Total poin soal: {selectedQuestion.points || 10} poin.
                        </p>
                      </div>

                      {/* Interactive live preview */}
                      <div className="bg-slate-900 p-3 rounded-2xl text-white">
                        <div className="text-[11px] font-bold text-amber-400 mb-2 flex items-center justify-between">
                          <span>Pratinjau Layar Siswa:</span>
                          <span className="text-slate-400 font-normal">Interaktif (Klik untuk uji coba)</span>
                        </div>
                        <VisualMatrixQuestionView
                          question={selectedQuestion}
                          userAnswer={{}}
                          onChange={() => {}}
                          onPreviewImage={(img) => setPreviewImage(img)}
                          disabled={false}
                        />
                      </div>
                    </div>
                  ) : selectedQuestion.questionType === 'Skala 1-5' ? (() => {
                    const variant = detectLikertVariant(selectedQuestion.question, selectedQuestion.options);
                    const currentScaleItems = getLikertScaleItems(variant);

                    return (
                      <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                            <span>Penilaian Sikap / Karakter ({variant === 'kesal' ? 'Skala Kesal' : 'Skala Senang'} 1 s.d. 5)</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            Skor Otomatis
                          </span>
                        </div>

                        {/* Visual Preview of the 5 Likert Emoticon Options */}
                        <div className="grid grid-cols-5 gap-1.5 p-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const item = currentScaleItems[lvl];
                            let labelText = item.defaultLabel;
                            if (Array.isArray(selectedQuestion.options) && selectedQuestion.options.length === 5) {
                              const raw = selectedQuestion.options[lvl - 1] || '';
                              const clean = raw.replace(/^[0-9]\.\s*/, '').trim();
                              if (clean) labelText = clean;
                            }
                            return (
                              <div
                                key={lvl}
                                className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-slate-50 border border-slate-200 gap-1.5"
                              >
                                <LikertEmoticon level={lvl} variant={variant} size={32} />
                                <span className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-2 min-h-[24px] flex items-center justify-center">
                                  {labelText}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {variant === 'kesal'
                            ? 'Ekspresi otomatis disesuaikan (Sangat Tidak Kesal = Hijau Senyum, Sangat Kesal = Merah Cemberut). Perhitungan poin (1 s.d. 5) diproses otomatis di latar belakang tanpa ditampilkan ke siswa.'
                            : 'Siswa akan melihat 5 ekspresi emotikon di atas tanpa label angka poin agar tidak mengarahkan jawaban. Perhitungan skor (1 s.d. 5 poin) tetap dihitung otomatis oleh sistem di latar belakang.'}
                        </p>
                      </div>
                    );
                  })() : selectedQuestion.questionType.toLowerCase().includes('matriks') ||
                    selectedQuestion.questionType.toLowerCase().includes('tabel') ? (() => {
                    const parsed = parseMatrixQuestionOptions(selectedQuestion.options, selectedQuestion.question);
                    return (
                      <div className="p-3.5 rounded-2xl bg-teal-50/90 border border-teal-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>Kuesioner Tabel Matriks ({parsed.statements.length} Baris Pernyataan)</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-300">
                            Matriks Checklist
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Kunci Jawaban yang Diharapkan:
                          </label>
                          <input
                            type="text"
                            value={selectedQuestion.correctAnswer || 'Semua Ya (1)'}
                            onChange={(e) =>
                              setSelectedQuestion({
                                ...selectedQuestion,
                                correctAnswer: e.target.value,
                              })
                            }
                            placeholder="Contoh: Semua Ya (1)"
                            className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                          <p className="text-[10px] text-slate-500">
                            Setiap baris pernyataan bernilai proporsional dari total {selectedQuestion.points || 10} poin.
                          </p>
                        </div>

                        {/* Interactive mini preview */}
                        <div className="bg-slate-900 p-2.5 rounded-xl text-white">
                          <div className="text-[10px] font-bold text-amber-400 mb-1.5 flex items-center justify-between">
                            <span>Pratinjau Layar Siswa:</span>
                            <span className="text-slate-400 font-normal">{parsed.columns.map((c) => c.label).join(' | ')}</span>
                          </div>
                          <MatrixQuestionView
                            options={selectedQuestion.options}
                            questionTitle={selectedQuestion.question}
                            userAnswer={{}}
                            onChange={() => {}}
                            disabled={true}
                          />
                        </div>
                      </div>
                    );
                  })() : (() => {
                    const currentOpts = Array.isArray(selectedQuestion.options) && selectedQuestion.options.length > 0
                      ? selectedQuestion.options
                      : ['A. Pilihan 1', 'B. Pilihan 2', 'C. Pilihan 3', 'D. Pilihan 4'];

                    const isCheckbox =
                      selectedQuestion.questionType === 'Checkbox' ||
                      String(selectedQuestion.questionType).toLowerCase().includes('checkbox') ||
                      selectedQuestion.questionType === 'Multi-Select' ||
                      selectedQuestion.id === 'Q31a' ||
                      selectedQuestion.id === 'Q31b' ||
                      selectedQuestion.id === 'Q52a' ||
                      selectedQuestion.id === 'Q52b';

                    if (isCheckbox) {
                      // Checkbox question: allow selecting multiple correct answers
                      const rawCorrect = (selectedQuestion.correctAnswer || '').trim();
                      const currentTokens = rawCorrect.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

                      const isChecked = (optText: string, idx: number) => {
                        const letter = String.fromCharCode(65 + idx);
                        return currentTokens.some((tok) => {
                          const uTok = tok.toUpperCase();
                          if (uTok === letter || uTok === `${letter}.`) return true;
                          if (uTok.startsWith(`${letter}.`) || uTok.startsWith(`${letter}:`)) return true;
                          if (optText.trim().toUpperCase() === uTok) return true;
                          const cleanOpt = optText.replace(/^[A-Z0-9]\.\s*/i, '').trim().toUpperCase();
                          return cleanOpt && uTok === cleanOpt;
                        });
                      };

                      const toggleOption = (optText: string, idx: number) => {
                        const letter = String.fromCharCode(65 + idx);
                        const cleanOpt = optText.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '').trim();
                        const optLabel = cleanOpt || optText;

                        let nextTokens: string[];
                        if (isChecked(optText, idx)) {
                          // Hapus dari kunci
                          nextTokens = currentTokens.filter((tok) => {
                            const uTok = tok.toUpperCase();
                            if (uTok === letter || uTok === `${letter}.`) return false;
                            if (optText.trim().toUpperCase() === uTok) return false;
                            const c = optText.replace(/^[A-Z0-9]\.\s*/i, '').trim().toUpperCase();
                            if (c && uTok === c) return false;
                            return true;
                          });
                        } else {
                          // Tambahkan ke kunci
                          nextTokens = [...currentTokens, optLabel];
                        }

                        setSelectedQuestion({
                          ...selectedQuestion,
                          correctAnswer: nextTokens.join(', '),
                        });
                      };

                      return (
                        <div className="space-y-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Kunci Jawaban Checkbox (Boleh Centang Lebih dari Satu):</span>
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              Multi-Kunci
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentOpts.map((opt, idx) => {
                              const letter = String.fromCharCode(65 + idx);
                              const cleanText = opt.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '').trim();
                              const active = isChecked(opt, idx);

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleOption(opt, idx)}
                                  className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                                    active
                                      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs ring-1 ring-amber-400'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 font-black ${
                                      active ? 'bg-amber-600 text-white' : 'border border-slate-300 bg-slate-50 text-slate-400'
                                    }`}
                                  >
                                    {active ? '✓' : letter}
                                  </div>
                                  <span className="truncate">{cleanText || opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="pt-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                              Teks Kunci Tersimpan (Bisa diedit/diketik langsung dipisahkan koma):
                            </label>
                            <input
                              type="text"
                              value={selectedQuestion.correctAnswer || ''}
                              onChange={(e) => {
                                setSelectedQuestion({
                                  ...selectedQuestion,
                                  correctAnswer: e.target.value,
                                });
                              }}
                              placeholder="Contoh: Gambar 1, Gambar 6"
                              className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-white font-mono text-xs text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                      );
                    }

                    // Find currently active option index
                    const cleanCorrect = (selectedQuestion.correctAnswer || '').trim().toUpperCase();
                    let selectedIdx = currentOpts.findIndex((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      if (cleanCorrect === letter || cleanCorrect === `${letter}.`) return true;
                      if (cleanCorrect.startsWith(`${letter}.`) || cleanCorrect.startsWith(`${letter}:`)) return true;
                      if (opt.trim().toUpperCase() === cleanCorrect) return true;
                      const cleanOpt = opt.replace(/^[A-Z0-9]\.\s*/i, '').trim().toUpperCase();
                      return cleanOpt && cleanCorrect === cleanOpt;
                    });

                    if (selectedIdx === -1) selectedIdx = 0;

                    return (
                      <div className="grid grid-cols-1 gap-2">
                        <select
                          value={selectedIdx}
                          onChange={(e) => {
                            const chosenIdx = parseInt(e.target.value, 10);
                            const chosenOpt = currentOpts[chosenIdx];
                            setSelectedQuestion({
                              ...selectedQuestion,
                              correctAnswer: chosenOpt || `${String.fromCharCode(65 + chosenIdx)}. `,
                            });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-400 font-bold text-slate-900 bg-emerald-50/40 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        >
                          {currentOpts.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            const cleanText = opt.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '').trim();
                            return (
                              <option key={idx} value={idx}>
                                Opsi {letter} — {cleanText || `(Pilihan ${letter})`}
                              </option>
                            );
                          })}
                        </select>
                        
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                          <span>
                            Kunci tersimpan saat ini: <strong className="text-emerald-700 font-mono">{selectedQuestion.correctAnswer || currentOpts[selectedIdx]}</strong>
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                            Otomatis sinkron dengan pilihan di atas
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
                  <span>Tahap Aktif: <strong className="text-slate-800">{selectedQuestion.stage}</strong></span>
                  <span>•</span>
                  <span>Total: <strong className="text-slate-800">{selectedQuestion.options?.length || 4} Pilihan</strong></span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE QUESTION */}
      {deleteTargetId && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Butir Soal?"
          message={`Apakah kamu yakin ingin menghapus butir soal ${deleteTargetId}? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={() => handleDeleteQuestion(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {/* CONFIRM DELETE ALL */}
      {confirmDeleteAll && (
        <ConfirmDialog
          isOpen={true}
          title={`Kosongkan Bank Soal ${CLASSIFICATION_LABELS[selectedClassification]}?`}
          message="Seluruh butir soal untuk kelompok usia ini akan dihapus. Anda dapat mengimpor kembali melalui spreadsheet Excel atau mereset ke default."
          confirmLabel="Ya, Kosongkan"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={() => {
            db.deleteAllFinalMissionQuestions(selectedClassification);
            showToast(`Bank soal ${selectedClassification} berhasil dikosongkan.`, 'info');
            refreshData();
            setConfirmDeleteAll(false);
          }}
          onCancel={() => setConfirmDeleteAll(false)}
        />
      )}

      {/* CONFIRM RESET DEFAULT BI MODAL */}
      {confirmResetDefault && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    Kunci Data ke Standar Bank Indonesia
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-amber-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Instrumen Resmi Survei CBP Rupiah 2025</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConfirmResetDefault(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation */}
            <div className="text-xs text-slate-600 leading-relaxed bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5">
              Tindakan ini akan mengunci dan memulihkan seluruh butir pertanyaan kembali ke <strong>Bank Soal Kuesioner Resmi Survei Cinta Bangga Paham Rupiah Bank Indonesia 2025</strong> lengkap dengan kunci jawaban terverifikasi, pembagian 3 dimensi (Cinta, Bangga, Paham), serta kelengkapan visual.
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-3 rounded-xl border transition-colors ${selectedClassification === 'anak' ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="text-[11px] text-slate-500 font-medium">Anak-Anak</div>
                <div className="text-base font-extrabold text-indigo-600 my-0.5">{seedFinalMissionQuestionsAnak.length} Soal</div>
                <div className="text-[10px] text-slate-400">Q1 s.d Q52</div>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${selectedClassification === 'remaja' ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="text-[11px] text-slate-500 font-medium">Remaja</div>
                <div className="text-base font-extrabold text-indigo-600 my-0.5">{seedFinalMissionQuestionsRemaja.length} Soal</div>
                <div className="text-[10px] text-slate-400">Q1 s.d Q60</div>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${selectedClassification === 'dewasa' ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="text-[11px] text-slate-500 font-medium">Dewasa</div>
                <div className="text-base font-extrabold text-indigo-600 my-0.5">{seedFinalMissionQuestionsDewasa.length} Soal</div>
                <div className="text-[10px] text-slate-400">Q1 s.d Q60</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  const count = db.resetFinalMissionQuestionsToDefault(selectedClassification);
                  sounds.playFanfare();
                  showToast(`✨ Bank soal ${CLASSIFICATION_LABELS[selectedClassification]} (${count} butir) berhasil dikunci ke standar BI!`);
                  refreshData();
                  setConfirmResetDefault(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  Kunci & Reset Kategori {selectedClassification === 'anak' ? 'Anak-Anak' : selectedClassification === 'remaja' ? 'Remaja' : 'Dewasa'} ({selectedClassification === 'anak' ? seedFinalMissionQuestionsAnak.length : selectedClassification === 'remaja' ? seedFinalMissionQuestionsRemaja.length : seedFinalMissionQuestionsDewasa.length} Soal)
                </span>
              </button>

              <button
                onClick={() => {
                  const total = db.resetFinalMissionQuestionsToDefault();
                  sounds.playFanfare();
                  showToast(`✨ Seluruh ${total} butir bank soal (Anak, Remaja, Dewasa) berhasil dikunci ke standar resmi BI!`);
                  refreshData();
                  setConfirmResetDefault(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Kunci & Reset Seluruh 3 Kategori ({allSeedFinalMissionQuestions.length} Soal Lengkap)</span>
              </button>

              <button
                onClick={() => setConfirmResetDefault(false)}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer mt-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EXCEL UPLOAD DIALOG */}
      {pendingExcelFile && (
        <ConfirmDialog
          isOpen={true}
          title="Konfirmasi Upload Excel Bank Soal?"
          message={`Apakah Anda yakin ingin mengunggah file "${pendingExcelFile.name}" ke kategori ${CLASSIFICATION_LABELS[selectedClassification]}? Soal pada kategori ini akan disinkronkan dengan data baru dari file.`}
          confirmLabel="Ya, Lanjutkan Upload"
          cancelLabel="Batal"
          variant="info"
          onConfirm={() => executeExcelUpload()}
          onCancel={() => setPendingExcelFile(null)}
        />
      )}

      {/* CONFIRM SINGLE IMAGE UPLOAD DIALOG */}
      {pendingSingleImage && (
        <ConfirmDialog
          isOpen={true}
          title={
            questions.find((q) => q.id === pendingSingleImage.questionId)?.imageUrl ||
            questions.find((q) => q.id === pendingSingleImage.questionId)?.imageFileName
              ? 'Konfirmasi Ganti Foto Soal?'
              : 'Konfirmasi Upload Foto Soal?'
          }
          message={`Apakah Anda yakin ingin mengunggah dan memasang gambar "${pendingSingleImage.file.name}" untuk butir soal ${pendingSingleImage.questionId}? ${
            questions.find((q) => q.id === pendingSingleImage.questionId)?.imageUrl ||
            questions.find((q) => q.id === pendingSingleImage.questionId)?.imageFileName
              ? 'Gambar sebelumnya akan otomatis digantikan dengan file gambar baru ini.'
              : ''
          }`}
          confirmLabel={
            questions.find((q) => q.id === pendingSingleImage.questionId)?.imageUrl ||
            questions.find((q) => q.id === pendingSingleImage.questionId)?.imageFileName
              ? 'Ya, Ganti Foto'
              : 'Ya, Upload Foto'
          }
          cancelLabel="Batal"
          variant="info"
          onConfirm={() => executeSingleImageUpload()}
          onCancel={() => setPendingSingleImage(null)}
        />
      )}

      {/* CONFIRM DELETE IMAGE DIALOG */}
      {deleteImageTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Gambar Soal?"
          message={`Apakah Anda yakin ingin menghapus gambar dari butir soal ${deleteImageTarget.id}? Soal ini tidak akan lagi menampilkan gambar pendukung.`}
          confirmLabel="Ya, Hapus Gambar"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={() => handleDeleteImage()}
          onCancel={() => setDeleteImageTarget(null)}
        />
      )}

      {/* CONFIRM BULK IMAGES UPLOAD DIALOG */}
      {pendingBulkImages && (
        <ConfirmDialog
          isOpen={true}
          title="Konfirmasi Upload Sekaligus Gambar?"
          message={`Apakah Anda yakin ingin mengunggah ${pendingBulkImages.length} file gambar sekaligus? Sistem akan mencocokkan nama file dengan ID atau nama file soal di Bank Soal Misi Akhir.`}
          confirmLabel="Ya, Upload Semua Gambar"
          cancelLabel="Batal"
          variant="info"
          onConfirm={() => executeBulkImagesUpload()}
          onCancel={() => setPendingBulkImages(null)}
        />
      )}

      {/* UPLOAD SUCCESS NOTIFICATION DIALOG */}
      {uploadSuccessDialogMsg && (
        <ConfirmDialog
          isOpen={true}
          title="Upload Berhasil!"
          message={uploadSuccessDialogMsg}
          confirmLabel="OK, Selesai"
          variant="info"
          onConfirm={() => setUploadSuccessDialogMsg(null)}
          onCancel={() => setUploadSuccessDialogMsg(null)}
        />
      )}
    </div>
  );
};
