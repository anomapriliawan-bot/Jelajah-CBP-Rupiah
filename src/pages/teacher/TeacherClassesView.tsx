import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Award,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Trophy,
  Search,
  Calendar,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../services/db';
import { Class } from '../../types';
import { TeacherClassFormModal } from './TeacherClassFormModal';
import { TeacherExcelImportModal } from './TeacherExcelImportModal';

interface TeacherClassesViewProps {
  onSelectClass: (classId: string) => void;
}

export const TeacherClassesView: React.FC<TeacherClassesViewProps> = ({
  onSelectClass,
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadClasses = () => {
    const list = db.getTeacherClasses();
    setClasses(list);
  };

  useEffect(() => {
    loadClasses();
    const unsub = db.subscribe(loadClasses);
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteClass = (e: React.MouseEvent, cls: Class) => {
    e.stopPropagation();
    if (window.confirm(`Apakah Anda yakin ingin menghapus rombel "${cls.name}"? Siswa di dalamnya akan tetap tersimpan di database.`)) {
      db.deleteClass(cls.id);
      showToast(`Kelas "${cls.name}" berhasil dihapus.`);
    }
  };

  const handleEditClass = (e: React.MouseEvent, cls: Class) => {
    e.stopPropagation();
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  const filteredClasses = classes.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.grade || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Rombongan Belajar & Kelas Saya</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar kelas yang berada di bawah bimbingan Anda pada tahun ajaran aktif 2024/2025.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Siswa (Excel)</span>
          </button>

          <button
            onClick={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelas atau jenjang..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: <span className="font-black text-slate-800">{classes.length} Rombel Terdaftar</span>
        </div>
      </div>

      {/* Class Cards Grid */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            🏫
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">Belum Ada Rombongan Belajar</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Mulai dengan menambahkan kelas baru atau unggah daftar siswa melalui file Excel untuk otomatis membuat kelas.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setEditingClass(null);
                setIsClassModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              + Tambah Kelas Baru
            </button>
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Upload Excel Siswa
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const students = db.getClassStudents(cls.id);
            const totalStudents = students.length;
            const avgProgress = totalStudents > 0
              ? Math.round(students.reduce((sum, s) => sum + s.progressPercent, 0) / totalStudents)
              : 0;
            const completedAll = students.filter((s) => s.completedMissionsCount >= 9).length;
            const totalBadges = students.reduce((sum, s) => sum + s.badgesCount, 0);

            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-5 group relative"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 uppercase">
                      {cls.grade}
                    </span>
                    
                    {/* Quick Edit/Delete */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleEditClass(e, cls)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit Kelas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClass(e, cls)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Wali Kelas: {cls.teacherName || 'Ibu Dewi Anggraeni, S.Pd.'}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{cls.academicYear} • {cls.school}</p>
                  </div>
                </div>

                {/* Stats Progress Bar */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Rata-Rata Progress
                    </span>
                    <span className="font-mono font-black text-blue-900">{avgProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>

                {/* 3 Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-100 pt-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Siswa</div>
                    <div className="font-black text-slate-900 font-mono text-sm mt-0.5">{totalStudents}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Tuntas 9 Misi</div>
                    <div className="font-black text-emerald-600 font-mono text-sm mt-0.5">{completedAll}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Lencana</div>
                    <div className="font-black text-amber-600 font-mono text-sm mt-0.5">{totalBadges}</div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="w-full py-2.5 px-4 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Kelola Kelas & Siswa</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Class Form Modal */}
      <TeacherClassFormModal
        isOpen={isClassModalOpen}
        initialClass={editingClass}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClass(null);
        }}
        onSuccess={(cls) => {
          loadClasses();
          showToast(`Kelas "${cls.name}" berhasil disimpan.`);
        }}
      />

      {/* Bulk Excel Import Modal */}
      <TeacherExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={(count) => {
          loadClasses();
          showToast(`Berhasil mengimpor ${count} siswa.`);
        }}
      />
    </div>
  );
};

