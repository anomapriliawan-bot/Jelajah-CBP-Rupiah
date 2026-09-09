import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react';
import { db } from '../../services/db';
import { Class } from '../../types';

interface TeacherExcelImportModalProps {
  targetClassId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedStudentRow {
  nisn: string;
  name: string;
  gender: string;
  className: string;
  grade: string;
  password: string;
  school: string;
  isValid: boolean;
  validationError?: string;
}

export const TeacherExcelImportModal: React.FC<TeacherExcelImportModalProps> = ({
  targetClassId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classes = db.getClasses();
  const selectedClass = targetClassId ? classes.find((c) => c.id === targetClassId) : null;
  const schoolSettings = db.getSchoolSettings();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    added: number;
    updated: number;
    total: number;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NISN': '0091234501',
        'Nama Siswa': 'Budi Santoso Pratama',
        'Jenis Kelamin (L/P)': 'L',
        'Nama Kelas': selectedClass ? selectedClass.name : 'Kelas 5A',
        'Tingkat': selectedClass ? selectedClass.grade : 'Kelas 5',
        'Kata Sandi / PIN': '123',
      },
      {
        'NISN': '0091234502',
        'Nama Siswa': 'Siti Nurhaliza Putri',
        'Jenis Kelamin (L/P)': 'P',
        'Nama Kelas': selectedClass ? selectedClass.name : 'Kelas 5A',
        'Tingkat': selectedClass ? selectedClass.grade : 'Kelas 5',
        'Kata Sandi / PIN': '123',
      },
      {
        'NISN': '0091234503',
        'Nama Siswa': 'I Gede Aditya Wardana',
        'Jenis Kelamin (L/P)': 'L',
        'Nama Kelas': selectedClass ? selectedClass.name : 'Kelas 5A',
        'Tingkat': selectedClass ? selectedClass.grade : 'Kelas 5',
        'Kata Sandi / PIN': '123',
      },
      {
        'NISN': '0091234504',
        'Nama Siswa': 'Ni Luh Putu Sintya Dewi',
        'Jenis Kelamin (L/P)': 'P',
        'Nama Kelas': selectedClass ? selectedClass.name : 'Kelas 5A',
        'Tingkat': selectedClass ? selectedClass.grade : 'Kelas 5',
        'Kata Sandi / PIN': '123',
      },
      {
        'NISN': '0091234505',
        'Nama Siswa': 'Rizky Alamsyah',
        'Jenis Kelamin (L/P)': 'L',
        'Nama Kelas': selectedClass ? selectedClass.name : 'Kelas 5B',
        'Tingkat': 'Kelas 5',
        'Kata Sandi / PIN': '123',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // Set column widths
    ws['!cols'] = [
      { wch: 16 }, // NISN
      { wch: 28 }, // Nama
      { wch: 20 }, // Gender
      { wch: 18 }, // Kelas
      { wch: 12 }, // Tingkat
      { wch: 16 }, // PIN
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DATA_SISWA');

    const fileName = `template_import_siswa_${selectedClass ? selectedClass.name.toLowerCase().replace(/\s+/g, '_') : 'semua_kelas'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Parse Excel / CSV File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg(null);
    setSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('File Excel kosong atau tidak memiliki baris data.');
          setParsedRows([]);
          return;
        }

        const rows: ParsedStudentRow[] = rawJson.map((row, idx) => {
          // Normalize column headers
          const keys = Object.keys(row);
          const findVal = (possibleNames: string[]) => {
            const matchedKey = keys.find((k) =>
              possibleNames.some((p) => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p))
            );
            return matchedKey ? String(row[matchedKey]).trim() : '';
          };

          const nisn = findVal(['nisn', 'nomorinduk', 'id']);
          const name = findVal(['nama', 'name', 'namasiswa', 'siswa']);
          const genderRaw = findVal(['gender', 'jeniskelamin', 'jk', 'kelamin', 'sex']);
          const className = findVal(['kelas', 'namakelas', 'class', 'rombel']) || (selectedClass ? selectedClass.name : 'Kelas 5A');
          const grade = findVal(['tingkat', 'grade', 'jenjang']) || (selectedClass ? selectedClass.grade : 'Kelas 5');
          const password = findVal(['password', 'pin', 'sandi', 'pass']) || '123';
          const school = findVal(['sekolah', 'school', 'namasekolah']) || schoolSettings.schoolName || 'SD Negeri 2 Medewi';

          let isValid = true;
          let validationError: string | undefined;

          if (!name) {
            isValid = false;
            validationError = 'Nama siswa wajib diisi';
          }

          return {
            nisn: nisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
            name,
            gender: genderRaw || 'L',
            className,
            grade,
            password,
            school,
            isValid,
            validationError,
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        setErrorMsg('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Perform Bulk Import
  const handleImportNow = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada baris data siswa yang valid untuk diimpor.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    setTimeout(() => {
      try {
        const importData = validRows.map((r) => ({
          name: r.name,
          nisn: r.nisn,
          gender: r.gender,
          password: r.password,
          grade: r.grade,
          school: r.school,
          className: r.className,
        }));

        const res = db.bulkImportStudents(importData, targetClassId);
        setSuccessResult({
          added: res.added,
          updated: res.updated,
          total: res.added + res.updated,
        });
        setIsProcessing(false);
        onSuccess(res.added + res.updated);
      } catch (err) {
        setErrorMsg('Terjadi kesalahan saat memproses data ke database.');
        setIsProcessing(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              📊
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Upload & Impor Data Siswa via Excel
              </h3>
              <p className="text-xs text-emerald-100">
                {selectedClass
                  ? `Tambahkan banyak siswa sekaligus ke ${selectedClass.name}`
                  : 'Impor daftar siswa secara massal untuk seluruh rombel'}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Template Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-emerald-950">
                  Unduh Template Excel Resmi (.XLSX)
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Format tabel sudah disesuaikan dengan kolom NISN, Nama Siswa, Jenis Kelamin (L/P), dan Kelas.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!successResult && (
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Pilih File Excel / CSV Hasil Pengisian
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-emerald-50/30 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-emerald-300 shadow-xs text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl transition-transform group-hover:scale-105">
                  📂
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {selectedFile ? (
                    <span className="text-emerald-700 font-black">{selectedFile.name}</span>
                  ) : (
                    <span>Klik untuk memilih file atau seret file ke sini</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successResult && (
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xl shadow-md">
                ✓
              </div>
              <div>
                <h4 className="text-base font-black text-emerald-950">
                  Berhasil Mengimpor {successResult.total} Data Siswa!
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  {successResult.added} siswa baru berhasil ditambahkan • {successResult.updated} siswa diperbarui.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-colors cursor-pointer"
                >
                  Tutup & Lihat Siswa di Kelas
                </button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && !successResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Pratinjau Data Terbaca ({parsedRows.length} Siswa)
                </span>
                <span className="text-[11px] text-slate-500">
                  {parsedRows.filter((r) => r.isValid).length} Valid • {parsedRows.filter((r) => !r.isValid).length} Tidak Valid
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">No</th>
                      <th className="p-2.5 border-b border-slate-200">NISN</th>
                      <th className="p-2.5 border-b border-slate-200">Nama Siswa</th>
                      <th className="p-2.5 border-b border-slate-200">JK</th>
                      <th className="p-2.5 border-b border-slate-200">Kelas</th>
                      <th className="p-2.5 border-b border-slate-200">PIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 ${
                          !row.isValid ? 'bg-rose-50/50 text-rose-800' : ''
                        }`}
                      >
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-semibold">{row.nisn}</td>
                        <td className="p-2.5 font-bold text-slate-800">{row.name}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              row.gender.toLowerCase().includes('p')
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {row.gender.toLowerCase().includes('p') ? 'P' : 'L'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{row.className}</td>
                        <td className="p-2.5 font-mono text-slate-500">{row.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {!successResult && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              {parsedRows.length > 0
                ? `${parsedRows.filter((r) => r.isValid).length} data siap disimpan`
                : 'Pilih file excel untuk mulai impor'}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || isProcessing}
                onClick={handleImportNow}
                className={`px-5 py-2.5 rounded-2xl text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  parsedRows.length === 0 || isProcessing
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Impor {parsedRows.filter((r) => r.isValid).length} Siswa Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
