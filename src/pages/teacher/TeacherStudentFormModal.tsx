import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { db } from '../../services/db';
import { User, Class } from '../../types';

interface TeacherStudentFormModalProps {
  initialStudent?: User | null;
  defaultClassId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: User) => void;
}

export const TeacherStudentFormModal: React.FC<TeacherStudentFormModalProps> = ({
  initialStudent,
  defaultClassId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const classes = db.getClasses();
  const schoolSettings = db.getSchoolSettings();

  const [formData, setFormData] = useState({
    name: initialStudent?.name || '',
    nisn: initialStudent?.nisn || '',
    gender: (initialStudent?.gender || 'male') as 'male' | 'female',
    password: initialStudent?.password || '123',
    grade: initialStudent?.grade || 'Kelas 5',
    school: initialStudent?.school || schoolSettings.schoolName || 'SD Negeri 2 Medewi',
    classId: defaultClassId || classes[0]?.id || '',
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama lengkap siswa tidak boleh kosong.');
      return;
    }
    if (!formData.nisn.trim()) {
      setError('NISN siswa wajib diisi untuk ID login petualangan.');
      return;
    }

    try {
      if (initialStudent) {
        const updated = db.updateStudent(
          initialStudent.id,
          {
            name: formData.name.trim(),
            nisn: formData.nisn.trim(),
            gender: formData.gender,
            password: formData.password.trim() || '123',
            grade: formData.grade,
            school: formData.school.trim(),
            avatar: formData.gender === 'female' ? 'perempuan' : 'laki-laki',
          },
          formData.classId
        );
        if (updated) {
          onSuccess(updated);
          onClose();
        }
      } else {
        const res = db.addStudent(
          {
            name: formData.name.trim(),
            nisn: formData.nisn.trim(),
            gender: formData.gender,
            password: formData.password.trim() || '123',
            grade: formData.grade,
            school: formData.school.trim(),
            avatar: formData.gender === 'female' ? 'perempuan' : 'laki-laki',
          },
          formData.classId
        );

        if (res.success && res.student) {
          onSuccess(res.student);
          onClose();
        } else {
          setError(res.message || 'Gagal menambahkan siswa.');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan data siswa.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              {formData.gender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {initialStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <p className="text-xs text-blue-100">
                Pendaftaran akun siswa untuk akses modul Jelajah Rupiah
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
              Nama Lengkap Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError(null);
              }}
              placeholder="Contoh: Ahmad Rizky Ramadhan"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                NISN (10 Digit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nisn}
                onChange={(e) => {
                  setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, '').slice(0, 10) });
                  setError(null);
                }}
                placeholder="Contoh: 0123456789"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk login siswa</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    formData.gender === 'male'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>👦</span>
                  <span>Laki-laki</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    formData.gender === 'female'
                      ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>👧</span>
                  <span>Perempuan</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Rombongan Belajar (Kelas)
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi / PIN
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Default: 123"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Standar default adalah 123</p>
            </div>
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
              <span>{initialStudent ? 'Simpan Data Siswa' : 'Daftarkan Siswa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
