export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface WorkflowReviewLog {
  id: string;
  entityType: 'mission' | 'lesson' | 'activity' | 'question' | 'tournament_question';
  entityId: string;
  entityTitle: string;
  previousStatus: ContentStatus;
  newStatus: ContentStatus;
  reviewerId: string;
  reviewerName: string;
  notes: string;
  timestamp: string;
}

export interface ContentVersionEntry {
  id: string;
  entityType: 'mission' | 'lesson' | 'activity' | 'question' | 'tournament_question';
  entityId: string;
  versionNumber: string;
  updatedBy: string;
  timestamp: string;
  changeSummary: string;
  snapshot: any;
}

export interface School {
  id: string; // e.g. 'SCH-001'
  code: string; // e.g. 'SDN-02-MDW'
  name: string; // e.g. 'SD Negeri 2 Medewi'
  npsn?: string;
  address?: string;
  principalName?: string;
  logo?: string;
  phone?: string;
  email?: string;
  adminId?: string; // ID of the Admin Sekolah
  adminName?: string;
  adminUsername?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  nisn?: string;
  nip?: string;
  phone?: string;
  password?: string;
  gender?: 'male' | 'female' | 'laki-laki' | 'perempuan';
  role: 'student' | 'teacher' | 'admin' | 'reviewer' | 'viewer' | 'superadmin';
  grade?: string;
  classId?: string;
  school?: string;
  schoolId?: string;
  institution?: string;
  points: number;
  level: number;
  levelTitle: string;
  currentXp: number;
  maxXp: number;
  avatar: string;
  streakDays: number;
  createdAt: string;
  isActive?: boolean;
  isGuest?: boolean;
}

export interface Class {
  id: string;
  code: string;
  name: string;
  grade: string;
  school: string;
  teacherId: string;
  teacherName?: string;
  academicYear: string;
  createdAt: string;
}

export interface ClassMember {
  id: string;
  classId: string;
  userId: string;
  joinedAt: string;
  role: 'student' | 'assistant';
}

export interface World {
  id: string;
  code: 'cinta' | 'bangga' | 'paham';
  title: string;
  tagline: string;
  themeColor: 'red' | 'blue' | 'orange';
  icon: string;
  orderIndex: number;
  description: string;
  status: ContentStatus;
}

export interface Mission {
  id: string;
  worldId: string; // 'cinta' | 'bangga' | 'paham'
  code: string; // e.g. JR-C01 to JR-P09
  title: string;
  subtitle: string;
  levelNumber: number; // 1 to 9
  summary: string;
  description?: string;
  learningPoints: string[];
  status: ContentStatus;
  xpReward: number;
  pointReward: number;
  orderIndex: number;
  badgeId?: string;
  badgeRewardId?: string;
  iconName?: string;
  bigQuestion?: string;
  objective?: string;
  openingStory?: string;
  storyOpening?: string;
  openingImageUrl?: string;
  imageUrl?: string;
  passingScore?: number;
  questionDisplayCount?: number;
}

export interface Lesson {
  id: string;
  content_id?: string;
  missionId: string;
  mission_id?: string;
  code: string; // e.g. MAT-001 to MAT-024
  title: string;
  summary?: string;
  content: string; // Legacy compatibility alias
  studentText: string; // CANONICAL alias
  student_text?: string; // CANONICAL: Isi utama materi untuk siswa
  text?: string;
  body?: string;
  description?: string;
  keyTakeaways?: string[];
  keyTakeaway?: string;
  sections?: Array<{ title?: string; content?: string; type?: string }>;
  imageUrl?: string;
  image_url?: string;
  imageCaption?: string;
  imageBrief?: string; // Catatan panduan ilustrasi untuk Admin / visual creator
  image_brief?: string;
  interactionPrompt?: string; // Prompt refleksi / pertanyaan interaktif siswa
  interaction_prompt?: string;
  gradeScope?: string;
  grade_scope?: string;
  contentType?: string;
  content_type?: string;
  teacherNote?: string;
  teacher_note?: string;
  sourceUrl?: string;
  source_url?: string;
  referenceId?: string;
  readTimeMinutes?: number;
  orderIndex: number;
  contentOrder?: number;
  content_order?: number;
  status: ContentStatus;
}

export interface Activity {
  id: string;
  missionId: string;
  code: string; // e.g. ACT-001 to ACT-018
  title: string;
  type: 'simulator_5j' | 'sorter' | 'decision_quest' | 'quiz' | 'budget_planner' | 'interactive' | 'ordering' | 'matching' | 'categorization' | 'hotspot' | 'calculation' | 'choose_answer';
  instruction: string;
  scenarioData?: any;
  config?: any;
  gradeScope?: string;
  pointReward: number;
  pointsAwarded?: number;
  xpReward: number;
  orderIndex: number;
  status: ContentStatus;
}

export interface PracticeQuestion {
  id: string;
  missionId: string;
  code: string; // e.g. QST-001 to QST-110
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  competencyCategory: string;
  points?: number;
  gradeLevel?: string;
  grade?: string;
  source?: string;
  sourceReferenceId?: string;
  referenceSourceId?: string;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
  orderIndex?: number;
  tags?: string[];
  status: ContentStatus;
}

export interface Badge {
  id: string;
  missionId?: string;
  code: string; // e.g. BDG-01 to BDG-09
  name: string;
  category: 'cinta' | 'bangga' | 'paham' | 'special';
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  unlocked: boolean;
  unlockedDate?: string;
  xpReward: number;
  status: ContentStatus;
}

export interface Reflection {
  id: string;
  missionId: string;
  code: string; // e.g. RFL-01 to RFL-09
  prompt: string;
  guideQuestions: string[];
  rubric?: string;
  status: ContentStatus;
}

export interface Reference {
  id: string;
  code: string; // e.g. REF-01 to REF-10
  title: string;
  sourceName: string;
  citation?: string;
  publicationYear: string | number;
  url?: string;
  type?: 'regulation' | 'book' | 'article' | 'guideline' | string;
  status: ContentStatus;
}

export type MissionState = 'locked' | 'available' | 'in_progress' | 'completed';

export interface StudentProgress {
  id: string;
  studentId: string;
  missionId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'not_started';
  startedAt?: string;
  completedAt?: string;
  score: number;
  badgeAwarded: boolean;
  completedSteps?: number[];
  completedSections?: ('learn' | 'activity' | 'practice' | 'reflection')[];
  reflectionAnswer?: string;
  lastAttemptScore?: number;
  attemptsCount?: number;
}

export interface PracticeAttempt {
  id: string;
  studentId: string;
  missionId: string;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  correctAnswers?: number;
  startedAt: string;
  completedAt: string;
  durationSeconds?: number;
  details?: Array<{ questionId: string; selectedAnswer: number; isCorrect: boolean }>;
}

export interface TournamentPackage {
  id: string;
  code: string; // e.g. PKG-01, PKG-02, PKG-03
  title: string;
  category?: 'cinta' | 'bangga' | 'paham' | 'grand' | string;
  worldId?: string;
  gradeLevel: string; // 'SD Kelas 4', 'SD Kelas 5', 'SD Kelas 6'
  targetDurationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  status: ContentStatus;
}

export interface TournamentQuestion {
  id: string;
  packageId: string;
  sourcePracticeQuestionId: string; // Links back to a PracticeQuestion
  code: string; // e.g. TQ-001 to TQ-060
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  competencyCategory?: string;
  gradeLevel?: string;
  category?: 'cinta' | 'bangga' | 'paham' | string;
  orderIndex?: number;
  status: ContentStatus;
}

export interface TournamentEvent {
  id: string;
  packageId: string;
  code?: string;
  title: string;
  school: string;
  classId?: string;
  className?: string;
  teacherId?: string;
  category?: 'cinta' | 'bangga' | 'paham' | 'grand';
  startTime: string;
  endTime: string;
  targetDurationMinutes?: number;
  totalQuestions?: number;
  passingScore?: number;
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
  isMakeup?: boolean;
  parentEventId?: string;
}

export interface TournamentParticipant {
  id: string;
  eventId: string;
  studentId: string;
  studentName?: string;
  registeredAt: string;
  status?: 'registered' | 'waiting' | 'active' | 'submitted' | 'absent';
  score?: number;
  currentQuestion?: number;
  joinedAt?: string;
  submittedAt?: string;
}

export interface TournamentResult {
  id: string;
  eventId: string;
  studentId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  durationSeconds?: number;
  completedAt: string;
  submittedAt?: string;
  rank?: number;
  medal?: 'gold' | 'silver' | 'bronze' | 'participant' | 'none';
  isVerified?: boolean;
  className?: string;
  studentName?: string;
  details?: Array<{ questionId: string; competencyCategory?: string; isCorrect: boolean; selectedAnswer: number }>;
}

export interface ContentVersion {
  id: string;
  versionNumber: string;
  title: string;
  description: string;
  importedAt: string;
  importedBy: string;
  status: ContentStatus;
}

export interface ImportAuditLog {
  id: string;
  timestamp: string;
  importedBy: string;
  fileName: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  details: {
    missionsCount: number;
    lessonsCount: number;
    activitiesCount: number;
    questionsCount: number;
    badgesCount: number;
    reflectionsCount: number;
    referencesCount: number;
    packagesCount: number;
    tournamentQuestionsCount: number;
    eventsCount: number;
    errorsList?: string[];
  };
  statusSummary: 'success' | 'warning' | 'failed';
}

// UI Compatible Types
export interface MissionStep {
  id: number;
  title: string;
  subtitle: string;
  iconName: string;
  completed: boolean;
  points: number;
}

export interface Realm {
  id: 'cinta' | 'bangga' | 'paham';
  title: string;
  themeColor: 'red' | 'blue' | 'orange';
  tagline: string;
  icon: string;
  buttonLabel: string;
  steps: MissionStep[];
  description: string;
  learningPoints: string[];
  missions?: Mission[];
}

export interface DailyActivity {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  iconType: 'quiz' | 'read' | 'mission';
}

export interface StudentProfile {
  name: string;
  gender: 'male' | 'female' | 'laki-laki' | 'perempuan';
  grade: string;
  school: string;
  points: number;
  level: number;
  levelTitle: string;
  currentXp: number;
  maxXp: number;
  avatar: string;
  streakDays: number;
}

export interface SchoolSettings {
  schoolName: string;
  schoolLogo: string; // Base64 data URI or image URL
  npsn?: string;
  address?: string;
  principalName?: string;
  academicYear?: string;
  tagline?: string;
  bypassFinalMissionRequirement?: boolean; // Jika true, siswa dapat membuka Misi Akhir tanpa harus menuntaskan 9 misi utama
  updatedAt?: string;
  updatedBy?: string;
}

// ==========================================
// MISI AKHIR: SANG PENJELAJAH RUPIAH TYPES
// ==========================================
export type FinalMissionClassification = 'anak' | 'remaja' | 'dewasa';

export type FinalMissionStage = 'pemula' | 'terampil' | 'master';

export interface FinalMissionMatrixItem {
  id: string; // e.g. 'item_1'
  label: string; // e.g. 'Uang Kertas (Rp 100.000)'
  imageFileName?: string;
  imageUrl?: string;
  correctCategory: string; // e.g. 'Tunai' atau 'Non Tunai'
  points?: number;
}

export interface FinalMissionQuestion {
  id: string; // e.g. Q1_1, Q2_1, Q37a, Q38, etc.
  dimension: string; // e.g. 'Cinta Rupiah - Pengetahuan', 'Bangga Rupiah - Sikap', etc.
  question: string;
  imageFileName?: string;
  imageUrl?: string;
  questionType: string; // 'Pilihan Ganda', 'Ya/Tidak', 'Tahu/Tidak', 'Skala 1-5', 'Benar/Salah', 'Tunai/Non-Tunai', 'Pilihan 1-7', 'Multi-Select', 'Pengelompokan Gambar', etc.
  options: string[] | string;
  correctAnswer: string;
  points: number;
  optionPoints?: number[]; // [Opsi 2]: Bobot poin per opsi jawaban (misal [1, 2], [2, 1], atau [5, 4, 3, 2, 1])
  categories?: string[]; // Kategori untuk soal matriks/pengelompokan (misal: ['Tunai', 'Non Tunai'])
  matrixItems?: FinalMissionMatrixItem[]; // Butir item gambar untuk matriks pengelompokan visual (Soal 38)
  stage: 'pemula' | 'terampil' | 'master' | string; // 'Penjelajah Pemula' | 'Penjelajah Terampil' | 'Sang Penjelajah Rupiah'
  classification: FinalMissionClassification; // 'anak' (10-17 th), 'remaja' (18-30 th), 'dewasa' (31-55 th)
  orderIndex?: number;
  status?: ContentStatus;
}

export interface FinalMissionProgress {
  id: string;
  userId: string;
  classification: FinalMissionClassification;
  stage1Completed: boolean; // Penjelajah Pemula
  stage1Score: number;
  stage2Completed: boolean; // Penjelajah Terampil
  stage2Score: number;
  stage3Completed: boolean; // Sang Penjelajah Rupiah
  stage3Score: number;
  grandTitleAwarded: boolean;
  unlockedAt?: string;
  completedAt?: string;
}

export interface FinalMissionAttempt {
  id: string;
  userId: string;
  classification: FinalMissionClassification;
  stage: FinalMissionStage;
  stageTitle: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  completedAt: string;
  durationSeconds?: number; // Waktu pengerjaan dalam detik
  details?: Array<{ questionId: string; selectedAnswer: any; isCorrect: boolean }>;
}

export interface FinalMissionEventSchedule {
  enabled: boolean; // Jika true, mode main bareng aktif (siswa hanya bisa buka saat jadwal dan sudah tuntas 9 misi)
  title: string; // Judul sesi, contoh: "Main Bareng Misi Akhir CBP Rupiah"
  startDate: string; // Tanggal & waktu mulai (ISO string atau YYYY-MM-DDTHH:mm)
  endDate: string; // Tanggal & waktu selesai (ISO string atau YYYY-MM-DDTHH:mm)
  schoolId?: string; // Target sekolah (default: 'ALL')
  description?: string; // Keterangan atau instruksi tambahan
  updatedBy?: string;
  updatedAt?: string;
}

export interface FinalMissionLeaderboardEntry {
  rank: number;
  userId: string;
  studentName: string;
  nisn?: string;
  className?: string;
  schoolName?: string;
  stage: FinalMissionStage;
  stageTitle: string;
  score: number;
  durationSeconds: number;
  formattedDuration: string;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
}

export interface FinalMissionStageAccessConfig {
  unlockAll: boolean; // Jika true, semua tahapan (1, 2, 3) terbuka langsung tanpa syarat
  unlockedStages: {
    pemula: boolean; // Selalu true (tahap awal)
    terampil: boolean; // Jika true, buka tahap 2 langsung tanpa harus lulus tahap 1
    master: boolean; // Jika true, buka tahap 3 langsung tanpa harus lulus tahap 2
  };
  unlockForEveryone: boolean; // Jika true, berlaku untuk semua akun; jika false, khusus admin / penguji
  passingGrade: number; // Ambang batas nilai kelulusan minimal (%) default: 80
  stagePassingGrades?: {
    pemula?: number; // Batas bawah nilai Tahap 1 (default: 80)
    terampil?: number; // Batas bawah nilai Tahap 2 (default: 80)
    master?: number; // Batas bawah nilai Tahap 3 (default: 80)
  };
  eventSchedule?: FinalMissionEventSchedule; // Pengaturan jadwal event Main Bareng oleh Admin Sekolah
}
