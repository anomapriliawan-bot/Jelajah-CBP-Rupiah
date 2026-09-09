import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Eye,
  Crown,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import { SchoolSettings, User } from '../../types';
import { sounds } from '../../utils/audio';
import { compressLogoImage } from '../../utils/imageCompressor';
import { FirebaseStatusBadge } from '../../components/FirebaseStatusBadge';

interface SchoolSettingsViewProps {
  currentUser?: User | null;
  onSaved?: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({ currentUser, onSaved }) => {
  const activeUser = currentUser || db.getCurrentUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';

  const [settings, setSettings] = useState<SchoolSettings>(db.getSchoolSettings());
  const [schoolLogo, setSchoolLogo] = useState<string>(settings.schoolLogo || '');
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [compressionInfo, setCompressionInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const current = db.getSchoolSettings();
    setSettings(current);
    setSchoolLogo(current.schoolLogo || '');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) return;
    const files = e.target.files;
    if (files && files[0]) {
      processLogoFile(files[0]);
    }
    // Reset file input value so selecting the same file again triggers onChange cleanly
    e.target.value = '';
  };

  const processLogoFile = async (file: File) => {
    setFileError('');
    setCompressionInfo('');

    // Verify format
    const isValidType = 
      file.type.startsWith('image/') || 
      file.name.toLowerCase().endsWith('.svg') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.webp') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg');

    if (!isValidType) {
      setFileError('Format file tidak didukung. Silakan gunakan format PNG, JPG, JPEG, SVG, atau WebP.');
      sounds.playError?.();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 10MB. Silakan pilih file gambar yang lebih kecil.');
      return;
    }

    setIsProcessing(true);

    try {
      // Compress and resize rapidly via offscreen canvas, preserving alpha/transparency
      const result = await compressLogoImage(file, 360);

      if (!result.dataUrl) {
        throw new Error('Gagal memproses gambar logo.');
      }

      setSchoolLogo(result.dataUrl);
      sounds.playPop();

      if (result.originalSizeKb > 0 && result.compressedSizeKb > 0) {
        setCompressionInfo(
          `Dioptimalkan dari ${result.originalSizeKb}KB menjadi ${result.compressedSizeKb}KB (${result.width}×${result.height}px)`
        );
      }
    } catch (err: any) {
      console.error('Failed to process logo file:', err);
      setFileError(err?.message || 'Terjadi kesalahan saat memproses gambar logo.');
      sounds.playError?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isSuperAdmin || isProcessing) return;
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    if (!isSuperAdmin) return;
    sounds.playPop();
    setSchoolLogo('');
    setCompressionInfo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!isSuperAdmin) {
      alert('Hanya Super Administrator yang memiliki kewenangan mengubah logo resmi sistem.');
      return;
    }

    setIsSaving(true);
    sounds.playSuccess();

    const updated = db.updateSchoolSettings({
      ...settings,
      schoolLogo: schoolLogo,
    });

    setSettings(updated);
    setIsSaving(false);
    setShowSuccessToast(true);

    if (onSaved) onSaved();

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  const handleResetToDefault = () => {
    if (!isSuperAdmin) return;
    if (window.confirm('Kembalikan logo sistem ke lambang awal bawaan (JR Logo)?')) {
      const reset = db.resetSchoolSettings();
      setSettings(reset);
      setSchoolLogo(reset.schoolLogo);
      setCompressionInfo('');
      sounds.playPop();
      setShowSuccessToast(true);
      if (onSaved) onSaved();
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input outside container to avoid duplicate events */}
      <input
        ref={fileInputRef}
        type="file"
        disabled={!isSuperAdmin || isProcessing}
        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Super Admin Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">Logo Resmi Sistem</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Pengaturan logo resmi aplikasi secara terpusat. Logo ini akan ditampilkan di bilah navigasi atas (Navbar), halaman login, dan modul pembelajaran untuk seluruh sekolah mitra.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FirebaseStatusBadge />
          {!isSuperAdmin && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold">
              <Lock className="w-4 h-4 text-rose-300 shrink-0" />
              <span>Mode Baca (Hanya Super Admin yang dapat mengubah)</span>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-xl flex items-center justify-between animate-fade-in border border-emerald-400">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-100 shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm">Logo Sistem Berhasil Disimpan!</h4>
              <p className="text-xs text-emerald-100">
                Logo resmi sistem telah diperbarui dan langsung aktif di bilah navigasi atas (Navbar), halaman login, serta seluruh modul aplikasi.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Box (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload Logo Sistem</h3>
                  <p className="text-xs text-slate-500">
                    Gantikan lambang default biru "JR" dengan logo resmi instansi atau logo penyelenggara.
                  </p>
                </div>
              </div>
              {schoolLogo && isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Logo</span>
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                if (!isSuperAdmin || isProcessing) return;
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (isSuperAdmin && !isProcessing) {
                  fileInputRef.current?.click();
                }
              }}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[200px] ${
                !isSuperAdmin
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-90'
                  : isProcessing
                  ? 'border-blue-400 bg-blue-50/80 cursor-wait'
                  : isDragging
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01] cursor-pointer'
                  : schoolLogo
                  ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50 cursor-pointer'
                  : 'border-slate-300 bg-slate-50/70 hover:bg-blue-50/40 hover:border-blue-300 cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md animate-spin">
                    <Loader2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-blue-900">
                      Mengompresi & Memproses Gambar Logo...
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Menjaga transparansi dan kualitas visual resolusi tinggi
                    </p>
                  </div>
                </div>
              ) : schoolLogo ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-md p-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={schoolLogo}
                      alt="Logo Sistem Terpilih"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-block">
                      ✓ Logo Sistem Aktif
                    </span>
                    {compressionInfo && (
                      <p className="text-[11px] font-semibold text-emerald-700">
                        {compressionInfo}
                      </p>
                    )}
                    {isSuperAdmin ? (
                      <p className="text-[11px] text-slate-500 pt-1">
                        Klik area ini untuk mengganti dengan gambar logo baru.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 pt-1">
                        Dikelola terpusat oleh Super Administrator
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      {isSuperAdmin
                        ? 'Klik untuk Memilih File atau Tarik & Letakkan Logo di Sini'
                        : 'Belum Ada Logo Khusus (Menggunakan Logo Default JR)'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mendukung PNG transparan, JPG, SVG, WebP (Otomatis dikompresi & anti-lag)
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Pilih dari Komputer
                    </button>
                  )}
                </div>
              )}
            </div>

            {fileError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                ⚠️ {fileError}
              </p>
            )}

            {/* Action Buttons (Super Admin only) */}
            {isSuperAdmin && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isProcessing || isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Logo JR Bawaan</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-102 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Logo Sistem'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Header Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 sticky top-24">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900">Live Preview Bilah Navigasi</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ml-auto">
                Real-time
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pratinjau tampilan logo sistem saat diakses oleh pengguna dari berbagai sekolah yang berbeda:
            </p>

            {/* Simulated Navbar Component Header */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-inner space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. Tampilan Siswa / Guru (Contoh: SDN 2 Medewi)
              </div>

              <div className="bg-white rounded-2xl p-3 border border-sky-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {schoolLogo ? (
                    <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 p-0.5 flex items-center justify-center shadow-md shadow-blue-500/15 overflow-hidden shrink-0">
                      <img
                        src={schoolLogo}
                        alt="Preview Logo"
                        className="w-full h-full object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      <span className="text-white font-extrabold text-xl tracking-tighter">JR</span>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <span className="text-lg font-black text-[#1E3A8A] tracking-tight">Jelajah</span>
                      <span className="text-lg font-black text-[#2563EB] tracking-tight ml-1 font-['Grandstander',_'Comfortaa',_sans-serif]">Rupiah</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tracking-tight leading-tight -mt-0.5 truncate max-w-[180px]">
                      SD Negeri 2 Medewi
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1">
                  <span className="px-2 py-1 rounded-lg bg-sky-50 text-[10px] font-extrabold text-sky-700">
                    Beranda
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-500">
                    Misi
                  </span>
                </div>
              </div>

              {/* Simulated Multi-School Variation */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2">
                2. Tampilan Siswa / Guru (Contoh: Sekolah Lain)
              </div>

              <div className="bg-white rounded-2xl p-3 border border-indigo-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {schoolLogo ? (
                    <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 p-0.5 flex items-center justify-center shadow-md shadow-blue-500/15 overflow-hidden shrink-0">
                      <img
                        src={schoolLogo}
                        alt="Preview Logo"
                        className="w-full h-full object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      <span className="text-white font-extrabold text-xl tracking-tighter">JR</span>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <span className="text-lg font-black text-[#1E3A8A] tracking-tight">Jelajah</span>
                      <span className="text-lg font-black text-[#2563EB] tracking-tight ml-1 font-['Grandstander',_'Comfortaa',_sans-serif]">Rupiah</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tracking-tight leading-tight -mt-0.5 truncate max-w-[180px]">
                      SD Negeri 1 Pekutatan
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1">
                  <span className="px-2 py-1 rounded-lg bg-indigo-50 text-[10px] font-extrabold text-indigo-700">
                    Portal
                  </span>
                </div>
              </div>

              {/* Simulated Login Page Header */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2">
                3. Pratinjau Header Halaman Login
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-blue-100 rounded-2xl p-4 border border-sky-200 shadow-sm flex items-center gap-3">
                {schoolLogo ? (
                  <div className="w-11 h-11 rounded-2xl bg-white border border-sky-200 p-1 flex items-center justify-center shadow-lg shadow-blue-500/15 overflow-hidden shrink-0">
                    <img
                      src={schoolLogo}
                      alt="Preview Logo"
                      className="w-full h-full object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                    <span className="text-white font-extrabold text-2xl tracking-tighter">JR</span>
                  </div>
                )}
                <div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-black text-[#1E3A8A] tracking-tight">Jelajah</span>
                    <span className="text-xl font-black text-[#2563EB] tracking-tight ml-1 font-['Grandstander',_'Comfortaa',_sans-serif]">Rupiah</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-700">
                    Portal Edukasi Cinta Bangga Paham Rupiah
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
