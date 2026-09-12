import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Trophy,
  Star,
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Download,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { db } from '../../services/db';
import { User, StudentProgress, Badge, Mission, PracticeAttempt } from '../../types';

interface TeacherStudentDetailModalProps {
  studentId: string;
  onClose: () => void;
}

export const TeacherStudentDetailModal: React.FC<TeacherStudentDetailModalProps> = ({
  studentId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'practice' | 'reflections'>('missions');
  const details = db.getStudentDetail(studentId);
  const user = details.user;
  const userClass = details.userClass;

  if (!user) {
    return null;
  }

  const completedMissionsCount = details.missionStatusList.filter((m) => m.status === 'completed').length;
  const totalMissions = details.missionStatusList.length || 9;
  const progressPercent = Math.round((completedMissionsCount / totalMissions) * 100);
  const badgesEarned = details.missionStatusList.filter((m) => m.badgeAwarded && m.status === 'completed').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${user.gender === 'female' ? 'from-pink-400 to-rose-300' : 'from-amber-400 to-amber-200'} p-1 shadow-md shrink-0`}>
              <div className="w-full h-full rounded-xl bg-amber-100 flex items-center justify-center text-3xl">
                {user.gender === 'female' ? '👧' : '👦'}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-black tracking-tight">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
                  {user.levelTitle || 'Duta Pratama'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                  {userClass ? userClass.name : user.grade || 'Kelas 5A'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.gender === 'female' ? 'bg-pink-500/30 text-pink-200 border border-pink-400/30' : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'}`}>
                  {user.gender === 'female' ? '👧 Perempuan' : '👦 Laki-laki'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/25 text-amber-200 border border-amber-400/30" title="Kategori umur penentu soal Misi Akhir">
                  {user.ageCategory === 'dewasa'
                    ? '💼 Dewasa (31-55 th)'
                    : user.ageCategory === 'remaja'
                    ? '🧑 Remaja (18-30 th)'
                    : '🧒 Anak-anak (10-17 th)'}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                NISN: <span className="font-mono">{user.nisn || `00${studentId.replace(/\D/g, '') || '9482103'}`}</span> • ID Siswa: <span className="font-mono">{user.id}</span> • Sekolah: SDN Percobaan 01
              </p>

              {/* Quick Stats Pills */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="bg-white/10 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{user.points || 0} Poin Rupiah</span>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                  <Award className="w-3.5 h-3.5 text-sky-300" />
                  <span>{badgesEarned} / {totalMissions} Lencana</span>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Progress: {progressPercent}%</span>
                </div>
              </div>
            </div>

            {/* Print action */}
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="Cetak Laporan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rapor</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('missions')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'missions'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>9 Misi Belajar ({completedMissionsCount}/{totalMissions})</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'practice'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Riwayat Latihan ({details.practiceAttempts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reflections')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reflections'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Jawaban Refleksi</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: 9 MISSIONS */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Daftar 9 Misi Kurikulum Jelajah Rupiah Bank Indonesia</span>
                <span className="font-semibold text-blue-700">Total Selesai: {completedMissionsCount} dari 9</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {details.missionStatusList.map((item, idx) => {
                  const isCompleted = item.status === 'completed';
                  const isInProgress = item.status === 'in_progress';
                  const worldColors = {
                    cinta: 'border-rose-200 bg-rose-50/40 text-rose-700',
                    bangga: 'border-amber-200 bg-amber-50/40 text-amber-700',
                    paham: 'border-emerald-200 bg-emerald-50/40 text-emerald-700',
                  };
                  const colorClass = worldColors[item.mission.worldId as keyof typeof worldColors] || 'border-slate-200 bg-slate-50 text-slate-700';

                  return (
                    <div
                      key={item.mission.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isInProgress
                          ? 'border-blue-200 bg-blue-50/20'
                          : 'border-slate-200 bg-slate-50/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${colorClass}`}>
                            {item.mission.worldId}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Misi {idx + 1}</span>
                        </div>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai ({item.score}%)
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Sedang Dikerjakan
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Belum Dimulai
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 mt-1.5">{item.mission.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.mission.description}</p>

                      {/* Details row */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Award className={`w-3.5 h-3.5 ${item.badgeAwarded ? 'text-amber-500' : 'text-slate-300'}`} />
                          <span className={item.badgeAwarded ? 'font-semibold text-amber-700' : 'text-slate-400'}>
                            {item.badge ? item.badge.name : 'Lencana Misi'}
                          </span>
                        </div>
                        {item.completedAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PRACTICE ATTEMPTS */}
          {activeTab === 'practice' && (
            <div className="space-y-3">
              {details.practiceAttempts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Belum Ada Riwayat Latihan Tambahan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Siswa telah menyelesaikan soal pada modul misi utama.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Waktu Selesai</th>
                        <th className="p-3">Misi / Topik</th>
                        <th className="p-3 text-center">Soal Dijawab</th>
                        <th className="p-3 text-center">Benar</th>
                        <th className="p-3 text-center">Skor</th>
                        <th className="p-3 text-right">Durasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.practiceAttempts.map((att) => {
                        const mObj = db.getMissionById(att.missionId);
                        return (
                          <tr key={att.id} className="hover:bg-slate-50/80">
                            <td className="p-3 text-slate-500 font-mono text-[11px]">
                              {new Date(att.completedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {mObj ? mObj.title : att.missionId}
                            </td>
                            <td className="p-3 text-center font-mono">{att.totalQuestions}</td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600">{att.correctAnswers}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                att.score >= 80 ? 'bg-emerald-100 text-emerald-800' : att.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {att.score}%
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                              {Math.floor(att.durationSeconds / 60)}m {att.durationSeconds % 60}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REFLECTIONS */}
          {activeTab === 'reflections' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Jawaban jurnal refleksi siswa yang ditulis setelah menyelesaikan setiap Misi Jelajah Rupiah:
              </p>

              <div className="space-y-3">
                {details.missionStatusList.map((item, idx) => {
                  if (!item.reflectionAnswer && !item.reflectionPrompt) return null;
                  return (
                    <div key={item.mission.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-800">
                          Misi {idx + 1}: {item.mission.title}
                        </span>
                        {item.status === 'completed' && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                            ✓ Terkirim
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100 font-medium">
                        <span className="text-slate-400 font-bold mr-1">Pertanyaan:</span>
                        {item.reflectionPrompt || 'Bagaimana cara kamu menerapkan ilmu Rupiah ini dalam kehidupan sehari-hari?'}
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50/50 text-xs text-blue-950 border border-blue-100 italic">
                        <span className="font-bold not-italic text-blue-700 block mb-0.5">Jawaban Siswa:</span>
                        "{item.reflectionAnswer || 'Saya selalu memeriksa uang kembalian dengan 3D dan menyimpannya rapi di dompet tanpa dilipat atau distapler.'}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Status Keanggotaan: <span className="font-bold text-slate-700">Aktif Terdaftar</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
