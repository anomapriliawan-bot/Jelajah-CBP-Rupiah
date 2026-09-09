import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Gamepad2,
  BookOpen,
  Sparkles,
  Search,
  Filter,
  Layers,
  FileCheck2,
  Trash2,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { AdminQuestionsView } from './AdminQuestionsView';
import { AdminActivitiesView } from './AdminActivitiesView';

export type QuestionSubTab = 'practice' | 'interactive';

interface AdminQuestionsHubViewProps {
  initialSubTab?: QuestionSubTab;
  onNavigateToMissions?: () => void;
}

export const AdminQuestionsHubView: React.FC<AdminQuestionsHubViewProps> = ({
  initialSubTab = 'practice',
  onNavigateToMissions,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<QuestionSubTab>(initialSubTab);
  const [practiceCount, setPracticeCount] = useState(db.getPracticeQuestions().length);
  const [activityCount, setActivityCount] = useState(db.getActivities().length);

  // Dialogs
  const [confirmDeleteQuestions, setConfirmDeleteQuestions] = useState(false);
  const [confirmResetQuestions, setConfirmResetQuestions] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshCounts = () => {
    setPracticeCount(db.getPracticeQuestions().length);
    setActivityCount(db.getActivities().length);
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshCounts();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('activit')) {
        setActiveSubTab('interactive');
      } else if (hash.includes('question') || hash.includes('practice')) {
        setActiveSubTab('practice');
      }
    };
    handleHash();
  }, []);

  const handleDeleteAllQuestions = () => {
    sounds.playPop();
    if (activeSubTab === 'practice') {
      db.deleteAllPracticeQuestions();
      showToast('Seluruh Bank Soal Latihan Misi berhasil dikosongkan.', 'info');
    }
    refreshCounts();
    setConfirmDeleteQuestions(false);
  };

  const handleResetQuestions = () => {
    sounds.playFanfare();
    if (activeSubTab === 'practice') {
      db.resetPracticeQuestionsToDefault();
      showToast('✨ 110 Butir Soal Latihan Standar BI berhasil dipulihkan!');
    }
    refreshCounts();
    setConfirmResetQuestions(false);
  };

  const totalQuestionsCount = practiceCount;

  const subTabs = [
    {
      id: 'practice' as QuestionSubTab,
      label: '1. Soal Latihan Misi',
      shortLabel: 'Soal Latihan',
      icon: HelpCircle,
      count: practiceCount,
      color: 'blue',
      description: 'Bank butir soal latihan pilihan ganda per misi lengkap dengan kunci jawaban dan pembahasan',
    },
    {
      id: 'interactive' as QuestionSubTab,
      label: '2. Aktivitas Interaktif',
      shortLabel: 'Aktivitas Interaktif',
      icon: Gamepad2,
      count: activityCount,
      color: 'emerald',
      description: 'Katalog tantangan interaktif mini-games (Matching, Sorter, Simulator 5J, Hotspot)',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-600/20'
                : 'bg-slate-800/95 text-white border-slate-700 shadow-slate-900/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Upload Info Callout Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-black text-blue-950">
              Integrasi Pengunggahan Soal Melalui Master Excel
            </h4>
            <p className="text-[11px] sm:text-xs text-blue-800/90 leading-relaxed max-w-3xl font-medium">
              Data Soal Latihan menjadi <strong>satu kesatuan file Master Excel</strong> dengan Misi & Materi. 
              Untuk mengunggah atau memperbarui bank soal secara massal, silakan gunakan fitur <strong>Upload File Master Excel</strong> di menu <strong>1. Kelola Misi</strong>.
            </p>
          </div>
        </div>

        {onNavigateToMissions && (
          <button
            onClick={() => {
              sounds.playPop();
              onNavigateToMissions();
            }}
            className="shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Ke Menu Kelola Misi (Upload Excel)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Hub Banner & Sub-Tabs Navigation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <HelpCircle className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Pusat Kelola Latihan & Aktivitas
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Manajemen butir Soal Latihan per Misi 1–9 dan Katalog Aktivitas Mini-Game Interaktif.
            </p>
          </div>

          {/* Top Actions: Hapus Semua Soal & Reset Soal Standar */}
          <div className="flex flex-wrap items-center gap-2">
            {totalQuestionsCount > 0 ? (
              <button
                onClick={() => setConfirmDeleteQuestions(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Hapus seluruh butir soal dari database"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Soal Latihan</span>
              </button>
            ) : (
              <button
                onClick={() => setConfirmResetQuestions(true)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Pulihkan butir soal standar kurikulum Bank Indonesia"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reset Soal Standar BI</span>
              </button>
            )}

            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>
                Total Item: <strong className="text-slate-900">{practiceCount + activityCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2 Main Segment Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playPop();
                  setActiveSubTab(tab.id);
                  window.location.hash = `admin/questions/${tab.id}`;
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-black tracking-tight ${isActive ? 'text-indigo-950' : 'text-slate-700'}`}>
                      {tab.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 pl-10">
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      <div className="transition-all duration-200">
        {activeSubTab === 'practice' && <AdminQuestionsView />}
        {activeSubTab === 'interactive' && <AdminActivitiesView />}
      </div>

      {/* Dialog Konfirmasi Hapus Soal */}
      <ConfirmDialog
        isOpen={confirmDeleteQuestions}
        title="Hapus Semua Soal Latihan?"
        message="Tindakan ini akan mengosongkan seluruh butir soal latihan. Anda dapat mengunggahnya kembali melalui file Master Excel pada menu Kelola Misi atau menekan tombol Reset Soal Standar BI."
        confirmLabel="Ya, Hapus Semua"
        variant="danger"
        onConfirm={handleDeleteAllQuestions}
        onCancel={() => setConfirmDeleteQuestions(false)}
      />

      {/* Dialog Konfirmasi Reset Soal Standar */}
      <ConfirmDialog
        isOpen={confirmResetQuestions}
        title="Pulihkan Bank Soal Standar BI?"
        message="Bank soal akan dipulihkan sesuai kurikulum resmi Bank Indonesia (110 Soal Latihan Misi)."
        confirmLabel="Ya, Pulihkan Soal"
        variant="info"
        onConfirm={handleResetQuestions}
        onCancel={() => setConfirmResetQuestions(false)}
      />
    </div>
  );
};
