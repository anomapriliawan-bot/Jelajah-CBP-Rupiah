import React from 'react';
import {
  Layers,
  BookOpen,
  Gamepad2,
  HelpCircle,
  FileEdit,
  Clock,
  CheckCircle2,
  Globe,
  Upload,
  PlusCircle,
  Sliders,
  ShieldAlert,
  ArrowRight,
  History,
  TrendingUp,
  Award,
  Sparkles,
  Users,
  Check,
  Zap,
} from 'lucide-react';
import { db } from '../../services/db';

interface AdminDashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateMission: () => void;
  onOpenCreateQuestion: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateTab,
  onOpenCreateMission,
  onOpenCreateQuestion,
}) => {
  const stats = db.getDatabaseStats();
  const statusCounts = db.getContentStatusCounts();
  const reviewQueue = db.getReviewQueue();
  const recentLogs = db.getWorkflowLogs().slice(0, 5);
  const auditLogs = db.getAuditLogs().slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Pusat Manajemen Kurikulum & Konten Jelajah Rupiah</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel Administrator & CMS Standar Bank Indonesia
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Kelola 9 misi pembelajaran, materi tematik 3D & 5J, aktivitas interaktif, bank butir soal latihan terstandar, dan audit alur telaah reviewer.
          </p>

          {/* Quick Actions Bar */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                db.publishAllMissions('Admin Kurikulum BI');
                alert('⚡ Berhasil! Semua 9 Misi Jelajah Rupiah dan materi/soal terkait telah diaktifkan (Status: Published).');
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
              title="Aktifkan semua 9 misi sekaligus"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Aktifkan Semua Misi</span>
            </button>
            <button
              onClick={() => onNavigateTab('missions')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Kelola 9 Misi</span>
            </button>
            <button
              onClick={() => onNavigateTab('school_settings')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Profil & Logo Sistem</span>
            </button>
            <button
              onClick={() => onNavigateTab('import_excel')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Content Excel</span>
            </button>
            <button
              onClick={onOpenCreateMission}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Tambah Misi Baru</span>
            </button>
            <button
              onClick={() => onNavigateTab('questions')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Kelola Bank Soal</span>
            </button>
            <button
              onClick={() => onNavigateTab('reviewer_queue')}
              className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold border border-indigo-400/40 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-200" />
              <span>Review Content ({reviewQueue.totalPending})</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset progress belajar dan turnamen siswa untuk persiapan kelas pilot baru? (Data Master Kurikulum tetap utuh)')) {
                  db.resetStudentProgressOnly();
                  alert('Data siswa berhasil direset ke kondisi awal untuk kelas pilot baru.');
                }
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold border border-emerald-500/40 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
              title="Reset progress siswa tanpa menghapus Master Content"
            >
              <History className="w-4 h-4 text-emerald-200" />
              <span>Reset Data Siswa (Pilot)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Workflow Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Draft</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{statusCounts.draft}</p>
            <span className="text-[11px] text-slate-500">Item sedang disusun</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileEdit className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-amber-50/40">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Menunggu Review</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{statusCounts.review}</p>
            <span className="text-[11px] text-amber-800">Antrean telaah ahli</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-blue-50/40">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Approved</span>
            <p className="text-2xl font-black text-blue-800 mt-1">{statusCounts.approved}</p>
            <span className="text-[11px] text-blue-700">Telah lolos verifikasi</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Published</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{statusCounts.published}</p>
            <span className="text-[11px] text-emerald-800">Aktif & diakses siswa</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Content Counts Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Modul Master Kurikulum</h2>
            <p className="text-xs text-slate-500">Kelola rincian data per kategori konten edukasi</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Missions */}
          <div 
            onClick={() => onNavigateTab('missions')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Total Misi</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.missions} Misi</h3>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
              <span>Kelola Misi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Lessons */}
          <div 
            onClick={() => onNavigateTab('lessons')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Materi Bacaan</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.lessons} Materi</h3>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
              <span>Kelola Materi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Activities */}
          <div 
            onClick={() => onNavigateTab('activities')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Aktivitas Interaktif</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.activities} Aktivitas</h3>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-600 font-semibold">
              <span>Kelola Gamifikasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Practice Questions */}
          <div 
            onClick={() => onNavigateTab('questions')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Soal Latihan</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.practiceQuestions} Soal</h3>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-600 font-semibold">
              <span>Kelola Bank Soal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Recent Review Logs & Import Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reviewer Workflow Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Rekam Jejak Review & Publikasi</h3>
            </div>
            <button
              onClick={() => onNavigateTab('reviewer_queue')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada catatan review</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-800 truncate">{log.entityTitle}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {log.newStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{log.notes}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{log.reviewerName}</span>
                    <span>{new Date(log.timestamp).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Canonical Excel Import Audit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Riwayat Sinkronisasi Excel Master</h3>
            </div>
            <button
              onClick={() => onNavigateTab('import')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Buka Importir
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada log import</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((audit) => (
                <div key={audit.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 truncate">{audit.fileName}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {audit.statusSummary}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>Total Baris: <strong>{audit.totalRows}</strong></span>
                    <span>Dibuat: <strong className="text-emerald-600">{audit.createdCount}</strong></span>
                    <span>Diperbarui: <strong className="text-blue-600">{audit.updatedCount}</strong></span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Diimpor oleh: {audit.importedBy}</span>
                    <span>{new Date(audit.timestamp).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
