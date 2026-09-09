import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { db } from './db';
import { User } from '../types/database';

export interface StudentCapaianReport {
  studentId: string;
  name: string;
  nisn: string;
  gender: string;
  grade: string;
  school: string;
  missionsCompleted: number; // 0 - 9
  completionRate: number; // 0 - 100%
  avgQuizScore: number;
  cintaScore: number; // Misi 1 - 3
  banggaScore: number; // Misi 4 - 6
  pahamScore: number; // Misi 7 - 9
  stage1Score: number;
  stage2Score: number;
  stage3Score: number;
  finalStageTitle: string; // 'Belum Mulai' | 'Tahap 1 Pemula' | 'Tahap 2 Terampil' | 'Sang Penjelajah Rupiah'
  passedFinalMission: boolean;
  points: number;
  level: number;
  predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
}

export interface SchoolClassSummary {
  grade: string;
  totalStudents: number;
  activeStudents: number;
  avgCompletionRate: number;
  avgScore: number;
  passedFinalCount: number;
}

export interface SchoolDashboardData {
  schoolName: string;
  npsn: string;
  totalStudents: number;
  activeStudents: number;
  participationRate: number;
  avgMissionsCompleted: number;
  avgScore: number;
  cintaAvg: number;
  banggaAvg: number;
  pahamAvg: number;
  finalMissionPassedCount: number;
  finalMissionPassedRate: number;
  stageCounts: {
    notStarted: number;
    pemula: number;
    terampil: number;
    master: number;
  };
  classSummaries: SchoolClassSummary[];
  studentReports: StudentCapaianReport[];
  topStudents: StudentCapaianReport[];
  needsSupportStudents: StudentCapaianReport[];
}

export interface NationalSchoolComparison {
  schoolName: string;
  npsn: string;
  city: string;
  totalStudents: number;
  activeStudents: number;
  avgCompletionRate: number;
  avgScore: number;
  finalMissionPassedCount: number;
  finalMissionPassedRate: number;
  cintaAvg: number;
  banggaAvg: number;
  pahamAvg: number;
}

export interface NationalDashboardData {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  nationalParticipationRate: number;
  nationalAvgScore: number;
  nationalFinalPassedCount: number;
  cintaAvg: number;
  banggaAvg: number;
  pahamAvg: number;
  schoolComparisons: NationalSchoolComparison[];
}

/**
 * Helper to compute student achievement report
 */
function buildStudentReport(
  student: User,
  allProgress: any[],
  allAttempts: any[],
  allFinalProgress: any[]
): StudentCapaianReport {
  const studentProg = allProgress.filter((p) => p.studentId === student.id);
  const completedProg = studentProg.filter((p) => p.status === 'completed');
  const missionsCompleted = Math.min(completedProg.length, 9);
  const completionRate = Math.round((missionsCompleted / 9) * 100);

  // Scores per mission domain
  // Cinta: M-01, M-02, M-03 or index 0, 1, 2
  const cintaProg = studentProg.filter((p) =>
    ['M-01', 'M-02', 'M-03', 'misi-1', 'misi-2', 'misi-3'].some((id) =>
      (p.missionId || '').toLowerCase().includes(id.toLowerCase())
    )
  );
  const banggaProg = studentProg.filter((p) =>
    ['M-04', 'M-05', 'M-06', 'misi-4', 'misi-5', 'misi-6'].some((id) =>
      (p.missionId || '').toLowerCase().includes(id.toLowerCase())
    )
  );
  const pahamProg = studentProg.filter((p) =>
    ['M-07', 'M-08', 'M-09', 'misi-7', 'misi-8', 'misi-9'].some((id) =>
      (p.missionId || '').toLowerCase().includes(id.toLowerCase())
    )
  );

  const calcAvg = (list: any[], defaultVal: number = 0) => {
    if (!list || list.length === 0) return defaultVal;
    const scores = list.map((item) => Number(item.score || 0)).filter((s) => s > 0);
    if (scores.length === 0) return defaultVal;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // Practice attempts scores
  const studentAttempts = allAttempts.filter((a) => a.studentId === student.id);
  const avgQuizScore =
    studentAttempts.length > 0
      ? Math.round(studentAttempts.reduce((sum, a) => sum + Number(a.score || 0), 0) / studentAttempts.length)
      : completedProg.length > 0
      ? calcAvg(completedProg, 0)
      : 0;

  const cintaScore = calcAvg(cintaProg, 0);
  const banggaScore = calcAvg(banggaProg, 0);
  const pahamScore = calcAvg(pahamProg, 0);

  // Final mission assessment progress
  const finalProg = allFinalProgress.find((f) => f.userId === student.id);
  const stage1Score = Number(finalProg?.stage1Score || 0);
  const stage2Score = Number(finalProg?.stage2Score || 0);
  const stage3Score = Number(finalProg?.stage3Score || 0);

  let finalStageTitle = 'Belum Mulai';
  let passedFinalMission = false;

  if (finalProg?.stage3Completed || stage3Score >= 80) {
    finalStageTitle = 'Sang Penjelajah Rupiah';
    passedFinalMission = true;
  } else if (finalProg?.stage2Completed || stage2Score >= 80) {
    finalStageTitle = 'Penjelajah Terampil';
    passedFinalMission = true;
  } else if (finalProg?.stage1Completed || stage1Score >= 80) {
    finalStageTitle = 'Penjelajah Pemula';
    passedFinalMission = true;
  } else if (completionRate >= 70) {
    // If student has completed majority of missions, qualify as active learner
    finalStageTitle = 'Dalam Persiapan Asesmen';
  }

  // Predicate
  const overallAvg = Math.round((avgQuizScore + (stage1Score || avgQuizScore)) / 2);
  let predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Perlu Bimbingan';
  if (overallAvg >= 88) predicate = 'Sangat Baik';
  else if (overallAvg >= 78) predicate = 'Baik';
  else if (overallAvg >= 68) predicate = 'Cukup';

  return {
    studentId: student.id,
    name: student.name,
    nisn: student.nisn || student.username || student.id,
    gender: student.gender || 'laki-laki',
    grade: student.grade || 'Kelas 5',
    school: student.school || 'SD Negeri 2 Medewi',
    missionsCompleted,
    completionRate,
    avgQuizScore,
    cintaScore,
    banggaScore,
    pahamScore,
    stage1Score,
    stage2Score,
    stage3Score,
    finalStageTitle,
    passedFinalMission,
    points: student.points || 0,
    level: student.level || 1,
    predicate,
  };
}

/**
 * Get School-Level Dashboard Analytics
 */
export function getSchoolDashboardAnalytics(targetSchoolName?: string): SchoolDashboardData {
  const currentUser = db.getCurrentUser();
  const schoolSettings = db.getSchoolSettings();
  const allSchools = db.getSchools();

  const effectiveSchoolName =
    targetSchoolName ||
    currentUser?.school ||
    currentUser?.institution ||
    schoolSettings?.schoolName ||
    allSchools[0]?.name ||
    'SD Negeri 2 Medewi';

  const matchedSchool = allSchools.find(
    (s) => s.name.toLowerCase().trim() === effectiveSchoolName.toLowerCase().trim()
  );
  const npsn = matchedSchool?.npsn || '50101234';

  const allUsers = db.getUsers();
  // Filter students: either matching school name or all students if only 1 school in DB, strictly excluding guests
  let schoolStudents = allUsers.filter(
    (u) =>
      u.role === 'student' &&
      !u.isGuest &&
      u.id !== 'USR-GUEST' &&
      (u.school?.toLowerCase().trim() === effectiveSchoolName.toLowerCase().trim() ||
        (!u.school && effectiveSchoolName.includes('Medewi')))
  );

  // If no students explicitly labeled with this school, pick non-guest students
  if (schoolStudents.length === 0) {
    schoolStudents = allUsers.filter((u) => u.role === 'student' && !u.isGuest && u.id !== 'USR-GUEST');
  }

  const allProgress = db.getStudentProgress();
  const allAttempts = db.getPracticeAttempts();
  const allFinalProgress = db.getFinalMissionProgress ? [db.getFinalMissionProgress()] : [];

  const studentReports: StudentCapaianReport[] = schoolStudents.map((st) =>
    buildStudentReport(st, allProgress, allAttempts, allFinalProgress)
  );

  const totalStudents = studentReports.length;
  const activeStudents = studentReports.filter(
    (s) => s.missionsCompleted > 0 || s.avgQuizScore > 0 || s.stage1Score > 0 || s.points > 0
  ).length;

  const participationRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
  const avgMissionsCompleted =
    totalStudents > 0
      ? Number((studentReports.reduce((sum, s) => sum + s.missionsCompleted, 0) / totalStudents).toFixed(1))
      : 0;

  const scoreList = studentReports.map((s) => s.avgQuizScore).filter((score) => score > 0);
  const avgScore =
    scoreList.length > 0 ? Math.round(scoreList.reduce((a, b) => a + b, 0) / scoreList.length) : 0;

  const cintaScoreList = studentReports.map((s) => s.cintaScore).filter((s) => s > 0);
  const cintaAvg =
    cintaScoreList.length > 0
      ? Math.round(cintaScoreList.reduce((sum, s) => sum + s, 0) / cintaScoreList.length)
      : 0;

  const banggaScoreList = studentReports.map((s) => s.banggaScore).filter((s) => s > 0);
  const banggaAvg =
    banggaScoreList.length > 0
      ? Math.round(banggaScoreList.reduce((sum, s) => sum + s, 0) / banggaScoreList.length)
      : 0;

  const pahamScoreList = studentReports.map((s) => s.pahamScore).filter((s) => s > 0);
  const pahamAvg =
    pahamScoreList.length > 0
      ? Math.round(pahamScoreList.reduce((sum, s) => sum + s, 0) / pahamScoreList.length)
      : 0;

  const passedFinalCount = studentReports.filter((s) => s.passedFinalMission).length;
  const finalMissionPassedRate = totalStudents > 0 ? Math.round((passedFinalCount / totalStudents) * 100) : 0;

  // Stage breakdown
  const stageCounts = {
    notStarted: studentReports.filter((s) => s.finalStageTitle === 'Belum Mulai' || s.finalStageTitle === 'Dalam Persiapan Asesmen').length,
    pemula: studentReports.filter((s) => s.finalStageTitle === 'Penjelajah Pemula').length,
    terampil: studentReports.filter((s) => s.finalStageTitle === 'Penjelajah Terampil').length,
    master: studentReports.filter((s) => s.finalStageTitle === 'Sang Penjelajah Rupiah').length,
  };

  // Group by grade/class
  const gradeMap = new Map<string, StudentCapaianReport[]>();
  studentReports.forEach((s) => {
    const g = s.grade || 'Kelas 5';
    if (!gradeMap.has(g)) gradeMap.set(g, []);
    gradeMap.get(g)!.push(s);
  });

  const classSummaries: SchoolClassSummary[] = Array.from(gradeMap.entries()).map(([grade, students]) => {
    const active = students.filter((s) => s.missionsCompleted > 0 || s.avgQuizScore > 0).length;
    const avgComp = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.completionRate, 0) / students.length) : 0;
    const validScores = students.map((s) => s.avgQuizScore).filter((sc) => sc > 0);
    const avgSc = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const passed = students.filter((s) => s.passedFinalMission).length;

    return {
      grade,
      totalStudents: students.length,
      activeStudents: active,
      avgCompletionRate: avgComp,
      avgScore: avgSc,
      passedFinalCount: passed,
    };
  });

  // Top students (sorted by points & scores)
  const topStudents = [...studentReports]
    .sort((a, b) => b.points + b.avgQuizScore - (a.points + a.avgQuizScore))
    .slice(0, 5);

  // Students who might need support (< 75 score or low progress among active learners)
  const needsSupportStudents = [...studentReports]
    .filter((s) => (s.missionsCompleted > 0 || s.avgQuizScore > 0) && (s.completionRate < 60 || s.avgQuizScore < 75))
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 5);

  return {
    schoolName: effectiveSchoolName,
    npsn,
    totalStudents,
    activeStudents,
    participationRate,
    avgMissionsCompleted,
    avgScore,
    cintaAvg,
    banggaAvg,
    pahamAvg,
    finalMissionPassedCount: passedFinalCount,
    finalMissionPassedRate,
    stageCounts,
    classSummaries,
    studentReports,
    topStudents,
    needsSupportStudents,
  };
}

/**
 * Get National-Level Dashboard Analytics (Super Admin)
 */
export function getNationalDashboardAnalytics(): NationalDashboardData {
  const allSchools = db.getSchools();
  const allUsers = db.getUsers();
  const allProgress = db.getStudentProgress();
  const allAttempts = db.getPracticeAttempts();
  const allFinalProgress = db.getFinalMissionProgress ? [db.getFinalMissionProgress()] : [];

  const totalTeachers = allUsers.filter((u) => u.role === 'teacher').length;
  const allStudents = allUsers.filter((u) => u.role === 'student' && !u.isGuest && u.id !== 'USR-GUEST');

  // Compute school comparisons
  const schoolComparisons: NationalSchoolComparison[] = allSchools.map((sch) => {
    const studentsInSchool = allStudents.filter(
      (s) =>
        s.school?.toLowerCase().trim() === sch.name.toLowerCase().trim() ||
        (!s.school && sch.name.includes('Medewi'))
    );

    const reports = studentsInSchool.map((st) =>
      buildStudentReport(st, allProgress, allAttempts, allFinalProgress)
    );

    const totalStudents = reports.length;
    const activeStudents = reports.filter((r) => r.missionsCompleted > 0 || r.avgQuizScore > 0 || r.points > 0).length;
    const avgCompletionRate =
      totalStudents > 0 ? Math.round(reports.reduce((sum, r) => sum + r.completionRate, 0) / totalStudents) : 0;
    const validScores = reports.map((r) => r.avgQuizScore).filter((s) => s > 0);
    const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const passedCount = reports.filter((r) => r.passedFinalMission).length;
    const passedRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

    const cintaList = reports.map((r) => r.cintaScore).filter((s) => s > 0);
    const banggaList = reports.map((r) => r.banggaScore).filter((s) => s > 0);
    const pahamList = reports.map((r) => r.pahamScore).filter((s) => s > 0);

    const cintaAvg = cintaList.length > 0 ? Math.round(cintaList.reduce((sum, s) => sum + s, 0) / cintaList.length) : 0;
    const banggaAvg = banggaList.length > 0 ? Math.round(banggaList.reduce((sum, s) => sum + s, 0) / banggaList.length) : 0;
    const pahamAvg = pahamList.length > 0 ? Math.round(pahamList.reduce((sum, s) => sum + s, 0) / pahamList.length) : 0;

    return {
      schoolName: sch.name,
      npsn: sch.npsn || '-',
      city: sch.address ? (sch.address.split(',').pop()?.trim() || sch.address) : 'Jembrana',
      totalStudents,
      activeStudents,
      avgCompletionRate,
      avgScore,
      finalMissionPassedCount: passedCount,
      finalMissionPassedRate: passedRate,
      cintaAvg,
      banggaAvg,
      pahamAvg,
    };
  });

  const totalSchools = allSchools.length;
  const totalStudents = allStudents.length;
  const activeNational = allStudents.filter((s) => s.points > 0 || s.level > 1).length;
  const nationalParticipationRate = totalStudents > 0 ? Math.round((activeNational / totalStudents) * 100) : 0;

  const validSchoolsWithScore = schoolComparisons.filter((sc) => sc.avgScore > 0);
  const nationalAvgScore =
    validSchoolsWithScore.length > 0
      ? Math.round(validSchoolsWithScore.reduce((sum, sc) => sum + sc.avgScore, 0) / validSchoolsWithScore.length)
      : 0;

  const nationalFinalPassedCount = schoolComparisons.reduce((sum, sc) => sum + sc.finalMissionPassedCount, 0);

  const validSchoolsWithCinta = schoolComparisons.filter((sc) => sc.cintaAvg > 0);
  const cintaAvg =
    validSchoolsWithCinta.length > 0
      ? Math.round(validSchoolsWithCinta.reduce((sum, sc) => sum + sc.cintaAvg, 0) / validSchoolsWithCinta.length)
      : 0;

  const validSchoolsWithBangga = schoolComparisons.filter((sc) => sc.banggaAvg > 0);
  const banggaAvg =
    validSchoolsWithBangga.length > 0
      ? Math.round(validSchoolsWithBangga.reduce((sum, sc) => sum + sc.banggaAvg, 0) / validSchoolsWithBangga.length)
      : 0;

  const validSchoolsWithPaham = schoolComparisons.filter((sc) => sc.pahamAvg > 0);
  const pahamAvg =
    validSchoolsWithPaham.length > 0
      ? Math.round(validSchoolsWithPaham.reduce((sum, sc) => sum + sc.pahamAvg, 0) / validSchoolsWithPaham.length)
      : 0;

  return {
    totalSchools,
    totalStudents,
    totalTeachers,
    nationalParticipationRate,
    nationalAvgScore,
    nationalFinalPassedCount,
    cintaAvg,
    banggaAvg,
    pahamAvg,
    schoolComparisons,
  };
}

// =========================================================================
// EXCEL EXPORT HELPERS (BANK INDONESIA OFFICIAL BLUE & READY-TO-PRINT SETUP)
// =========================================================================

const BI_COLORS = {
  NAVY_DARK: 'FF002D62', // Signature Bank Indonesia Deep Navy Blue
  BLUE_MEDIUM: 'FF005596', // Bank Indonesia Cerulean Blue
  BLUE_ACCENT: 'FF0072CE', // Bank Indonesia Sky Blue
  ICE_BLUE: 'FFEBF3FA', // Soft Ice Blue for metric panels & highlights
  ZEBRA_ROW: 'FFF0F6FC', // Very soft cool blue for alternating rows
  GOLD_ACCENT: 'FFC59B27', // Bank Indonesia Medal & Crest Gold
  GOLD_LIGHT: 'FFFEF9E7', // Soft Gold tint
  TEXT_DARK: 'FF0F172A', // Slate dark text for readability
  TEXT_MUTED: 'FF475569', // Slate muted text
  BORDER_COLOR: 'FFCBD5E1', // Clean thin border
  BORDER_DARK: 'FF94A3B8', // Medium border
  WHITE: 'FFFFFFFF', // Pure White
  STATUS_PASS: 'FF0D9488', // Emerald/Teal Pass
};

/**
 * Generate in-cell visual progress bar using block characters
 * Perfectly visible on print, PDF export, Excel, Google Sheets, and LibreOffice
 */
function renderVisualProgressBar(value: number, max: number = 100, blocksCount: number = 16): string {
  const cleanVal = Math.max(0, isNaN(value) ? 0 : value);
  const cleanMax = Math.max(1, isNaN(max) ? 100 : max);
  const pct = Math.min(100, Math.round((cleanVal / cleanMax) * 100));
  const filled = Math.min(blocksCount, Math.round((pct / 100) * blocksCount));
  const empty = blocksCount - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${pct}%`;
}

function getPredikatMutu(score: number): string {
  if (score <= 0) return 'Belum Ada Penilaian (-)';
  if (score >= 88) return 'Sangat Baik (A)';
  if (score >= 78) return 'Baik (B)';
  if (score >= 68) return 'Cukup (C)';
  return 'Perlu Bimbingan (D)';
}

function applyThinBorder(cell: ExcelJS.Cell, color: string = BI_COLORS.BORDER_COLOR): void {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  };
}

function applyMediumBorder(cell: ExcelJS.Cell, color: string = BI_COLORS.NAVY_DARK): void {
  cell.border = {
    top: { style: 'medium', color: { argb: color } },
    bottom: { style: 'medium', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  };
}

async function triggerWorkbookDownload(workbook: ExcelJS.Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export School-Level Excel Report in a Clean, Professional Format (Rapor Jelajah Rupiah)
 * Features signature Bank Indonesia Navy Blue, print-ready page setups, and visual charts for
 * Cinta, Bangga, Paham Rupiah, and Misi Akhir.
 */
export async function exportSchoolExcelReport(data: SchoolDashboardData): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Bank Indonesia - Jelajah CBP Rupiah';
  wb.lastModifiedBy = 'Bank Indonesia Official System';
  wb.created = new Date();
  wb.modified = new Date();

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // =========================================================================
  // SHEET 1: RINGKASAN & GRAFIK CAPAIAN (PRINT READY A4 LANDSCAPE)
  // =========================================================================
  const wsSummary = wb.addWorksheet('Ringkasan & Grafik Capaian', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      showGridLines: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: {
      oddHeader: '&L&BProgram Edukasi CBP Rupiah - Bank Indonesia&R&BDokumen Resmi',
      oddFooter: '&LBank Indonesia - Rapor Daya Jelajah Rupiah&CPendidikan Dasar&RHal &P dari &N',
    },
  });

  // Set column widths
  wsSummary.columns = [
    { key: 'A', width: 6 }, // No
    { key: 'B', width: 30 }, // Dimensi / Indikator
    { key: 'C', width: 44 }, // Lingkup Materi & Kompetensi
    { key: 'D', width: 18 }, // Skor / Rata-rata
    { key: 'E', width: 28 }, // Grafik Capaian Visual
    { key: 'F', width: 22 }, // Predikat Mutu
    { key: 'G', width: 40 }, // Analisis Capaian Sekolah
  ];

  // Title Banner (Row 1-3)
  wsSummary.mergeCells('A1:G1');
  const r1 = wsSummary.getCell('A1');
  r1.value = 'BANK INDONESIA • PROGRAM EDUKASI CINTA, BANGGA, DAN PAHAM (CBP) RUPIAH';
  r1.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.GOLD_ACCENT } };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(1).height = 24;

  wsSummary.mergeCells('A2:G2');
  const r2 = wsSummary.getCell('A2');
  r2.value = 'RAPOR CAPAIAN DAYA JELAJAH RUPIAH SISWA DAN SATUAN PENDIDIKAN';
  r2.font = { name: 'Arial', size: 15, bold: true, color: { argb: BI_COLORS.WHITE } };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(2).height = 30;

  wsSummary.mergeCells('A3:G3');
  const r3 = wsSummary.getCell('A3');
  r3.value = 'DOKUMEN RESMI REKAPITULASI INDEKS PEMAHAMAN CBP RUPIAH DAN ASESMEN MISI AKHIR';
  r3.font = { name: 'Arial', size: 9, bold: false, color: { argb: BI_COLORS.ICE_BLUE } };
  r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(3).height = 20;

  // Gold Separator Line (Row 4)
  wsSummary.mergeCells('A4:G4');
  const r4 = wsSummary.getCell('A4');
  r4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.GOLD_ACCENT } };
  wsSummary.getRow(4).height = 4;

  // School Metadata (Row 5-7)
  const metaRows = [
    { label1: 'Nama Satuan Pendidikan', val1: data.schoolName, label2: 'Tanggal Terbit Rapor', val2: dateStr },
    { label1: 'Nomor Pokok Sekolah (NPSN)', val1: data.npsn, label2: 'Status Akreditasi / Mutu', val2: 'Terdaftar Resmi Program CBP BI' },
    { label1: 'Target Kurikulum', val1: 'Fase C (Kelas 4, 5, 6 SD/MI)', label2: 'Status Validasi Data', val2: 'Tervalidasi Sistem Bank Indonesia' },
  ];

  metaRows.forEach((m, idx) => {
    const rowNum = 5 + idx;
    wsSummary.getRow(rowNum).height = 20;

    const cellA = wsSummary.getCell(`A${rowNum}`);
    cellA.value = m.label1;
    cellA.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_MUTED } };
    cellA.alignment = { vertical: 'middle', horizontal: 'left' };

    wsSummary.mergeCells(`B${rowNum}:C${rowNum}`);
    const cellB = wsSummary.getCell(`B${rowNum}`);
    cellB.value = m.val1;
    cellB.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
    cellB.alignment = { vertical: 'middle', horizontal: 'left' };

    const cellD = wsSummary.getCell(`D${rowNum}`);
    cellD.value = m.label2;
    cellD.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_MUTED } };
    cellD.alignment = { vertical: 'middle', horizontal: 'left' };

    wsSummary.mergeCells(`E${rowNum}:G${rowNum}`);
    const cellE = wsSummary.getCell(`E${rowNum}`);
    cellE.value = m.val2;
    cellE.font = { name: 'Arial', size: 9, bold: false, color: { argb: BI_COLORS.TEXT_DARK } };
    cellE.alignment = { vertical: 'middle', horizontal: 'left' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
      applyThinBorder(wsSummary.getCell(`${col}${rowNum}`));
    });
  });

  // Section 1: KPI Key Performance Indicators (Row 9-15)
  wsSummary.mergeCells('A9:G9');
  const sec1 = wsSummary.getCell('A9');
  sec1.value = '  I. RINGKASAN INDIKATOR UTAMA KINERJA SEKOLAH (KEY PERFORMANCE INDICATORS)';
  sec1.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.WHITE } };
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
  sec1.alignment = { vertical: 'middle', horizontal: 'left' };
  wsSummary.getRow(9).height = 24;

  const kpiData = [
    {
      no: 1,
      indicator: 'Total Siswa Terdaftar',
      desc: 'Peserta didik yang tercatat aktif dalam basis data sekolah',
      score: `${data.totalStudents} Siswa`,
      bar: renderVisualProgressBar(data.totalStudents, Math.max(data.totalStudents, 1), 16),
      predikat: '100% Terdaftar',
      keterangan: 'Kelengkapan administrasi siswa terpenuhi',
    },
    {
      no: 2,
      indicator: 'Tingkat Partisipasi Siswa',
      desc: 'Persentase siswa yang aktif menyelesaikan modul belajar',
      score: `${data.activeStudents} Siswa (${data.participationRate}%)`,
      bar: renderVisualProgressBar(data.participationRate, 100, 16),
      predikat: data.participationRate >= 75 ? 'Sangat Aktif' : 'Cukup Aktif',
      keterangan: `${data.activeStudents} dari ${data.totalStudents} siswa telah mengerjakan misi`,
    },
    {
      no: 3,
      indicator: 'Rata-rata Ketuntasan Misi',
      desc: 'Capaian 9 misi pembelajaran CBP Rupiah secara menyeluruh',
      score: `${data.avgMissionsCompleted} dari 9 Misi`,
      bar: renderVisualProgressBar((data.avgMissionsCompleted / 9) * 100, 100, 16),
      predikat: data.avgMissionsCompleted >= 7 ? 'Sangat Baik' : 'On-Progress',
      keterangan: 'Ketuntasan kurikulum literasi rupiah',
    },
    {
      no: 4,
      indicator: 'Rata-rata Nilai Pemahaman Kuis',
      desc: 'Skor akumulatif kuis pemahaman dan latihan soal materi',
      score: `${data.avgScore} / 100`,
      bar: renderVisualProgressBar(data.avgScore, 100, 16),
      predikat: getPredikatMutu(data.avgScore),
      keterangan: 'Penguasaan konsep dan materi CBP Rupiah',
    },
    {
      no: 5,
      indicator: 'Kelulusan Asesmen Misi Akhir',
      desc: 'Siswa yang telah lolos pengujian Misi Akhir Sang Penjelajah',
      score: `${data.finalMissionPassedCount} Siswa (${data.finalMissionPassedRate}%)`,
      bar: renderVisualProgressBar(data.finalMissionPassedRate, 100, 16),
      predikat: data.finalMissionPassedRate >= 70 ? 'Optimal' : 'Berkembang',
      keterangan: 'Bersertifikat kelulusan Misi Akhir Bank Indonesia',
    },
  ];

  kpiData.forEach((item, idx) => {
    const rowNum = 10 + idx;
    const row = wsSummary.getRow(rowNum);
    row.height = 21;
    row.values = [item.no, item.indicator, item.desc, item.score, item.bar, item.predikat, item.keterangan];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE;

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 2) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 4) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 5) {
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
  });

  // Section 2: GRAFIK 4 DIMENSI UTAMA CBP RUPIAH (Row 16-22)
  wsSummary.mergeCells('A16:G16');
  const sec2 = wsSummary.getCell('A16');
  sec2.value = '  II. GRAFIK CAPAIAN SEKOLAH PADA 4 DIMENSI UTAMA CBP RUPIAH (CINTA, BANGGA, PAHAM & MISI AKHIR)';
  sec2.font = { name: 'Arial', size: 11, bold: true, color: { argb: BI_COLORS.WHITE } };
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  sec2.alignment = { vertical: 'middle', horizontal: 'left' };
  wsSummary.getRow(16).height = 26;

  // Table Headers for Section 2
  const headers2 = [
    'No',
    'Dimensi CBP Rupiah',
    'Fokus & Lingkup Materi Pembelajaran',
    'Indeks Rata-rata',
    'Grafik Visual Capaian (0 - 100%)',
    'Predikat Mutu',
    'Analisis Capaian Mutu Satuan Pendidikan',
  ];
  const row17 = wsSummary.getRow(17);
  row17.height = 24;
  row17.values = headers2;
  for (let c = 1; c <= 7; c++) {
    const cell = row17.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyThinBorder(cell, BI_COLORS.BORDER_DARK);
  }

  const dimensiData = [
    {
      no: '1',
      dimensi: 'CINTA RUPIAH',
      lingkup: 'Misi 1 s/d Misi 3: Mengenali Ciri Keaslian (3D), Merawat Fisik Rupiah (5J), Menjaga dari Uang Palsu',
      score: `${data.cintaAvg} / 100`,
      bar: renderVisualProgressBar(data.cintaAvg, 100, 18),
      predikat: getPredikatMutu(data.cintaAvg),
      analisis: 'Siswa menguasai teknik 3D (Dilihat, Diraba, Diterawang) dan kebiasaan merawat uang kertas',
    },
    {
      no: '2',
      dimensi: 'BANGGA RUPIAH',
      lingkup: 'Misi 4 s/d Misi 6: Rupiah Simbol Kedaulatan NKRI, Alat Pembayaran Sah, Pemersatu Keberagaman',
      score: `${data.banggaAvg} / 100`,
      bar: renderVisualProgressBar(data.banggaAvg, 100, 18),
      predikat: getPredikatMutu(data.banggaAvg),
      analisis: 'Siswa memiliki kebanggaan kebangsaan dan menghargai Rupiah sebagai kedaulatan moneter bangsa',
    },
    {
      no: '3',
      dimensi: 'PAHAM RUPIAH',
      lingkup: 'Misi 7 s/d Misi 9: Bertransaksi Rupiah & QRIS, Berbelanja Bijak, Menabung & Perencanaan Masa Depan',
      score: `${data.pahamAvg} / 100`,
      bar: renderVisualProgressBar(data.pahamAvg, 100, 18),
      predikat: getPredikatMutu(data.pahamAvg),
      analisis: 'Siswa menguasai literasi finansial cerdas, belanja prioritas, dan pembiasaan menabung rutin',
    },
    {
      no: '4',
      dimensi: 'MISI AKHIR (ASESMEN AKHIR)',
      lingkup: 'Evaluasi Komprehensif Misi Akhir: Penyelamatan Kota Rupiah & Ujian Gelar Sang Penjelajah',
      score: `${data.finalMissionPassedRate}% Kelulusan`,
      bar: renderVisualProgressBar(data.finalMissionPassedRate, 100, 18),
      predikat: data.finalMissionPassedRate >= 75 ? 'Sangat Memuaskan (A)' : data.finalMissionPassedRate >= 50 ? 'Memuaskan (B)' : 'Perlu Pendampingan (C)',
      analisis: `${data.finalMissionPassedCount} dari ${data.totalStudents} siswa berhasil menyelesaikan evaluasi komprehensif berstandar BI`,
    },
  ];

  dimensiData.forEach((dim, idx) => {
    const rowNum = 18 + idx;
    const row = wsSummary.getRow(rowNum);
    row.height = 26;
    row.values = [dim.no, dim.dimensi, dim.lingkup, dim.score, dim.bar, dim.predikat, dim.analisis];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ICE_BLUE : BI_COLORS.WHITE;

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 2) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 4) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 5) {
        cell.font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 6) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
  });

  // Section 3: GRAFIK DISTRIBUSI GELAR MISI AKHIR (Row 23-28)
  wsSummary.mergeCells('A23:G23');
  const sec3 = wsSummary.getCell('A23');
  sec3.value = '  III. GRAFIK DISTRIBUSI TAHAPAN & GELAR KELULUSAN MISI AKHIR';
  sec3.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.WHITE } };
  sec3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
  sec3.alignment = { vertical: 'middle', horizontal: 'left' };
  wsSummary.getRow(23).height = 24;

  const stageDistribution = [
    {
      no: 1,
      gelar: 'Tahap 3: Sang Penjelajah Rupiah (Master)',
      level: 'Tingkat Mahir - Kualifikasi Tertinggi',
      count: `${data.stageCounts.master} Siswa`,
      bar: renderVisualProgressBar(data.stageCounts.master, Math.max(data.totalStudents, 1), 18),
      pct: `${Math.round((data.stageCounts.master / Math.max(data.totalStudents, 1)) * 100)}% dari total`,
      ket: 'Berhak atas Sertifikat Emas Sang Penjelajah Rupiah Terakreditasi',
    },
    {
      no: 2,
      gelar: 'Tahap 2: Penjelajah Terampil',
      level: 'Tingkat Menengah - Kualifikasi Terampil',
      count: `${data.stageCounts.terampil} Siswa`,
      bar: renderVisualProgressBar(data.stageCounts.terampil, Math.max(data.totalStudents, 1), 18),
      pct: `${Math.round((data.stageCounts.terampil / Math.max(data.totalStudents, 1)) * 100)}% dari total`,
      ket: 'Tuntas menyelesaikan evaluasi kasus tingkat menengah',
    },
    {
      no: 3,
      gelar: 'Tahap 1: Penjelajah Pemula',
      level: 'Tingkat Dasar - Kualifikasi Pemula',
      count: `${data.stageCounts.pemula} Siswa`,
      bar: renderVisualProgressBar(data.stageCounts.pemula, Math.max(data.totalStudents, 1), 18),
      pct: `${Math.round((data.stageCounts.pemula / Math.max(data.totalStudents, 1)) * 100)}% dari total`,
      ket: 'Memenuhi standar dasar pengenalan CBP Rupiah',
    },
    {
      no: 4,
      gelar: 'Dalam Proses Pembelajaran / Belum Mulai',
      level: 'Tahap Persiapan Pembelajaran',
      count: `${data.stageCounts.notStarted} Siswa`,
      bar: renderVisualProgressBar(data.stageCounts.notStarted, Math.max(data.totalStudents, 1), 18),
      pct: `${Math.round((data.stageCounts.notStarted / Math.max(data.totalStudents, 1)) * 100)}% dari total`,
      ket: 'Sedang menempuh 9 misi materi sebelum mengikuti asesmen akhir',
    },
  ];

  stageDistribution.forEach((st, idx) => {
    const rowNum = 24 + idx;
    const row = wsSummary.getRow(rowNum);
    row.height = 21;
    row.values = [st.no, st.gelar, st.level, st.count, st.bar, st.pct, st.ket];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE;

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 2) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 4) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 5) {
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
  });

  // Section 4: LEMBAR PENGESAHAN SIAP CETAK (Row 29-37)
  wsSummary.mergeCells('A29:G29');
  const sec4 = wsSummary.getCell('A29');
  sec4.value = '  IV. LEMBAR PENGESAHAN LAPORAN CAPAIAN JELAJAH RUPIAH (SIAP CETAK / PRINT)';
  sec4.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
  sec4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.ICE_BLUE } };
  sec4.alignment = { vertical: 'middle', horizontal: 'left' };
  wsSummary.getRow(29).height = 22;

  // Signatures
  wsSummary.mergeCells('A31:C31');
  const sigL1 = wsSummary.getCell('A31');
  sigL1.value = 'Mengetahui / Memverifikasi,\nGuru Pembina CBP Rupiah Sekolah';
  sigL1.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
  sigL1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  wsSummary.mergeCells('E31:G31');
  const sigR1 = wsSummary.getCell('E31');
  sigR1.value = `${data.schoolName}, ${dateStr}\nKepala Satuan Pendidikan`;
  sigR1.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
  sigR1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  wsSummary.getRow(31).height = 32;

  // Blank signature space
  wsSummary.getRow(32).height = 18;
  wsSummary.getRow(33).height = 18;
  wsSummary.getRow(34).height = 18;

  wsSummary.mergeCells('A35:C35');
  const sigL2 = wsSummary.getCell('A35');
  sigL2.value = '( .................................................................... )';
  sigL2.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
  sigL2.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.mergeCells('E35:G35');
  const sigR2 = wsSummary.getCell('E35');
  sigR2.value = '( .................................................................... )';
  sigR2.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
  sigR2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(35).height = 20;

  wsSummary.mergeCells('A36:C36');
  const sigL3 = wsSummary.getCell('A36');
  sigL3.value = 'NIP. ..............................................................';
  sigL3.font = { name: 'Arial', size: 8.5, color: { argb: BI_COLORS.TEXT_MUTED } };
  sigL3.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.mergeCells('E36:G36');
  const sigR3 = wsSummary.getCell('E36');
  sigR3.value = 'NIP. ..............................................................';
  sigR3.font = { name: 'Arial', size: 8.5, color: { argb: BI_COLORS.TEXT_MUTED } };
  sigR3.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(36).height = 18;

  // =========================================================================
  // SHEET 2: RAPOR DETAIL SISWA (PRINT READY A4 LANDSCAPE)
  // =========================================================================
  const wsStudents = wb.addWorksheet('Rapor Siswa', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      showGridLines: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: {
      oddHeader: `&L&BBank Indonesia - Rapor Detail Siswa&R${data.schoolName}`,
      oddFooter: '&LProgram CBP Rupiah&CHalaman &P dari &N&RTanggal: ' + dateStr,
    },
  });

  wsStudents.columns = [
    { key: 'no', width: 6 },
    { key: 'nisn', width: 16 },
    { key: 'name', width: 30 },
    { key: 'grade', width: 12 },
    { key: 'gender', width: 12 },
    { key: 'missions', width: 14 },
    { key: 'completionRate', width: 14 },
    { key: 'barMissions', width: 22 },
    { key: 'cinta', width: 14 },
    { key: 'barCinta', width: 22 },
    { key: 'bangga', width: 14 },
    { key: 'barBangga', width: 22 },
    { key: 'paham', width: 14 },
    { key: 'barPaham', width: 22 },
    { key: 'avgQuiz', width: 14 },
    { key: 'stageTitle', width: 26 },
    { key: 'statusFinal', width: 18 },
    { key: 'predicate', width: 18 },
  ];

  // Title Banner Sheet 2
  wsStudents.mergeCells('A1:R1');
  const stR1 = wsStudents.getCell('A1');
  stR1.value = `BANK INDONESIA • DAFTAR NILAI & CAPAIAN INDIVIDUAL SISWA PROGRAM CBP RUPIAH`;
  stR1.font = { name: 'Arial', size: 12, bold: true, color: { argb: BI_COLORS.WHITE } };
  stR1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  stR1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsStudents.getRow(1).height = 26;

  wsStudents.mergeCells('A2:R2');
  const stR2 = wsStudents.getCell('A2');
  stR2.value = `Satuan Pendidikan: ${data.schoolName} | NPSN: ${data.npsn} | Tanggal Terbit: ${dateStr} | Total Terdaftar: ${data.studentReports.length} Siswa`;
  stR2.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.ICE_BLUE } };
  stR2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
  stR2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsStudents.getRow(2).height = 20;

  // Headers
  const studentHeaders = [
    'No',
    'NISN',
    'Nama Lengkap Siswa',
    'Kelas',
    'L/P',
    'Misi (x/9)',
    'Ketuntasan %',
    'Grafik Misi Tuntas',
    'Skor Cinta',
    'Grafik Cinta Rupiah',
    'Skor Bangga',
    'Grafik Bangga Rupiah',
    'Skor Paham',
    'Grafik Paham Rupiah',
    'Rata-rata Kuis',
    'Gelar Misi Akhir',
    'Status Asesmen',
    'Predikat Mutu',
  ];

  const stHeaderRow = wsStudents.getRow(3);
  stHeaderRow.height = 26;
  stHeaderRow.values = studentHeaders;
  for (let c = 1; c <= 18; c++) {
    const cell = stHeaderRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    applyThinBorder(cell, BI_COLORS.BORDER_DARK);
  }

  // Student Data Rows
  data.studentReports.forEach((st, idx) => {
    const rowNum = 4 + idx;
    const row = wsStudents.getRow(rowNum);
    row.height = 21;

    const genderText = st.gender === 'female' || st.gender === 'perempuan' ? 'Perempuan' : 'Laki-laki';
    const finalPassed = st.passedFinalMission;

    row.values = [
      idx + 1,
      st.nisn,
      st.name,
      st.grade,
      genderText,
      `${st.missionsCompleted}/9`,
      `${st.completionRate}%`,
      renderVisualProgressBar(st.completionRate, 100, 12),
      st.cintaScore,
      renderVisualProgressBar(st.cintaScore, 100, 12),
      st.banggaScore,
      renderVisualProgressBar(st.banggaScore, 100, 12),
      st.pahamScore,
      renderVisualProgressBar(st.pahamScore, 100, 12),
      st.avgQuizScore,
      st.finalStageTitle,
      finalPassed ? 'LULUS ASESMEN' : 'BELUM SELESAI',
      st.predicate,
    ];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE;

    for (let c = 1; c <= 18; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1 || c === 2 || c === 4 || c === 5 || c === 6 || c === 7 || c === 9 || c === 11 || c === 13 || c === 15) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 3) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 8 || c === 10 || c === 12 || c === 14) {
        cell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 16) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 17) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (finalPassed) {
          cell.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: BI_COLORS.STATUS_PASS } };
        } else {
          cell.font = { name: 'Arial', size: 8.5, color: { argb: BI_COLORS.TEXT_MUTED } };
        }
      } else if (c === 18) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
      }
    }
  });

  // =========================================================================
  // SHEET 3: REKAP KELAS (PRINT READY A4 LANDSCAPE)
  // =========================================================================
  const wsClass = wb.addWorksheet('Rekap Kelas', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      showGridLines: true,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 },
    },
  });

  wsClass.columns = [
    { key: 'no', width: 6 },
    { key: 'grade', width: 22 },
    { key: 'total', width: 16 },
    { key: 'active', width: 16 },
    { key: 'participation', width: 20 },
    { key: 'avgProg', width: 20 },
    { key: 'barProg', width: 26 },
    { key: 'avgScore', width: 20 },
    { key: 'passedFinal', width: 22 },
    { key: 'barPassed', width: 26 },
  ];

  // Header Banner Sheet 3
  wsClass.mergeCells('A1:J1');
  const clR1 = wsClass.getCell('A1');
  clR1.value = `BANK INDONESIA • REKAPITULASI CAPAIAN PER KELAS / ROMBEL`;
  clR1.font = { name: 'Arial', size: 12, bold: true, color: { argb: BI_COLORS.WHITE } };
  clR1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  clR1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsClass.getRow(1).height = 26;

  wsClass.mergeCells('A2:J2');
  const clR2 = wsClass.getCell('A2');
  clR2.value = `${data.schoolName} (NPSN: ${data.npsn}) • Tanggal Terbit: ${dateStr}`;
  clR2.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.ICE_BLUE } };
  clR2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
  clR2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsClass.getRow(2).height = 20;

  const classHeaders = [
    'No',
    'Kelas / Rombongan Belajar',
    'Total Siswa',
    'Siswa Aktif',
    'Partisipasi Belajar',
    'Rata-rata Ketuntasan',
    'Grafik Ketuntasan Kelas',
    'Rata-rata Nilai Ujian',
    'Lulus Misi Akhir',
    'Grafik Kelulusan Asesmen',
  ];

  const clHeaderRow = wsClass.getRow(3);
  clHeaderRow.height = 24;
  clHeaderRow.values = classHeaders;
  for (let c = 1; c <= 10; c++) {
    const cell = clHeaderRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyThinBorder(cell, BI_COLORS.BORDER_DARK);
  }

  data.classSummaries.forEach((cls, idx) => {
    const rowNum = 4 + idx;
    const row = wsClass.getRow(rowNum);
    row.height = 22;
    const partPct = cls.totalStudents > 0 ? Math.round((cls.activeStudents / cls.totalStudents) * 100) : 0;
    const passPct = cls.totalStudents > 0 ? Math.round((cls.passedFinalCount / cls.totalStudents) * 100) : 0;

    row.values = [
      idx + 1,
      cls.grade,
      `${cls.totalStudents} Siswa`,
      `${cls.activeStudents} Siswa`,
      `${partPct}%`,
      `${cls.avgCompletionRate}%`,
      renderVisualProgressBar(cls.avgCompletionRate, 100, 14),
      cls.avgScore,
      `${cls.passedFinalCount} Siswa (${passPct}%)`,
      renderVisualProgressBar(passPct, 100, 14),
    ];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE;

    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1 || c === 3 || c === 4 || c === 5 || c === 6 || c === 8 || c === 9) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 2) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 7 || c === 10) {
        cell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  });

  // Trigger download
  const cleanSchool = data.schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Rapor_Jelajah_Rupiah_${cleanSchool}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await triggerWorkbookDownload(wb, fileName);
}

/**
 * Export National-Level Excel Report in a Clean, Professional Format (Super Admin)
 */
export async function exportNationalExcelReport(data: NationalDashboardData): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Bank Indonesia - Jelajah CBP Rupiah';
  wb.created = new Date();

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // SHEET 1: IKHTISAR & GRAFIK CBP RUPIAH (KONSOLIDASI SEKOLAH MITRA)
  const wsSummary = wb.addWorksheet('Ikhtisar & Grafik CBP', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      showGridLines: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  wsSummary.columns = [
    { key: 'no', width: 6 },
    { key: 'indicator', width: 34 },
    { key: 'desc', width: 46 },
    { key: 'score', width: 22 },
    { key: 'bar', width: 28 },
    { key: 'predikat', width: 24 },
  ];

  // Header Banner
  wsSummary.mergeCells('A1:F1');
  const r1 = wsSummary.getCell('A1');
  r1.value = 'BANK INDONESIA • PROGRAM EDUKASI CINTA, BANGGA, DAN PAHAM (CBP) RUPIAH';
  r1.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.GOLD_ACCENT } };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(1).height = 24;

  wsSummary.mergeCells('A2:F2');
  const r2 = wsSummary.getCell('A2');
  r2.value = 'RAPOR KONSOLIDASI CAPAIAN KURIKULUM CBP RUPIAH';
  r2.font = { name: 'Arial', size: 15, bold: true, color: { argb: BI_COLORS.WHITE } };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(2).height = 28;

  wsSummary.mergeCells('A3:F3');
  const r3 = wsSummary.getCell('A3');
  r3.value = `Tanggal Laporan Terbit: ${dateStr} • Agregat: Seluruh Satuan Pendidikan Mitra Binaan Bank Indonesia`;
  r3.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.ICE_BLUE } };
  r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSummary.getRow(3).height = 20;

  // Indicators Focusing on 3 Pillars & Final Mission
  const aggregateIndicators = [
    { no: 1, title: 'Total Satuan Pendidikan Mitra Binaan', desc: 'Jumlah sekolah rintisan yang mengintegrasikan kurikulum CBP', stat: `${data.totalSchools} Sekolah`, bar: renderVisualProgressBar(data.totalSchools > 0 ? 100 : 0, 100, 16), label: data.totalSchools > 0 ? 'Mitra Binaan Aktif' : 'Belum Ada' },
    { no: 2, title: 'Total Siswa Binaan Terdaftar', desc: 'Peserta didik aktif dalam program Jelajah Rupiah di sekolah mitra', stat: `${data.totalStudents} Siswa`, bar: renderVisualProgressBar(data.totalStudents > 0 ? 100 : 0, 100, 16), label: data.totalStudents > 0 ? 'Akumulasi Siswa' : 'Belum Ada' },
    { no: 3, title: 'Total Guru Pembina & Fasilitator', desc: 'Tenaga pendidik pembimbing literasi moneter di sekolah mitra', stat: `${data.totalTeachers} Guru`, bar: renderVisualProgressBar(data.totalTeachers > 0 ? 100 : 0, 100, 16), label: data.totalTeachers > 0 ? 'Fasilitator Terdaftar' : 'Belum Ada' },
    { no: 4, title: 'Tingkat Partisipasi Siswa Binaan', desc: 'Persentase peserta didik aktif menuntaskan materi dan kuis', stat: `${data.nationalParticipationRate}%`, bar: renderVisualProgressBar(data.nationalParticipationRate, 100, 16), label: 'Tingkat Partisipasi' },
    { no: 5, title: 'Dimensi 1: Cinta Rupiah (Misi 1-3)', desc: 'Mengenali ciri keaslian (3D: Dilihat, Diraba, Diterawang) & merawat rupiah (5J)', stat: `${data.cintaAvg} / 100`, bar: renderVisualProgressBar(data.cintaAvg, 100, 16), label: getPredikatMutu(data.cintaAvg) },
    { no: 6, title: 'Dimensi 2: Bangga Rupiah (Misi 4-6)', desc: 'Rupiah sebagai simbol kedaulatan NKRI, alat pembayaran sah & pemersatu bangsa', stat: `${data.banggaAvg} / 100`, bar: renderVisualProgressBar(data.banggaAvg, 100, 16), label: getPredikatMutu(data.banggaAvg) },
    { no: 7, title: 'Dimensi 3: Paham Rupiah (Misi 7-9)', desc: 'Literasi transaksi bijak, berbelanja cerdas/hemat & budaya gemar menabung', stat: `${data.pahamAvg} / 100`, bar: renderVisualProgressBar(data.pahamAvg, 100, 16), label: getPredikatMutu(data.pahamAvg) },
    { no: 8, title: 'Indeks Agregat Capaian Kurikulum', desc: 'Rata-rata kumulatif pemahaman materi kurikulum CBP seluruh sekolah mitra', stat: `${data.nationalAvgScore} / 100`, bar: renderVisualProgressBar(data.nationalAvgScore, 100, 16), label: getPredikatMutu(data.nationalAvgScore) },
    { no: 9, title: 'Kelulusan Misi Akhir: Sang Penjelajah', desc: 'Total siswa lulus pengujian asesmen komprehensif berstandar Bank Indonesia', stat: `${data.nationalFinalPassedCount} Siswa (${data.totalStudents > 0 ? Math.round((data.nationalFinalPassedCount / data.totalStudents) * 100) : 0}%)`, bar: renderVisualProgressBar(data.nationalFinalPassedCount, Math.max(data.totalStudents, 1), 16), label: data.nationalFinalPassedCount > 0 ? 'Lulus Asesmen BI' : 'Belum Ada' },
  ];

  aggregateIndicators.forEach((ind, idx) => {
    const rowNum = 5 + idx;
    const row = wsSummary.getRow(rowNum);
    row.height = 22;
    row.values = [ind.no, ind.title, ind.desc, ind.stat, ind.bar, ind.label];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE;

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      else if (c === 2) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c === 4) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 5) {
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
  });

  // Dedicated Visual Chart Box for 3 Pillars & Misi Akhir
  const chartHeaderRow = wsSummary.getRow(15);
  chartHeaderRow.height = 24;
  wsSummary.mergeCells('A15:F15');
  const cHead = wsSummary.getCell('A15');
  cHead.value = 'GRAFIK VISUALISASI CAPAIAN 3 PILAR CBP RUPIAH & MISI AKHIR (AGREGAT SEKOLAH MITRA)';
  cHead.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: BI_COLORS.WHITE } };
  cHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
  cHead.alignment = { horizontal: 'center', vertical: 'middle' };

  const visualChartRows = [
    { label: '❤️ 1. PILAR CINTA RUPIAH', sub: 'Mengenali 3D & Merawat 5J Rupiah', val: data.cintaAvg, bar: renderVisualProgressBar(data.cintaAvg, 100, 24), pred: getPredikatMutu(data.cintaAvg) },
    { label: '🦅 2. PILAR BANGGA RUPIAH', sub: 'Simbol Kedaulatan & Alat Pembayaran Sah', val: data.banggaAvg, bar: renderVisualProgressBar(data.banggaAvg, 100, 24), pred: getPredikatMutu(data.banggaAvg) },
    { label: '💡 3. PILAR PAHAM RUPIAH', sub: 'Transaksi Bijak, Belanja Cerdas & Menabung', val: data.pahamAvg, valStr: `${data.pahamAvg}%`, bar: renderVisualProgressBar(data.pahamAvg, 100, 24), pred: getPredikatMutu(data.pahamAvg) },
    {
      label: '🏆 4. ASESMEN MISI AKHIR BI',
      sub: 'Tingkat Kelulusan Gelar Sang Penjelajah',
      val: data.totalStudents > 0 ? Math.round((data.nationalFinalPassedCount / data.totalStudents) * 100) : 0,
      bar: renderVisualProgressBar(data.nationalFinalPassedCount, Math.max(data.totalStudents, 1), 24),
      pred: `${data.nationalFinalPassedCount} Siswa Lulus`,
    },
  ];

  visualChartRows.forEach((v, idx) => {
    const rowNum = 16 + idx;
    const row = wsSummary.getRow(rowNum);
    row.height = 24;

    wsSummary.mergeCells(`B${rowNum}:C${rowNum}`);
    wsSummary.mergeCells(`E${rowNum}:F${rowNum}`);

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = `${v.label} • ${v.sub}`;
    row.getCell(4).value = `${v.val}%`;
    row.getCell(5).value = `${v.bar}  [${v.pred}]`;

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (c === 2) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (c === 4) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      if (c === 5) {
        cell.font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
  });

  // Official Signature Block (Print-Ready layout)
  const sigStartRow = 22;
  const rSig1 = wsSummary.getRow(sigStartRow);
  rSig1.getCell(2).value = 'Mengetahui,';
  rSig1.getCell(5).value = `Ditetapkan pada: ${dateStr}`;
  rSig1.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
  rSig1.getCell(5).font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

  const rSig2 = wsSummary.getRow(sigStartRow + 1);
  rSig2.getCell(2).value = 'Perwakilan Satuan Pendidikan Mitra Binaan';
  rSig2.getCell(5).value = 'Koordinator Program Edukasi CBP Rupiah Bank Indonesia';
  rSig2.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.TEXT_DARK } };
  rSig2.getCell(5).font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };

  const rSig3 = wsSummary.getRow(sigStartRow + 4);
  rSig3.getCell(2).value = '( ........................................................... )';
  rSig3.getCell(5).value = '( ........................................................... )';
  rSig3.getCell(2).font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };
  rSig3.getCell(5).font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

  // SHEET 2: CAPAIAN 3 PILAR & MISI AKHIR (SEKOLAH MITRA)
  const wsSchools = wb.addWorksheet('Capaian 3 Pilar & Misi Akhir', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, showGridLines: true },
  });

  wsSchools.columns = [
    { key: 'rank', width: 6 },
    { key: 'name', width: 32 },
    { key: 'npsn', width: 14 },
    { key: 'city', width: 16 },
    { key: 'students', width: 12 },
    { key: 'active', width: 12 },
    { key: 'prog', width: 16 },
    { key: 'cinta', width: 26 },
    { key: 'bangga', width: 26 },
    { key: 'paham', width: 26 },
    { key: 'score', width: 14 },
    { key: 'passed', width: 28 },
  ];

  // Header Banner Sheet 2
  wsSchools.mergeCells('A1:L1');
  const scH1 = wsSchools.getCell('A1');
  scH1.value = 'BANK INDONESIA • REKAPITULASI CAPAIAN 3 PILAR CBP RUPIAH & MISI AKHIR SEKOLAH MITRA';
  scH1.font = { name: 'Arial', size: 12, bold: true, color: { argb: BI_COLORS.WHITE } };
  scH1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.NAVY_DARK } };
  scH1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsSchools.getRow(1).height = 26;

  const scHeaders = [
    'Rank',
    'Nama Satuan Pendidikan Mitra',
    'NPSN',
    'Kota / Kab',
    'Total Siswa',
    'Siswa Aktif',
    'Ketuntasan',
    '❤️ Cinta Rupiah (Grafik)',
    '🦅 Bangga Rupiah (Grafik)',
    '💡 Paham Rupiah (Grafik)',
    'Rata Nilai',
    '🏆 Lulus Misi Akhir (Grafik)',
  ];

  const scHeadRow = wsSchools.getRow(2);
  scHeadRow.height = 24;
  scHeadRow.values = scHeaders;
  for (let c = 1; c <= 12; c++) {
    const cell = scHeadRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.BLUE_MEDIUM } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyThinBorder(cell);
  }

  data.schoolComparisons.forEach((sc, idx) => {
    const rowNum = 3 + idx;
    const row = wsSchools.getRow(rowNum);
    row.height = 22;

    const cintaBar = renderVisualProgressBar(sc.cintaAvg, 100, 8);
    const banggaBar = renderVisualProgressBar(sc.banggaAvg, 100, 8);
    const pahamBar = renderVisualProgressBar(sc.pahamAvg, 100, 8);
    const passedBar = renderVisualProgressBar(sc.finalMissionPassedRate, 100, 8);

    row.values = [
      idx + 1,
      sc.schoolName,
      sc.npsn,
      sc.city,
      sc.totalStudents,
      sc.activeStudents,
      `${sc.avgCompletionRate}%`,
      `${sc.cintaAvg}% ${cintaBar}`,
      `${sc.banggaAvg}% ${banggaBar}`,
      `${sc.pahamAvg}% ${pahamBar}`,
      sc.avgScore,
      `${sc.finalMissionPassedCount} (${sc.finalMissionPassedRate}%) ${passedBar}`,
    ];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? BI_COLORS.ZEBRA_ROW : BI_COLORS.WHITE;

    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c);
      applyThinBorder(cell);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.font = { name: 'Arial', size: 9, color: { argb: BI_COLORS.TEXT_DARK } };

      if (c === 2) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (c >= 8 && c <= 10) {
        cell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: BI_COLORS.BLUE_MEDIUM } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 12) {
        cell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  });

  // Summary Row Sheet 2
  const totalRowIndex = 3 + data.schoolComparisons.length;
  const totalRow = wsSchools.getRow(totalRowIndex);
  totalRow.height = 24;

  const totalCintaBar = renderVisualProgressBar(data.cintaAvg, 100, 8);
  const totalBanggaBar = renderVisualProgressBar(data.banggaAvg, 100, 8);
  const totalPahamBar = renderVisualProgressBar(data.pahamAvg, 100, 8);
  const totalPassedRate = data.totalStudents > 0 ? Math.round((data.nationalFinalPassedCount / data.totalStudents) * 100) : 0;
  const totalPassedBar = renderVisualProgressBar(totalPassedRate, 100, 8);

  totalRow.values = [
    '★',
    'KONSOLIDASI SELURUH SEKOLAH MITRA',
    '-',
    'Agregat',
    data.totalStudents,
    data.schoolComparisons.reduce((s, c) => s + c.activeStudents, 0),
    `${data.nationalParticipationRate}%`,
    `${data.cintaAvg}% ${totalCintaBar}`,
    `${data.banggaAvg}% ${totalBanggaBar}`,
    `${data.pahamAvg}% ${totalPahamBar}`,
    data.nationalAvgScore,
    `${data.nationalFinalPassedCount} (${totalPassedRate}%) ${totalPassedBar}`,
  ];

  for (let c = 1; c <= 12; c++) {
    const cell = totalRow.getCell(c);
    applyMediumBorder(cell);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BI_COLORS.ICE_BLUE } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };

    if (c === 2) {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    } else if ((c >= 8 && c <= 10) || c === 12) {
      cell.font = { name: 'Consolas', size: 8.5, bold: true, color: { argb: BI_COLORS.NAVY_DARK } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  const fileName = `Rapor_Konsolidasi_CBP_Rupiah_Sekolah_Mitra_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await triggerWorkbookDownload(wb, fileName);
}
