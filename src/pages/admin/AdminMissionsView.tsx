import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  History,
  Archive,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Award,
  Globe,
  FileEdit,
  Send,
  Zap,
  CheckCircle2,
  Power,
  ToggleLeft,
  ToggleRight,
  Filter,
  Search,
  BookOpen,
  Upload,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Gamepad2,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mission, ContentStatus, Badge } from '../../types';
import { db, normalizeMissionId } from '../../services/db';
import { sounds } from '../../utils/audio';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { VersionHistoryDrawer } from '../../components/admin/VersionHistoryDrawer';
import { WorkflowActionModal } from '../../components/admin/WorkflowActionModal';
import { StudentPreviewModal } from '../../components/admin/StudentPreviewModal';
import { QuickExcelImportModal } from '../../components/admin/QuickExcelImportModal';
import { ComprehensiveMissionModal } from '../../components/admin/ComprehensiveMissionModal';

export const AdminMissionsView: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>(
    db.getMissions().sort((a, b) => a.orderIndex - b.orderIndex)
  );
  const badges = db.getBadges();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWorld, setFilterWorld] = useState<string>('all');

  // Modals & Drawers States
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [comprehensiveMission, setComprehensiveMission] = useState<Mission | null>(null);
  const [isComprehensiveOpen, setIsComprehensiveOpen] = useState(false);

  const [previewMission, setPreviewMission] = useState<Mission | null>(null);
  const [historyEntity, setHistoryEntity] = useState<{ id: string; title: string } | null>(null);
  const [workflowEntity, setWorkflowEntity] = useState<{ mission: Mission } | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeactivateAll, setConfirmDeactivateAll] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isPersistingDefault, setIsPersistingDefault] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [uploadSuccessModalMsg, setUploadSuccessModalMsg] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    setMissions(db.getMissions().sort((a, b) => a.orderIndex - b.orderIndex));
  };

  const handleMakeSystemDefault = async () => {
    try {
      setIsPersistingDefault(true);
      sounds.playPop();
      const currentMissions = db.getMissions();
      if (!currentMissions || currentMissions.length === 0) {
        showToast('Tidak ada data misi yang dapat dipermanenkan.', 'info');
        setIsPersistingDefault(false);
        return;
      }

      const payload = {
        missions: currentMissions,
        lessons: db.getLessons(),
        activities: db.getActivities(),
        practiceQuestions: db.getPracticeQuestions(),
        badges: db.getBadges(),
        reflections: db.getReflections(),
        references: db.getReferences(),
        tournamentPackages: db.getTournamentPackages(),
        tournamentQuestions: db.getTournamentQuestions(),
        tournamentEvents: db.getTournamentEvents(),
      };

      // 1. Simpan langsung ke memori lokal peramban agar instan
      localStorage.setItem('jr_db_custom_default_master', JSON.stringify(payload));

      // 2. Kirim ke backend server agar tersimpan permanen di file server
      const res = await fetch('/api/set-system-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      sounds.playFanfare();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (result.success) {
        showToast(
          `✨ Berhasil! ${result.missionsCount || currentMissions.length} Misi baru telah dipermanenkan sebagai default sistem!`
        );
      } else {
        showToast(
          `✨ Data misi berhasil disimpan di memori browser sebagai default sistem!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Data misi berhasil disimpan di memori lokal peramban.', 'info');
    } finally {
      setIsPersistingDefault(false);
    }
  };

  const handleDeleteAllMissions = () => {
    sounds.playPop();
    db.deleteAllMissions();
    refreshData();
    setConfirmDeleteAll(false);
    showToast('Semua misi berhasil dihapus dari sistem.', 'info');
  };

  const handleResetDefaultMissions = () => {
    sounds.playFanfare();
    db.resetMissionsToDefault();
    refreshData();
    showToast('✨ Berhasil mereset 9 Misi Kurikulum Standar Bank Indonesia!');
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setMissions(db.getMissions().sort((a, b) => a.orderIndex - b.orderIndex));
    });
    return unsub;
  }, []);

  // Filter logic
  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesWorld = filterWorld === 'all' || m.worldId === filterWorld;
    return matchesSearch && matchesStatus && matchesWorld;
  });

  // Reorder Mission
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    sounds.playPop();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= missions.length) return;

    const newMissions = [...missions];
    const [moved] = newMissions.splice(index, 1);
    newMissions.splice(targetIndex, 0, moved);

    // Update orderIndex
    newMissions.forEach((m, idx) => {
      m.orderIndex = idx + 1;
      m.levelNumber = idx + 1;
      db.updateMission(m.id, { orderIndex: idx + 1, levelNumber: idx + 1 });
    });

    setMissions(newMissions);
    showToast(`Urutan misi berhasil diperbarui.`);
  };

  // Quick Toggle Status
  const handleToggleStatus = (m: Mission) => {
    sounds.playPop();
    const newStatus: ContentStatus = m.status === 'published' ? 'draft' : 'published';
    db.updateMissionStatus(m.id, newStatus, {
      id: 'USR-ADM-001',
      name: 'Admin Kurikulum BI',
      notes: `Status diubah ke ${newStatus}`,
    });
    refreshData();
    showToast(
      `Status "${m.code}" diubah ke ${newStatus === 'published' ? 'AKTIF (Published)' : 'DRAFT'}.`
    );
  };

  // Activate All
  const handleActivateAll = () => {
    sounds.playFanfare();
    const all = db.getMissions();
    all.forEach((m) => {
      db.updateMissionStatus(m.id, 'published', {
        id: 'USR-ADM-001',
        name: 'Admin Kurikulum BI',
        notes: 'Aktivasi seluruh misi',
      });
    });
    refreshData();
    showToast('🎉 Semua 9 Misi berhasil diaktifkan ke status Published!');
  };

  // Deactivate All
  const handleDeactivateAll = () => {
    sounds.playPop();
    const all = db.getMissions();
    all.forEach((m) => {
      db.updateMissionStatus(m.id, 'draft', {
        id: 'USR-ADM-001',
        name: 'Admin Kurikulum BI',
        notes: 'Non-aktifkan seluruh misi ke Draft',
      });
    });
    refreshData();
    setConfirmDeactivateAll(false);
    showToast('Semua misi telah diubah ke status Draft.', 'info');
  };

  // Delete Mission
  const handleDelete = (id: string) => {
    sounds.playPop();
    db.deleteMission(id);
    refreshData();
    setConfirmDeleteId(null);
    showToast('Misi berhasil dihapus dari database.');
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    try {
      sounds.playPop();
      import('../../services/excelImporter').then(({ generateCanonicalExcelWorkbook }) => {
        const buffer = generateCanonicalExcelWorkbook();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Template_Master_Kurikulum_Jelajah_Rupiah.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Template Excel Master berhasil diunduh!');
      });
    } catch (e) {
      console.error(e);
      showToast('Gagal mendownload template Excel.', 'info');
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AKTIF (PUBLISHED)
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            APPROVED
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Send className="w-3 h-3 text-amber-600" />
            REVIEW
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-500" />
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FileEdit className="w-3 h-3 text-slate-500" />
            DRAFT
          </span>
        );
    }
  };

  const publishedCount = missions.filter((m) => m.status === 'published').length;
  const draftCount = missions.filter((m) => m.status === 'draft').length;
  const reviewCount = missions.filter((m) => m.status === 'review' || m.status === 'approved').length;
  const allLessons = db.getLessons();
  const allQuestions = db.getPracticeQuestions();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Unified Hub Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Pusat Kelola Misi, Materi & Soal (Terpadu)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Satu menu lengkap untuk unggah Excel, kelola foto/cover materi per slide, modifikasi aktivitas interaktif, atur bank soal, dan aktifkan misi bagi siswa.
          </p>
        </div>

        {/* Action Buttons Hub */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* UPLOAD MASTER EXCEL BUTTON */}
          <button
            onClick={() => {
              sounds.playPop();
              setIsExcelImportOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-700/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            title="Unggah dan sinkronkan file Master Excel Kurikulum"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-300" />
            <span>Upload Excel Master</span>
          </button>

          {/* PERMANENKAN SEBAGAI DEFAULT SISTEM BUTTON */}
          <button
            onClick={handleMakeSystemDefault}
            disabled={isPersistingDefault}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-black shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-60"
            title="Kunci dan jadikan seluruh data misi yang aktif saat ini sebagai default permanen sistem"
          >
            <ShieldCheck className="w-4 h-4 text-amber-100" />
            <span>{isPersistingDefault ? 'Menyimpan...' : 'Permanenkan Sebagai Default'}</span>
          </button>

          {/* DOWNLOAD TEMPLATE EXCEL */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Template Excel Master (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template Excel</span>
          </button>

          {/* AKTIFKAN SEMUA MISI BUTTON */}
          <button
            onClick={handleActivateAll}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            title="Aktifkan semua 9 misi sekaligus ke status Published"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Aktifkan Semua</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
              {publishedCount}/{missions.length}
            </span>
          </button>

          {/* NONAKTIFKAN SEMUA */}
          {publishedCount > 0 && (
            <button
              onClick={() => setConfirmDeactivateAll(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Set semua misi ke status Draft"
            >
              <Power className="w-3.5 h-3.5 text-slate-500" />
              <span>Draft Semua</span>
            </button>
          )}

          {/* HAPUS SEMUA MISI */}
          {missions.length > 0 ? (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus seluruh misi dari database"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Semua</span>
            </button>
          ) : (
            <button
              onClick={handleResetDefaultMissions}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Kembalikan 9 Misi Standar Kurikulum Bank Indonesia"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reset 9 Misi Standar BI</span>
            </button>
          )}

          {/* TAMBAH MISI BARU */}
          <button
            onClick={() => {
              sounds.playPop();
              setComprehensiveMission(null);
              setIsComprehensiveOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Misi</span>
          </button>
        </div>
      </div>

      {/* Summary Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Misi</span>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{missions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Aktif (Siswa)</span>
            <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">
              {publishedCount} <span className="text-xs font-normal text-emerald-600">/ {missions.length}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Draft</span>
            <p className="text-xl font-black text-amber-800 font-mono mt-0.5">{draftCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <FileEdit className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Slide Materi</span>
            <p className="text-xl font-black text-blue-800 font-mono mt-0.5">{allLessons.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Soal Latihan</span>
            <p className="text-xl font-black text-purple-800 font-mono mt-0.5">{allQuestions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode, nama misi, atau topik materi..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* World Filter */}
          <select
            value={filterWorld}
            onChange={(e) => setFilterWorld(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Semua Dunia</option>
            <option value="cinta">Cinta Rupiah (3D & 5J)</option>
            <option value="bangga">Bangga Rupiah (Simbol Kedaulatan)</option>
            <option value="paham">Paham Rupiah (Hemat, Belanja, QRIS)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-500 uppercase"
          >
            <option value="all">Semua Status</option>
            <option value="published">Aktif (Published)</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Mission List Cards */}
      <div className="space-y-4">
        {missions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Database Misi Bersih (0 Misi Terdaftar)</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Seluruh misi dan materi sebelumnya telah dikosongkan. Silakan unggah file <strong>Master Excel (.xlsx)</strong> pada kotak di atas untuk mengisi kurikulum baru secara bersih tanpa penumpukan, atau pulihkan standar resmi.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleResetDefaultMissions}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Reset 9 Misi Standar BI</span>
              </button>
            </div>
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada misi yang sesuai filter</h3>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau reset filter status.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterWorld('all');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredMissions.map((m, idx) => {
            const canonicalId = normalizeMissionId(m.id || m.code);
            const badge = badges.find((b) => b.id === m.badgeRewardId || b.id === m.badgeId);
            const missionLessons = db.getLessonsByMission(canonicalId);
            const missionActivities = db.getActivitiesByMission(canonicalId);
            const missionQuestions = db.getPracticeQuestionsByMission(canonicalId);
            const isPublished = m.status === 'published';

            return (
              <div
                key={m.id}
                className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 ${
                  isPublished
                    ? 'border-emerald-200 hover:border-emerald-300 hover:shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Reorder & Number */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer"
                      title="Pindahkan ke atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === missions.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors cursor-pointer"
                      title="Pindahkan ke bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shadow-2xs border ${
                      isPublished
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {m.orderIndex}
                  </div>
                </div>

                {/* Center: Mission Info & Details */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {m.code}
                    </span>

                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-lg ${
                        m.worldId === 'cinta'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : m.worldId === 'bangga'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Dunia {m.worldId}
                    </span>

                    {/* Status Badge */}
                    {getStatusBadge(m.status)}
                  </div>

                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Cover Thumbnail */}
                    <div className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {m.imageUrl || (m as any).openingImageUrl ? (
                        <img
                          src={m.imageUrl || (m as any).openingImageUrl}
                          alt={m.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 truncate">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                        {m.subtitle || m.storyOpening || (m as any).openingStory || 'Petualangan edukatif jelajah rupiah.'}
                      </p>
                    </div>
                  </div>

                  {/* Modules Summary Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{missionLessons.length} Slide Materi</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>{missionActivities.length} Aktivitas</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{missionQuestions.length} Soal Latihan</span>
                    </div>

                    {badge && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-bold">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lencana: {badge.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                  {/* Quick Status Toggle Button */}
                  <button
                    onClick={() => handleToggleStatus(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPublished
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                    title={isPublished ? 'Klik untuk nonaktifkan (ubah ke Draft)' : 'Klik untuk publikasikan misi'}
                  >
                    {isPublished ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>Draft</span>
                      </>
                    )}
                  </button>

                  {/* PREVIEW BUTTON */}
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setPreviewMission(m);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Preview Mode Siswa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* RIWAYAT VERSI */}
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setHistoryEntity({ id: m.id, title: m.title });
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Riwayat Versi"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  {/* UNIFIED COMPREHENSIVE EDIT BUTTON */}
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setComprehensiveMission(m);
                      setIsComprehensiveOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    title="Edit lengkap info, materi, foto slide, aktivitas, dan bank soal"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Kelola Lengkap</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setConfirmDeleteId(m.id);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Hapus Misi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK EXCEL IMPORT MODAL */}
      <QuickExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportSuccess={(msg) => {
          refreshData();
          showToast(msg);
          setUploadSuccessModalMsg(msg);
        }}
      />

      {/* COMPREHENSIVE MISSION & CONTENT EDITOR MODAL */}
      <ComprehensiveMissionModal
        mission={comprehensiveMission}
        isOpen={isComprehensiveOpen}
        onClose={() => {
          setIsComprehensiveOpen(false);
          setComprehensiveMission(null);
        }}
        onSaved={(msg) => {
          refreshData();
          showToast(msg);
        }}
      />

      {/* STUDENT PREVIEW MODAL */}
      {previewMission && (
        <StudentPreviewModal
          isOpen={true}
          onClose={() => setPreviewMission(null)}
          lesson={db.getLessonsByMission(previewMission.id)[0]}
        />
      )}

      {/* VERSION HISTORY DRAWER */}
      {historyEntity && (
        <VersionHistoryDrawer
          isOpen={true}
          onClose={() => setHistoryEntity(null)}
          entityId={historyEntity.id}
          entityTitle={historyEntity.title}
          entityType="mission"
        />
      )}

      {/* WORKFLOW MODAL */}
      {workflowEntity && (
        <WorkflowActionModal
          isOpen={true}
          onClose={() => setWorkflowEntity(null)}
          entityId={workflowEntity.mission.id}
          entityTitle={workflowEntity.mission.title}
          entityType="mission"
          currentStatus={workflowEntity.mission.status}
          onApplyAction={(targetStatus, reviewerInfo) => {
            db.updateMissionStatus(workflowEntity.mission.id, targetStatus, reviewerInfo);
            refreshData();
            setWorkflowEntity(null);
            showToast(`Status misi diperbarui menjadi ${targetStatus}.`);
          }}
        />
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Hapus Misi Pembelajaran?"
        message="Misi yang dihapus tidak akan dapat diakses siswa. Pastikan tidak ada data ketergantungan yang masih aktif."
        confirmLabel="Ya, Hapus Misi"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* CONFIRM DEACTIVATE ALL DIALOG */}
      <ConfirmDialog
        isOpen={confirmDeactivateAll}
        title="Nonaktifkan Semua Misi?"
        message="Semua misi yang aktif akan diubah statusnya menjadi Draft sehingga sementara tidak tampil bagi siswa."
        confirmLabel="Ya, Nonaktifkan Semua"
        variant="warning"
        onConfirm={handleDeactivateAll}
        onCancel={() => setConfirmDeactivateAll(false)}
      />

      {/* CONFIRM DELETE ALL DIALOG */}
      <ConfirmDialog
        isOpen={confirmDeleteAll}
        title="Hapus SEMUA Misi?"
        message="Tindakan ini akan menghapus seluruh misi dari database. Anda dapat mengunggah kembali file Excel Master atau menekan tombol 'Reset 9 Misi Standar BI' kapan saja."
        confirmLabel="Ya, Hapus Semua Misi"
        variant="danger"
        onConfirm={handleDeleteAllMissions}
        onCancel={() => setConfirmDeleteAll(false)}
      />

      {/* UPLOAD SUCCESS NOTIFICATION DIALOG */}
      <ConfirmDialog
        isOpen={!!uploadSuccessModalMsg}
        title="Upload & Sinkronisasi Berhasil!"
        message={uploadSuccessModalMsg || 'Data kurikulum misi berhasil diimpor dan disimpan ke database.'}
        confirmLabel="OK, Selesai"
        variant="info"
        onConfirm={() => setUploadSuccessModalMsg(null)}
        onCancel={() => setUploadSuccessModalMsg(null)}
      />
    </div>
  );
};
