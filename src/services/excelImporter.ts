import * as XLSX from 'xlsx';
import { normalizeImageUrl } from '../utils/imageHelper';
import {
  Mission,
  Lesson,
  Activity,
  PracticeQuestion,
  Badge,
  Reflection,
  Reference,
  TournamentPackage,
  TournamentQuestion,
  TournamentEvent,
  ContentStatus,
} from '../types';
import {
  seedMissions,
  seedLessons,
  seedActivities,
  seedPracticeQuestions,
  seedBadges,
  seedReflections,
  seedReferences,
  seedTournamentPackages,
  seedTournamentQuestions,
} from './seedData';
import { normalizeMissionId } from './db';

export interface ParsedWorkbookData {
  sheetsFound: string[];
  ignoredSheets: string[];
  missions: Mission[];
  lessons: Lesson[];
  activities: Activity[];
  practiceQuestions: PracticeQuestion[];
  badges: Badge[];
  reflections: Reflection[];
  references: Reference[];
  tournamentPackages: TournamentPackage[];
  tournamentQuestions: TournamentQuestion[];
  tournamentEvents: TournamentEvent[];
  rawRowsCount: Record<string, number>;
}

export interface ValidationErrorItem {
  sheet: string;
  rowNumber: number;
  recordId: string;
  field: string;
  errorCode: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  isValid: boolean;
  errorsCount: number;
  warningsCount: number;
  errors: ValidationErrorItem[];
  counts: {
    missions: number;
    lessons: number;
    activities: number;
    practiceQuestions: number;
    badges: number;
    reflections: number;
    references: number;
    tournamentPackages: number;
    tournamentQuestions: number;
    tournamentEvents: number;
  };
  duplicatesInFile: string[];
  missingRelations: string[];
}

export const VALID_SHEET_NAMES = [
  '01_MISI',
  '02_MATERI',
  '03_AKTIVITAS',
  '04_SOAL',
  '05_LENCANA',
  '06_REFERENSI',
  '07_REFLEKSI',
  '10_PAKET_TURNAMEN',
  '11_SOAL_TURNAMEN',
  '12_EVENT_TEMPLATE',
];

export const IGNORED_SHEET_NAMES = [
  '00_PETUNJUK',
  '08_IMPORT_MAP',
  '09_VALIDASI',
  '13_PENGGUNA_TEMPLATE',
  '14_MEDIA_ASSET',
  '15_ENUMS_IMPORT',
  '16_DIAGNOSTIK_IMPORT',
];

// Helper: normalize key for matching column names regardless of spaces, underscores, casing
function normalizeKey(k: string): string {
  return String(k || '').toLowerCase().trim().replace(/[\s_\-\.]/g, '');
}

// Helper: normalize identifier for cross-referencing
export function normalizeId(id: string): string {
  return String(id || '').toLowerCase().trim().replace(/[\s_\-]/g, '');
}

// Helper: safely get cell value from row using multiple potential column aliases
export function getVal(row: any, ...keys: string[]): any {
  if (!row || typeof row !== 'object') return '';
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return row[k];
    }
  }
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const target = normalizeKey(k);
    const foundKey = rowKeys.find((rk) => normalizeKey(rk) === target);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey];
    }
  }
  return '';
}

// Helper: parse boolean from Excel values (TRUE, FALSE, 1, 0, ya, tidak)
export function parseBoolean(val: any, defaultVal: boolean = false): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (['true', '1', 'ya', 'yes', 't', 'benar', 'y'].includes(s)) return true;
    if (['false', '0', 'tidak', 'no', 'f', 'salah', 'n'].includes(s)) return false;
  }
  return defaultVal;
}

// Helper: normalize content status to canonical values ('draft', 'review', 'approved', 'published', 'archived')
export function normalizeContentStatus(val: any): ContentStatus {
  if (!val) return 'draft';
  const s = String(val).trim().toLowerCase();
  if (s === 'draft' || s === 'konsep' || s === 'draf') return 'draft';
  if (s === 'review' || s === 'ditinjau' || s === 'tinjauan') return 'review';
  if (s === 'approved' || s === 'disetujui' || s === 'approve') return 'approved';
  if (s === 'published' || s === 'dipublikasikan' || s === 'aktif' || s === 'publish' || s === 'active') return 'published';
  if (s === 'archived' || s === 'diarsipkan' || s === 'arsip') return 'archived';
  return 'draft';
}

// Helper: normalize World ID
export function normalizeWorldId(val: any): 'cinta' | 'bangga' | 'paham' {
  const s = String(val || '').toLowerCase().trim();
  if (s.includes('bangga') || s.includes('dunia 2') || s === '2') return 'bangga';
  if (s.includes('paham') || s.includes('dunia 3') || s === '3') return 'paham';
  return 'cinta';
}

export function parseExcelWorkbook(fileBuffer: ArrayBuffer | Uint8Array): ParsedWorkbookData {
  const data = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  const result: ParsedWorkbookData = {
    sheetsFound: [],
    ignoredSheets: [],
    missions: [],
    lessons: [],
    activities: [],
    practiceQuestions: [],
    badges: [],
    reflections: [],
    references: [],
    tournamentPackages: [],
    tournamentQuestions: [],
    tournamentEvents: [],
    rawRowsCount: {},
  };

  for (const name of sheetNames) {
    const trimmedName = name.trim();

    // Check if it's an ignored sheet
    if (IGNORED_SHEET_NAMES.some((ign) => trimmedName.includes(ign) || ign.includes(trimmedName))) {
      result.ignoredSheets.push(trimmedName);
      continue;
    }

    const worksheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
    result.rawRowsCount[trimmedName] = rows.length;

    // 11_SOAL_TURNAMEN (Check before 04_SOAL to avoid matching on 'soal')
    if (
      trimmedName.includes('11_SOAL_TURNAMEN') ||
      trimmedName.toLowerCase().includes('soal_turnamen') ||
      trimmedName.toLowerCase().includes('tournament_question') ||
      (trimmedName.toLowerCase().includes('turnamen') && trimmedName.toLowerCase().includes('soal'))
    ) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'tournament_question_id', 'kode_soal_turnamen', 'kode') || `TQ-${String(idx + 1).padStart(3, '0')}`).trim();
        const packageId = String(getVal(r, 'package_id', 'id_paket', 'paket_id') || '').trim();
        const sourcePracticeQuestionId = String(getVal(r, 'source_practice_question_id', 'id_soal_latihan', 'source_question_id', 'ref_soal') || '').trim();
        const missionId = String(getVal(r, 'mission_id', 'id_misi', 'misi_id') || '').trim();
        const code = String(getVal(r, 'code', 'kode', 'kode_soal') || id).trim();
        const question = String(getVal(r, 'question', 'pertanyaan', 'soal') || '').trim();

        let options: string[] = [];
        const optA = String(getVal(r, 'option_a', 'opsi_a', 'a') || '').trim();
        const optB = String(getVal(r, 'option_b', 'opsi_b', 'b') || '').trim();
        const optC = String(getVal(r, 'option_c', 'opsi_c', 'c') || '').trim();
        const optD = String(getVal(r, 'option_d', 'opsi_d', 'd') || '').trim();

        if (optA && optB) {
          options = [optA, optB, optC, optD].filter(Boolean);
        } else {
          const rawOpts = String(getVal(r, 'options', 'pilihan', 'opsi') || '');
          options = rawOpts ? rawOpts.split(/[;\n\r|]/).map((s) => s.trim()).filter(Boolean) : [];
        }

        let correctAnswerIndex = 0;
        const ansRaw = String(getVal(r, 'correct_answer', 'correct_option', 'jawaban_benar', 'kunci') || '').toUpperCase().trim();
        if (ansRaw === 'A' || ansRaw === '0') correctAnswerIndex = 0;
        else if (ansRaw === 'B' || ansRaw === '1') correctAnswerIndex = 1;
        else if (ansRaw === 'C' || ansRaw === '2') correctAnswerIndex = 2;
        else if (ansRaw === 'D' || ansRaw === '3') correctAnswerIndex = 3;

        const explanation = String(getVal(r, 'explanation', 'penjelasan') || '').trim();
        const points = Number(getVal(r, 'points', 'poin', 'skor') || 100);
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.tournamentQuestions.push({
          id,
          packageId,
          sourcePracticeQuestionId,
          code,
          question,
          options: options.length >= 2 ? options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
          correctAnswerIndex,
          explanation,
          points,
          status,
          ...(missionId ? { missionId } : {}),
        } as any);
      });
    }

    // 10_PAKET_TURNAMEN
    else if (trimmedName.includes('10_PAKET_TURNAMEN') || trimmedName.toLowerCase().includes('paket') || trimmedName.toLowerCase().includes('package')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'package_id', 'kode_paket', 'kode') || `PKG-${String(idx + 1).padStart(2, '0')}`).trim();
        const code = String(getVal(r, 'code', 'kode', 'kode_paket') || id).trim();
        const title = String(getVal(r, 'title', 'judul', 'nama_paket') || `Paket Turnamen ${idx + 1}`).trim();
        const gradeLevel = String(getVal(r, 'grade_level', 'tingkat_kelas', 'kelas') || 'SD Kelas 5').trim();
        const duration = Number(getVal(r, 'duration_minutes', 'durasi_menit', 'waktu') || 15);
        const totalQuestions = Number(getVal(r, 'total_questions', 'jumlah_soal') || 20);
        const passingScore = Number(getVal(r, 'passing_score', 'nilai_lulus', 'kkm') || 75);
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.tournamentPackages.push({
          id,
          code,
          title,
          gradeLevel,
          targetDurationMinutes: duration,
          totalQuestions,
          passingScore,
          status,
        });
      });
    }

    // 12_EVENT_TEMPLATE
    else if (trimmedName.includes('12_EVENT_TEMPLATE') || trimmedName.toLowerCase().includes('event')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'event_id', 'kode') || `EVT-${idx + 1}`).trim();
        const packageId = String(getVal(r, 'package_id', 'id_paket') || '').trim();
        const title = String(getVal(r, 'title', 'nama_event') || `Turnamen Sekolah ${idx + 1}`).trim();
        const school = String(getVal(r, 'school', 'nama_sekolah') || 'SD Nusantara').trim();
        const startTime = String(getVal(r, 'start_time', 'waktu_mulai') || new Date().toISOString()).trim();
        const endTime = String(getVal(r, 'end_time', 'waktu_selesai') || new Date().toISOString()).trim();
        const rawStatus = getVal(r, 'status', 'status_event');

        result.tournamentEvents.push({
          id,
          packageId,
          title,
          school,
          startTime,
          endTime,
          status: rawStatus === 'completed' ? 'completed' : rawStatus === 'ongoing' || rawStatus === 'active' ? 'active' : rawStatus === 'waiting' ? 'waiting' : rawStatus === 'cancelled' ? 'cancelled' : 'scheduled',
        });
      });
    }

    // 01_MISI
    else if (trimmedName.includes('01_MISI') || trimmedName.toLowerCase().includes('misi')) {
      result.sheetsFound.push(trimmedName);
      const canonicalDefaults = [
        'JR-C01', 'JR-C02', 'JR-C03',
        'JR-B04', 'JR-B05', 'JR-B06',
        'JR-P07', 'JR-P08', 'JR-P09'
      ];
      rows.forEach((r, idx) => {
        const rawId = String(getVal(r, 'id', 'mission_id', 'kode_misi', 'kode') || '').trim();
        const id = normalizeMissionId(rawId) || (idx < 9 ? canonicalDefaults[idx] : `MIS-${idx + 1}`);
        const rawWorld = getVal(r, 'world_id', 'world', 'realm', 'kategori', 'dunia');
        const worldId = normalizeWorldId(rawWorld) || (id.startsWith('JR-C') ? 'cinta' : id.startsWith('JR-B') ? 'bangga' : 'paham');
        const code = String(getVal(r, 'code', 'kode', 'kode_misi') || id).trim();
        const title = String(getVal(r, 'title', 'judul', 'nama_misi') || `Misi ${idx + 1}`).trim();
        const subtitle = String(getVal(r, 'subtitle', 'subjudul', 'tagline') || '').trim();
        const levelNum = Number(getVal(r, 'level', 'level_number', 'tingkat', 'urutan') || idx + 1);
        const summary = String(getVal(r, 'summary', 'ringkasan', 'deskripsi') || '').trim();
        const learningPointsRaw = String(getVal(r, 'learning_points', 'poin_belajar', 'tujuan') || '');
        const learningPoints = learningPointsRaw ? learningPointsRaw.split(/[;\n\r]/).map((s) => s.trim()).filter(Boolean) : [];
        const xp = Number(getVal(r, 'xp_reward', 'xp', 'hadiah_xp') || 150);
        const pts = Number(getVal(r, 'point_reward', 'points', 'poin') || 150);
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);
        const rawImageUrl = String(
          getVal(
            r,
            'image_url',
            'gambar',
            'url_gambar',
            'cover_url',
            'cover',
            'opening_image_url',
            'foto',
            'link_gambar',
            'file_gambar',
            'image',
            'img',
            'sampul',
            'url_foto',
            'tautan_gambar',
            'media',
            'illustration'
          ) || ''
        ).trim();
        const imageUrl = normalizeImageUrl(rawImageUrl);

        result.missions.push({
          id,
          worldId,
          code,
          title,
          subtitle,
          levelNumber: levelNum,
          summary,
          learningPoints: learningPoints.length > 0 ? learningPoints : ['Mengenal konsep dasar', 'Praktik langsung'],
          status,
          xpReward: xp,
          pointReward: pts,
          orderIndex: idx + 1,
          badgeId: `BDG-${String(idx + 1).padStart(2, '0')}`,
          iconName: 'book-open',
          imageUrl: imageUrl || '',
          openingImageUrl: imageUrl || '',
        });
      });
    }

    // 02_MATERI
    else if (trimmedName.includes('02_MATERI') || trimmedName.toLowerCase().includes('materi') || trimmedName.toLowerCase().includes('lesson')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'content_id', 'id', 'lesson_id', 'kode_materi', 'kode') || `MAT-${String(idx + 1).padStart(3, '0')}`).trim();
        const rawMissionId = String(getVal(r, 'mission_id', 'id_misi', 'misi_id', 'kode_misi') || '').trim();
        const missionId = normalizeMissionId(rawMissionId);
        const code = String(getVal(r, 'code', 'kode', 'kode_materi', 'content_id') || id).trim();
        const title = String(getVal(r, 'title', 'judul', 'judul_materi') || `Materi ${idx + 1}`).trim();
        const summary = String(getVal(r, 'summary', 'ringkasan', 'deskripsi_singkat') || '').trim();
        
        // PENTING: student_text adalah isi utama materi untuk siswa
        const studentText = String(
          getVal(
            r,
            'student_text',
            'studenttext',
            'student_Text',
            'studentText',
            'teks_siswa',
            'tekssiswa',
            'isi_siswa',
            'isisiswa',
            'isi_materi',
            'isimateri',
            'materi',
            'uraian',
            'uraian_materi',
            'narasi',
            'bacaan',
            'artikel',
            'penjelasan',
            'content',
            'isi',
            'body',
            'text',
            'konten',
            'isi_konten',
            'materi_pembelajaran',
            'isi_pelajaran',
            'deskripsi',
            'description'
          ) || ''
        ).trim();
        const takeawaysRaw = String(getVal(r, 'key_takeaways', 'poin_penting', 'kesimpulan') || '');
        const keyTakeaways = takeawaysRaw ? takeawaysRaw.split(/[;\n\r]/).map((s) => s.trim()).filter(Boolean) : [];
        const imageUrl = normalizeImageUrl(
          String(
            getVal(
              r,
              'image_url',
              'gambar',
              'url_gambar',
              'opening_image_url',
              'foto',
              'link_gambar',
              'file_gambar',
              'image',
              'img',
              'cover',
              'sampul',
              'url_foto',
              'tautan_gambar',
              'media',
              'illustration'
            ) || ''
          ).trim()
        );
        const imageBrief = String(getVal(r, 'image_brief', 'brief_gambar', 'image_caption', 'keterangan_gambar', 'caption') || '').trim();
        const interactionPrompt = String(getVal(r, 'interaction_prompt', 'prompt_interaksi', 'ayo_berpikir', 'pertanyaan_interaktif') || '').trim();
        const gradeScope = String(getVal(r, 'grade_scope', 'fase', 'tingkat', 'kelas') || 'Semua Tingkat').trim();
        const contentType = String(getVal(r, 'content_type', 'tipe_konten', 'jenis_konten') || 'article').trim();
        const teacherNote = String(getVal(r, 'teacher_note', 'catatan_guru') || '').trim();
        const sourceUrl = String(getVal(r, 'source_url', 'sumber', 'referensi_url') || '').trim();
        const contentOrder = Number(getVal(r, 'content_order', 'order_index', 'order', 'urutan', 'no') || idx + 1);
        const readTime = Number(getVal(r, 'read_time', 'read_time_minutes', 'waktu_baca', 'durasi_menit') || 3);
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.lessons.push({
          id,
          content_id: id,
          missionId,
          mission_id: missionId,
          code,
          title,
          summary,
          content: studentText, // fallback compatibility
          studentText: studentText, // CANONICAL
          student_text: studentText, // CANONICAL
          text: studentText,
          body: studentText,
          keyTakeaways,
          imageUrl: imageUrl || '',
          image_url: imageUrl || '',
          imageBrief: imageBrief,
          image_brief: imageBrief,
          imageCaption: imageBrief,
          interactionPrompt: interactionPrompt,
          interaction_prompt: interactionPrompt,
          gradeScope: gradeScope,
          grade_scope: gradeScope,
          contentType: contentType,
          content_type: contentType,
          teacherNote: teacherNote,
          teacher_note: teacherNote,
          sourceUrl: sourceUrl,
          source_url: sourceUrl,
          readTimeMinutes: readTime,
          contentOrder: contentOrder,
          content_order: contentOrder,
          orderIndex: contentOrder,
          status,
        });
      });
    }

    // 03_AKTIVITAS
    else if (trimmedName.includes('03_AKTIVITAS') || trimmedName.toLowerCase().includes('aktivitas') || trimmedName.toLowerCase().includes('activity')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'activity_id', 'kode_aktivitas', 'kode') || `ACT-${String(idx + 1).padStart(3, '0')}`).trim();
        const missionId = String(getVal(r, 'mission_id', 'id_misi', 'misi_id') || '').trim();
        const code = String(getVal(r, 'code', 'kode', 'kode_aktivitas') || id).trim();
        const title = String(getVal(r, 'title', 'judul', 'nama_aktivitas') || `Aktivitas ${idx + 1}`).trim();
        const type = String(getVal(r, 'type', 'tipe', 'jenis') || 'interactive').trim() as any;
        const instruction = String(getVal(r, 'instruction', 'instruksi', 'petunjuk') || '').trim();
        const pts = Number(getVal(r, 'point_reward', 'points', 'poin') || 100);
        const xp = Number(getVal(r, 'xp_reward', 'xp') || 50);
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.activities.push({
          id,
          missionId,
          code,
          title,
          type: type || 'interactive',
          instruction,
          pointReward: pts,
          xpReward: xp,
          orderIndex: idx + 1,
          status,
        });
      });
    }

    // 04_SOAL (Explicitly exclude 'turnamen')
    else if (
      trimmedName.includes('04_SOAL') ||
      trimmedName.toLowerCase().includes('practice') ||
      trimmedName.toLowerCase().includes('latihan') ||
      (trimmedName.toLowerCase().includes('soal') && !trimmedName.toLowerCase().includes('turnamen')) ||
      (trimmedName.toLowerCase().includes('question') && !trimmedName.toLowerCase().includes('tournament'))
    ) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'question_id', 'kode_soal', 'kode') || `QST-${String(idx + 1).padStart(3, '0')}`).trim();
        const missionId = String(getVal(r, 'mission_id', 'id_misi', 'misi_id') || '').trim();
        const code = String(getVal(r, 'code', 'kode', 'kode_soal') || id).trim();
        const question = String(getVal(r, 'question', 'pertanyaan', 'soal', 'teks_soal') || '').trim();

        // Options
        let options: string[] = [];
        const optA = String(getVal(r, 'option_a', 'opsi_a', 'pilihan_a', 'a', 'jawaban_a') || '').trim();
        const optB = String(getVal(r, 'option_b', 'opsi_b', 'pilihan_b', 'b', 'jawaban_b') || '').trim();
        const optC = String(getVal(r, 'option_c', 'opsi_c', 'pilihan_c', 'c', 'jawaban_c') || '').trim();
        const optD = String(getVal(r, 'option_d', 'opsi_d', 'pilihan_d', 'd', 'jawaban_d') || '').trim();

        if (optA && optB) {
          options = [optA, optB, optC, optD].filter(Boolean);
        } else {
          const rawOpts = String(getVal(r, 'options', 'pilihan', 'opsi', 'daftar_pilihan') || '');
          options = rawOpts ? rawOpts.split(/[;\n\r|]/).map((s) => s.trim()).filter(Boolean) : [];
        }

        // Correct Answer / Option (Accept A, B, C, D or 0, 1, 2, 3)
        let correctAnswerIndex = 0;
        const rawAns = String(
          getVal(r, 'correct_option', 'correct_answer', 'jawaban_benar', 'kunci', 'kunci_jawaban', 'jawaban', 'opsi_benar', 'kunci_soal') || ''
        ).trim();
        const upperAns = rawAns.toUpperCase();

        if (upperAns === 'A' || upperAns === '0') correctAnswerIndex = 0;
        else if (upperAns === 'B' || upperAns === '1') correctAnswerIndex = 1;
        else if (upperAns === 'C' || upperAns === '2') correctAnswerIndex = 2;
        else if (upperAns === 'D' || upperAns === '3') correctAnswerIndex = 3;
        else if (options.length > 0) {
          const matchedIdx = options.findIndex((opt) => opt.toLowerCase() === rawAns.toLowerCase());
          if (matchedIdx >= 0) correctAnswerIndex = matchedIdx;
        }

        const explanation = String(getVal(r, 'explanation', 'penjelasan', 'pembahasan') || '').trim();
        const difficulty = String(getVal(r, 'difficulty', 'tingkat_kesulitan', 'level') || 'easy').toLowerCase().trim() as any;
        const competency = String(getVal(r, 'competency_category', 'kategori_kompetensi', 'topik') || 'Cinta Bangga Paham Rupiah').trim();
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.practiceQuestions.push({
          id,
          missionId,
          code,
          question,
          options: options.length >= 2 ? options : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
          correctAnswerIndex,
          explanation,
          difficulty: difficulty === 'hard' || difficulty === 'medium' ? difficulty : 'easy',
          competencyCategory: competency,
          status,
        });
      });
    }

    // 05_LENCANA
    else if (trimmedName.includes('05_LENCANA') || trimmedName.toLowerCase().includes('lencana') || trimmedName.toLowerCase().includes('badge')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'badge_id', 'kode_lencana', 'kode') || `BDG-${String(idx + 1).padStart(2, '0')}`).trim();
        const missionId = String(getVal(r, 'mission_id', 'id_misi', 'misi_id') || '').trim();
        const code = String(getVal(r, 'code', 'kode', 'kode_lencana') || id).trim();
        const nameVal = String(getVal(r, 'name', 'nama', 'nama_lencana') || `Lencana ${idx + 1}`).trim();
        const category = String(getVal(r, 'category', 'kategori', 'realm') || 'cinta').toLowerCase().trim() as any;
        const icon = String(getVal(r, 'icon', 'ikon') || 'award').trim();
        const color = String(getVal(r, 'color', 'warna') || '#3B82F6').trim();
        const bgColor = String(getVal(r, 'bg_color', 'warna_latar') || '#DBEAFE').trim();
        const borderColor = String(getVal(r, 'border_color', 'warna_garis') || '#93C5FD').trim();
        const description = String(getVal(r, 'description', 'deskripsi', 'keterangan') || '').trim();
        const xp = Number(getVal(r, 'xp_reward', 'xp') || 150);
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.badges.push({
          id,
          missionId: missionId || undefined,
          code,
          name: nameVal,
          category: category || 'cinta',
          icon,
          color,
          bgColor,
          borderColor,
          description,
          unlocked: false,
          xpReward: xp,
          status,
        });
      });
    }

    // 06_REFERENSI
    else if (trimmedName.includes('06_REFERENSI') || trimmedName.toLowerCase().includes('referensi') || trimmedName.toLowerCase().includes('reference')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'ref_id', 'kode_referensi', 'kode') || `REF-${String(idx + 1).padStart(2, '0')}`).trim();
        const code = String(getVal(r, 'code', 'kode') || id).trim();
        const title = String(getVal(r, 'title', 'judul', 'nama_dokumen') || '').trim();
        const sourceName = String(getVal(r, 'source_name', 'sumber', 'penerbit') || '').trim();
        const year = String(getVal(r, 'publication_year', 'tahun', 'tahun_terbit') || '2023').trim();
        const url = String(getVal(r, 'url', 'link', 'tautan') || '').trim();
        const type = String(getVal(r, 'type', 'jenis', 'tipe') || 'guideline').toLowerCase().trim() as any;
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.references.push({
          id,
          code,
          title,
          sourceName,
          publicationYear: year,
          url,
          type: type || 'guideline',
          status,
        });
      });
    }

    // 07_REFLEKSI
    else if (trimmedName.includes('07_REFLEKSI') || trimmedName.toLowerCase().includes('refleksi') || trimmedName.toLowerCase().includes('reflection')) {
      result.sheetsFound.push(trimmedName);
      rows.forEach((r, idx) => {
        const id = String(getVal(r, 'id', 'refleksi_id', 'kode_refleksi', 'kode') || `RFL-${String(idx + 1).padStart(2, '0')}`).trim();
        const missionId = String(getVal(r, 'mission_id', 'id_misi', 'misi_id') || '').trim();
        const code = String(getVal(r, 'code', 'kode', 'kode_refleksi') || id).trim();
        const prompt = String(getVal(r, 'prompt', 'pertanyaan_refleksi', 'instruksi') || '').trim();
        const guidesRaw = String(getVal(r, 'guide_questions', 'panduan_pertanyaan', 'panduan') || '');
        const guideQuestions = guidesRaw ? guidesRaw.split(/[;\n\r]/).map((s) => s.trim()).filter(Boolean) : [];
        const rubric = String(getVal(r, 'rubric', 'rubrik', 'kriteria_penilaian') || '').trim();
        const rawStatus = getVal(r, 'status', 'status_konten');
        const status = normalizeContentStatus(rawStatus);

        result.reflections.push({
          id,
          missionId,
          code,
          prompt,
          guideQuestions,
          rubric,
          status,
        });
      });
    }
  }

  return result;
}

// Deep Validation Engine
export function validateWorkbookData(
  parsed: ParsedWorkbookData,
  existingMissions: Mission[],
  existingPracticeQuestions: PracticeQuestion[],
  existingPackages: TournamentPackage[]
): ValidationSummary {
  const errors: ValidationErrorItem[] = [];
  const duplicatesInFile: string[] = [];
  const missingRelations: string[] = [];

  // ID Maps and Normalized ID Lookups
  const allMissionsList = [...parsed.missions, ...existingMissions];
  const allMissionsNormalized = new Map<string, Mission>();
  allMissionsList.forEach((m) => {
    if (m.id) {
      allMissionsNormalized.set(normalizeId(m.id), m);
      allMissionsNormalized.set(normalizeId(m.code), m);
    }
  });

  const allPracticeQList = [...parsed.practiceQuestions, ...existingPracticeQuestions];
  const allPracticeQNormalized = new Map<string, PracticeQuestion>();
  allPracticeQList.forEach((q) => {
    if (q.id) {
      allPracticeQNormalized.set(normalizeId(q.id), q);
      allPracticeQNormalized.set(normalizeId(q.code), q);
    }
  });

  const allPackagesList = [...parsed.tournamentPackages, ...existingPackages];
  const allPackagesNormalized = new Map<string, TournamentPackage>();
  allPackagesList.forEach((p) => {
    if (p.id) {
      allPackagesNormalized.set(normalizeId(p.id), p);
      allPackagesNormalized.set(normalizeId(p.code), p);
    }
  });

  // Helper to check duplicate IDs within a sheet
  function checkSheetDuplicateIds<T extends { id: string }>(items: T[], sheetName: string) {
    const seen = new Set<string>();
    items.forEach((item, idx) => {
      const rowNumber = idx + 2;
      if (!item.id || item.id.trim() === '') {
        errors.push({
          sheet: sheetName,
          rowNumber,
          recordId: 'UNKNOWN',
          field: 'id',
          errorCode: 'MISSING_ID',
          message: `Baris ${rowNumber} tidak memiliki field ID yang wajib ada.`,
          severity: 'error',
        });
      } else {
        const norm = normalizeId(item.id);
        if (seen.has(norm)) {
          duplicatesInFile.push(`${sheetName}: ${item.id}`);
          errors.push({
            sheet: sheetName,
            rowNumber,
            recordId: item.id,
            field: 'id',
            errorCode: 'DUPLICATE_ID',
            message: `ID '${item.id}' terduplikasi di sheet ${sheetName}.`,
            severity: 'error',
          });
        } else {
          seen.add(norm);
        }
      }
    });
  }

  // 1. Validate Missions (01_MISI)
  checkSheetDuplicateIds(parsed.missions, '01_MISI');
  parsed.missions.forEach((m, idx) => {
    const rowNumber = idx + 2;
    if (!m.title || m.title.trim() === '') {
      errors.push({
        sheet: '01_MISI',
        rowNumber,
        recordId: m.id || `ROW-${rowNumber}`,
        field: 'title',
        errorCode: 'MISSING_TITLE',
        message: `Misi ${m.id} tidak memiliki judul (title).`,
        severity: 'error',
      });
    }
    if (!['cinta', 'bangga', 'paham'].includes(m.worldId.toLowerCase())) {
      errors.push({
        sheet: '01_MISI',
        rowNumber,
        recordId: m.id,
        field: 'worldId',
        errorCode: 'UNKNOWN_WORLD_ID',
        message: `World ID '${m.worldId}' pada misi ${m.id} harus salah satu dari: cinta, bangga, paham.`,
        severity: 'warning',
      });
    }
  });

  // 2. Validate Lessons (02_MATERI) & mission_id relation
  checkSheetDuplicateIds(parsed.lessons, '02_MATERI');
  parsed.lessons.forEach((l, idx) => {
    const rowNumber = idx + 2;
    if (!l.title || l.title.trim() === '') {
      errors.push({
        sheet: '02_MATERI',
        rowNumber,
        recordId: l.id || `ROW-${rowNumber}`,
        field: 'title',
        errorCode: 'MISSING_TITLE',
        message: `Materi ${l.id} tidak memiliki judul (title).`,
        severity: 'error',
      });
    }
    if (!l.missionId || l.missionId.trim() === '') {
      missingRelations.push(`Materi ${l.id} -> missing mission_id`);
      errors.push({
        sheet: '02_MATERI',
        rowNumber,
        recordId: l.id,
        field: 'mission_id',
        errorCode: 'MISSING_RELATION',
        message: `Materi ${l.id} tidak memiliki relasi mission_id.`,
        severity: 'error',
      });
    } else if (!allMissionsNormalized.has(normalizeId(l.missionId))) {
      missingRelations.push(`Materi ${l.id} -> mission_id '${l.missionId}' not found`);
      errors.push({
        sheet: '02_MATERI',
        rowNumber,
        recordId: l.id,
        field: 'mission_id',
        errorCode: 'INVALID_RELATION_MISSION',
        message: `mission_id '${l.missionId}' pada materi ${l.id} tidak ditemukan di daftar Misi.`,
        severity: 'error',
      });
    }
  });

  // 3. Validate Activities (03_AKTIVITAS) & mission_id relation
  checkSheetDuplicateIds(parsed.activities, '03_AKTIVITAS');
  parsed.activities.forEach((a, idx) => {
    const rowNumber = idx + 2;
    if (!a.title || a.title.trim() === '') {
      errors.push({
        sheet: '03_AKTIVITAS',
        rowNumber,
        recordId: a.id || `ROW-${rowNumber}`,
        field: 'title',
        errorCode: 'MISSING_TITLE',
        message: `Aktivitas ${a.id} tidak memiliki judul (title).`,
        severity: 'error',
      });
    }
    if (!a.missionId || a.missionId.trim() === '') {
      missingRelations.push(`Aktivitas ${a.id} -> missing mission_id`);
      errors.push({
        sheet: '03_AKTIVITAS',
        rowNumber,
        recordId: a.id,
        field: 'mission_id',
        errorCode: 'MISSING_RELATION',
        message: `Aktivitas ${a.id} tidak memiliki relasi mission_id.`,
        severity: 'error',
      });
    } else if (!allMissionsNormalized.has(normalizeId(a.missionId))) {
      missingRelations.push(`Aktivitas ${a.id} -> mission_id '${a.missionId}' not found`);
      errors.push({
        sheet: '03_AKTIVITAS',
        rowNumber,
        recordId: a.id,
        field: 'mission_id',
        errorCode: 'INVALID_RELATION_MISSION',
        message: `mission_id '${a.missionId}' pada aktivitas ${a.id} tidak ditemukan di daftar Misi.`,
        severity: 'error',
      });
    }
  });

  // 4. Validate Practice Questions (04_SOAL) & mission_id relation & correct_option
  checkSheetDuplicateIds(parsed.practiceQuestions, '04_SOAL');
  parsed.practiceQuestions.forEach((q, idx) => {
    const rowNumber = idx + 2;
    if (!q.question || q.question.trim() === '') {
      errors.push({
        sheet: '04_SOAL',
        rowNumber,
        recordId: q.id || `ROW-${rowNumber}`,
        field: 'question',
        errorCode: 'MISSING_QUESTION',
        message: `Soal ${q.id} tidak memiliki teks pertanyaan (question).`,
        severity: 'error',
      });
    }
    if (!q.missionId || q.missionId.trim() === '') {
      missingRelations.push(`Soal ${q.id} -> missing mission_id`);
      errors.push({
        sheet: '04_SOAL',
        rowNumber,
        recordId: q.id,
        field: 'mission_id',
        errorCode: 'MISSING_RELATION',
        message: `Soal ${q.id} tidak memiliki relasi mission_id.`,
        severity: 'error',
      });
    } else if (!allMissionsNormalized.has(normalizeId(q.missionId))) {
      missingRelations.push(`Soal ${q.id} -> mission_id '${q.missionId}' not found`);
      errors.push({
        sheet: '04_SOAL',
        rowNumber,
        recordId: q.id,
        field: 'mission_id',
        errorCode: 'INVALID_RELATION_MISSION',
        message: `mission_id '${q.missionId}' pada soal latihan ${q.id} tidak ditemukan di daftar Misi.`,
        severity: 'error',
      });
    }

    if (q.correctAnswerIndex === undefined || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
      errors.push({
        sheet: '04_SOAL',
        rowNumber,
        recordId: q.id,
        field: 'correct_option',
        errorCode: 'INVALID_OPTION',
        message: 'correct_option harus A, B, C, atau D.',
        severity: 'error',
      });
    }
  });

  // 5. Validate Badges (05_LENCANA)
  checkSheetDuplicateIds(parsed.badges, '05_LENCANA');
  parsed.badges.forEach((b, idx) => {
    const rowNumber = idx + 2;
    if (!b.name || b.name.trim() === '') {
      errors.push({
        sheet: '05_LENCANA',
        rowNumber,
        recordId: b.id || `ROW-${rowNumber}`,
        field: 'name',
        errorCode: 'MISSING_NAME',
        message: `Lencana ${b.id} tidak memiliki nama.`,
        severity: 'error',
      });
    }
    if (b.missionId && !allMissionsNormalized.has(normalizeId(b.missionId))) {
      errors.push({
        sheet: '05_LENCANA',
        rowNumber,
        recordId: b.id,
        field: 'mission_id',
        errorCode: 'INVALID_RELATION_MISSION',
        message: `mission_id '${b.missionId}' pada lencana ${b.name} tidak ditemukan di daftar Misi.`,
        severity: 'warning',
      });
    }
  });

  // 6. Validate References (06_REFERENSI)
  checkSheetDuplicateIds(parsed.references, '06_REFERENSI');
  parsed.references.forEach((r, idx) => {
    const rowNumber = idx + 2;
    if (!r.title || r.title.trim() === '') {
      errors.push({
        sheet: '06_REFERENSI',
        rowNumber,
        recordId: r.id || `ROW-${rowNumber}`,
        field: 'title',
        errorCode: 'MISSING_TITLE',
        message: `Referensi ${r.id} tidak memiliki judul.`,
        severity: 'error',
      });
    }
  });

  // 7. Validate Reflections (07_REFLEKSI)
  checkSheetDuplicateIds(parsed.reflections, '07_REFLEKSI');
  parsed.reflections.forEach((rf, idx) => {
    const rowNumber = idx + 2;
    if (!rf.prompt || rf.prompt.trim() === '') {
      errors.push({
        sheet: '07_REFLEKSI',
        rowNumber,
        recordId: rf.id || `ROW-${rowNumber}`,
        field: 'prompt',
        errorCode: 'MISSING_PROMPT',
        message: `Refleksi ${rf.id} tidak memiliki prompt pertanyaan.`,
        severity: 'error',
      });
    }
    if (rf.missionId && !allMissionsNormalized.has(normalizeId(rf.missionId))) {
      errors.push({
        sheet: '07_REFLEKSI',
        rowNumber,
        recordId: rf.id,
        field: 'mission_id',
        errorCode: 'INVALID_RELATION_MISSION',
        message: `mission_id '${rf.missionId}' pada refleksi ${rf.id} tidak ditemukan di daftar Misi.`,
        severity: 'error',
      });
    }
  });

  // 8. Validate Tournament Packages (10_PAKET_TURNAMEN)
  checkSheetDuplicateIds(parsed.tournamentPackages, '10_PAKET_TURNAMEN');
  parsed.tournamentPackages.forEach((p, idx) => {
    const rowNumber = idx + 2;
    if (!p.title || p.title.trim() === '') {
      errors.push({
        sheet: '10_PAKET_TURNAMEN',
        rowNumber,
        recordId: p.id || `ROW-${rowNumber}`,
        field: 'title',
        errorCode: 'MISSING_TITLE',
        message: `Paket Turnamen ${p.id} tidak memiliki judul.`,
        severity: 'error',
      });
    }
  });

  // 9. Validate Tournament Questions (11_SOAL_TURNAMEN)
  // Ignore quality check columns like source_exists and source_mission_match
  checkSheetDuplicateIds(parsed.tournamentQuestions, '11_SOAL_TURNAMEN');
  parsed.tournamentQuestions.forEach((tq, idx) => {
    const rowNumber = idx + 2;
    if (!tq.packageId || tq.packageId.trim() === '') {
      missingRelations.push(`Soal Turnamen ${tq.id} -> missing package_id`);
      errors.push({
        sheet: '11_SOAL_TURNAMEN',
        rowNumber,
        recordId: tq.id,
        field: 'package_id',
        errorCode: 'MISSING_PACKAGE_ID',
        message: `Soal turnamen ${tq.id} tidak memiliki package_id.`,
        severity: 'error',
      });
    } else if (!allPackagesNormalized.has(normalizeId(tq.packageId))) {
      missingRelations.push(`Soal Turnamen ${tq.id} -> package_id '${tq.packageId}' not found`);
      errors.push({
        sheet: '11_SOAL_TURNAMEN',
        rowNumber,
        recordId: tq.id,
        field: 'package_id',
        errorCode: 'INVALID_RELATION_PACKAGE',
        message: `package_id '${tq.packageId}' pada soal turnamen ${tq.id} tidak ditemukan di Paket Turnamen.`,
        severity: 'error',
      });
    }

    if (!tq.sourcePracticeQuestionId || tq.sourcePracticeQuestionId.trim() === '') {
      missingRelations.push(`Soal Turnamen ${tq.id} -> missing source_practice_question_id`);
      errors.push({
        sheet: '11_SOAL_TURNAMEN',
        rowNumber,
        recordId: tq.id,
        field: 'source_practice_question_id',
        errorCode: 'MISSING_SOURCE_QUESTION',
        message: `Soal turnamen ${tq.id} harus memiliki 'source_practice_question_id' yang menunjuk ke Soal Latihan.`,
        severity: 'error',
      });
    } else {
      const srcQ = allPracticeQNormalized.get(normalizeId(tq.sourcePracticeQuestionId));
      if (!srcQ) {
        missingRelations.push(`Soal Turnamen ${tq.id} -> source_practice_question_id '${tq.sourcePracticeQuestionId}' not found`);
        errors.push({
          sheet: '11_SOAL_TURNAMEN',
          rowNumber,
          recordId: tq.id,
          field: 'source_practice_question_id',
          errorCode: 'INVALID_RELATION_SOURCE_QUESTION',
          message: `source_practice_question_id '${tq.sourcePracticeQuestionId}' pada soal turnamen ${tq.id} tidak menunjuk ke soal latihan yang valid.`,
          severity: 'error',
        });
      } else {
        // If mission_id is explicitly provided on the tournament question, check for match
        const tqMissionId = (tq as any).missionId;
        if (tqMissionId && srcQ.missionId && normalizeId(tqMissionId) !== normalizeId(srcQ.missionId)) {
          errors.push({
            sheet: '11_SOAL_TURNAMEN',
            rowNumber,
            recordId: tq.id,
            field: 'mission_id',
            errorCode: 'MISMATCHED_MISSION',
            message: 'source question harus berasal dari mission yang sama.',
            severity: 'error',
          });
        }
      }
    }
  });

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  return {
    isValid: errorCount === 0,
    errorsCount: errorCount,
    warningsCount: warningCount,
    errors,
    counts: {
      missions: parsed.missions.length,
      lessons: parsed.lessons.length,
      activities: parsed.activities.length,
      practiceQuestions: parsed.practiceQuestions.length,
      badges: parsed.badges.length,
      reflections: parsed.reflections.length,
      references: parsed.references.length,
      tournamentPackages: parsed.tournamentPackages.length,
      tournamentQuestions: parsed.tournamentQuestions.length,
      tournamentEvents: parsed.tournamentEvents.length,
    },
    duplicatesInFile,
    missingRelations,
  };
}

// Generate complete canonical 10-sheet Excel file (.xlsx) matching exact specs
export function generateCanonicalExcelWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. 01_MISI
  const wsMissions = XLSX.utils.json_to_sheet(
    seedMissions.map((m) => ({
      id: m.id,
      world_id: m.worldId,
      code: m.code,
      title: m.title,
      subtitle: m.subtitle,
      level_number: m.levelNumber,
      summary: m.summary,
      learning_points: m.learningPoints.join('; '),
      xp_reward: m.xpReward,
      point_reward: m.pointReward,
      badge_id: m.badgeId,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsMissions, '01_MISI');

  // 2. 02_MATERI
  const wsLessons = XLSX.utils.json_to_sheet(
    seedLessons.map((l) => ({
      content_id: l.id,
      mission_id: l.missionId,
      content_order: l.contentOrder || l.orderIndex,
      grade_scope: l.gradeScope || 'Semua Tingkat',
      content_type: l.contentType || 'article',
      title: l.title,
      student_text: l.studentText || l.content,
      image_brief: l.imageBrief || l.imageCaption || '',
      image_url: l.imageUrl || '',
      interaction_prompt: l.interactionPrompt || '',
      teacher_note: l.teacherNote || '',
      source_url: l.sourceUrl || '',
      status: l.status === 'published' ? 'Published' : 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsLessons, '02_MATERI');

  // 3. 03_AKTIVITAS
  const wsActivities = XLSX.utils.json_to_sheet(
    seedActivities.map((a) => ({
      id: a.id,
      mission_id: a.missionId,
      code: a.code,
      title: a.title,
      type: a.type,
      instruction: a.instruction,
      point_reward: a.pointReward,
      xp_reward: a.xpReward,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsActivities, '03_AKTIVITAS');

  // 4. 04_SOAL
  const wsQuestions = XLSX.utils.json_to_sheet(
    seedPracticeQuestions.map((q) => ({
      id: q.id,
      mission_id: q.missionId,
      code: q.code,
      question: q.question,
      option_a: q.options[0] || '',
      option_b: q.options[1] || '',
      option_c: q.options[2] || '',
      option_d: q.options[3] || '',
      correct_option: String.fromCharCode(65 + q.correctAnswerIndex),
      explanation: q.explanation,
      difficulty: q.difficulty,
      competency_category: q.competencyCategory,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsQuestions, '04_SOAL');

  // 5. 05_LENCANA
  const wsBadges = XLSX.utils.json_to_sheet(
    seedBadges.map((b) => ({
      id: b.id,
      mission_id: b.missionId || '',
      code: b.code,
      name: b.name,
      category: b.category,
      icon: b.icon,
      color: b.color,
      bg_color: b.bgColor,
      border_color: b.borderColor,
      description: b.description,
      xp_reward: b.xpReward,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsBadges, '05_LENCANA');

  // 6. 06_REFERENSI
  const wsReferences = XLSX.utils.json_to_sheet(
    seedReferences.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      source_name: r.sourceName,
      publication_year: r.publicationYear,
      url: r.url || '',
      type: r.type,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsReferences, '06_REFERENSI');

  // 7. 07_REFLEKSI
  const wsReflections = XLSX.utils.json_to_sheet(
    seedReflections.map((r) => ({
      id: r.id,
      mission_id: r.missionId,
      code: r.code,
      prompt: r.prompt,
      guide_questions: r.guideQuestions.join('; '),
      rubric: r.rubric || '',
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsReflections, '07_REFLEKSI');

  // 8. 10_PAKET_TURNAMEN
  const wsPackages = XLSX.utils.json_to_sheet(
    seedTournamentPackages.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      grade_level: p.gradeLevel,
      duration_minutes: p.targetDurationMinutes,
      total_questions: p.totalQuestions,
      passing_score: p.passingScore,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsPackages, '10_PAKET_TURNAMEN');

  // 9. 11_SOAL_TURNAMEN
  const wsTournamentQuestions = XLSX.utils.json_to_sheet(
    seedTournamentQuestions.map((tq) => ({
      id: tq.id,
      package_id: tq.packageId,
      source_practice_question_id: tq.sourcePracticeQuestionId,
      code: tq.code,
      question: tq.question,
      option_a: tq.options[0] || '',
      option_b: tq.options[1] || '',
      option_c: tq.options[2] || '',
      option_d: tq.options[3] || '',
      correct_answer: String.fromCharCode(65 + tq.correctAnswerIndex),
      explanation: tq.explanation,
      points: tq.points,
      status: 'Draft',
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsTournamentQuestions, '11_SOAL_TURNAMEN');

  // 10. 12_EVENT_TEMPLATE
  const wsEvent = XLSX.utils.json_to_sheet([
    {
      id: 'EVT-001',
      package_id: 'PKG-02',
      title: 'Cerdas Rupiah SD Championship 2026',
      school: 'SD Nusantara Cemerlang',
      start_time: '2026-08-20T09:00:00Z',
      end_time: '2026-08-20T11:00:00Z',
      status: 'scheduled',
    },
  ]);
  XLSX.utils.book_append_sheet(wb, wsEvent, '12_EVENT_TEMPLATE');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
