import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  History,
  Send,
  Globe,
  FileEdit,
  CheckCircle,
  Archive,
  Image as ImageIcon,
  Clock,
  Sparkles,
  X,
  Save,
  Filter,
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Film,
  ArrowRight,
  ChevronRight,
  Layers,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { Lesson, ContentStatus } from '../../types';
import { db, normalizeMissionId } from '../../services/db';
import { compressImageFile } from '../../utils/imageCompressor';
import { sounds } from '../../utils/audio';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { VersionHistoryDrawer } from '../../components/admin/VersionHistoryDrawer';
import { WorkflowActionModal } from '../../components/admin/WorkflowActionModal';
import { StudentPreviewModal } from '../../components/admin/StudentPreviewModal';
import { BatchImageUploadModal } from '../../components/admin/BatchImageUploadModal';
import { uploadDataUrlToServer, deleteImageFromServer } from '../../services/uploadService';

export const AdminLessonsView: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>(
    db.getLessons().sort((a, b) => (a.contentOrder || a.orderIndex) - (b.contentOrder || b.orderIndex))
  );
  const missions = db.getMissions();

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setLessons(db.getLessons().sort((a, b) => (a.contentOrder || a.orderIndex) - (b.contentOrder || b.orderIndex)));
    });
    return () => unsub();
  }, []);

  // View Mode: 'storyboard' (Solusi 1) or 'grid' (Semua Materi)
  const [viewMode, setViewMode] = useState<'storyboard' | 'grid'>('storyboard');
  const [activeStoryboardMissionId, setActiveStoryboardMissionId] = useState<string>('JR-C01');

  // Filter States (for Grid mode)
  const [selectedMissionFilter, setSelectedMissionFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [historyEntity, setHistoryEntity] = useState<{ id: string; title: string } | null>(null);
  const [workflowEntity, setWorkflowEntity] = useState<{ lesson: Lesson } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' } | null>(null);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    missionId: string;
    title: string;
    content: string;
    studentText: string;
    imageBrief: string;
    interactionPrompt: string;
    readTimeMinutes: number;
    orderIndex: number;
    status: ContentStatus;
    imageUrl: string;
    imageCaption: string;
    keyTakeaway: string;
    gradeScope: string;
    section1Title: string;
    section1Content: string;
    section2Title: string;
    section2Content: string;
  }>({
    code: '',
    missionId: 'JR-C01',
    title: '',
    content: '',
    studentText: '',
    imageBrief: '',
    interactionPrompt: '',
    readTimeMinutes: 3,
    orderIndex: 1,
    status: 'draft',
    imageUrl: '',
    imageCaption: '',
    keyTakeaway: '',
    gradeScope: 'Semua Tingkat',
    section1Title: 'Pengenalan Ciri Keaslian',
    section1Content: '',
    section2Title: 'Langkah Praktik Siswa',
    section2Content: '',
  });

  const refreshData = () => {
    setLessons(db.getLessons().sort((a, b) => (a.contentOrder || a.orderIndex) - (b.contentOrder || b.orderIndex)));
  };

  const handleUploadImageForLesson = async (
    lesson: Lesson,
    file: File,
    cardNumber: number
  ) => {
    try {
      setUploadingCardId(lesson.id);
      const res = await compressImageFile(file, 860, 0.76);
      if (!res.dataUrl) {
        showToast('Gagal memproses gambar.', 'info');
        return;
      }

      // Upload physically to server (/public/images/lessons/)
      const serverRes = await uploadDataUrlToServer(file.name, res.dataUrl, 'lessons');
      const savedUrl = serverRes?.success && serverRes?.url ? serverRes.url : res.dataUrl;

      const canonicalMission = normalizeMissionId(lesson.missionId);
      const cardOrder = Number(lesson.contentOrder || lesson.orderIndex || cardNumber);

      // 1. Optimistic instant state update
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lesson.id ||
          l.code === lesson.code ||
          (normalizeMissionId(l.missionId) === canonicalMission &&
            Number(l.contentOrder || l.orderIndex) === cardOrder)
            ? { ...l, imageUrl: savedUrl, image_url: savedUrl }
            : l
        )
      );

      // 2. Persist to DB service & local storage
      db.updateLesson(
        lesson.id,
        {
          imageUrl: savedUrl,
          missionId: canonicalMission,
          contentOrder: cardOrder,
          orderIndex: cardOrder,
        },
        'Admin Kurikulum',
        `Update gambar kartu ${cardNumber}: ${lesson.title}`
      );

      refreshData();
      sounds.playSuccess();
      showToast(`Gambar Kartu ${cardNumber} berhasil disimpan permanen di sistem!`);
    } catch (err) {
      console.error('Error uploading image:', err);
      showToast('Gagal mengunggah gambar. Silakan coba lagi.', 'info');
    } finally {
      setUploadingCardId(null);
    }
  };

  const handleDeleteImageForLesson = async (lesson: Lesson, cardNumber: number) => {
    const canonicalMission = normalizeMissionId(lesson.missionId);
    const cardOrder = Number(lesson.contentOrder || lesson.orderIndex || cardNumber);

    // If file was stored on server, remove it
    if (lesson.imageUrl && lesson.imageUrl.startsWith('/images/')) {
      await deleteImageFromServer(lesson.imageUrl);
    }

    // 1. Optimistic state update
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lesson.id ||
        l.code === lesson.code ||
        (normalizeMissionId(l.missionId) === canonicalMission &&
          Number(l.contentOrder || l.orderIndex) === cardOrder)
          ? { ...l, imageUrl: '', image_url: '' }
          : l
      )
    );

    // 2. Persist to DB service
    db.updateLesson(
      lesson.id,
      {
        imageUrl: '',
        missionId: canonicalMission,
        contentOrder: cardOrder,
        orderIndex: cardOrder,
      },
      'Admin Kurikulum',
      `Hapus gambar kartu ${cardNumber}: ${lesson.title}`
    );

    refreshData();
    showToast(`Gambar Kartu ${cardNumber} dihapus.`, 'info');
  };

  const handleOpenCreate = () => {
    const nextOrder = lessons.length + 1;
    const nextCode = `MAT-${String(nextOrder).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      missionId: missions[0]?.id || 'JR-C01',
      title: '',
      content: '',
      studentText: '',
      imageBrief: '',
      interactionPrompt: '',
      readTimeMinutes: 3,
      orderIndex: nextOrder,
      status: 'draft',
      imageUrl: '',
      imageCaption: '',
      keyTakeaway: '',
      gradeScope: 'Semua Tingkat',
      section1Title: 'Konsep Dasar & Regulasi BI',
      section1Content: '',
      section2Title: 'Praktik Lapangan Siswa',
      section2Content: '',
    });
    setEditingLesson(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (l: Lesson) => {
    setEditingLesson(l);
    setFormData({
      code: l.code,
      missionId: l.missionId,
      title: l.title,
      content: l.studentText || l.content,
      studentText: l.studentText || l.content,
      imageBrief: l.imageBrief || l.imageCaption || '',
      interactionPrompt: l.interactionPrompt || '',
      readTimeMinutes: l.readTimeMinutes || 3,
      orderIndex: l.contentOrder || l.orderIndex,
      status: l.status,
      imageUrl: l.imageUrl || '',
      imageCaption: l.imageCaption || '',
      keyTakeaway: l.keyTakeaway || '',
      gradeScope: l.gradeScope || 'Semua Tingkat',
      section1Title: l.sections?.[0]?.title || 'Konsep Dasar & Regulasi BI',
      section1Content: l.sections?.[0]?.content || '',
      section2Title: l.sections?.[1]?.title || 'Praktik Lapangan Siswa',
      section2Content: l.sections?.[1]?.content || '',
    });
    setIsCreateOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Smart Curriculum File Parser & Auto Reconcile
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setIsReconciling(true);
        const text = event.target?.result as string;
        let parsedLessons: Partial<Lesson>[] = [];

        // Check if JSON
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          parsedLessons = Array.isArray(json) ? json : json.lessons || json.materi || [];
        } else {
          // CSV / TSV / Excel text format parsing
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
            const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(separator).map((c) => c.trim().replace(/^"|"$/g, ''));
              if (cols.length < 2) continue;

              const row: any = {};
              headers.forEach((h, idx) => {
                row[h] = cols[idx] || '';
              });

              // Smart field normalization
              const missionId = row.misi || row.mission || row.missionid || row.kode_misi || row['kode misi'] || 'JR-C01';
              const cardOrder = Number(row.urutan || row.order || row.kartu || row.nomor_kartu || row['nomor kartu'] || i);
              const title = row.judul || row.title || row.nama || row['judul materi'] || `Materi Kartu ${cardOrder}`;
              const studentText = row.isi || row.materi || row.text || row.studenttext || row.penjelasan || row['isi materi'] || '';
              const keyTakeaway = row.kesimpulan || row.takeaway || row.prompt || row.keytakeaway || '';
              const code = row.kode || row.code || `MAT-${String(i).padStart(3, '0')}`;

              parsedLessons.push({
                code,
                missionId,
                contentOrder: cardOrder,
                orderIndex: cardOrder,
                title,
                studentText,
                content: studentText,
                keyTakeaway,
                keyTakeaways: keyTakeaway ? [keyTakeaway] : [],
                summary: row.ringkasan || row.summary || '',
                status: 'published',
              });
            }
          }
        }

        if (parsedLessons.length > 0) {
          const res = db.reconcileLessons(parsedLessons, 'Unggah Dokumen Materi');
          refreshData();
          showToast(`⚡ Sinkronisasi Selesai! ${res.updated} diperbarui, ${res.added} kartu baru ditambahkan, ${res.preserved} materi tetap terjaga.`);
        } else {
          showToast('Format berkas tidak dikenali atau kosong. Silakan gunakan format Excel/CSV/JSON.', 'info');
        }
      } catch (err) {
        console.error('Error importing curriculum:', err);
        showToast('Gagal memproses berkas materi.', 'info');
      } finally {
        setIsReconciling(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    const sections = [];
    if (formData.section1Title && formData.section1Content) {
      sections.push({ title: formData.section1Title, content: formData.section1Content });
    }
    if (formData.section2Title && formData.section2Content) {
      sections.push({ title: formData.section2Title, content: formData.section2Content });
    }

    const payload: Partial<Lesson> = {
      code: formData.code,
      missionId: formData.missionId,
      title: formData.title,
      content: formData.studentText || formData.content,
      studentText: formData.studentText || formData.content,
      imageBrief: formData.imageBrief,
      interactionPrompt: formData.interactionPrompt,
      readTimeMinutes: Number(formData.readTimeMinutes),
      orderIndex: Number(formData.orderIndex),
      contentOrder: Number(formData.orderIndex),
      status: formData.status,
      imageUrl: formData.imageUrl,
      imageCaption: formData.imageCaption || formData.imageBrief,
      keyTakeaway: formData.keyTakeaway,
      gradeScope: formData.gradeScope,
      sections,
    };

    if (editingLesson) {
      db.updateLesson(
        editingLesson.id,
        payload,
        'Admin Kurikulum BI',
        `Pembaruan materi ${formData.code}: ${formData.title}`
      );
      showToast(`Materi "${formData.title}" berhasil diperbarui!`);
    } else {
      db.createLesson(payload as Omit<Lesson, 'id'>);
      showToast(`Materi baru "${formData.title}" berhasil dibuat!`);
    }

    refreshData();
    setIsCreateOpen(false);
    setEditingLesson(null);
  };

  const handleDelete = (id: string) => {
    db.deleteLesson(id);
    refreshData();
    setConfirmDeleteId(null);
    showToast('Materi berhasil dihapus.', 'info');
  };

  // Filtered Lessons
  const filteredLessons = lessons.filter((l) => {
    if (selectedMissionFilter !== 'all' && l.missionId !== selectedMissionFilter) return false;
    if (selectedGradeFilter !== 'all' && l.gradeScope && l.gradeScope !== selectedGradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchCode = l.code.toLowerCase().includes(q);
      const matchContent = l.content.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchContent) return false;
    }
    return true;
  });

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Published</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">Approved</span>;
      case 'review':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Review</span>;
      case 'archived':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">Archived</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">Draft</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Kelola Materi Belajar (Lessons)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Susun dan pasang gambar kartu materi per alur misi dengan tampilan Papan Cerita (Storyboard) atau daftar umum.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Hidden File Input for Excel/CSV/JSON Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .tsv, .txt, .json, .xlsx, .xls"
            className="hidden"
          />

          {/* Smart Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isReconciling}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unggah berkas Excel / CSV kurikulum materi untuk sinkronisasi otomatis"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>{isReconciling ? 'Menyelaraskan...' : 'Unggah Materi (Excel/CSV)'}</span>
          </button>

          {/* Batch Image Upload Button */}
          <button
            onClick={() => setIsBatchUploadOpen(true)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unggah banyak gambar ilustrasi materi sekaligus"
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Unggah Gambar Massal</span>
          </button>

          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('storyboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'storyboard'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Papan Cerita (Storyboard)</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semua Materi</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Materi Baru</span>
          </button>
        </div>
      </div>

      {/* STORYBOARD VIEW MODE */}
      {viewMode === 'storyboard' && (
        <div className="space-y-6">
          {/* Mission Selector Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Pilih Misi untuk Mengatur Alur Kartu:
              </span>
              <span className="text-[11px] text-slate-400">Total {missions.length} Misi Tersedia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {missions.map((m) => {
                const missionLessons = lessons
                  .filter((l) => l.missionId === m.id || l.missionId === m.code)
                  .sort((a, b) => (a.contentOrder || a.orderIndex) - (b.contentOrder || b.orderIndex));
                const totalCards = missionLessons.length;
                const imagesCount = missionLessons.filter((l) => l.imageUrl && l.imageUrl.trim() !== '').length;
                const isSelected = activeStoryboardMissionId === m.id || activeStoryboardMissionId === m.code;

                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveStoryboardMissionId(m.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {m.code}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          imagesCount === totalCards && totalCards > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : imagesCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {imagesCount}/{totalCards} Visual
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{m.title}</h4>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>{totalCards} Kartu Materi</span>
                      <span className="font-semibold text-emerald-700 capitalize">Dunia {m.worldId}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Mission Storyboard Track */}
          {(() => {
            const currentMission = missions.find(
              (m) => m.id === activeStoryboardMissionId || m.code === activeStoryboardMissionId
            ) || missions[0];

            if (!currentMission) return null;

            const missionLessons = lessons
              .filter((l) => l.missionId === currentMission.id || l.missionId === currentMission.code)
              .sort((a, b) => (a.contentOrder || a.orderIndex) - (b.contentOrder || b.orderIndex));

            return (
              <div className="space-y-4">
                {/* Active Mission Banner */}
                <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">
                        {currentMission.code}
                      </span>
                      <span className="bg-emerald-500/40 text-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded capitalize">
                        Dunia {currentMission.worldId}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">{currentMission.title}</h3>
                    <p className="text-xs text-emerald-100/90 max-w-2xl">{currentMission.summary || currentMission.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      const nextOrder = missionLessons.length + 1;
                      const nextCode = `MAT-${String(nextOrder).padStart(3, '0')}`;
                      setFormData({
                        code: nextCode,
                        missionId: currentMission.id,
                        title: `Kartu ${nextOrder}: `,
                        content: '',
                        studentText: '',
                        imageBrief: '',
                        interactionPrompt: '',
                        readTimeMinutes: 3,
                        orderIndex: nextOrder,
                        status: 'published',
                        imageUrl: '',
                        imageCaption: '',
                        keyTakeaway: '',
                        gradeScope: 'Semua Tingkat',
                        section1Title: 'Konsep Dasar & Regulasi BI',
                        section1Content: '',
                        section2Title: 'Praktik Lapangan Siswa',
                        section2Content: '',
                      });
                      setEditingLesson(null);
                      setIsCreateOpen(true);
                    }}
                    className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kartu di Misi Ini</span>
                  </button>
                </div>

                {/* Cards Sequence Track */}
                {missionLessons.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Kartu Materi di Misi Ini</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Klik tombol &quot;Tambah Kartu di Misi Ini&quot; untuk membuat kartu pertama dalam alur belajar siswa.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {missionLessons.map((lesson, idx) => {
                      const cardNumber = lesson.contentOrder || lesson.orderIndex || (idx + 1);

                      return (
                        <div
                          key={lesson.id}
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 p-5 shadow-xs transition-all flex flex-col justify-between relative overflow-hidden"
                        >
                          {/* Card Order Badge Top Header */}
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-900 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                                  Kartu {cardNumber}
                                </span>
                                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {lesson.code}
                                </span>
                              </div>
                              {getStatusBadge(lesson.status)}
                            </div>

                            {/* Direct Image Frame with Fast Upload */}
                            <div>
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  Gambar Kartu {cardNumber}
                                </span>
                                {lesson.imageUrl ? (
                                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-600 font-bold">Belum Ada Gambar</span>
                                )}
                              </div>

                              {lesson.imageUrl && lesson.imageUrl.trim() !== '' ? (
                                <div className="space-y-2">
                                  <div className="w-full h-44 bg-slate-900/5 rounded-xl border border-slate-200 overflow-hidden relative group">
                                    <img
                                      src={lesson.imageUrl}
                                      alt={lesson.title}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-contain p-1"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <label className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Ganti Gambar</span>
                                        <input
                                          type="file"
                                          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadImageForLesson(lesson, file, cardNumber);
                                          }}
                                        />
                                      </label>
                                      <button
                                        onClick={() => handleDeleteImageForLesson(lesson, cardNumber)}
                                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                                        title="Hapus Gambar"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Quick Buttons below image */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <label className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer">
                                      <Upload className="w-3 h-3" />
                                      <span>Ganti File Gambar</span>
                                      <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleUploadImageForLesson(lesson, file, cardNumber);
                                        }}
                                      />
                                    </label>
                                    <button
                                      onClick={() => handleDeleteImageForLesson(lesson, cardNumber)}
                                      className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus Gambar</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith('image/')) {
                                      handleUploadImageForLesson(lesson, file, cardNumber);
                                    }
                                  }}
                                  className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                                    uploadingCardId === lesson.id
                                      ? 'border-emerald-500 bg-emerald-50 animate-pulse'
                                      : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40'
                                  }`}
                                >
                                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                                    <Upload className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">
                                    {uploadingCardId === lesson.id ? 'Sedang Memproses...' : 'Tarik / Klik Unggah Gambar'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    Pasang gambar khusus untuk Kartu {cardNumber}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadImageForLesson(lesson, file, cardNumber);
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Text Details */}
                            <div className="space-y-1 pt-1">
                              <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                                {lesson.title}
                              </h4>
                              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                                {lesson.studentText || lesson.content}
                              </p>
                            </div>

                            {lesson.imageBrief && (
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                                <span className="font-bold text-slate-700 block mb-0.5">Caption/Panduan:</span>
                                <span className="line-clamp-2">{lesson.imageBrief}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                            <button
                              onClick={() => setPreviewLesson(lesson)}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg flex items-center gap-1"
                              title="Pratinjau Siswa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Pratinjau</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setWorkflowEntity({ lesson })}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                                title="Alur Status"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setHistoryEntity({ id: lesson.id, title: lesson.title })}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                                title="Riwayat Versi"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(lesson)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1"
                                title="Edit Teks & Data"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit Teks</span>
                              </button>

                              <button
                                onClick={() => setConfirmDeleteId(lesson.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus Kartu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* GRID VIEW MODE (Semua Materi) */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari materi atau kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedMissionFilter}
                onChange={(e) => setSelectedMissionFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="all">Semua Misi (1-9)</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.title.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
            >
              <option value="all">Semua Jenjang</option>
              <option value="Semua Tingkat">Semua Tingkat</option>
              <option value="SD Kelas 4">SD Kelas 4</option>
              <option value="SD Kelas 5">SD Kelas 5</option>
              <option value="SD Kelas 6">SD Kelas 6</option>
            </select>
          </div>

          {/* Lesson List Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => {
              const mission = missions.find((m) => m.id === lesson.missionId || m.code === lesson.missionId);

              return (
                <div
                  key={lesson.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {lesson.code}
                      </span>
                      {getStatusBadge(lesson.status)}
                    </div>

                    {lesson.imageUrl && lesson.imageUrl.trim() !== '' ? (
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                        <img
                          src={lesson.imageUrl}
                          alt={lesson.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 bg-slate-900/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {lesson.gradeScope || 'Semua Tingkat'}
                        </span>

                        {/* Quick Replace / Delete Overlays on Hover */}
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <label className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1 transition-all">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ganti</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadImageForLesson(lesson, file, lesson.contentOrder || lesson.orderIndex || 1);
                                }
                              }}
                            />
                          </label>
                          <button
                            onClick={() => handleDeleteImageForLesson(lesson, lesson.contentOrder || lesson.orderIndex || 1)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1 transition-all"
                            title="Hapus gambar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            handleUploadImageForLesson(lesson, file, lesson.contentOrder || lesson.orderIndex || 1);
                          }
                        }}
                        className="w-full h-24 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-dashed border-slate-300 hover:border-emerald-500 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-700 text-xs font-semibold cursor-pointer transition-all p-3 text-center group"
                      >
                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-[11px]">
                          {uploadingCardId === lesson.id ? 'Mengunggah...' : 'Klik / Tarik Gambar ke Sini'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadImageForLesson(lesson, file, lesson.contentOrder || lesson.orderIndex || 1);
                            }
                          }}
                        />
                      </label>
                    )}

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        {mission ? `${mission.code} • ${mission.title}` : lesson.missionId}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                        {lesson.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {lesson.studentText || lesson.content}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {lesson.readTimeMinutes || 3} Menit
                      </span>
                      {lesson.keyTakeaway && (
                        <span className="text-amber-700 font-semibold truncate flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Poin Kunci Ada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewLesson(lesson)}
                      className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg flex items-center gap-1"
                      title="Pratinjau Siswa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setWorkflowEntity({ lesson })}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                        title="Alur Status"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setHistoryEntity({ id: lesson.id, title: lesson.title })}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        title="Riwayat Versi"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(lesson)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                        title="Edit Materi"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(lesson.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT LESSON MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {editingLesson ? `Edit Materi (${formData.code})` : 'Tambah Materi Belajar Baru'}
                </h3>
                <p className="text-xs text-slate-500">Tulis teks bacaan, tentukan visual, dan jenjang kelas</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode Materi</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Misi Terkait</label>
                    <select
                      value={formData.missionId}
                      onChange={(e) => setFormData({ ...formData, missionId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      {missions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.title.slice(0, 20)}...
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang Sasaran</label>
                    <select
                      value={formData.gradeScope}
                      onChange={(e) => setFormData({ ...formData, gradeScope: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Semua Tingkat">Semua Tingkat</option>
                      <option value="SD Kelas 4">SD Kelas 4</option>
                      <option value="SD Kelas 5">SD Kelas 5</option>
                      <option value="SD Kelas 6">SD Kelas 6</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Materi Pembelajaran (title)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Contoh: Mengenal Uang Kertas & Logam TE 2022"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teks Materi Siswa (student_text) <span className="text-blue-600 font-extrabold">*Isi Utama Materi Siswa</span>
                  </label>
                  <textarea
                    rows={5}
                    value={formData.studentText || formData.content}
                    onChange={(e) => setFormData({ ...formData, studentText: e.target.value, content: e.target.value })}
                    required
                    placeholder="Tuliskan penjelasan materi lengkap yang ramah anak..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prompt Interaksi / Refleksi Siswa (interaction_prompt)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.interactionPrompt || formData.keyTakeaway}
                    onChange={(e) => setFormData({ ...formData, interactionPrompt: e.target.value, keyTakeaway: e.target.value })}
                    placeholder="Contoh: Mengapa kita harus merawat uang Rupiah dengan 5J? Ceritakan ke teman sebangkumu!"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Gambar Materi Edukasi (image_url)</span>
                      <span className="text-[10px] text-blue-600 font-medium">Unggah Langsung File Gambar</span>
                    </label>

                    {formData.imageUrl && formData.imageUrl.trim() !== '' ? (
                      <div className="relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row items-center gap-3.5">
                        <div className="w-full sm:w-44 h-32 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center p-1 overflow-hidden shrink-0">
                          <img
                            src={formData.imageUrl}
                            alt="Preview Gambar Materi"
                            className="w-full h-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 text-left w-full">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Gambar Materi Terpasang</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Ganti Gambar</span>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const res = await compressImageFile(file, 960, 0.8);
                                      if (res.dataUrl) {
                                        setFormData({ ...formData, imageUrl: res.dataUrl });
                                      }
                                    } catch {
                                      // fallback
                                    }
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, imageUrl: '' })}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            try {
                              const res = await compressImageFile(file, 960, 0.8);
                              if (res.dataUrl) {
                                setFormData({ ...formData, imageUrl: res.dataUrl });
                              }
                            } catch {
                              // fallback
                            }
                          }
                        }}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Klik untuk memilih gambar materi atau seret file ke sini
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Otomatis dikompresi agar ringan, tajam, dan cepat dimuat (PNG, JPG, WebP, SVG)
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const res = await compressImageFile(file, 1200, 0.85);
                                setFormData({ ...formData, imageUrl: res.dataUrl });
                              } catch {
                                // fallback
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Brief Ilustrator / Caption (image_brief)
                    </label>
                    <input
                      type="text"
                      value={formData.imageBrief || formData.imageCaption}
                      onChange={(e) => setFormData({ ...formData, imageBrief: e.target.value, imageCaption: e.target.value })}
                      placeholder="Brief panduan visual untuk ilustrator / Admin..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Sub-sections */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800">Bagian Tambahan (Sections)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Judul Bagian 1"
                        value={formData.section1Title}
                        onChange={(e) => setFormData({ ...formData, section1Title: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg mb-1.5 font-semibold"
                      />
                      <textarea
                        rows={2}
                        placeholder="Isi Bagian 1..."
                        value={formData.section1Content}
                        onChange={(e) => setFormData({ ...formData, section1Content: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Judul Bagian 2"
                        value={formData.section2Title}
                        onChange={(e) => setFormData({ ...formData, section2Title: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg mb-1.5 font-semibold"
                      />
                      <textarea
                        rows={2}
                        placeholder="Isi Bagian 2..."
                        value={formData.section2Content}
                        onChange={(e) => setFormData({ ...formData, section2Content: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Kunci / Interaction Prompt (Key Takeaway)</label>
                  <input
                    type="text"
                    value={formData.keyTakeaway}
                    onChange={(e) => setFormData({ ...formData, keyTakeaway: e.target.value })}
                    placeholder="Pesan ringkas penting yang disampaikan maskot Rupi..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Waktu Baca (Menit)</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={formData.readTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, readTimeMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Materi</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-bold"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Materi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Preview Modal */}
      {previewLesson && (
        <StudentPreviewModal
          isOpen={true}
          onClose={() => setPreviewLesson(null)}
          lesson={previewLesson}
        />
      )}

      {/* Version History Drawer */}
      {historyEntity && (
        <VersionHistoryDrawer
          isOpen={true}
          onClose={() => setHistoryEntity(null)}
          entityId={historyEntity.id}
          entityTitle={historyEntity.title}
          entityType="lesson"
        />
      )}

      {/* Workflow Modal */}
      {workflowEntity && (
        <WorkflowActionModal
          isOpen={true}
          onClose={() => setWorkflowEntity(null)}
          entityId={workflowEntity.lesson.id}
          entityTitle={workflowEntity.lesson.title}
          entityType="lesson"
          currentStatus={workflowEntity.lesson.status}
          onApplyAction={(targetStatus, reviewerInfo) => {
            db.updateLessonStatus(workflowEntity.lesson.id, targetStatus, reviewerInfo);
            refreshData();
            setWorkflowEntity(null);
          }}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Hapus Materi Pembelajaran?"
        message="Materi ini akan dihapus dari daftar. Siswa tidak akan dapat membaca materi ini di dalam misi."
        confirmLabel="Ya, Hapus Materi"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Batch Image Upload Modal */}
      <BatchImageUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        lessons={lessons}
        missions={missions}
        onSuccess={(count) => {
          refreshData();
          showToast(`${count} gambar kartu materi berhasil diunggah & disimpan!`);
        }}
      />
    </div>
  );
};
