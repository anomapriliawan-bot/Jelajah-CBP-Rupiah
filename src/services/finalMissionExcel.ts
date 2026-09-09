import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { FinalMissionQuestion, FinalMissionClassification } from '../types';
import { STAGES } from './finalMissionData';

export interface ParseFinalMissionResult {
  success: boolean;
  totalParsed: number;
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
  questions: FinalMissionQuestion[];
}

/**
 * Standard 10-column headers for Final Mission Database (with Option 2 Bobot Poin per Opsi)
 */
export const FINAL_MISSION_HEADERS = [
  'ID Soal',
  'Dimensi',
  'Pertanyaan',
  'Nama File Gambar',
  'Tipe Soal',
  'Pilihan Jawaban',
  'Kunci Jawaban',
  'Skor Poin',
  'Tahap',
  'Bobot Poin per Opsi',
];

/**
 * Parse options string into structured array with standard A., B., C. prefixes
 */
export function normalizeOptions(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item, idx) => {
        const text = String(item).trim();
        const letter = String.fromCharCode(65 + idx);
        if (/^[A-Z0-9]\.\s*/i.test(text)) return text;
        return text ? `${letter}. ${text}` : '';
      })
      .filter(Boolean);
  }
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text) return [];

  let items: string[] = [];

  // Check if comma-separated list like "A. Rp 1.000, B. Rp 2.000, C. Rp 5.000" or semicolon
  if (/[A-Z0-9]\.\s*/i.test(text) && (text.includes(',') || text.includes(';') || text.includes('\n'))) {
    items = text.split(/[,;\n]\s*(?=[A-Z0-9]\.\s*)/i).map((p) => p.trim()).filter(Boolean);
  } else if (text.includes('\n')) {
    items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  } else if (text.includes(';')) {
    items = text.split(';').map((l) => l.trim()).filter(Boolean);
  } else if (text.includes(',')) {
    items = text.split(',').map((l) => l.trim()).filter(Boolean);
  } else if (text.includes('|')) {
    items = text.split('|').map((l) => l.trim()).filter(Boolean);
  } else {
    items = [text];
  }

  // Ensure each parsed item has A., B., C. prefix
  return items.map((item, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const clean = item.replace(new RegExp(`^(\\[?${letter}\\]?|[A-Z0-9])\\.\\s*`, 'i'), '').trim();
    if (/^[A-Z0-9]\.\s*/i.test(item)) {
      return item;
    }
    return clean ? `${letter}. ${clean}` : `${letter}. ${item}`;
  });
}

/**
 * Normalize Stage name into one of the canonical 3 stages
 */
export function normalizeStageName(rawStage: any, index?: number): string {
  if (!rawStage) {
    if (typeof index === 'number') {
      if (index < 22) return STAGES.PEMULA;
      if (index < 44) return STAGES.TERAMPIL;
      return STAGES.MASTER;
    }
    return STAGES.PEMULA;
  }

  const str = String(rawStage).toLowerCase();
  if (str.includes('master') || str.includes('sang') || str.includes('puncak') || str.includes('3')) {
    return STAGES.MASTER;
  }
  if (str.includes('terampil') || str.includes('mahir') || str.includes('lanjut') || str.includes('2')) {
    return STAGES.TERAMPIL;
  }
  return STAGES.PEMULA;
}

/**
 * Parse uploaded Excel or CSV file buffer for Final Mission
 */
export function parseFinalMissionExcelOrCsv(
  fileBuffer: ArrayBuffer | Uint8Array,
  classification: FinalMissionClassification = 'anak'
): ParseFinalMissionResult {
  const result: ParseFinalMissionResult = {
    success: false,
    totalParsed: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    questions: [],
  };

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      result.errors.push('File spreadsheet tidak memiliki lembar kerja (worksheet).');
      return result;
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      result.errors.push('Lembar kerja kosong atau tidak ada baris data.');
      return result;
    }

    rawRows.forEach((row, idx) => {
      // Find keys in case-insensitive manner
      const getVal = (possibleKeys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const target of possibleKeys) {
            const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanK === cleanTarget) {
              return row[k];
            }
          }
        }
        return '';
      };

      const id = String(getVal(['idsoal', 'id', 'kode', 'code']) || `Q_${classification}_${idx + 1}`).trim();
      const dimension = String(getVal(['dimensi', 'kategori', 'pilar', 'topik']) || 'Cinta Rupiah').trim();
      const question = String(getVal(['pertanyaan', 'soal', 'question'])).trim();
      const imageFileName = String(getVal(['namafilegambar', 'gambar', 'image', 'filegambar'])).trim();
      const questionType = String(getVal(['tipesoal', 'tipe', 'type', 'format']) || 'Pilihan Ganda').trim();
      const rawOptions = getVal(['pilihanjawaban', 'pilihan', 'options', 'opsi']);
      const correctAnswer = String(getVal(['kuncijawaban', 'kunci', 'jawaban', 'correctanswer'])).trim();
      const rawPoints = getVal(['skorpoin', 'skor', 'poin', 'points', 'bobot']);
      const rawStage = getVal(['tahap', 'stage', 'tingkat', 'level']);
      const rawOptionPoints = getVal([
        'bobotpoinperopsi',
        'bobotopsi',
        'poinopsi',
        'optionpoints',
        'bobotperopsi',
        'skoropsi',
      ]);

      if (!question) {
        result.skipped++;
        result.errors.push(`Baris ${idx + 2}: Teks Pertanyaan kosong.`);
        return;
      }

      const options = normalizeOptions(rawOptions);
      const isScale = questionType.toLowerCase().includes('skala') || questionType.toLowerCase().includes('1-5');
      const points = parseInt(String(rawPoints), 10) || (isScale ? 5 : 10);
      const stage = normalizeStageName(rawStage, idx);

      let optionPoints: number[] | undefined = undefined;
      if (rawOptionPoints) {
        const parsedArr = String(rawOptionPoints)
          .split(/[,;|]/)
          .map((p) => parseFloat(p.trim()))
          .filter((n) => !isNaN(n));
        if (parsedArr.length > 0) {
          optionPoints = parsedArr;
        }
      }

      const parsedQuestion: FinalMissionQuestion = {
        id,
        dimension,
        question,
        imageFileName: imageFileName || undefined,
        questionType: questionType || 'Pilihan Ganda',
        options: options.length > 0 ? options : (isScale ? ['1. Sangat Tidak Setuju', '2. Tidak Setuju', '3. Biasa Saja', '4. Setuju', '5. Sangat Setuju'] : ['A. Benar', 'B. Salah']),
        correctAnswer: correctAnswer || (isScale ? 'Skor Otomatis 1-5' : (options[0] ?? 'A')),
        points: points > 0 ? points : (isScale ? 5 : 10),
        optionPoints,
        stage,
        classification,
        orderIndex: idx + 1,
      };

      result.questions.push(parsedQuestion);
      result.totalParsed++;
    });

    result.success = result.questions.length > 0;
    return result;
  } catch (err: any) {
    result.errors.push(`Gagal memproses file Excel: ${err?.message || String(err)}`);
    return result;
  }
}

/**
 * Generate Excel Workbook for Final Mission Questions with Bank Indonesia Professional Styling & Native Dropdowns
 */
export async function generateFinalMissionExcel(
  questions: FinalMissionQuestion[],
  sheetTitle: string = 'Bank Soal Misi Akhir'
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jelajah CBP Rupiah Bank Indonesia';
  workbook.lastModifiedBy = 'Admin Jelajah CBP Rupiah';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. LEMBAR UTAMA: BANK SOAL
  const worksheet = workbook.addWorksheet(sheetTitle, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }],
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  worksheet.columns = [
    { header: 'ID Soal', key: 'id', width: 15 },
    { header: 'Dimensi', key: 'dimension', width: 32 },
    { header: 'Pertanyaan', key: 'question', width: 58 },
    { header: 'Nama File Gambar', key: 'imageFileName', width: 28 },
    { header: 'Tipe Soal', key: 'questionType', width: 20 },
    { header: 'Pilihan Jawaban', key: 'options', width: 55 },
    { header: 'Kunci Jawaban', key: 'correctAnswer', width: 32 },
    { header: 'Skor Poin', key: 'points', width: 14 },
    { header: 'Tahap', key: 'stage', width: 24 },
    { header: 'Bobot Poin per Opsi', key: 'optionPoints', width: 24 },
  ];

  // Aktifkan Filter Otomatis pada Baris Header (A1:J1)
  worksheet.autoFilter = 'A1:J1';

  // Styling Baris Header (Baris 1) - Tema Deep Navy Blue Bank Indonesia
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F254B' }, // Official Bank Indonesia Navy Blue
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0A1931' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // 2. LEMBAR KEDUA: PANDUAN & MASTER DATA REFERENSI DROPDOWN
  const refSheet = workbook.addWorksheet('Panduan_&_Referensi', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Master List Values
  const masterDimensi = [
    'Cinta Rupiah - Pengetahuan',
    'Cinta Rupiah - Sikap',
    'Cinta Rupiah - Perilaku',
    'Bangga Rupiah - Pengetahuan',
    'Bangga Rupiah - Sikap',
    'Bangga Rupiah - Perilaku',
    'Paham Rupiah - Pengetahuan',
    'Paham Rupiah - Sikap',
    'Paham Rupiah - Perilaku',
    'Cinta, Bangga, Paham - Edukasi Terpadu',
  ];

  const masterTipeSoal = [
    'Pilihan Ganda',
    'Ya/Tidak',
    'Skala 1-5',
    'Pengelompokan Gambar',
  ];

  const masterTahap = [
    'Penjelajah Pemula',
    'Penjelajah Terampil',
    'Sang Penjelajah',
  ];

  refSheet.columns = [
    { header: 'Daftar Dimensi', key: 'dimensi', width: 34 },
    { header: 'Daftar Tipe Soal', key: 'tipe', width: 24 },
    { header: 'Daftar Tahap', key: 'tahap', width: 24 },
    { header: '', key: 'spacer', width: 5 },
    { header: 'Kolom', key: 'kolom', width: 22 },
    { header: 'Panduan Pengisian Standar Bank Indonesia', key: 'panduan', width: 65 },
  ];

  // Styling Header Ref Sheet
  const refHeader = refSheet.getRow(1);
  refHeader.height = 30;
  refHeader.eachCell((cell, colNumber) => {
    if (colNumber === 4) return;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Isi data referensi dropdown
  const maxRefRows = Math.max(masterDimensi.length, masterTipeSoal.length, masterTahap.length);
  const guides = [
    { col: 'ID Soal', guide: 'Kode unik soal (contoh: Q1a, Q2b, Q_DWS_01).' },
    { col: 'Dimensi', guide: 'Pilih dari menu dropdown (Cinta, Bangga, atau Paham).' },
    { col: 'Pertanyaan', guide: 'Teks butir soal lengkap, jelas, dan santun.' },
    { col: 'Nama File Gambar', guide: 'Nama file foto/visual (contoh: uang_kertas_1000.png). Kosongkan jika tanpa gambar.' },
    { col: 'Tipe Soal', guide: 'Pilih dari dropdown: Pilihan Ganda, Ya/Tidak, Skala 1-5, atau Pengelompokan Gambar.' },
    { col: 'Pilihan Jawaban', guide: 'Daftar opsi jawaban dipisah koma atau baris baru (contoh: A. Opsi 1, B. Opsi 2).' },
    { col: 'Kunci Jawaban', guide: 'Teks opsi jawaban yang benar (harus persis sama dengan salah satu opsi).' },
    { col: 'Skor Poin', guide: 'Poin angka (standar: 10 poin per soal).' },
    { col: 'Tahap', guide: 'Pilih dari dropdown: Penjelajah Pemula, Penjelajah Terampil, atau Sang Penjelajah.' },
    { col: 'Bobot Poin per Opsi', guide: 'Khusus Skala 1-5 (contoh: 2, 4, 6, 8, 10). Kosongkan untuk pilihan ganda normal.' },
  ];

  for (let i = 0; i < maxRefRows; i++) {
    const row = refSheet.getRow(i + 2);
    row.height = 24;
    if (masterDimensi[i]) row.getCell(1).value = masterDimensi[i];
    if (masterTipeSoal[i]) row.getCell(2).value = masterTipeSoal[i];
    if (masterTahap[i]) row.getCell(3).value = masterTahap[i];

    if (guides[i]) {
      row.getCell(5).value = guides[i].col;
      row.getCell(5).font = { bold: true };
      row.getCell(6).value = guides[i].guide;
    }

    [1, 2, 3, 5, 6].forEach((c) => {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  }

  // 3. PENGISIAN DATA SOAL KE LEMBAR UTAMA DENGAN FORMAT & STYLING RAPI
  questions.forEach((q, idx) => {
    const rowIndex = idx + 2;
    const row = worksheet.getRow(rowIndex);
    row.height = 28;

    row.values = {
      id: q.id,
      dimension: q.dimension,
      question: q.question,
      imageFileName: q.imageFileName || '',
      questionType: q.questionType,
      options: Array.isArray(q.options) ? q.options.join(', ') : q.options,
      correctAnswer: q.correctAnswer,
      points: q.points,
      stage: q.stage,
      optionPoints: q.optionPoints && q.optionPoints.length > 0 ? q.optionPoints.join(', ') : '',
    };

    // Alternating subtle row fill for high readability
    const isEven = idx % 2 === 1;
    const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    // Alignment dan Border tiap sel
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Tentukan perataan spesifik kolom
      if (c === 1 || c === 5 || c === 8 || c === 9 || c === 10) {
        // ID, Tipe Soal, Skor, Tahap, Bobot Opsi -> Rata Tengah
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 3 || c === 6 || c === 7) {
        // Pertanyaan, Opsi, Kunci -> Rata Kiri + Wrap Text aktif
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      if (c === 1) {
        cell.font = { bold: true, color: { argb: 'FF1E293B' } };
      } else if (c === 8) {
        cell.font = { bold: true, color: { argb: 'FF059669' } }; // Hijau skor
      }
    }
  });

  // 4. PENERAPAN DROPDOWN (DATA VALIDATION) PADA SEL BARIS DATA & CADANGAN BARIS BARU
  // Memasang dropdown dari baris 2 hingga 200 baris ke depan agar admin yang menambah baris baru di Excel juga otomatis mendapat dropdown
  const totalRowsWithDropdown = Math.max(questions.length + 50, 150);
  for (let r = 2; r <= totalRowsWithDropdown; r++) {
    // Dropdown Kolom B: Dimensi
    worksheet.getCell(`B${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Panduan_&_Referensi'!$A$2:$A$11`],
      showErrorMessage: true,
      errorTitle: 'Dimensi Tidak Valid',
      error: 'Silakan pilih dimensi resmi dari daftar menu dropdown.',
    };

    // Dropdown Kolom E: Tipe Soal
    worksheet.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Panduan_&_Referensi'!$B$2:$B$5`],
      showErrorMessage: true,
      errorTitle: 'Tipe Soal Tidak Valid',
      error: 'Silakan pilih tipe soal resmi (Pilihan Ganda, Ya/Tidak, Skala 1-5, atau Pengelompokan Gambar).',
    };

    // Dropdown Kolom I: Tahap
    worksheet.getCell(`I${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'Panduan_&_Referensi'!$C$2:$C$4`],
      showErrorMessage: true,
      errorTitle: 'Tahap Tidak Valid',
      error: 'Silakan pilih tahap resmi (Penjelajah Pemula, Penjelajah Terampil, atau Sang Penjelajah).',
    };
  }

  // Tulis buffer file Excel (.xlsx)
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
