import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Award,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Eye,
  Star,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Printer,
  UserPlus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Key,
} from 'lucide-react';
import { db } from '../../services/db';
import { Class, User } from '../../types';
import { TeacherStudentDetailModal } from './TeacherStudentDetailModal';
import { TeacherStudentFormModal } from './TeacherStudentFormModal';
import { TeacherExcelImportModal } from './TeacherExcelImportModal';

interface TeacherClassDetailViewProps {
  classId: string;
  onBack: () => void;
}

export const TeacherClassDetailView: React.FC<TeacherClassDetailViewProps> = ({
  classId,
  onBack,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed_all' | 'in_progress' | 'needs_attention'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'cinta' | 'bangga' | 'paham' | 'medals'>('progress');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentClass = db.getClassById(classId) || db.getClasses()[0];
  const [students, setStudents] = useState<any[]>([]);

  const loadStudents = () => {
    if (currentClass) {
      const data = db.getClassStudents(currentClass.id);
      setStudents(data);
    }
  };

  useEffect(() => {
    loadStudents();
    const unsub = db.subscribe(loadStudents);
    return () => unsub();
  }, [classId, currentClass]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteStudent = (e: React.MouseEvent, studentUser: User) => {
    e.stopPropagation();
    if (window.confirm(`Hapus siswa "${studentUser.name}" dari rombel ini? Data akun dan progress akan dihapus.`)) {
      db.deleteStudent(studentUser.id);
      showToast(`Siswa "${studentUser.name}" berhasil dihapus.`);
    }
  };

  const handleEditStudent = (e: React.MouseEvent, studentUser: User) => {
    e.stopPropagation();
    setEditingStudent(studentUser);
    setIsStudentModalOpen(true);
  };

  if (!currentClass) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600 font-bold">Kelas tidak ditemukan.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer">
          Kembali
        </button>
      </div>
    );
  }

  // Summary Metrics
  const totalStudents = students.length;
  const avgProgress = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.progressPercent, 0) / totalStudents)
    : 0;
  const totalBadgesEarned = students.reduce((sum, s) => sum + s.badgesCount, 0);
  const completedAllCount = students.filter((s) => s.completedMissionsCount >= 9).length;

  const handleExportCSV = () => {
    const headers = [
      'NISN',
      'Nama Siswa',
      'Jenis Kelamin',
      'Kata Sandi / PIN',
      'Progress (%)',
      'Misi Selesai (dari 9)',
      'Lencana Diperoleh',
      'Latihan Terakhir',
      'Turnamen Cinta Rupiah',
      'Turnamen Bangga Rupiah',
      'Turnamen Paham Rupiah',
      'Medali Emas',
      'Medali Perak',
      'Medali Perunggu',
      'Status Duta Rupiah',
    ];

    const rows = students.map((s) => [
      `"${s.user.nisn || s.user.id}"`,
      `"${s.user.name.replace(/"/g, '""')}"`,
      `"${s.user.gender === 'female' ? 'Perempuan' : 'Laki-laki'}"`,
      `"${s.user.password || '123'}"`,
      `${s.progressPercent}%`,
      `${s.completedMissionsCount}/9`,
      s.badgesCount,
      `"${s.lastAttemptInfo.replace(/"/g, '""')}"`,
      s.cintaScore !== undefined ? s.cintaScore : '-',
      s.banggaScore !== undefined ? s.banggaScore : '-',
      s.pahamScore !== undefined ? s.pahamScore : '-',
      s.medals.gold,
      s.medals.silver,
      s.medals.bronze,
      `"${s.dutaStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_kelas_${currentClass.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort
  const filteredStudents = students
    .filter((s) => {
      const matchQuery = (s.user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.user.nisn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.user.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchQuery) return false;

      if (filterStatus === 'completed_all') return s.completedMissionsCount >= 9;
      if (filterStatus === 'in_progress') return s.completedMissionsCount > 0 && s.completedMissionsCount < 9;
      if (filterStatus === 'needs_attention') return s.completedMissionsCount < 3 || s.progressPercent < 35;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.user.name.localeCompare(b.user.name);
      } else if (sortBy === 'progress') {
        comparison = b.progressPercent - a.progressPercent;
      } else if (sortBy === 'cinta') {
        comparison = (b.cintaScore || 0) - (a.cintaScore || 0);
      } else if (sortBy === 'bangga') {
        comparison = (b.banggaScore || 0) - (a.banggaScore || 0);
      } else if (sortBy === 'paham') {
        comparison = (b.pahamScore || 0) - (a.pahamScore || 0);
      } else if (sortBy === 'medals') {
        comparison = (b.medals.gold * 3 + b.medals.silver * 2 + b.medals.bronze) - (a.medals.gold * 3 + a.medals.silver * 2 + a.medals.bronze);
      }
      return sortDirection === 'desc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Kelas</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Siswa (Excel)</span>
          </button>

          <button
            onClick={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Siswa</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Rekap (CSV)</span>
          </button>
        </div>
      </div>

      {/* Class Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500 text-white uppercase">
                {currentClass.grade}
              </span>
              <span className="text-xs text-blue-200">Tahun Ajaran: {currentClass.academicYear}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{currentClass.name}</h2>
            <p className="text-xs text-slate-300">
              Wali Kelas: <span className="font-bold text-white">{currentClass.teacherName || 'Ibu Dewi Anggraeni, S.Pd.'}</span> • {currentClass.school}
            </p>
          </div>

          {/* 4 Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Total Siswa</div>
              <div className="text-xl font-black font-mono mt-0.5">{totalStudents}</div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Rata-Rata Progress</div>
              <div className="text-xl font-black font-mono mt-0.5 text-emerald-400">{avgProgress}%</div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Lulus 9 Misi</div>
              <div className="text-xl font-black font-mono mt-0.5 text-amber-300">{completedAllCount} Siswa</div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Lencana Terkumpul</div>
              <div className="text-xl font-black font-mono mt-0.5 text-sky-300">{totalBadgesEarned}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau NISN siswa..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({students.length})
          </button>
          <button
            onClick={() => setFilterStatus('completed_all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'completed_all' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            ✓ Tuntas 9 Misi ({completedAllCount})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'in_progress' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Sedang Belajar
          </button>
          <button
            onClick={() => setFilterStatus('needs_attention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'needs_attention' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Perlu Perhatian
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Urutkan:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="progress">Progress Tertinggi</option>
            <option value="name">Nama Siswa (A-Z)</option>
            <option value="cinta">Skor Turnamen Cinta</option>
            <option value="bangga">Skor Turnamen Bangga</option>
            <option value="paham">Skor Turnamen Paham</option>
            <option value="medals">Perolehan Medali</option>
          </select>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Nama Siswa & NISN</th>
                <th className="p-4 text-center">PIN Login</th>
                <th className="p-4 text-center">Progress</th>
                <th className="p-4 text-center">Misi Selesai</th>
                <th className="p-4 text-center">Lencana</th>
                <th className="p-4">Latihan Terakhir</th>
                <th className="p-4 text-center">Cinta Trn</th>
                <th className="p-4 text-center">Bangga Trn</th>
                <th className="p-4 text-center">Paham Trn</th>
                <th className="p-4 text-center">Medali</th>
                <th className="p-4 text-center">Status Duta</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400 space-y-3">
                    <p className="text-slate-500 font-bold">Belum ada siswa di kelas ini.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingStudent(null);
                          setIsStudentModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        + Tambah Siswa Manual
                      </button>
                      <button
                        onClick={() => setIsExcelModalOpen(true)}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Upload Excel Siswa
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => {
                  const dutaBadge =
                    item.dutaStatus === 'Duta Utama'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : item.dutaStatus === 'Duta Madya'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : item.dutaStatus === 'Duta Pratama'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const isF = item.user.gender === 'female' || item.user.gender === 'perempuan';

                  return (
                    <tr
                      key={item.user.id}
                      onClick={() => setSelectedStudentId(item.user.id)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${isF ? 'bg-pink-100 border-pink-200 text-pink-900' : 'bg-blue-100 border-blue-200 text-blue-900'} border flex items-center justify-center font-bold text-xs shrink-0`}>
                            {isF ? '👧' : '👦'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                              <span>{item.user.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isF ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isF ? 'Perempuan' : 'Laki-laki'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              NISN: <span className="font-bold text-slate-600">{item.user.nisn || item.user.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Password / PIN */}
                      <td className="p-4 text-center">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          {item.user.password || '123'}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1 min-w-[80px]">
                          <span className="font-mono font-bold text-slate-800 text-xs">{item.progressPercent}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.progressPercent === 100 ? 'bg-emerald-500' : item.progressPercent >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Misi Selesai */}
                      <td className="p-4 text-center font-mono font-bold text-slate-700">
                        <span className={item.completedMissionsCount === 9 ? 'text-emerald-600 font-extrabold' : ''}>
                          {item.completedMissionsCount} / 9
                        </span>
                      </td>

                      {/* Lencana */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-xs">
                          <Award className="w-3 h-3 text-amber-500" />
                          {item.badgesCount}
                        </span>
                      </td>

                      {/* Latihan Terakhir */}
                      <td className="p-4 text-slate-600 text-[11px]">
                        <span className="font-medium">{item.lastAttemptInfo}</span>
                      </td>

                      {/* Cinta Trn */}
                      <td className="p-4 text-center font-mono font-bold">
                        {item.cintaScore !== undefined ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {item.cintaScore}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Bangga Trn */}
                      <td className="p-4 text-center font-mono font-bold">
                        {item.banggaScore !== undefined ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {item.banggaScore}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Paham Trn */}
                      <td className="p-4 text-center font-mono font-bold">
                        {item.pahamScore !== undefined ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {item.pahamScore}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Medals */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                          {item.medals.gold > 0 && <span title={`${item.medals.gold} Emas`}>🥇{item.medals.gold}</span>}
                          {item.medals.silver > 0 && <span title={`${item.medals.silver} Perak`}>🥈{item.medals.silver}</span>}
                          {item.medals.bronze > 0 && <span title={`${item.medals.bronze} Perunggu`}>🥉{item.medals.bronze}</span>}
                          {item.medals.gold === 0 && item.medals.silver === 0 && item.medals.bronze === 0 && (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>

                      {/* Status Duta */}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${dutaBadge}`}>
                          {item.dutaStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(item.user.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Lihat Detail Progress"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </button>

                          <button
                            onClick={(e) => handleEditStudent(e, item.user)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteStudent(e, item.user)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentId && (
        <TeacherStudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* STUDENT FORM MODAL (MANUAL INPUT) */}
      <TeacherStudentFormModal
        isOpen={isStudentModalOpen}
        defaultClassId={currentClass.id}
        initialStudent={editingStudent}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSuccess={(st) => {
          loadStudents();
          showToast(`Data siswa "${st.name}" berhasil disimpan.`);
        }}
      />

      {/* EXCEL IMPORT MODAL */}
      <TeacherExcelImportModal
        isOpen={isExcelModalOpen}
        targetClassId={currentClass.id}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={(count) => {
          loadStudents();
          showToast(`Berhasil mengimpor ${count} siswa ke kelas.`);
        }}
      />
    </div>
  );
};

