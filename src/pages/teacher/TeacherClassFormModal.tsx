import React, { useState } from 'react';
import { X, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../services/db';
import { Class } from '../../types';

interface TeacherClassFormModalProps {
  initialClass?: Class | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cls: Class) => void;
}

export const TeacherClassFormModal: React.FC<TeacherClassFormModalProps> = ({
  initialClass,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentUser = db.getCurrentUser();
  const schoolSettings = db.getSchoolSettings();

  const [formData, setFormData] = useState({
    name: initialClass?.name || '',
    grade: initialClass?.grade || 'Kelas 5',
    code: initialClass?.code || '',
    academicYear: initialClass?.academicYear || '2024/2025',
    teacherName: initialClass?.teacherName || currentUser?.name || 'Ibu Dewi Anggraeni, S.Pd.',
    school: initialClass?.school || schoolSettings.schoolName || 'SD Negeri 2 Medewi',
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama kelas tidak boleh kosong.');
      return;
    }

    try {
      if (initialClass) {
        const updated = db.updateClass(initialClass.id, {
          name: formData.name.trim(),
          grade: formData.grade,
          code: formData.code.trim() || initialClass.code,
          academicYear: formData.academicYear.trim(),
          teacherName: formData.teacherName.trim(),
          school: formData.school.trim(),
        });
        if (updated) {
          onSuccess(updated);
          onClose();
        }
      } else {
        const newCls = db.addClass({
          name: formData.name.trim(),
          grade: formData.grade,
          code: formData.code.trim() || `KLS-${Math.floor(100 + Math.random() * 900)}`,
          academicYear: formData.academicYear.trim(),
          teacherName: formData.teacherName.trim(),
          school: formData.school.trim(),
        });
        onSuccess(newCls);
        onClose();
      }
    } catch (err) {
      setError('Gagal menyimpan kelas. Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              🏫
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {initialClass ? 'Edit Rombongan Belajar' : 'Tambah Rombongan Belajar Baru'}
              </h3>
              <p className="text-xs text-blue-100">
                Kelola data kelas dan jenjang untuk pengelompokan siswa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError(null);
              }}
              placeholder="Contoh: Kelas 5A (Harimau), Kelas 5B (Garuda)"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Tingkat / Jenjang
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="Kelas 4">Kelas 4 SD</option>
                <option value="Kelas 5">Kelas 5 SD (Fase C Utama)</option>
                <option value="Kelas 6">Kelas 6 SD</option>
                <option value="Kelas 3">Kelas 3 SD</option>
                <option value="Ekstrakurikuler">Ekstrakurikuler Literasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2024/2025"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Guru Pembina / Wali Kelas
            </label>
            <input
              type="text"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              placeholder="Nama Guru Pembina"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialClass ? 'Simpan Perubahan' : 'Buat Kelas Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
