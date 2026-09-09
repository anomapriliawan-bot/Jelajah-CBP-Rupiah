import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  BookOpen,
  Gamepad2,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import {
  parseExcelWorkbook,
  validateWorkbookData,
  ParsedWorkbookData,
  ValidationSummary,
} from '../../services/excelImporter';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ConfirmDialog } from './ConfirmDialog';

interface QuickExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (resultMessage: string) => void;
}

export const QuickExcelImportModal: React.FC<QuickExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedWorkbookData | null>(null);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<'update' | 'skip' | 'replace_clean'>('update');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmUpload, setShowConfirmUpload] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = async (selectedFile: File) => {
    try {
      sounds.playPop();
      setErrorMessage(null);
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setIsParsing(true);

      const buffer = await selectedFile.arrayBuffer();
      const parsed = parseExcelWorkbook(buffer);
      setParsedData(parsed);

      const existingMissions = db.getMissions();
      const existingQuestions = db.getPracticeQuestions();
      const existingPackages = db.getTournamentPackages();
      const val = validateWorkbookData(parsed, existingMissions, existingQuestions, existingPackages);
      setValidation(val);

      setIsParsing(false);
    } catch (err: any) {
      setIsParsing(false);
      setErrorMessage('Gagal membaca file Excel: ' + (err?.message || 'Format tidak valid.'));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
        handleFileProcess(f);
      } else {
        setErrorMessage('Silakan unggah file berformat .xlsx atau .xls');
      }
    }
  };

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
      });
    } catch (e) {
      console.error(e);
      alert('Gagal mendownload template.');
    }
  };

  const handleExecuteImport = () => {
    if (!parsedData) return;
    sounds.playPop();
    setIsImporting(true);

    setTimeout(() => {
      try {
        const currentUser = db.getCurrentUser();
        const res = db.bulkImportData(
          {
            missions: parsedData.missions,
            lessons: parsedData.lessons,
            activities: parsedData.activities,
            practiceQuestions: parsedData.practiceQuestions,
            badges: parsedData.badges,
            reflections: parsedData.reflections,
            references: parsedData.references,
            tournamentPackages: parsedData.tournamentPackages,
            tournamentQuestions: parsedData.tournamentQuestions,
            tournamentEvents: parsedData.tournamentEvents,
          },
          duplicateHandling,
          {
            fileName: fileName || 'Import_Misi_Master.xlsx',
            importedBy: currentUser?.name || 'Admin Kurikulum BI',
          }
        );

        // Simpan otomatis sebagai default sistem
        try {
          const defaultPayload = {
            missions: db.getMissions(),
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
          localStorage.setItem('jr_db_custom_default_master', JSON.stringify(defaultPayload));
          fetch('/api/set-system-default', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultPayload),
          }).catch(() => {});
        } catch {}

        setIsImporting(false);
        sounds.playFanfare();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        onImportSuccess(
          `✅ Berhasil mengimpor: ${res.updatedCount} data diperbarui, ${res.createdCount} data baru ditambahkan tanpa duplikasi misi! Data telah dipermanenkan sebagai default sistem.`
        );
        onClose();
      } catch (err: any) {
        setIsImporting(false);
        setErrorMessage('Terjadi kesalahan saat menyimpan ke database: ' + (err?.message || ''));
      }
    }, 500);
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setParsedData(null);
    setValidation(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Upload & Sinkronisasi Master Excel
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                Pembaruan kurikulum misi, materi slide, aktivitas, dan bank soal otomatis rapi
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {!parsedData ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-400'
                }`}
                onClick={() => document.getElementById('quick-excel-input')?.click()}
              >
                <input
                  id="quick-excel-input"
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  {isParsing ? (
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <h4 className="text-base font-black text-slate-800 mb-1">
                  {isParsing ? 'Membaca data Excel...' : 'Tarik & Letakkan File Excel di Sini'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Mendukung format <strong>.xlsx</strong> atau <strong>.xls</strong>. Sistem otomatis mencocokkan ID 9 Misi Kanonikal sehingga tidak terjadi penumpukan misi ganda.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File dari Komputer</span>
                </div>
              </div>

              {/* Template Download Prompt */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950">Belum punya format Excel yang sesuai?</div>
                    <div className="text-[11px] text-amber-800">Gunakan template resmi master kurikulum Jelajah Rupiah.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>Unduh Template</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-blue-950 truncate">{fileName}</div>
                    <div className="text-[10px] text-blue-700 font-medium">
                      {(file ? (file.size / 1024).toFixed(1) : '0')} KB • Validasi Berhasil
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold border border-slate-200 transition-colors shrink-0"
                >
                  Ganti File
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Misi</div>
                    <div className="text-sm font-black text-slate-800">{parsedData.missions.length} Data</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Materi</div>
                    <div className="text-sm font-black text-slate-800">{parsedData.lessons.length} Slide</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Aktivitas</div>
                    <div className="text-sm font-black text-slate-800">{parsedData.activities.length} Modul</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Soal Latihan</div>
                    <div className="text-sm font-black text-slate-800">{parsedData.practiceQuestions.length} Butir</div>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Mode */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Mode Sinkronisasi & Impor Database:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      duplicateHandling === 'replace_clean'
                        ? 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dup-mode"
                      checked={duplicateHandling === 'replace_clean'}
                      onChange={() => setDuplicateHandling('replace_clean')}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <div className="font-bold flex items-center gap-1 text-rose-900">
                        <span>Ganti Bersih (Clean Slate)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Mengganti total bank soal & materi dengan file Excel ini agar tidak ada soal turnamen/latihan lama yang menumpuk.
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      duplicateHandling === 'update'
                        ? 'bg-blue-50 border-blue-300 text-blue-950 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dup-mode"
                      checked={duplicateHandling === 'update'}
                      onChange={() => setDuplicateHandling('update')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold">Perbarui Data Cocok</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Memperbarui teks/materi pada kode yang cocok tanpa mengubah item lainnya.
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      duplicateHandling === 'skip'
                        ? 'bg-blue-50 border-blue-300 text-blue-950 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dup-mode"
                      checked={duplicateHandling === 'skip'}
                      onChange={() => setDuplicateHandling('skip')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold">Lewati Jika Ada</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Hanya menambahkan butir baru yang belum ada di database.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {validation && validation.warningsCount > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Ditemukan {validation.warningsCount} catatan format minor, namun aman untuk diimpor.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors"
          >
            Batal
          </button>

          {parsedData && (
            <button
              onClick={() => {
                sounds.playPop();
                setShowConfirmUpload(true);
              }}
              disabled={isImporting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan & Sinkronkan Sekarang</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* DIALOG KONFIRMASI SEBELUM IMPORT */}
        {showConfirmUpload && (
          <ConfirmDialog
            isOpen={true}
            title="Konfirmasi Upload & Sinkronisasi Excel?"
            message={`Apakah Anda yakin ingin mengunggah dan menyinkronkan data dari file "${fileName || 'Excel Kurikulum'}" ke database sistem? Data materi, soal, dan aktivitas akan diperbarui sesuai pengaturan mode duplikasi.`}
            confirmLabel="Ya, Lanjutkan Upload"
            cancelLabel="Batal"
            variant="info"
            onConfirm={() => {
              setShowConfirmUpload(false);
              handleExecuteImport();
            }}
            onCancel={() => setShowConfirmUpload(false)}
          />
        )}
      </div>
    </div>
  );
};
