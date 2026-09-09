import { FinalMissionQuestion } from '../types';
import {
  SVG_UANG_KERTAS_100K,
  SVG_KARTU_DEBIT_GPN,
  SVG_EWALLET_SERVER,
  SVG_EMONEY_KARTU,
  SVG_UANG_LOGAM_RUPIAH,
} from '../data/q38Assets';

export const STAGES = {
  PEMULA: 'Penjelajah Pemula',
  TERAMPIL: 'Penjelajah Terampil',
  MASTER: 'Sang Penjelajah Rupiah',
} as const;

export const CLASSIFICATIONS = {
  ANAK: 'anak',
  REMAJA: 'remaja',
  DEWASA: 'dewasa',
} as const;

export const CLASSIFICATION_LABELS = {
  anak: 'Anak-Anak (10 - 17 Tahun / SD - SMA)',
  remaja: 'Remaja (18 - 30 Tahun / Mahasiswa & Pemuda)',
  dewasa: 'Dewasa (31 - 55 Tahun / Profesional & Umum)',
};

/**
 * Seed Database for Anak-Anak (10-17 Tahun / SD-SMA)
 * Directly initialized from Bank Soal CBP Rupiah Standard
 */
import { seedFinalMissionQuestionsAnak } from '../data/finalMissionAnakData';
export { seedFinalMissionQuestionsAnak };

/**
 * Seed Database for Remaja (18 - 30 Tahun / Mahasiswa & Pemuda)
 * Diintegrasikan langsung dari Bank Soal Kuesioner Resmi Survei CBP Rupiah Bank Indonesia 2025 (Q1 s.d Q60)
 */
import { seedFinalMissionQuestionsRemaja } from '../data/finalMissionRemajaData';
export { seedFinalMissionQuestionsRemaja };

/**
 * Seed Database for Dewasa (31 - 55 Tahun / Profesional & Umum)
 * Diintegrasikan langsung dari Bank Soal Kuesioner Resmi Survei CBP Rupiah Bank Indonesia 2025 (Q1 s.d Q60)
 */
import { seedFinalMissionQuestionsDewasa } from '../data/finalMissionDewasaData';
export { seedFinalMissionQuestionsDewasa };

export const allSeedFinalMissionQuestions: FinalMissionQuestion[] = [
  ...seedFinalMissionQuestionsAnak,
  ...seedFinalMissionQuestionsRemaja,
  ...seedFinalMissionQuestionsDewasa,
];
