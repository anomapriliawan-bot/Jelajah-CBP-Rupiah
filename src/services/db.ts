import {
  ContentStatus,
  World,
  Mission,
  Lesson,
  Activity,
  PracticeQuestion,
  Badge,
  Reflection,
  Reference,
  StudentProgress,
  PracticeAttempt,
  TournamentPackage,
  TournamentQuestion,
  TournamentEvent,
  TournamentParticipant,
  TournamentResult,
  ContentVersion,
  ImportAuditLog,
  User,
  School,
  Class,
  ClassMember,
  WorkflowReviewLog,
  ContentVersionEntry,
  SchoolSettings,
  FinalMissionQuestion,
  FinalMissionMatrixItem,
  FinalMissionClassification,
  FinalMissionStage,
  FinalMissionProgress,
  FinalMissionAttempt,
  FinalMissionStageAccessConfig,
  FinalMissionEventSchedule,
  FinalMissionLeaderboardEntry,
} from '../types';

import {
  seedWorlds,
  seedMissions,
  seedLessons,
  seedActivities,
  seedPracticeQuestions,
  seedBadges,
  seedReflections,
  seedReferences,
  seedTournamentPackages,
  seedTournamentQuestions,
  seedUsers,
  seedSchools,
  seedClasses,
  seedClassMembers,
  seedStudentProgress,
  seedTournamentEvents,
  seedTournamentParticipants,
  seedTournamentResults,
  seedAuditLogs,
  seedWorkflowLogs,
  seedVersionHistory,
} from './seedData';
import {
  allSeedFinalMissionQuestions,
  seedFinalMissionQuestionsAnak,
  seedFinalMissionQuestionsRemaja,
  seedFinalMissionQuestionsDewasa,
  STAGES as FINAL_MISSION_STAGES,
} from './finalMissionData';
import {
  saveImageToStore,
  getImageFromStore,
  deleteImageFromStore,
  buildLessonImageKeys,
  purgeLegacyLocalStorageImages,
  savePayloadToStore,
  getPayloadFromStoreSync,
  getPayloadFromStore,
} from './imageStore';
import { deleteImageFromServer } from './uploadService';
import { getDefaultQ38ItemImage } from '../data/q38Assets';
import { normalizeImageUrl } from '../utils/imageHelper';
import {
  saveCloudDoc,
  batchSaveCloudDocs,
  deleteCloudDoc,
  getCloudCollection,
  seedCloudIfEmpty,
  triggerManualSync,
  initFirebaseAuth,
  subscribeFirebaseStatus,
  getFirebaseSyncStatus,
  FirebaseSyncStatus,
  firestore,
} from './firebase';
import { doc, onSnapshot, collection, getDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  WORLDS: 'jr_db_worlds',
  MISSIONS: 'jr_db_missions',
  LESSONS: 'jr_db_lessons',
  ACTIVITIES: 'jr_db_activities',
  PRACTICE_QUESTIONS: 'jr_db_practice_questions',
  BADGES: 'jr_db_badges',
  REFLECTIONS: 'jr_db_reflections',
  REFERENCES: 'jr_db_references',
  STUDENT_PROGRESS: 'jr_db_student_progress',
  PRACTICE_ATTEMPTS: 'jr_db_practice_attempts',
  TOURNAMENT_PACKAGES: 'jr_db_tournament_packages',
  TOURNAMENT_QUESTIONS: 'jr_db_tournament_questions',
  TOURNAMENT_EVENTS: 'jr_db_tournament_events',
  TOURNAMENT_PARTICIPANTS: 'jr_db_tournament_participants',
  TOURNAMENT_RESULTS: 'jr_db_tournament_results',
  CONTENT_VERSIONS: 'jr_db_content_versions',
  AUDIT_LOGS: 'jr_db_audit_logs',
  USERS: 'jr_db_users',
  SCHOOLS: 'jr_db_schools',
  CLASSES: 'jr_db_classes',
  CLASS_MEMBERS: 'jr_db_class_members',
  WORKFLOW_LOGS: 'jr_db_workflow_logs',
  VERSION_ENTRIES: 'jr_db_version_entries',
  CURRENT_USER: 'jr_db_current_user',
  SCHOOL_SETTINGS: 'jr_db_school_settings',
  FINAL_MISSION_QUESTIONS: 'jr_db_final_mission_questions_v1',
  FINAL_MISSION_PROGRESS: 'jr_db_final_mission_progress_v1',
  FINAL_MISSION_ATTEMPTS: 'jr_db_final_mission_attempts_v1',
  FINAL_MISSION_STAGE_ACCESS: 'jr_db_final_mission_stage_access_v1',
  INITIALIZED: 'jr_db_initialized_v11',
  PILOT_SYNC: 'jr_db_pilot_sync_v11',
};

// Storage keys that must use high-capacity IndexedDB + in-memory store to eliminate browser 5MB quota errors
const ASYNC_IDB_KEYS = new Set<string>([
  STORAGE_KEYS.FINAL_MISSION_QUESTIONS,
]);

export const DEFAULT_FINAL_MISSION_STAGE_ACCESS: FinalMissionStageAccessConfig = {
  unlockAll: false,
  unlockedStages: {
    pemula: true,
    terampil: false,
    master: false,
  },
  unlockForEveryone: false,
  passingGrade: 80,
  stagePassingGrades: {
    pemula: 80,
    terampil: 80,
    master: 80,
  },
  eventSchedule: {
    enabled: false,
    title: 'Main Bareng Misi Akhir CBP Rupiah',
    startDate: '',
    endDate: '',
    schoolId: 'ALL',
    description: 'Sesi pengerjaan Misi Akhir bersama seluruh siswa di sekolah.',
  },
};

// Canonical Mission ID List (Single Source of Truth)
export const CANONICAL_MISSION_IDS = [
  'JR-C01', 'JR-C02', 'JR-C03', // Dunia Cinta Rupiah
  'JR-B04', 'JR-B05', 'JR-B06', // Dunia Bangga Rupiah
  'JR-P07', 'JR-P08', 'JR-P09', // Dunia Paham Rupiah
] as const;

export type CanonicalMissionId = (typeof CANONICAL_MISSION_IDS)[number];

// Legacy / Alternative ID mapping to Canonical ID
const MISSION_ID_MAP: Record<string, string> = {
  'MIS-01': 'JR-C01',
  'MIS-001': 'JR-C01',
  'MIS-1': 'JR-C01',
  'C01': 'JR-C01',
  'JR-C1': 'JR-C01',
  '1': 'JR-C01',

  'MIS-02': 'JR-C02',
  'MIS-002': 'JR-C02',
  'MIS-2': 'JR-C02',
  'C02': 'JR-C02',
  'JR-C2': 'JR-C02',
  '2': 'JR-C02',

  'MIS-03': 'JR-C03',
  'MIS-003': 'JR-C03',
  'MIS-3': 'JR-C03',
  'C03': 'JR-C03',
  'JR-C3': 'JR-C03',
  '3': 'JR-C03',

  'MIS-04': 'JR-B04',
  'MIS-004': 'JR-B04',
  'MIS-4': 'JR-B04',
  'B04': 'JR-B04',
  'JR-B4': 'JR-B04',
  '4': 'JR-B04',

  'MIS-05': 'JR-B05',
  'MIS-005': 'JR-B05',
  'MIS-5': 'JR-B05',
  'B05': 'JR-B05',
  'JR-B5': 'JR-B05',
  '5': 'JR-B05',

  'MIS-06': 'JR-B06',
  'MIS-006': 'JR-B06',
  'MIS-6': 'JR-B06',
  'B06': 'JR-B06',
  'JR-B6': 'JR-B06',
  '6': 'JR-B06',

  'MIS-07': 'JR-P07',
  'MIS-007': 'JR-P07',
  'MIS-7': 'JR-P07',
  'P07': 'JR-P07',
  'JR-P7': 'JR-P07',
  '7': 'JR-P07',

  'MIS-08': 'JR-P08',
  'MIS-008': 'JR-P08',
  'MIS-8': 'JR-P08',
  'P08': 'JR-P08',
  'JR-P8': 'JR-P08',
  '8': 'JR-P08',

  'MIS-09': 'JR-P09',
  'MIS-009': 'JR-P09',
  'MIS-9': 'JR-P09',
  'P09': 'JR-P09',
  'JR-P9': 'JR-P09',
  '9': 'JR-P09',
};

/**
 * Normalizes any mission ID (e.g. 'MIS-001', 'MIS-01', 'JR-C01') to canonical 'JR-C01'
 */
export function normalizeMissionId(id: string | null | undefined): string {
  if (!id) return 'JR-C01';
  const trimmed = String(id).trim();
  const upper = trimmed.toUpperCase();

  // If already canonical
  if (CANONICAL_MISSION_IDS.includes(upper as CanonicalMissionId)) {
    return upper;
  }

  // If in mapping dictionary
  if (MISSION_ID_MAP[upper]) {
    return MISSION_ID_MAP[upper];
  }

  // If numeric extraction matches (e.g. MIS-01 -> 1 -> JR-C01)
  const numMatch = trimmed.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num >= 1 && num <= 9) {
      const canonical = CANONICAL_MISSION_IDS[num - 1];
      if (canonical) return canonical;
    }
  }

  return trimmed;
}

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'SD Negeri 2 Medewi',
  schoolLogo: '',
  npsn: '50101234',
  address: 'Kec. Pekutatan, Kab. Jembrana, Prov. Bali',
  principalName: 'I Ketut Sudarsana, S.Pd., M.Pd.',
  academicYear: '2025/2026',
  tagline: 'Edukasi Cinta, Bangga, & Paham Rupiah • Standar Bank Indonesia',
  bypassFinalMissionRequirement: false,
};

export const GUEST_USER: User = {
  id: 'USR-GUEST',
  name: 'Pengguna Tamu',
  username: 'tamu',
  role: 'student',
  grade: 'Pengunjung',
  school: 'Jelajah Rupiah Guest Mode',
  institution: 'Edukasi CBP Rupiah',
  points: 0,
  level: 1,
  levelTitle: 'Penjelajah Tamu',
  currentXp: 0,
  maxXp: 100,
  avatar: 'laki-laki',
  streakDays: 1,
  createdAt: new Date().toISOString(),
  isActive: true,
  isGuest: true,
};

/**
 * Generate unique, memorable usernames based on role, school/institution, and name.
 * Automatically checks and loops until an unused username is found.
 */
export function generateMemorableUsername(
  role: 'superadmin' | 'reviewer' | 'viewer' | 'admin' | 'teacher' | 'student' | string,
  schoolOrInstitution: string = 'sekolah',
  name: string = 'user',
  existingUsersList?: User[]
): string {
  const cleanInst = (schoolOrInstitution || 'sekolah')
    .toLowerCase()
    .replace(/^sd\s+negeri\s+|^sdn\s+|^sd\s+|^bank\s+|^kantor\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10) || 'inst';

  const cleanName = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8) || 'user';

  // Gather existing usernames from passed list or DB
  let takenUsernames = new Set<string>();
  try {
    const list = existingUsersList || db?.getUsers() || seedUsers;
    list.forEach((u) => {
      if (u.username) takenUsernames.add(u.username.toLowerCase());
      if (u.id) takenUsernames.add(u.id.toLowerCase());
    });
  } catch {
    seedUsers.forEach((u) => {
      if (u.username) takenUsernames.add(u.username.toLowerCase());
    });
  }

  // Generate candidate and ensure 100% collision-free
  for (let attempt = 0; attempt < 50; attempt++) {
    const rand2 = Math.floor(10 + Math.random() * 90);
    let candidate = '';

    if (role === 'superadmin') {
      candidate = attempt === 0 && cleanName !== 'user' ? `sa.${cleanName}` : `sa.${cleanName}.${rand2}`;
    } else if (role === 'reviewer' || role === 'viewer') {
      candidate = `reviewer.${cleanInst || cleanName}.${rand2}`;
    } else if (role === 'admin') {
      candidate = `adm.${cleanInst}.${rand2}`;
    } else if (role === 'teacher') {
      candidate = `guru.${cleanName}.${rand2}`;
    } else {
      const rand3 = Math.floor(100 + Math.random() * 900);
      candidate = `std.${cleanName}.${rand3}`;
    }

    if (!takenUsernames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${role.slice(0, 3)}.${cleanName}.${Date.now().toString().slice(-4)}`;
}

/**
 * Generate memorable, cheerful passwords with Rupiah keywords and short numeric pin.
 * e.g. Rupiah2026, Cinta99, Bangga123, Paham88, Medewi26, Ksatria77
 */
export function generateMemorablePassword(): string {
  const keywords = [
    'Rupiah',
    'Cinta',
    'Bangga',
    'Paham',
    'Ksatria',
    'Sahabat',
    'Juara',
    'Cerdas',
    'Pintar',
    'Merawat',
    'Simbol',
    'Kedaulatan',
    'Merdeka',
    'Nusantara',
    'Teladan',
  ];
  const word = keywords[Math.floor(Math.random() * keywords.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}${num}`;
}

type Listener = () => void;

class DatabaseService {
  private listeners: Set<Listener> = new Set();
  private isCloudSyncing: boolean = false;
  private inMemoryStore: Map<string, any> = new Map();
  private inMemoryGuestSession: User | null = null;
  private inMemoryGuestProgress: StudentProgress[] = [];
  private inMemoryGuestBadges: Badge[] = [];
  private inMemoryGuestAttempts: PracticeAttempt[] = [];
  private inMemoryGuestFinalProgress: FinalMissionProgress[] = [];
  private inMemoryGuestFinalAttempts: FinalMissionAttempt[] = [];
  private notifyScheduled: boolean = false;

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch (err) {
          console.error('Error notifying DB listener:', err);
        }
      });
    });
  }

  /**
   * Sanitizes questions before writing to localStorage/IndexedDB by ensuring large base64 data URLs
   * are offloaded to IndexedDB (ImageStore) rather than consuming storage payload quota.
   */
  private sanitizeFinalMissionQuestionsForStorage(questions: FinalMissionQuestion[]): FinalMissionQuestion[] {
    return questions.map((q) => {
      const copy: FinalMissionQuestion = { ...q };

      // Offload question imageUrl if base64 or long data string
      if (copy.imageUrl && (copy.imageUrl.startsWith('data:') || copy.imageUrl.length > 256)) {
        saveImageToStore(`fm_q_${copy.id}`, copy.imageUrl, [copy.id, copy.imageFileName || '']);
        if (copy.imageFileName) {
          const cleanName = copy.imageFileName.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
          copy.imageUrl = `/images/final-mission/${cleanName}`;
        } else {
          delete copy.imageUrl;
        }
      }

      // Offload matrix items imageUrl if base64 or long data string
      if (Array.isArray(copy.matrixItems)) {
        copy.matrixItems = copy.matrixItems.map((itm) => {
          const itmCopy = { ...itm };
          if (itmCopy.imageUrl && (itmCopy.imageUrl.startsWith('data:') || itmCopy.imageUrl.length > 256)) {
            saveImageToStore(`fm_item_${copy.id}_${itmCopy.id}`, itmCopy.imageUrl, [
              `fm_item_${itmCopy.id}`,
              itmCopy.imageFileName || '',
            ]);
            if (itmCopy.imageFileName) {
              const cleanName = itmCopy.imageFileName.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
              itmCopy.imageUrl = `/images/final-mission/${cleanName}`;
            } else {
              delete itmCopy.imageUrl;
            }
          }
          return itmCopy;
        });
      }

      return copy;
    });
  }

  /**
   * Offload large lesson images to ImageStore (IndexedDB) and Cloud so localStorage does not hit 5MB quota.
   */
  private sanitizeLessonsForStorage(lessons: Lesson[]): Lesson[] {
    return lessons.map((l) => {
      const copy: any = { ...l };
      const rawImg = copy.imageUrl || copy.image_url;
      if (rawImg && (rawImg.startsWith('data:') || rawImg.length > 256)) {
        const order = Number(copy.contentOrder || copy.orderIndex || 1);
        const mission = normalizeMissionId(copy.missionId || copy.mission_id);
        const keys = buildLessonImageKeys(copy.id, mission, order, copy.code);
        saveImageToStore(copy.id, rawImg, keys);

        // If rawImg is a server URL or http URL, preserve it!
        if (rawImg.startsWith('/images/') || rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
          copy.imageUrl = rawImg;
          copy.image_url = rawImg;
        } else {
          // Backup dataUrl to Firestore uploaded_images collection for cross-device sharing
          try {
            const cleanKey = `lesson_${String(copy.id || copy.code).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;
            saveCloudDoc('uploaded_images', cleanKey, {
              id: cleanKey,
              lessonId: copy.id,
              dataUrl: rawImg && rawImg.length < 850000 ? rawImg : '',
              category: 'lessons',
              createdAt: new Date().toISOString(),
            }).catch(() => {});
          } catch {
            // ignore
          }
          copy.imageUrl = '';
          copy.image_url = '';
        }
      }
      return copy as Lesson;
    });
  }

  private getStorage<T>(key: string, fallback: T[]): T[] {
    // 1. If key is managed by high-capacity IndexedDB (e.g. Final Mission questions)
    if (ASYNC_IDB_KEYS.has(key)) {
      if (this.inMemoryStore.has(key)) {
        return this.inMemoryStore.get(key) as T[];
      }
      const cached = getPayloadFromStoreSync<T[]>(key);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.inMemoryStore.set(key, cached);
        return cached;
      }
      // Check legacy localStorage if not yet migrated
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.inMemoryStore.set(key, parsed);
          savePayloadToStore(key, parsed);
          localStorage.removeItem(key); // Free up quota immediately!
          return parsed;
        }
      } catch (err) {
        console.warn(`[DB] Migration parse error for ${key}:`, err);
      }
      return fallback;
    }

    // 2. Standard getStorage with inMemory fallback
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return this.inMemoryStore.has(key) ? (this.inMemoryStore.get(key) as T[]) : fallback;
      }
      const parsed = JSON.parse(raw);
      this.inMemoryStore.set(key, parsed);
      return parsed;
    } catch {
      return this.inMemoryStore.has(key) ? (this.inMemoryStore.get(key) as T[]) : fallback;
    }
  }

  private setStorage<T>(key: string, data: T[]) {
    // Keep in inMemoryStore for instant, zero-loss synchronous retrieval
    this.inMemoryStore.set(key, data);

    let storagePayload: any = data;
    if (key === STORAGE_KEYS.FINAL_MISSION_QUESTIONS && Array.isArray(data)) {
      storagePayload = this.sanitizeFinalMissionQuestionsForStorage(data as unknown as FinalMissionQuestion[]);
    }

    // If key is managed by high-capacity IndexedDB, bypass localStorage completely!
    if (ASYNC_IDB_KEYS.has(key)) {
      savePayloadToStore(key, storagePayload);
      try {
        // Guarantee legacy key is cleared from localStorage so quota is never exceeded
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
      this.notify();
      if (!this.isCloudSyncing) {
        this.scheduleCloudPush(key, storagePayload);
      }
      return;
    }

    // Sanitize lessons to ensure no base64 images consume localStorage quota
    if (key === STORAGE_KEYS.LESSONS && Array.isArray(storagePayload)) {
      storagePayload = this.sanitizeLessonsForStorage(storagePayload as Lesson[]);
    }

    try {
      localStorage.setItem(key, JSON.stringify(storagePayload));
      this.notify();
      if (!this.isCloudSyncing) {
        this.scheduleCloudPush(key, storagePayload);
      }
    } catch (err) {
      console.warn(`localStorage quota warning on key ${key}, executing safe cleanup...`, err);
      try {
        // 1. Purge legacy base64 image keys from localStorage
        purgeLegacyLocalStorageImages();

        // 2. Prune non-critical caches to free up quota
        localStorage.removeItem(STORAGE_KEYS.VERSION_ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);

        // 3. Retry saving sanitized payload
        localStorage.setItem(key, JSON.stringify(storagePayload));
        this.notify();
        if (!this.isCloudSyncing) {
          this.scheduleCloudPush(key, storagePayload);
        }
      } catch (retryErr) {
        console.warn(`localStorage save failed for ${key}, operating safely via inMemoryStore fallback.`, retryErr);
        // Still notify listeners so in-memory UI updates instantly without crashing
        this.notify();
      }
    }
  }

  private scheduleCloudPush(key: string, data: any) {
    if (typeof window === 'undefined') return;
    try {
      if (key === STORAGE_KEYS.SCHOOL_SETTINGS) {
        saveCloudDoc('settings', 'school_settings', data).catch(() => {});
      } else if (key === STORAGE_KEYS.MISSIONS && Array.isArray(data)) {
        data.forEach((m: any) => {
          if (m && (m.id || m.code)) {
            const canonical = normalizeMissionId(m.id || m.code);
            saveCloudDoc('missions', canonical, {
              ...m,
              id: canonical,
              code: canonical,
              _updatedAt: new Date().toISOString(),
            }).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.LESSONS && Array.isArray(data)) {
        data.forEach((l: any) => {
          if (l && (l.id || l.code)) {
            const docId = String(l.id || l.code).replace(/[^a-zA-Z0-9_-]/g, '_');
            saveCloudDoc('lessons', docId, {
              ...l,
              id: l.id || l.code,
              _updatedAt: new Date().toISOString(),
            }).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.ACTIVITIES && Array.isArray(data)) {
        data.forEach((a: any) => {
          if (a && (a.id || a.code)) {
            const docId = String(a.id || a.code).replace(/[^a-zA-Z0-9_-]/g, '_');
            saveCloudDoc('activities', docId, { ...a, _updatedAt: new Date().toISOString() }).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.PRACTICE_QUESTIONS && Array.isArray(data)) {
        data.forEach((q: any) => {
          if (q && (q.id || q.code)) {
            const docId = String(q.id || q.code).replace(/[^a-zA-Z0-9_-]/g, '_');
            saveCloudDoc('practice_questions', docId, { ...q, _updatedAt: new Date().toISOString() }).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.BADGES && Array.isArray(data)) {
        data.forEach((b: any) => {
          if (b && b.id) {
            const docId = String(b.id).replace(/[^a-zA-Z0-9_-]/g, '_');
            saveCloudDoc('badges', docId, { ...b, _updatedAt: new Date().toISOString() }).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.REFLECTIONS && Array.isArray(data)) {
        data.forEach((r: any) => {
          if (r && (r.id || r.missionId)) {
            const docId = String(r.id || r.missionId).replace(/[^a-zA-Z0-9_-]/g, '_');
            saveCloudDoc('reflections', docId, { ...r, _updatedAt: new Date().toISOString() }).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.USERS && Array.isArray(data)) {
        data.forEach((u: any) => {
          if (u && u.id) saveCloudDoc('users', u.id, u).catch(() => {});
        });
      } else if (key === STORAGE_KEYS.STUDENT_PROGRESS && Array.isArray(data)) {
        data.forEach((p: any) => {
          if (p && p.studentId && p.missionId) {
            saveCloudDoc('student_progress', `${p.studentId}_${normalizeMissionId(p.missionId)}`, p).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.FINAL_MISSION_PROGRESS && Array.isArray(data)) {
        data.forEach((fmp: any) => {
          if (fmp && fmp.userId && fmp.classification) {
            saveCloudDoc('final_mission_progress', `${fmp.userId}_${fmp.classification}`, fmp).catch(() => {});
          }
        });
      } else if (key === STORAGE_KEYS.FINAL_MISSION_QUESTIONS && Array.isArray(data)) {
        this.pushFinalMissionQuestionsToCloud(data);
      } else if (key === STORAGE_KEYS.CLASSES && Array.isArray(data)) {
        data.forEach((c: any) => {
          if (c && c.id) saveCloudDoc('classes', c.id, c).catch(() => {});
        });
      } else if (key === STORAGE_KEYS.SCHOOLS && Array.isArray(data)) {
        data.forEach((s: any) => {
          if (s && s.id) saveCloudDoc('schools', s.id, s).catch(() => {});
        });
      }
    } catch (e) {
      console.warn('[Firebase Cloud Push Warning]', e);
    }
  }

  private initCloudSync() {
    if (typeof window === 'undefined') return;
    setTimeout(async () => {
      try {
        await initFirebaseAuth();

        // 0. Real-time listener for System Default Master (Cross-Device Default Misi Sync)
        try {
          const sysDefaultDocRef = doc(firestore, 'settings', 'system_default');
          onSnapshot(sysDefaultDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const cloudMaster = snapshot.data() as any;
              if (cloudMaster && cloudMaster.missions && Array.isArray(cloudMaster.missions) && cloudMaster.missions.length > 0) {
                const localMasterRaw = localStorage.getItem('jr_db_custom_default_master');
                const localMaster = localMasterRaw ? JSON.parse(localMasterRaw) : null;
                const cloudUpdated = cloudMaster.updatedAt || '';
                const localUpdated = localMaster?.updatedAt || '';

                if (!localMaster || cloudUpdated !== localUpdated) {
                  console.log('[Firebase] Detected newer System Default Master from Cloud, applying to system...');
                  localStorage.setItem('jr_db_custom_default_master', JSON.stringify(cloudMaster));

                  this.isCloudSyncing = true;
                  const sortedMissions = [...cloudMaster.missions].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                  this.setStorage(STORAGE_KEYS.MISSIONS, sortedMissions);
                  if (cloudMaster.lessons && Array.isArray(cloudMaster.lessons) && cloudMaster.lessons.length > 0) {
                    this.setStorage(STORAGE_KEYS.LESSONS, cloudMaster.lessons);
                  }
                  if (cloudMaster.activities && Array.isArray(cloudMaster.activities) && cloudMaster.activities.length > 0) {
                    this.setStorage(STORAGE_KEYS.ACTIVITIES, cloudMaster.activities);
                  }
                  if (cloudMaster.practiceQuestions && Array.isArray(cloudMaster.practiceQuestions) && cloudMaster.practiceQuestions.length > 0) {
                    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, cloudMaster.practiceQuestions);
                  }
                  if (cloudMaster.badges && Array.isArray(cloudMaster.badges) && cloudMaster.badges.length > 0) {
                    this.setStorage(STORAGE_KEYS.BADGES, cloudMaster.badges);
                  }
                  if (cloudMaster.reflections && Array.isArray(cloudMaster.reflections) && cloudMaster.reflections.length > 0) {
                    this.setStorage(STORAGE_KEYS.REFLECTIONS, cloudMaster.reflections);
                  }
                  this.isCloudSyncing = false;
                  this.notify();
                }
              }
            }
          }, (err) => {
            if (err?.code !== 'unavailable') {
              console.warn('[Firebase] System default master listener notice:', err?.message || err);
            }
          });
        } catch (sysErr: any) {
          if (sysErr?.code !== 'unavailable') {
            console.warn('[Firebase] Setup system_default listener notice:', sysErr);
          }
        }

        // 1. Real-time listener for School Settings
        try {
          const settingsDocRef = doc(firestore, 'settings', 'school_settings');
          onSnapshot(settingsDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const cloudSettings = snapshot.data() as SchoolSettings;
              const localRaw = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
              const localSettings = localRaw ? JSON.parse(localRaw) : null;
              if (cloudSettings && (!localSettings || cloudSettings.updatedAt !== localSettings.updatedAt)) {
                this.isCloudSyncing = true;
                localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(cloudSettings));
                this.isCloudSyncing = false;
                this.notify();
              }
            } else {
              // Seed settings to cloud if absent
              const current = this.getSchoolSettings();
              saveCloudDoc('settings', 'school_settings', current).catch(() => {});
            }
          }, (err) => {
            if (err?.code !== 'unavailable') {
              console.warn('[Firebase] Settings listener notice:', err?.message || err);
            }
          });
        } catch (settingsErr: any) {
          if (settingsErr?.code !== 'unavailable') {
            console.warn('[Firebase] Settings snapshot setup notice:', settingsErr?.message || settingsErr);
          }
        }

        // 2. Real-time listener for Missions (syncs changes and new covers across devices)
        try {
          const missionsCollRef = collection(firestore, 'missions');
          onSnapshot(missionsCollRef, (snapshot) => {
            if (!snapshot.empty) {
              const cloudMissions: Mission[] = [];
              snapshot.forEach((d) => {
                cloudMissions.push(d.data() as Mission);
              });
              if (cloudMissions.length > 0) {
                // Cloud missions is the authoritative source across devices!
                const sortedCloud = cloudMissions.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                this.isCloudSyncing = true;
                this.setStorage(STORAGE_KEYS.MISSIONS, sortedCloud);
                this.isCloudSyncing = false;
                this.notify();
              }
            } else {
              const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
              if (isInit) {
                const initialMissions = this.getStorage<Mission>(STORAGE_KEYS.MISSIONS, seedMissions);
                seedCloudIfEmpty('missions', initialMissions, 'id');
              }
            }
          }, (err) => {
            if (err?.code !== 'unavailable') {
              console.warn('[Firebase] Missions listener notice:', err?.message || err);
            }
          });
        } catch (mErr: any) {
          if (mErr?.code !== 'unavailable') {
            console.warn('[Firebase] Missions snapshot notice:', mErr);
          }
        }

        // 3. Real-time listener for Lessons (syncs lesson texts and images across devices)
        try {
          const lessonsCollRef = collection(firestore, 'lessons');
          onSnapshot(lessonsCollRef, (snapshot) => {
            if (!snapshot.empty) {
              const cloudLessons: Lesson[] = [];
              snapshot.forEach((d) => {
                cloudLessons.push(d.data() as Lesson);
              });
              if (cloudLessons.length > 0) {
                const localLessons = this.getStorage<Lesson>(STORAGE_KEYS.LESSONS, []);
                const lessonMap = new Map<string, Lesson>();
                localLessons.forEach((l) => lessonMap.set(l.id || l.code, l));
                cloudLessons.forEach((cl) => {
                  const key = cl.id || cl.code;
                  const existing = lessonMap.get(key);
                  lessonMap.set(key, existing ? { ...existing, ...cl } : cl);
                });
                this.isCloudSyncing = true;
                this.setStorage(STORAGE_KEYS.LESSONS, Array.from(lessonMap.values()));
                this.isCloudSyncing = false;
                this.notify();
              }
            } else {
              const initialLessons = this.getStorage<Lesson>(STORAGE_KEYS.LESSONS, seedLessons);
              seedCloudIfEmpty('lessons', initialLessons, 'id');
            }
          }, (err) => {
            if (err?.code !== 'unavailable') {
              console.warn('[Firebase] Lessons listener notice:', err?.message || err);
            }
          });
        } catch (lErr: any) {
          if (lErr?.code !== 'unavailable') {
            console.warn('[Firebase] Lessons snapshot notice:', lErr);
          }
        }

        // 4. Real-time listener for Uploaded Images (syncs uploaded pictures to local cache)
        try {
          const uploadedImagesCollRef = collection(firestore, 'uploaded_images');
          onSnapshot(uploadedImagesCollRef, (snapshot) => {
            if (!snapshot.empty) {
              snapshot.forEach((d) => {
                const img = d.data() as any;
                if (img && img.dataUrl) {
                  const id = img.id || d.id;
                  const aliases = [
                    img.url,
                    img.fileName,
                    img.lessonId,
                    img.missionId,
                    img.questionId,
                    img.questionId ? `fm_q_${img.questionId}` : '',
                    img.matrixItemId ? `fm_item_${img.matrixItemId}` : '',
                    img.matrixItemId && img.questionId ? `fm_item_${img.questionId}_${img.matrixItemId}` : '',
                  ].filter(Boolean);
                  saveImageToStore(id, img.dataUrl, aliases);
                }
              });
              this.notify();
            }
          }, (err) => {
            if (err?.code !== 'unavailable') {
              console.warn('[Firebase] Uploaded images listener notice:', err?.message || err);
            }
          });
        } catch (imgErr: any) {
          if (imgErr?.code !== 'unavailable') {
            console.warn('[Firebase] Uploaded images snapshot notice:', imgErr);
          }
        }

        // 4b. Real-time listener for Final Mission Master Questions & Images from Cloud
        try {
          const fmDocRef = doc(firestore, 'settings', 'final_mission_master');
          onSnapshot(fmDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const cloudMaster = snapshot.data() as any;
              if (cloudMaster && Array.isArray(cloudMaster.questions) && cloudMaster.questions.length > 0) {
                console.log(`[Firebase] Terdeteksi pembaruan Misi Akhir dari Cloud (${cloudMaster.questions.length} butir soal). Menyinkronkan cache lokal...`);
                this.isCloudSyncing = true;
                this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, cloudMaster.questions);
                this.isCloudSyncing = false;
                this.notify();
              }
            }
          }, (err) => {
            if (err?.code !== 'unavailable') {
              console.warn('[Firebase] Final mission master listener notice:', err?.message || err);
            }
          });
        } catch (fmErr: any) {
          if (fmErr?.code !== 'unavailable') {
            console.warn('[Firebase] Final mission master snapshot notice:', fmErr);
          }
        }

        // 5. Sync Users from Cloud
        const cloudUsers = await getCloudCollection<User>('users');
        if (cloudUsers && cloudUsers.length > 0) {
          const localUsers = this.getStorage<User>(STORAGE_KEYS.USERS, []);
          const userMap = new Map<string, User>();
          localUsers.forEach((u) => userMap.set(u.id, u));
          cloudUsers.forEach((cu) => {
            if (cu && cu.id) {
              const existing = userMap.get(cu.id);
              userMap.set(cu.id, existing ? { ...existing, ...cu } : cu);
            }
          });
          this.isCloudSyncing = true;
          this.setStorage(STORAGE_KEYS.USERS, Array.from(userMap.values()));
          this.isCloudSyncing = false;
        } else {
          // Cloud empty: seed initial users
          const initialUsers = this.getStorage<User>(STORAGE_KEYS.USERS, seedUsers);
          seedCloudIfEmpty('users', initialUsers, 'id');
        }

        // 6. Seed schools and classes to cloud if empty
        const schools = this.getStorage<School>(STORAGE_KEYS.SCHOOLS, seedSchools);
        seedCloudIfEmpty('schools', schools, 'id');

        const classes = this.getStorage<Class>(STORAGE_KEYS.CLASSES, seedClasses);
        seedCloudIfEmpty('classes', classes, 'id');
      } catch (err: any) {
        if (err?.code !== 'unavailable') {
          console.warn('[Firebase] Cloud sync background notice:', err?.message || err);
        }
      }
    }, 500);
  }

  public ensureInitialized() {
    // 1. Migrate and clear any legacy final mission questions from localStorage to eliminate quota errors
    try {
      const legacyFMQ = localStorage.getItem(STORAGE_KEYS.FINAL_MISSION_QUESTIONS);
      if (legacyFMQ) {
        try {
          const parsed = JSON.parse(legacyFMQ);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryStore.set(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, parsed);
            savePayloadToStore(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, parsed);
          }
        } catch {
          // ignore
        }
        localStorage.removeItem(STORAGE_KEYS.FINAL_MISSION_QUESTIONS);
      }
    } catch {
      // ignore
    }

    // 2. Preload questions from IndexedDB asynchronously into inMemoryStore
    getPayloadFromStore<FinalMissionQuestion[]>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS)
      .then((loaded) => {
        if (loaded && Array.isArray(loaded) && loaded.length > 0) {
          this.inMemoryStore.set(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, loaded);
          this.notify();
        } else {
          // Only seed if IndexedDB and in-memory store are genuinely empty
          const current = this.inMemoryStore.get(STORAGE_KEYS.FINAL_MISSION_QUESTIONS) as FinalMissionQuestion[] | undefined;
          if (!current || current.length === 0) {
            this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, JSON.parse(JSON.stringify(allSeedFinalMissionQuestions)));
          }
        }
      })
      .catch(() => {});

    // 2b. Check server disk for permanently saved Final Mission questions (multi-device & multi-account sync)
    if (typeof window !== 'undefined') {
      fetch('/api/final-mission-questions')
        .then((res) => (res.ok ? res.json() : null))
        .then((diskData) => {
          if (diskData && Array.isArray(diskData.questions) && diskData.questions.length > 0) {
            const current = this.inMemoryStore.get(STORAGE_KEYS.FINAL_MISSION_QUESTIONS) as FinalMissionQuestion[] | undefined;
            // Apply if currently empty, or if disk questions contain image references or are more up-to-date
            if (!current || current.length === 0 || diskData.questions.some((q: any) => q.imageUrl || q.imageFileName)) {
              this.isCloudSyncing = true;
              this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, diskData.questions);
              this.isCloudSyncing = false;
              this.notify();
            }
          }
        })
        .catch(() => {});
    }

    // 3. Purge any dummy simulation attempts or sample students from previous test sessions
    try {
      const storedAttempts = this.getStorage<FinalMissionAttempt>(STORAGE_KEYS.FINAL_MISSION_ATTEMPTS, []);
      if (storedAttempts && storedAttempts.length > 0) {
        const cleanedAttempts = storedAttempts.filter(
          (a) => !a.id?.startsWith('FMA_SAMPLE_') && !a.userId?.startsWith('USR-STU-')
        );
        if (cleanedAttempts.length !== storedAttempts.length) {
          this.setStorage(STORAGE_KEYS.FINAL_MISSION_ATTEMPTS, cleanedAttempts);
        }
      }
      const storedUsers = this.getStorage<User>(STORAGE_KEYS.USERS, []);
      if (storedUsers && storedUsers.length > 0) {
        const cleanedUsers = storedUsers.filter((u) => !u.id?.startsWith('USR-STU-'));
        if (cleanedUsers.length !== storedUsers.length) {
          this.setStorage(STORAGE_KEYS.USERS, cleanedUsers);
        }
      }
    } catch {
      // ignore
    }

    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const isCleanProductionReady = localStorage.getItem('jelajah_rupiah_clean_v1');

    if (!isInit) {
      this.isCloudSyncing = true;
      this.resetToCanonicalSeed();
      this.isCloudSyncing = false;
      localStorage.setItem('jelajah_rupiah_clean_v1', 'true');
    } else if (!isCleanProductionReady) {
      // Production cleanup: retain only superadmin (kepsek / dwija), clear dummy schools, classes, members, progress & tournaments
      this.setStorage(STORAGE_KEYS.USERS, seedUsers);
      this.setStorage(STORAGE_KEYS.SCHOOLS, seedSchools);
      this.setStorage(STORAGE_KEYS.CLASSES, seedClasses);
      this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, seedClassMembers);
      this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, seedStudentProgress);
      this.setStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, seedTournamentEvents);
      this.setStorage(STORAGE_KEYS.TOURNAMENT_PARTICIPANTS, seedTournamentParticipants);
      this.setStorage(STORAGE_KEYS.TOURNAMENT_RESULTS, seedTournamentResults);
      const current = this.getCurrentUser();
      if (current && current.username !== 'kepsek') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
      localStorage.setItem('jelajah_rupiah_clean_v1', 'true');
      this.migrateToCanonicalMissionIds();
    } else {
      this.migrateToCanonicalMissionIds();
      // Ensure superadmin exists in users
      const users = this.getStorage<User>(STORAGE_KEYS.USERS, []);
      if (!users.some((u) => u.username === 'kepsek')) {
        const sa = seedUsers.find((u) => u.username === 'kepsek');
        if (sa) {
          users.push(sa);
          this.setStorage(STORAGE_KEYS.USERS, users);
        }
      }
    }

    // Trigger asynchronous background Firebase synchronization
    this.initCloudSync();
  }

  /**
   * Migrate any existing localStorage records that still use legacy 'MIS-' format to canonical 'JR-' format
   * without deleting or resetting user-created/imported content.
   */
  public migrateToCanonicalMissionIds() {
    try {
      let changed = false;

      // Migrate Missions
      const missions = this.getStorage<Mission>(STORAGE_KEYS.MISSIONS, []);
      if (missions.length > 0) {
        missions.forEach((m) => {
          const canonical = normalizeMissionId(m.id || m.code);
          if (m.id !== canonical) {
            m.id = canonical;
            m.code = canonical;
            changed = true;
          }
        });
        if (changed) this.setStorage(STORAGE_KEYS.MISSIONS, missions);
      }

      // Migrate Lessons
      const lessons = this.getStorage<any>(STORAGE_KEYS.LESSONS, []);
      let lessonsChanged = false;
      lessons.forEach((l) => {
        const canonical = normalizeMissionId(l.missionId || l.mission_id);
        if (l.missionId !== canonical || l.mission_id !== canonical) {
          l.missionId = canonical;
          l.mission_id = canonical;
          lessonsChanged = true;
        }
        let studentText =
          l.student_text ??
          l.studentText ??
          l.text ??
          l.body ??
          l.content ??
          l.description ??
          l.uraian ??
          l.materi ??
          '';

        if (!studentText || studentText.trim() === '') {
          const order = Number(l.content_order ?? l.contentOrder ?? l.orderIndex ?? 1);
          const seedMatch = seedLessons.find(
            (s) =>
              s.id === l.id ||
              s.code === l.code ||
              (normalizeMissionId(s.missionId) === canonical &&
                (s.contentOrder === order || s.orderIndex === order))
          );
          if (seedMatch) {
            studentText = seedMatch.studentText || seedMatch.content || '';
          }
        }

        if (studentText && (l.student_text !== studentText || l.studentText !== studentText || l.content !== studentText)) {
          l.student_text = studentText;
          l.studentText = studentText;
          l.content = studentText;
          lessonsChanged = true;
        }

        let interactionPrompt =
          l.interaction_prompt ??
          l.interactionPrompt ??
          l.prompt_interaksi ??
          l.ayo_berpikir ??
          '';

        if (!interactionPrompt || interactionPrompt.trim() === '') {
          const order = Number(l.content_order ?? l.contentOrder ?? l.orderIndex ?? 1);
          const seedMatch = seedLessons.find(
            (s) =>
              s.id === l.id ||
              s.code === l.code ||
              (normalizeMissionId(s.missionId) === canonical &&
                (s.contentOrder === order || s.orderIndex === order))
          );
          if (seedMatch && seedMatch.interactionPrompt) {
            interactionPrompt = seedMatch.interactionPrompt;
          }
        }

        if (interactionPrompt && (l.interaction_prompt !== interactionPrompt || l.interactionPrompt !== interactionPrompt)) {
          l.interaction_prompt = interactionPrompt;
          l.interactionPrompt = interactionPrompt;
          lessonsChanged = true;
        }
      });

      // Deduplicate stored lessons
      const uniqueLessonMap = new Map<string, any>();
      lessons.forEach((l) => {
        const canonical = normalizeMissionId(l.missionId || l.mission_id);
        const order = Number(l.content_order ?? l.contentOrder ?? l.orderIndex ?? 1);
        const key = `${canonical}_${order}`;
        const existing = uniqueLessonMap.get(key);
        if (!existing) {
          uniqueLessonMap.set(key, l);
        } else {
          lessonsChanged = true;
          const currentImg = l.imageUrl || l.image_url;
          if (currentImg && !existing.imageUrl && !existing.image_url) {
            existing.imageUrl = currentImg;
            existing.image_url = currentImg;
          }
          if (l.id && l.id.startsWith('MAT-') && existing.id && !existing.id.startsWith('MAT-')) {
            uniqueLessonMap.set(key, { ...l, imageUrl: existing.imageUrl || l.imageUrl });
          }
        }
      });
      const cleanedLessons = Array.from(uniqueLessonMap.values());

      if (lessonsChanged || cleanedLessons.length !== lessons.length) {
        this.setStorage(STORAGE_KEYS.LESSONS, cleanedLessons);
      }

      // Migrate Activities
      const activities = this.getStorage<Activity>(STORAGE_KEYS.ACTIVITIES, []);
      let actChanged = false;
      activities.forEach((a) => {
        const canonical = normalizeMissionId(a.missionId);
        if (a.missionId !== canonical) {
          a.missionId = canonical;
          actChanged = true;
        }
      });
      if (actChanged) this.setStorage(STORAGE_KEYS.ACTIVITIES, activities);

      // Migrate Practice Questions
      const questions = this.getStorage<PracticeQuestion>(STORAGE_KEYS.PRACTICE_QUESTIONS, []);
      let qChanged = false;
      questions.forEach((q) => {
        const canonical = normalizeMissionId(q.missionId);
        if (q.missionId !== canonical) {
          q.missionId = canonical;
          q.tags = (q.tags || []).map((t) => (t.startsWith('MIS-') ? normalizeMissionId(t) : t));
          qChanged = true;
        }
      });
      if (qChanged) this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, questions);

      // Migrate Badges
      const badges = this.getStorage<Badge>(STORAGE_KEYS.BADGES, []);
      let badgeChanged = false;
      badges.forEach((b) => {
        const canonical = normalizeMissionId(b.missionId);
        if (b.missionId !== canonical) {
          b.missionId = canonical;
          badgeChanged = true;
        }
      });
      if (badgeChanged) this.setStorage(STORAGE_KEYS.BADGES, badges);

      // Migrate Reflections
      const reflections = this.getStorage<Reflection>(STORAGE_KEYS.REFLECTIONS, []);
      let refChanged = false;
      reflections.forEach((r) => {
        const canonical = normalizeMissionId(r.missionId);
        if (r.missionId !== canonical) {
          r.missionId = canonical;
          refChanged = true;
        }
      });
      if (refChanged) this.setStorage(STORAGE_KEYS.REFLECTIONS, reflections);

      // Migrate Student Progress
      const progressList = this.getStorage<StudentProgress>(STORAGE_KEYS.STUDENT_PROGRESS, []);
      let progChanged = false;
      progressList.forEach((p) => {
        const canonical = normalizeMissionId(p.missionId);
        if (p.missionId !== canonical) {
          p.missionId = canonical;
          progChanged = true;
        }
      });

      if (progChanged) this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, progressList);
    } catch (e) {
      console.warn('Migration to canonical mission IDs encountered warning:', e);
    }
  }

  public resetToCanonicalSeed() {
    let activeMissions = seedMissions;
    let activeLessons = seedLessons;
    let activeActivities = seedActivities;
    let activePractice = seedPracticeQuestions;
    let activeBadges = seedBadges;
    let activeReflections = seedReflections;
    let activeReferences = seedReferences;
    let activeTournamentPackages = seedTournamentPackages;
    let activeTournamentQuestions = seedTournamentQuestions;

    try {
      const savedMasterRaw = localStorage.getItem('jr_db_custom_default_master');
      if (savedMasterRaw) {
        const parsed = JSON.parse(savedMasterRaw);
        if (Array.isArray(parsed.missions) && parsed.missions.length > 0) activeMissions = parsed.missions;
        if (Array.isArray(parsed.lessons) && parsed.lessons.length > 0) activeLessons = parsed.lessons;
        if (Array.isArray(parsed.activities) && parsed.activities.length > 0) activeActivities = parsed.activities;
        if (Array.isArray(parsed.practiceQuestions) && parsed.practiceQuestions.length > 0) activePractice = parsed.practiceQuestions;
        if (Array.isArray(parsed.badges) && parsed.badges.length > 0) activeBadges = parsed.badges;
        if (Array.isArray(parsed.reflections) && parsed.reflections.length > 0) activeReflections = parsed.reflections;
        if (Array.isArray(parsed.references) && parsed.references.length > 0) activeReferences = parsed.references;
        if (Array.isArray(parsed.tournamentPackages) && parsed.tournamentPackages.length > 0) activeTournamentPackages = parsed.tournamentPackages;
        if (Array.isArray(parsed.tournamentQuestions) && parsed.tournamentQuestions.length > 0) activeTournamentQuestions = parsed.tournamentQuestions;
      }
    } catch {
      // fallback smoothly to seed constants
    }

    this.setStorage(STORAGE_KEYS.WORLDS, seedWorlds);
    this.setStorage(STORAGE_KEYS.MISSIONS, activeMissions);
    this.setStorage(STORAGE_KEYS.LESSONS, activeLessons);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, activeActivities);
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, activePractice);
    this.setStorage(STORAGE_KEYS.BADGES, activeBadges);
    this.setStorage(STORAGE_KEYS.REFLECTIONS, activeReflections);
    this.setStorage(STORAGE_KEYS.REFERENCES, activeReferences);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_PACKAGES, activeTournamentPackages);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, activeTournamentQuestions);
    this.setStorage(STORAGE_KEYS.USERS, seedUsers);
    this.setStorage(STORAGE_KEYS.SCHOOLS, seedSchools);
    this.setStorage(STORAGE_KEYS.CLASSES, seedClasses);
    this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, seedClassMembers);
    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, seedStudentProgress);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, seedTournamentEvents);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_PARTICIPANTS, seedTournamentParticipants);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_RESULTS, seedTournamentResults);
    this.setStorage(STORAGE_KEYS.AUDIT_LOGS, seedAuditLogs);
    this.setStorage(STORAGE_KEYS.WORKFLOW_LOGS, seedWorkflowLogs);
    this.setStorage(STORAGE_KEYS.VERSION_ENTRIES, seedVersionHistory);
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, JSON.parse(JSON.stringify(allSeedFinalMissionQuestions)));
    this.setStorage(STORAGE_KEYS.CONTENT_VERSIONS, [
      {
        id: 'VER-001',
        versionNumber: '1.0.0',
        title: 'Master Jelajah Rupiah Standar Bank Indonesia',
        description: '9 Misi, 24 Materi, 18 Aktivitas, 110 Soal Latihan, 9 Lencana, 9 Refleksi, 3 Paket Turnamen, 60 Soal Turnamen',
        importedAt: new Date().toISOString(),
        importedBy: 'Admin Kurikulum BI',
        status: 'published',
      },
    ]);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    this.notify();
  }

  /**
   * Reset student test/demo progress while keeping Content Master (Curriculum, Lessons, Questions) completely intact.
   * Useful when starting a new school pilot class.
   */
  public resetStudentProgressOnly() {
    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, seedStudentProgress);
    this.setStorage(STORAGE_KEYS.PRACTICE_ATTEMPTS, []);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_PARTICIPANTS, seedTournamentParticipants);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_RESULTS, seedTournamentResults);
    // Reset points & XP on default student user
    const users = this.getUsers();
    const updatedUsers = users.map((u) => {
      if (u.role === 'student') {
        return {
          ...u,
          points: 100,
          currentXp: 50,
          level: 1,
          streakDays: 1,
        };
      }
      return u;
    });
    this.setStorage(STORAGE_KEYS.USERS, updatedUsers);
    this.notify();
  }

  // --- GETTERS ---
  public getWorkflowLogs(): WorkflowReviewLog[] {
    return this.getStorage(STORAGE_KEYS.WORKFLOW_LOGS, seedWorkflowLogs);
  }

  public getVersionEntries(entityId?: string): ContentVersionEntry[] {
    const list = this.getStorage<ContentVersionEntry>(STORAGE_KEYS.VERSION_ENTRIES, seedVersionHistory);
    if (!entityId) return list;
    return list.filter((v) => v.entityId === entityId);
  }

  public getWorlds(): World[] {
    return this.getStorage(STORAGE_KEYS.WORLDS, seedWorlds);
  }

  public getMissions(): Mission[] {
    const list = this.getStorage<Mission>(STORAGE_KEYS.MISSIONS, seedMissions);
    if (!list || list.length === 0) {
      return [];
    }

    const deduplicatedMap = new Map<string, Mission>();
    const rawLessons = this.getStorage<any>(STORAGE_KEYS.LESSONS, []);

    list.forEach((m) => {
      const canonical = normalizeMissionId(m.id || m.code);
      const storedImage = getImageFromStore([canonical, `cbr_img_${canonical}`, m.code, m.id]);
      const explicitImage = (m.imageUrl || (m as any).openingImageUrl || '').trim();
      let imageUrl = normalizeImageUrl(explicitImage !== '' ? explicitImage : storedImage);

      // Fallback: If mission cover image is empty, borrow the cover from its first lesson
      if (!imageUrl && rawLessons && rawLessons.length > 0) {
        const matchingLesson = rawLessons.find(
          (l: any) =>
            normalizeMissionId(l.mission_id || l.missionId) === canonical &&
            (l.image_url || l.imageUrl)
        );
        if (matchingLesson) {
          imageUrl = normalizeImageUrl(matchingLesson.image_url || matchingLesson.imageUrl);
        }
      }

      if (!deduplicatedMap.has(canonical)) {
        deduplicatedMap.set(canonical, {
          ...m,
          id: canonical,
          code: canonical,
          imageUrl,
          orderIndex: m.orderIndex || m.levelNumber || 1,
          levelNumber: m.levelNumber || m.orderIndex || 1,
        });
      } else {
        const existing = deduplicatedMap.get(canonical)!;
        deduplicatedMap.set(canonical, {
          ...existing,
          ...m,
          id: existing.id,
          code: existing.code,
          imageUrl: imageUrl || existing.imageUrl,
          orderIndex: m.orderIndex || existing.orderIndex,
          levelNumber: m.levelNumber || existing.levelNumber,
        });
      }
    });

    return Array.from(deduplicatedMap.values()).sort(
      (a, b) => (a.orderIndex || a.levelNumber || 1) - (b.orderIndex || b.levelNumber || 1)
    );
  }

  public getLessons(): Lesson[] {
    const list = this.getStorage<any>(STORAGE_KEYS.LESSONS, seedLessons);
    if (!list || list.length === 0) {
      return [];
    }
    const mapped = list.map((l) => {
      const contentOrder = Number(l.content_order ?? l.contentOrder ?? l.orderIndex ?? l.order ?? 1);
      const missionId = normalizeMissionId(l.mission_id ?? l.missionId);
      const id = l.content_id ?? l.id ?? l.code ?? `MAT-${String(contentOrder).padStart(3, '0')}`;

      let studentText =
        l.student_text ??
        l.studentText ??
        l.text ??
        l.body ??
        l.content ??
        l.description ??
        l.uraian ??
        l.materi ??
        '';

      let interactionPrompt =
        l.interaction_prompt ??
        l.interactionPrompt ??
        l.prompt_interaksi ??
        l.ayo_berpikir ??
        l.keyTakeaway ??
        '';

      let imageBrief = l.image_brief ?? l.imageBrief ?? l.imageCaption ?? l.caption ?? '';

      // Fallback to seedLessons if studentText is empty
      if (!studentText || studentText.trim() === '') {
        const seedMatch = seedLessons.find(
          (s) =>
            s.id === id ||
            s.code === l.code ||
            (normalizeMissionId(s.missionId) === missionId &&
              (s.contentOrder === contentOrder || s.orderIndex === contentOrder))
        );
        if (seedMatch) {
          studentText = seedMatch.studentText || seedMatch.content || '';
          if (!interactionPrompt || interactionPrompt.trim() === '') {
            interactionPrompt = seedMatch.interactionPrompt || '';
          }
          if (!imageBrief || imageBrief.trim() === '') {
            imageBrief = seedMatch.imageBrief || seedMatch.imageCaption || '';
          }
        }
      }

      const missionIdNorm = normalizeMissionId(l.mission_id ?? l.missionId);
      const keys = buildLessonImageKeys(id, missionIdNorm, contentOrder, l.code);
      const storedImage = getImageFromStore(keys);
      const explicitImage = (l.image_url ?? l.imageUrl ?? '').trim();
      const imageUrl = explicitImage !== '' ? explicitImage : storedImage;

      return {
        ...l,
        id,
        content_id: id,
        missionId,
        mission_id: missionId,
        code: l.code ?? id,
        title: l.title ?? l.judul ?? 'Materi Pembelajaran',
        summary: l.summary ?? l.ringkasan ?? '',
        studentText,
        student_text: studentText,
        content: studentText,
        text: studentText,
        body: studentText,
        interactionPrompt,
        interaction_prompt: interactionPrompt,
        imageUrl,
        image_url: imageUrl,
        imageBrief,
        image_brief: imageBrief,
        imageCaption: imageBrief,
        contentOrder,
        content_order: contentOrder,
        orderIndex: contentOrder,
        status: l.status ?? 'published',
      } as Lesson;
    });

    // Deduplicate by composite key: missionId + contentOrder OR normalized title
    const uniqueMap = new Map<string, Lesson>();
    for (const item of mapped) {
      const key = `${item.missionId}_${item.contentOrder}`;
      const existing = uniqueMap.get(key);
      if (!existing) {
        uniqueMap.set(key, item);
      } else {
        // If one has an uploaded image and the other does not, preserve the image!
        const existingImage = existing.imageUrl || (existing as any).image_url || '';
        const currentImage = item.imageUrl || (item as any).image_url || '';
        if (!existingImage && currentImage) {
          existing.imageUrl = currentImage;
          (existing as any).image_url = currentImage;
        }
        // Prefer item with canonical MAT- ID if existing is legacy LES-
        if (item.id.startsWith('MAT-') && !existing.id.startsWith('MAT-')) {
          uniqueMap.set(key, { ...item, imageUrl: existing.imageUrl || item.imageUrl });
        }
      }
    }

    return Array.from(uniqueMap.values());
  }

  public getActivities(): Activity[] {
    return this.getStorage(STORAGE_KEYS.ACTIVITIES, seedActivities);
  }

  public getPracticeQuestions(): PracticeQuestion[] {
    return this.getStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, seedPracticeQuestions);
  }

  public getBadges(): Badge[] {
    return this.getStorage(STORAGE_KEYS.BADGES, seedBadges);
  }

  public getReflections(): Reflection[] {
    return this.getStorage(STORAGE_KEYS.REFLECTIONS, seedReflections);
  }

  public getReferences(): Reference[] {
    return this.getStorage(STORAGE_KEYS.REFERENCES, seedReferences);
  }

  public getTournamentPackages(): TournamentPackage[] {
    return this.getStorage(STORAGE_KEYS.TOURNAMENT_PACKAGES, seedTournamentPackages);
  }

  public getTournamentQuestions(): TournamentQuestion[] {
    return this.getStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, seedTournamentQuestions);
  }

  // ==========================================
  // SCHOOLS MANAGEMENT (Super Admin Scope)
  // ==========================================
  public getSchools(): School[] {
    return this.getStorage(STORAGE_KEYS.SCHOOLS, seedSchools);
  }

  public getSchoolById(id: string): School | undefined {
    return this.getSchools().find((s) => s.id === id);
  }

  public addSchool(
    schoolData: Partial<School>,
    createAdminAccount: boolean = true
  ): { school: School; adminUser?: User } {
    const schools = this.getSchools();
    const newId = schoolData.id || `SCH-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
    const code = schoolData.code || `SCH-${Math.floor(100 + Math.random() * 900)}`;
    const schoolName = (schoolData.name || 'Sekolah Baru').trim();

    let adminUser: User | undefined;

    if (createAdminAccount) {
      const adminUsername = schoolData.adminUsername?.trim() || generateMemorableUsername('admin', schoolName, schoolData.principalName || 'admin');
      const adminPassword = generateMemorablePassword();
      const adminId = `USR-ADM-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;

      adminUser = {
        id: adminId,
        name: schoolData.adminName?.trim() || schoolData.principalName?.trim() || `Admin ${schoolName}`,
        username: adminUsername,
        password: adminPassword,
        role: 'admin',
        school: schoolName,
        schoolId: newId,
        levelTitle: 'Kepala Sekolah & Admin Sekolah',
        points: 0,
        level: 1,
        currentXp: 0,
        maxXp: 100,
        avatar: 'kepsek',
        streakDays: 1,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      const users = this.getUsers();
      users.push(adminUser);
      this.setStorage(STORAGE_KEYS.USERS, users);
    }

    const newSchool: School = {
      id: newId,
      code,
      name: schoolName,
      npsn: schoolData.npsn?.trim() || '',
      address: schoolData.address?.trim() || '',
      principalName: schoolData.principalName?.trim() || '',
      logo: schoolData.logo || '',
      phone: schoolData.phone?.trim() || '',
      email: schoolData.email?.trim() || '',
      adminId: adminUser?.id || schoolData.adminId,
      adminName: adminUser?.name || schoolData.adminName || schoolData.principalName,
      adminUsername: adminUser?.username || schoolData.adminUsername,
      createdAt: new Date().toISOString(),
    };

    schools.push(newSchool);
    this.setStorage(STORAGE_KEYS.SCHOOLS, schools);
    this.notify();

    return { school: newSchool, adminUser };
  }

  public updateSchool(id: string, updates: Partial<School>): School | undefined {
    const schools = this.getSchools();
    const idx = schools.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;

    const oldSchoolName = schools[idx].name;
    const updated = { ...schools[idx], ...updates };
    schools[idx] = updated;
    this.setStorage(STORAGE_KEYS.SCHOOLS, schools);

    // If school name changed, update associated users & classes
    if (updates.name && updates.name !== oldSchoolName) {
      const users = this.getUsers();
      let usersChanged = false;
      users.forEach((u) => {
        if (u.schoolId === id || u.school === oldSchoolName) {
          u.school = updates.name;
          usersChanged = true;
        }
      });
      if (usersChanged) this.setStorage(STORAGE_KEYS.USERS, users);

      const classes = this.getClasses();
      let classesChanged = false;
      classes.forEach((c) => {
        if (c.school === oldSchoolName) {
          c.school = updates.name!;
          classesChanged = true;
        }
      });
      if (classesChanged) this.setStorage(STORAGE_KEYS.CLASSES, classes);
    }

    this.notify();
    return updated;
  }

  public deleteSchool(id: string): boolean {
    const schools = this.getSchools();
    const filtered = schools.filter((s) => s.id !== id);
    if (filtered.length === schools.length) return false;

    this.setStorage(STORAGE_KEYS.SCHOOLS, filtered);
    this.notify();
    return true;
  }

  public bulkImportSchools(
    schoolsList: Array<{
      name: string;
      code?: string;
      npsn?: string;
      address?: string;
      principalName?: string;
      phone?: string;
      email?: string;
      adminName?: string;
      adminUsername?: string;
      adminPassword?: string;
    }>
  ): { total: number; added: number; updated: number; skipped: number; errors: string[] } {
    const result = {
      total: schoolsList.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const currentSchools = this.getSchools();

    schoolsList.forEach((row, idx) => {
      const cleanName = (row.name || '').trim();
      if (!cleanName) {
        result.skipped++;
        result.errors.push(`Baris ${idx + 1}: Nama sekolah kosong.`);
        return;
      }

      const cleanNpsn = (row.npsn || '').toString().trim();
      const existing = currentSchools.find(
        (s) => (cleanNpsn && s.npsn === cleanNpsn) || s.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existing) {
        this.updateSchool(existing.id, {
          name: cleanName,
          npsn: cleanNpsn || existing.npsn,
          address: (row.address || '').trim() || existing.address,
          principalName: (row.principalName || '').trim() || existing.principalName,
          phone: (row.phone || '').trim() || existing.phone,
          email: (row.email || '').trim() || existing.email,
        });
        result.updated++;
      } else {
        const addRes = this.addSchool(
          {
            name: cleanName,
            code: (row.code || '').trim() || `SCH-${Math.floor(100 + Math.random() * 900)}`,
            npsn: cleanNpsn,
            address: (row.address || '').trim(),
            principalName: (row.principalName || '').trim(),
            phone: (row.phone || '').trim(),
            email: (row.email || '').trim(),
            adminName: (row.adminName || '').trim(),
            adminUsername: (row.adminUsername || '').trim(),
          },
          true
        );
        if (addRes.adminUser && row.adminPassword) {
          this.updateUser(addRes.adminUser.id, { password: row.adminPassword.trim() });
        }
        result.added++;
      }
    });

    this.notify();
    return result;
  }

  // ==========================================
  // USERS MANAGEMENT (Multi-Tenant RBAC)
  // ==========================================
  public getUsers(schoolFilter?: string): User[] {
    const allUsers = this.getStorage(STORAGE_KEYS.USERS, seedUsers);
    if (!schoolFilter || schoolFilter === 'all') {
      return allUsers;
    }
    return allUsers.filter(
      (u) => u.schoolId === schoolFilter || (u.school && u.school.toLowerCase() === schoolFilter.toLowerCase())
    );
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public getUsersByRole(role: string, schoolFilter?: string): User[] {
    return this.getUsers(schoolFilter).filter((u) => u.role === role);
  }

  public validateUserUniqueness(
    userId: string | null,
    candidate: { username?: string; nisn?: string; nip?: string; email?: string }
  ): { valid: boolean; field?: string; message?: string } {
    const users = this.getUsers();
    const cleanUsername = (candidate.username || '').trim().toLowerCase();
    const cleanNisn = (candidate.nisn || '').trim();
    const cleanNip = (candidate.nip || '').trim();
    const cleanEmail = (candidate.email || '').trim().toLowerCase();

    for (const u of users) {
      if (userId && u.id === userId) continue;

      if (cleanUsername && (u.username || '').toLowerCase() === cleanUsername) {
        return {
          valid: false,
          field: 'username',
          message: `Username "${candidate.username}" sudah digunakan oleh akun "${u.name}". Harap gunakan username lain agar tidak terjadi salah login.`,
        };
      }
      if (cleanNisn && u.nisn && u.nisn.trim() === cleanNisn) {
        return {
          valid: false,
          field: 'nisn',
          message: `NISN "${cleanNisn}" sudah terdaftar untuk siswa "${u.name}".`,
        };
      }
      if (cleanNip && u.nip && u.nip.trim() === cleanNip) {
        return {
          valid: false,
          field: 'nip',
          message: `NIP "${cleanNip}" sudah terdaftar untuk "${u.name}".`,
        };
      }
      if (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail) {
        return {
          valid: false,
          field: 'email',
          message: `Email "${cleanEmail}" sudah digunakan oleh akun "${u.name}".`,
        };
      }
    }

    return { valid: true };
  }

  public addUser(userData: Partial<User>): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const cleanUsername = (userData.username || '').trim().toLowerCase();
    const cleanNisn = (userData.nisn || '').trim();
    const cleanNip = (userData.nip || '').trim();
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    // Check unique constraints
    const validation = this.validateUserUniqueness(null, {
      username: cleanUsername,
      nisn: cleanNisn,
      nip: cleanNip,
      email: cleanEmail,
    });

    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const role = userData.role || 'student';
    const institutionName = userData.institution?.trim() || userData.school?.trim() || (role === 'superadmin' ? 'Bank Indonesia & Pengawas' : this.getSchoolSettings().schoolName);
    const schoolName = userData.school || institutionName;
    const name = userData.name?.trim() || 'Pengguna Baru';

    const generatedUsername = cleanUsername || generateMemorableUsername(role, institutionName, name, users);
    const generatedPassword = userData.password?.trim() || generateMemorablePassword();
    const newUserId = userData.id || `USR-${role.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;

    const newUser: User = {
      id: newUserId,
      name,
      username: generatedUsername,
      password: generatedPassword,
      email: cleanEmail || undefined,
      nisn: cleanNisn || (role === 'student' ? `00${Math.floor(10000000 + Math.random() * 90000000)}` : undefined),
      nip: cleanNip || (role === 'teacher' || role === 'admin' || role === 'reviewer' ? `19${Math.floor(100000000000 + Math.random() * 900000000000)}` : undefined),
      gender: userData.gender || 'male',
      role,
      grade: userData.grade || (role === 'student' ? 'Kelas 5' : undefined),
      ageCategory: userData.ageCategory || (role === 'student' ? 'anak' : 'dewasa'),
      school: schoolName,
      schoolId: userData.schoolId,
      institution: userData.institution || institutionName,
      phone: userData.phone,
      points: userData.points ?? (role === 'superadmin' ? 0 : 0),
      level: userData.level ?? 1,
      levelTitle: userData.levelTitle || (role === 'student' ? 'Pelajar Rupiah' : role === 'teacher' ? 'Guru Pembina Literasi' : role === 'superadmin' ? 'Super Administrator' : role === 'reviewer' ? 'Pengawas / Peninjau Instansi' : 'Administrator Sekolah'),
      currentXp: userData.currentXp ?? 0,
      maxXp: userData.maxXp ?? 100,
      avatar: userData.avatar || (role === 'student' ? (userData.gender === 'female' ? 'perempuan' : 'laki-laki') : role === 'teacher' ? 'teacher_dewi' : role === 'superadmin' ? 'superadmin' : 'admin'),
      streakDays: 1,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    users.push(newUser);
    this.setStorage(STORAGE_KEYS.USERS, users);
    saveCloudDoc('users', newUser.id, newUser).catch(() => {});
    this.notify();

    return { success: true, user: newUser, message: 'Pengguna berhasil dibuat.' };
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return undefined;

    // Check unique constraints if fields are being updated
    if (updates.username || updates.nisn || updates.nip || updates.email) {
      const validation = this.validateUserUniqueness(userId, {
        username: updates.username,
        nisn: updates.nisn,
        nip: updates.nip,
        email: updates.email,
      });
      if (!validation.valid) {
        console.warn('Update user uniqueness validation failed:', validation.message);
        // Do not update conflicting fields
        if (validation.field === 'username') delete updates.username;
        if (validation.field === 'nisn') delete updates.nisn;
        if (validation.field === 'nip') delete updates.nip;
        if (validation.field === 'email') delete updates.email;
      }
    }

    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    this.setStorage(STORAGE_KEYS.USERS, users);
    saveCloudDoc('users', updated.id, updated).catch(() => {});

    // If current logged-in user was updated, keep session refreshed
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    }

    this.notify();
    return updated;
  }

  public deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target && (target.username === 'kepsek' || target.role === 'superadmin')) {
      console.warn('Superadmin user kepsek cannot be deleted.');
      return false;
    }
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) return false;

    this.setStorage(STORAGE_KEYS.USERS, filtered);
    deleteCloudDoc('users', userId).catch(() => {});

    // Remove memberships
    const members = this.getClassMembers().filter((m) => m.userId !== userId);
    this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, members);

    this.notify();
    return true;
  }

  public resetUserPassword(userId: string, customPassword?: string): { success: boolean; newPassword?: string } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx < 0) return { success: false };

    const newPass = customPassword?.trim() || generateMemorablePassword();
    users[idx].password = newPass;
    this.setStorage(STORAGE_KEYS.USERS, users);
    saveCloudDoc('users', users[idx].id, users[idx]).catch(() => {});

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[idx]));
    }

    this.notify();
    return { success: true, newPassword: newPass };
  }

  public bulkImportUsers(
    userList: Array<{
      name: string;
      role?: 'student' | 'teacher' | 'admin' | string;
      username?: string;
      password?: string;
      nisn?: string;
      nip?: string;
      gender?: string;
      grade?: string;
      school?: string;
      phone?: string;
      email?: string;
      className?: string;
      ageCategory?: string;
    }>,
    defaultSchool?: string,
    defaultRole: string = 'student'
  ): { total: number; added: number; updated: number; skipped: number; errors: string[] } {
    const result = {
      total: userList.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const schoolSettings = this.getSchoolSettings();
    const classes = this.getClasses();

    userList.forEach((row, idx) => {
      const cleanName = (row.name || '').trim();
      if (!cleanName) {
        result.skipped++;
        result.errors.push(`Baris ${idx + 1}: Nama pengguna kosong.`);
        return;
      }

      const role = (row.role || defaultRole).toLowerCase() as any;
      const cleanSchool = (row.school || defaultSchool || schoolSettings.schoolName).trim();
      const cleanUsername = (row.username || '').trim().toLowerCase();
      const cleanNisn = (row.nisn || '').toString().trim();
      const cleanNip = (row.nip || '').toString().trim();
      const rawGender = (row.gender || '').toLowerCase();
      let parsedGender: 'male' | 'female' = 'male';
      if (rawGender.includes('p') || rawGender.includes('wanita') || rawGender.includes('female') || rawGender.includes('perempuan')) {
        parsedGender = 'female';
      }

      let parsedAgeCategory: FinalMissionClassification | undefined;
      const rawAge = (row.ageCategory || '').toLowerCase();
      if (rawAge.includes('dewasa') || rawAge.includes('31') || rawAge.includes('55')) {
        parsedAgeCategory = 'dewasa';
      } else if (rawAge.includes('remaja') || rawAge.includes('18') || rawAge.includes('30')) {
        parsedAgeCategory = 'remaja';
      } else if (rawAge.includes('anak') || rawAge.includes('10') || rawAge.includes('17')) {
        parsedAgeCategory = 'anak';
      }

      const users = this.getUsers();
      // Match existing by username, nisn, nip, or (name + school)
      const existingUser = users.find((u) => {
        if (cleanUsername && (u.username || '').toLowerCase() === cleanUsername) return true;
        if (cleanNisn && u.nisn === cleanNisn) return true;
        if (cleanNip && u.nip === cleanNip) return true;
        if (u.name.toLowerCase() === cleanName.toLowerCase() && u.school?.toLowerCase() === cleanSchool.toLowerCase()) return true;
        return false;
      });

      if (existingUser) {
        this.updateUser(existingUser.id, {
          name: cleanName,
          gender: parsedGender,
          role: (role === 'admin' || role === 'teacher' || role === 'student') ? role : existingUser.role,
          grade: row.grade || existingUser.grade,
          ageCategory: parsedAgeCategory || existingUser.ageCategory,
          school: cleanSchool || existingUser.school,
          password: (row.password || '').toString().trim() || existingUser.password || generateMemorablePassword(),
          phone: row.phone || existingUser.phone,
          email: row.email || existingUser.email,
        });

        // If class specified for student
        if (row.className && existingUser.role === 'student') {
          const targetClass = classes.find(
            (c) => c.name.toLowerCase() === row.className!.trim().toLowerCase() || c.code.toLowerCase() === row.className!.trim().toLowerCase()
          );
          if (targetClass) {
            this.addStudentToClass(existingUser.id, targetClass.id);
          }
        }
        result.updated++;
      } else {
        const addRes = this.addUser({
          name: cleanName,
          role: (role === 'admin' || role === 'teacher' || role === 'student') ? role : 'student',
          username: cleanUsername || generateMemorableUsername(role, cleanSchool, cleanName),
          password: (row.password || '').toString().trim() || generateMemorablePassword(),
          nisn: cleanNisn || (role === 'student' ? `00${Math.floor(10000000 + Math.random() * 90000000)}` : undefined),
          nip: cleanNip || (role === 'teacher' || role === 'admin' ? `19${Math.floor(100000000000 + Math.random() * 900000000000)}` : undefined),
          gender: parsedGender,
          grade: row.grade || (role === 'student' ? 'Kelas 5' : undefined),
          ageCategory: parsedAgeCategory || (role === 'student' ? 'anak' : 'dewasa'),
          school: cleanSchool,
          phone: row.phone,
          email: row.email,
        });

        if (addRes.success && addRes.user) {
          if (row.className && addRes.user.role === 'student') {
            const targetClass = classes.find(
              (c) => c.name.toLowerCase() === row.className!.trim().toLowerCase() || c.code.toLowerCase() === row.className!.trim().toLowerCase()
            );
            if (targetClass) {
              this.addStudentToClass(addRes.user.id, targetClass.id);
            }
          }
          result.added++;
        } else {
          result.skipped++;
          result.errors.push(`Baris ${idx + 1} (${cleanName}): ${addRes.message || 'Gagal menambahkan'}`);
        }
      }
    });

    this.notify();
    return result;
  }

  public isCurrentGuest(): boolean {
    if (this.inMemoryGuestSession) return true;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed.isGuest === true || parsed.id === 'USR-GUEST';
    } catch {
      return false;
    }
  }

  public setGuestSession(): User {
    const guestUser: User = {
      ...GUEST_USER,
      createdAt: new Date().toISOString(),
    };
    this.inMemoryGuestSession = guestUser;
    this.inMemoryGuestProgress = [];
    this.inMemoryGuestBadges = [];
    this.inMemoryGuestAttempts = [];
    this.inMemoryGuestFinalProgress = [];
    this.inMemoryGuestFinalAttempts = [];
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(guestUser));
    } catch {
      // ignore
    }
    this.notify();
    return guestUser;
  }

  public getCurrentUser(): User | null {
    if (this.inMemoryGuestSession) {
      return this.inMemoryGuestSession;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (parsed.isGuest === true || parsed.id === 'USR-GUEST') {
        if (!this.inMemoryGuestSession) {
          this.inMemoryGuestSession = parsed;
        }
        return this.inMemoryGuestSession;
      }
      // Ensure we have freshest data from DB
      const freshUser = this.getUserById(parsed.id);
      return freshUser || parsed;
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null): void {
    if (user && (user.isGuest || user.id === 'USR-GUEST')) {
      this.inMemoryGuestSession = user;
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch {
        // ignore
      }
      this.notify();
      return;
    }

    this.inMemoryGuestSession = null;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public getSchoolSettings(): SchoolSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
      if (!raw) {
        return { ...DEFAULT_SCHOOL_SETTINGS };
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SCHOOL_SETTINGS,
        ...parsed,
        schoolName: parsed.schoolName || DEFAULT_SCHOOL_SETTINGS.schoolName,
      };
    } catch {
      return { ...DEFAULT_SCHOOL_SETTINGS };
    }
  }

  public updateSchoolSettings(
    settings: Partial<SchoolSettings>,
    updatedBy?: string
  ): SchoolSettings {
    const current = this.getSchoolSettings();
    const updated: SchoolSettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || this.getCurrentUser()?.name || 'Administrator',
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(updated));
      saveCloudDoc('settings', 'school_settings', updated).catch(() => {});
    } catch (err) {
      console.error('Failed to save school settings to localStorage', err);
    }
    this.notify();
    return updated;
  }

  public resetSchoolSettings(): SchoolSettings {
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_SETTINGS);
    this.notify();
    return { ...DEFAULT_SCHOOL_SETTINGS };
  }

  public login(
    identifier: string,
    password?: string,
    expectedRole?: string
  ): { success: boolean; user?: User; message?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const users = this.getUsers();

    // Match by ID, username, email, nisn, nip, or name
    const foundUser = users.find((u) => {
      const matchId = u.id.toLowerCase() === cleanId;
      const matchUsername = (u.username || '').toLowerCase() === cleanId;
      const matchEmail = (u.email || '').toLowerCase() === cleanId;
      const matchNisn = (u.nisn || '').toLowerCase() === cleanId;
      const matchNip = (u.nip || '').toLowerCase() === cleanId;
      const matchName = u.name.toLowerCase() === cleanId;
      return matchId || matchUsername || matchEmail || matchNisn || matchNip || matchName;
    });

    if (!foundUser) {
      return {
        success: false,
        message: 'Pengguna tidak ditemukan. Silakan periksa Username/NISN/NIP/Email Anda.',
      };
    }

    if (expectedRole && foundUser.role !== expectedRole) {
      // Allow admin / kepsek / superadmin / reviewer interchangeably for management
      const isManagement = ['admin', 'reviewer', 'superadmin', 'viewer'].includes(foundUser.role) && (expectedRole === 'admin' || expectedRole === 'superadmin');
      if (!isManagement) {
        return {
          success: false,
          message: `Akun ini terdaftar sebagai ${foundUser.role === 'student' ? 'Siswa' : foundUser.role === 'teacher' ? 'Guru' : 'Admin'}, silakan login melalui tab yang sesuai.`,
        };
      }
    }

    // Password validation (if password provided in user record)
    if (foundUser.password) {
      if (!password || foundUser.password !== password.trim()) {
        return {
          success: false,
          message: 'Kata sandi / PIN yang Anda masukkan salah.',
        };
      }
    }

    this.setCurrentUser(foundUser);
    return {
      success: true,
      user: foundUser,
    };
  }

  public logout(): void {
    this.inMemoryGuestSession = null;
    this.inMemoryGuestProgress = [];
    this.inMemoryGuestBadges = [];
    this.inMemoryGuestAttempts = [];
    this.inMemoryGuestFinalProgress = [];
    this.inMemoryGuestFinalAttempts = [];
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notify();
  }

  public getClasses(): Class[] {
    return this.getStorage(STORAGE_KEYS.CLASSES, seedClasses);
  }

  public getClassMembers(): ClassMember[] {
    return this.getStorage(STORAGE_KEYS.CLASS_MEMBERS, seedClassMembers);
  }

  public getStudentProgress(): StudentProgress[] {
    return this.getStorage(STORAGE_KEYS.STUDENT_PROGRESS, seedStudentProgress);
  }

  public getTournamentEvents(): TournamentEvent[] {
    return this.getStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, seedTournamentEvents);
  }

  public getTournamentParticipants(eventId?: string): TournamentParticipant[] {
    const list = this.getStorage(STORAGE_KEYS.TOURNAMENT_PARTICIPANTS, seedTournamentParticipants);
    if (!eventId) return list;
    return list.filter((p) => p.eventId === eventId);
  }

  public getTournamentResults(eventId?: string): TournamentResult[] {
    const list = this.getStorage(STORAGE_KEYS.TOURNAMENT_RESULTS, seedTournamentResults);
    if (!eventId) return list;
    return list.filter((r) => r.eventId === eventId);
  }

  public getAuditLogs(): ImportAuditLog[] {
    return this.getStorage(STORAGE_KEYS.AUDIT_LOGS, seedAuditLogs);
  }

  public getContentVersions(): ContentVersion[] {
    return this.getStorage(STORAGE_KEYS.CONTENT_VERSIONS, []);
  }

  // --- RELATIONAL QUERIES ---
  public getMissionById(missionId: string): Mission | undefined {
    const canonical = normalizeMissionId(missionId);
    return this.getMissions().find((m) => m.id === canonical || m.id === missionId || m.code === canonical || m.code === missionId);
  }

  public getMissionsByWorld(worldId: string): Mission[] {
    return this.getMissions()
      .filter((m) => m.worldId === worldId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public getLessonsByMission(missionId: string): Lesson[] {
    const canonical = normalizeMissionId(missionId);
    return this.getLessons()
      .filter((l) => {
        const itemCanonical = normalizeMissionId(l.missionId);
        return l.missionId === canonical || l.missionId === missionId || itemCanonical === canonical;
      })
      .sort((a, b) => (a.contentOrder || a.orderIndex || 0) - (b.contentOrder || b.orderIndex || 0));
  }

  public getActivitiesByMission(missionId: string): Activity[] {
    const canonical = normalizeMissionId(missionId);
    return this.getActivities()
      .filter((a) => {
        const itemCanonical = normalizeMissionId(a.missionId);
        return a.missionId === canonical || a.missionId === missionId || itemCanonical === canonical;
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public getPracticeQuestionsByMission(missionId: string): PracticeQuestion[] {
    const canonical = normalizeMissionId(missionId);
    return this.getPracticeQuestions().filter((q) => {
      const itemCanonical = normalizeMissionId(q.missionId);
      return q.missionId === canonical || q.missionId === missionId || itemCanonical === canonical;
    });
  }

  public getBadgeByMission(missionId: string): Badge | undefined {
    const canonical = normalizeMissionId(missionId);
    return this.getBadges().find((b) => {
      const itemCanonical = normalizeMissionId(b.missionId);
      return b.missionId === canonical || b.missionId === missionId || itemCanonical === canonical;
    });
  }

  public getReflectionByMission(missionId: string): Reflection | undefined {
    const canonical = normalizeMissionId(missionId);
    return this.getReflections().find((r) => {
      const itemCanonical = normalizeMissionId(r.missionId);
      return r.missionId === canonical || r.missionId === missionId || itemCanonical === canonical;
    });
  }

  public getTournamentQuestionsByPackage(packageId: string): TournamentQuestion[] {
    return this.getTournamentQuestions().filter((tq) => tq.packageId === packageId);
  }

  public getPracticeAttempts(): PracticeAttempt[] {
    return this.getStorage(STORAGE_KEYS.PRACTICE_ATTEMPTS, []);
  }

  public getPracticeAttemptsByMission(missionId: string, studentId: string): PracticeAttempt[] {
    return this.getPracticeAttempts().filter((a) => a.missionId === missionId && a.studentId === studentId);
  }

  public getPracticeAttemptsByStudent(studentId: string): PracticeAttempt[] {
    return this.getPracticeAttempts().filter((a) => a.studentId === studentId);
  }

  // --- TEACHER, CLASS & STUDENT MANAGEMENT ---
  public getTeacherClasses(teacherId?: string): Class[] {
    const classes = this.getClasses();
    const current = this.getCurrentUser();
    const targetTeacherId = teacherId || (current?.role === 'teacher' ? current.id : 'TCH-001');
    return classes.filter((c) => c.teacherId === targetTeacherId || c.teacherId === 'TCH-001');
  }

  public getClassById(classId: string): Class | undefined {
    return this.getClasses().find((c) => c.id === classId);
  }

  public addClass(classData: Partial<Class>): Class {
    const classes = this.getClasses();
    const current = this.getCurrentUser();
    const teacherId = classData.teacherId || (current?.role === 'teacher' ? current.id : 'TCH-001');
    const teacherName = classData.teacherName || (current?.role === 'teacher' ? current.name : 'Ibu Dewi Anggraeni, S.Pd.');

    const newClass: Class = {
      id: classData.id || `CLS-${Date.now().toString().slice(-4)}`,
      code: classData.code || `KLS-${Math.floor(100 + Math.random() * 900)}`,
      name: classData.name || 'Kelas Baru',
      grade: classData.grade || 'Kelas 5',
      school: classData.school || this.getSchoolSettings().schoolName || 'SD Negeri 2 Medewi',
      teacherId,
      teacherName,
      academicYear: classData.academicYear || '2024/2025',
      createdAt: new Date().toISOString(),
    };

    classes.push(newClass);
    this.setStorage(STORAGE_KEYS.CLASSES, classes);
    this.notify();
    return newClass;
  }

  public updateClass(classId: string, updates: Partial<Class>): Class | undefined {
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.id === classId);
    if (idx < 0) return undefined;

    const updated = { ...classes[idx], ...updates };
    classes[idx] = updated;
    this.setStorage(STORAGE_KEYS.CLASSES, classes);
    this.notify();
    return updated;
  }

  public deleteClass(classId: string): boolean {
    const classes = this.getClasses();
    const filtered = classes.filter((c) => c.id !== classId);
    if (filtered.length === classes.length) return false;

    this.setStorage(STORAGE_KEYS.CLASSES, filtered);

    // Also remove memberships
    const members = this.getClassMembers().filter((m) => m.classId !== classId);
    this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, members);

    this.notify();
    return true;
  }

  public addStudentToClass(studentId: string, classId: string): void {
    const members = this.getClassMembers();
    // remove existing membership for this student to prevent duplicate classes
    const filtered = members.filter((m) => m.userId !== studentId);
    filtered.push({
      id: `MBR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      classId,
      userId: studentId,
      joinedAt: new Date().toISOString(),
      role: 'student',
    });
    this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, filtered);
    this.notify();
  }

  public removeStudentFromClass(studentId: string, classId: string): void {
    const members = this.getClassMembers();
    const filtered = members.filter((m) => !(m.userId === studentId && m.classId === classId));
    this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, filtered);
    this.notify();
  }

  public addStudent(studentData: Partial<User>, targetClassId?: string): { success: boolean; student?: User; message?: string } {
    const users = this.getUsers();
    const cleanNisn = (studentData.nisn || '').trim();

    if (cleanNisn) {
      const existing = users.find((u) => u.nisn === cleanNisn);
      if (existing) {
        // If student exists, update class assignment if requested
        if (targetClassId) {
          this.addStudentToClass(existing.id, targetClassId);
        }
        return {
          success: true,
          student: existing,
          message: `Siswa dengan NISN ${cleanNisn} sudah ada, data kelas diperbarui.`,
        };
      }
    }

    const schoolSettings = this.getSchoolSettings();
    const newStudentId = studentData.id || `USR-STD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
    const newStudent: User = {
      id: newStudentId,
      name: studentData.name?.trim() || 'Siswa Baru',
      nisn: cleanNisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: studentData.password?.trim() || '123',
      gender: studentData.gender || 'male',
      role: 'student',
      grade: studentData.grade || 'Kelas 5',
      ageCategory: studentData.ageCategory || 'anak',
      school: studentData.school || schoolSettings.schoolName || 'SD Negeri 2 Medewi',
      points: studentData.points ?? 0,
      level: studentData.level ?? 1,
      levelTitle: studentData.levelTitle || 'Pelajar Rupiah',
      currentXp: studentData.currentXp ?? 0,
      maxXp: studentData.maxXp ?? 100,
      avatar: studentData.avatar || (studentData.gender === 'female' ? 'perempuan' : 'laki-laki'),
      streakDays: 1,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    users.push(newStudent);
    this.setStorage(STORAGE_KEYS.USERS, users);

    // Bind to class if specified
    if (targetClassId) {
      this.addStudentToClass(newStudent.id, targetClassId);
    }

    this.notify();
    return {
      success: true,
      student: newStudent,
      message: 'Siswa berhasil ditambahkan.',
    };
  }

  public updateStudent(studentId: string, updates: Partial<User>, newClassId?: string): User | undefined {
    const updated = this.updateUser(studentId, updates);
    if (updated && newClassId) {
      this.addStudentToClass(studentId, newClassId);
    }
    return updated;
  }

  public deleteStudent(studentId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== studentId);
    if (filtered.length === users.length) return false;

    this.setStorage(STORAGE_KEYS.USERS, filtered);

    // Remove class memberships
    const members = this.getClassMembers().filter((m) => m.userId !== studentId);
    this.setStorage(STORAGE_KEYS.CLASS_MEMBERS, members);

    this.notify();
    return true;
  }

  public bulkImportStudents(
    studentList: Array<{
      name: string;
      nisn?: string;
      gender?: string;
      password?: string;
      grade?: string;
      school?: string;
      className?: string;
    }>,
    defaultClassId?: string
  ): { total: number; added: number; updated: number; skipped: number; errors: string[] } {
    const result = {
      total: studentList.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const classes = this.getClasses();
    const schoolSettings = this.getSchoolSettings();

    studentList.forEach((row, idx) => {
      const cleanName = (row.name || '').trim();
      if (!cleanName) {
        result.skipped++;
        result.errors.push(`Baris ${idx + 1}: Nama siswa kosong.`);
        return;
      }

      const cleanNisn = (row.nisn || '').toString().trim();
      const rawGender = (row.gender || '').toLowerCase();
      let parsedGender: 'male' | 'female' = 'male';
      if (rawGender.includes('p') || rawGender.includes('wanita') || rawGender.includes('female') || rawGender.includes('perempuan')) {
        parsedGender = 'female';
      }

      // Determine class
      let targetClass = defaultClassId ? classes.find((c) => c.id === defaultClassId) : undefined;
      if (row.className && (!targetClass || row.className.trim())) {
        const found = classes.find(
          (c) => c.name.toLowerCase() === row.className!.trim().toLowerCase() ||
                 c.code.toLowerCase() === row.className!.trim().toLowerCase()
        );
        if (found) {
          targetClass = found;
        } else if (row.className.trim()) {
          // Auto create class if requested
          targetClass = this.addClass({
            name: row.className.trim(),
            grade: row.grade || 'Kelas 5',
            school: row.school || schoolSettings.schoolName,
          });
        }
      }

      const users = this.getUsers();
      const existingUser = cleanNisn ? users.find((u) => u.nisn === cleanNisn) : undefined;

      if (existingUser) {
        // Update
        this.updateUser(existingUser.id, {
          name: cleanName,
          gender: parsedGender,
          grade: row.grade || existingUser.grade || 'Kelas 5',
          password: (row.password || '').toString().trim() || existingUser.password || '123',
        });
        if (targetClass) {
          this.addStudentToClass(existingUser.id, targetClass.id);
        }
        result.updated++;
      } else {
        // Add new
        const addRes = this.addStudent(
          {
            name: cleanName,
            nisn: cleanNisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
            gender: parsedGender,
            grade: row.grade || 'Kelas 5',
            password: (row.password || '').toString().trim() || '123',
            school: row.school || schoolSettings.schoolName,
          },
          targetClass ? targetClass.id : defaultClassId
        );

        if (addRes.success) {
          result.added++;
        } else {
          result.skipped++;
          result.errors.push(`Baris ${idx + 1} (${cleanName}): ${addRes.message || 'Gagal menambahkan'}`);
        }
      }
    });

    this.notify();
    return result;
  }

  public getClassStudents(classId: string) {
    const members = this.getClassMembers().filter((m) => m.classId === classId);
    const users = this.getUsers();
    const progressList = this.getStudentProgress();
    const badges = this.getBadges();
    const practiceAttempts = this.getPracticeAttempts();
    const tournamentResults = this.getTournamentResults();
    const missions = this.getMissions();
    const totalMissions = missions.length || 9;

    return members.map((m) => {
      const user = users.find((u) => u.id === m.userId) || {
        id: m.userId,
        name: 'Siswa',
        role: 'student' as const,
        grade: 'Kelas 5',
        points: 0,
        level: 1,
        levelTitle: 'Pelajar Rupiah',
        currentXp: 0,
        maxXp: 100,
        avatar: 'budi',
        streakDays: 1,
        createdAt: new Date().toISOString(),
      };

      const userProg = progressList.filter((p) => p.studentId === user.id);
      const completedCount = userProg.filter((p) => p.status === 'completed').length;
      const progressPercent = Math.round((completedCount / totalMissions) * 100);

      // Badges
      const userBadgesCount = userProg.filter((p) => p.badgeAwarded && p.status === 'completed').length;

      // Last Practice Attempt
      const userAttempts = practiceAttempts
        .filter((a) => a.studentId === user.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      
      const lastAttempt = userAttempts[0];
      let lastAttemptInfo = '-';
      if (lastAttempt) {
        const mObj = missions.find((ms) => ms.id === lastAttempt.missionId);
        lastAttemptInfo = `Skor ${lastAttempt.score} (${mObj ? mObj.title : lastAttempt.missionId})`;
      } else if (completedCount > 0) {
        lastAttemptInfo = `Skor 95 (Misi Terakhir)`;
      }

      // Tournament scores per category
      const userResults = tournamentResults.filter((r) => r.studentId === user.id);
      const cintaRes = userResults.find((r) => r.eventId === 'EVT-001' || r.eventId.includes('CIN'));
      const banggaRes = userResults.find((r) => r.eventId === 'EVT-002' || r.eventId.includes('BGG'));
      const pahamRes = userResults.find((r) => r.eventId === 'EVT-003' || r.eventId.includes('PHM'));

      // Medals summary
      const medals = {
        gold: userResults.filter((r) => r.medal === 'gold').length,
        silver: userResults.filter((r) => r.medal === 'silver').length,
        bronze: userResults.filter((r) => r.medal === 'bronze').length,
        participant: userResults.filter((r) => r.medal === 'participant').length,
      };

      // Duta Status
      let dutaStatus = 'Pelajar Pemula';
      if (completedCount >= 9 || medals.gold > 0) {
        dutaStatus = 'Duta Utama';
      } else if (completedCount >= 6 || medals.silver > 0) {
        dutaStatus = 'Duta Madya';
      } else if (completedCount >= 3) {
        dutaStatus = 'Duta Pratama';
      }

      return {
        user,
        completedMissionsCount: completedCount,
        totalMissions,
        progressPercent,
        badgesCount: userBadgesCount,
        lastAttemptInfo,
        cintaScore: cintaRes ? cintaRes.score : undefined,
        banggaScore: banggaRes ? banggaRes.score : undefined,
        pahamScore: pahamRes ? pahamRes.score : undefined,
        medals,
        highestMedal: userResults[0]?.medal || 'none',
        dutaStatus,
      };
    });
  }

  public getTeacherDashboardSummary(teacherId: string = 'TCH-001') {
    const teacherClasses = this.getTeacherClasses(teacherId);
    const classIds = teacherClasses.map((c) => c.id);
    const members = this.getClassMembers().filter((m) => classIds.includes(m.classId));
    const studentIds = members.map((m) => m.userId);

    const progressList = this.getStudentProgress().filter((p) => studentIds.includes(p.studentId));
    const practiceAttempts = this.getPracticeAttempts().filter((a) => studentIds.includes(a.studentId));
    const tournamentResults = this.getTournamentResults().filter((r) => studentIds.includes(r.studentId));
    const tournamentParticipants = this.getTournamentParticipants().filter((p) => studentIds.includes(p.studentId));

    const totalStudents = studentIds.length || 8;
    
    // Active students: students with at least 1 started progress or attempt
    const activeStudentIds = new Set([
      ...progressList.filter((p) => p.status === 'completed' || p.status === 'in_progress').map((p) => p.studentId),
      ...practiceAttempts.map((a) => a.studentId),
    ]);
    const activeStudents = activeStudentIds.size || totalStudents;

    // Missions Completed
    const completedProgress = progressList.filter((p) => p.status === 'completed');
    const totalMissionsCompleted = completedProgress.length;

    // Average Progress (%) across all students (out of 9 missions)
    const avgProgress = totalStudents > 0
      ? Math.round((totalMissionsCompleted / (totalStudents * 9)) * 100)
      : 0;

    // Average Practice Score (%)
    const avgPracticeScore = practiceAttempts.length > 0
      ? Math.round(practiceAttempts.reduce((sum, a) => sum + a.score, 0) / practiceAttempts.length)
      : completedProgress.length > 0
      ? Math.round(completedProgress.reduce((sum, p) => sum + (p.score || 90), 0) / completedProgress.length)
      : 88;

    // Tournament stats
    const totalTournamentParticipants = new Set(tournamentParticipants.map((p) => p.studentId)).size || tournamentResults.length;
    
    const verifiedResults = tournamentResults.filter((r) => r.isVerified);
    const avgVerifiedScore = verifiedResults.length > 0
      ? Math.round(verifiedResults.reduce((sum, r) => sum + r.score, 0) / verifiedResults.length)
      : 86;

    // Mission Completion Rate Breakdown (1 to 9)
    const missions = this.getMissions().sort((a, b) => a.orderIndex - b.orderIndex);
    const missionStats = missions.map((m) => {
      const completedForMission = completedProgress.filter((p) => p.missionId === m.id).length;
      const rate = totalStudents > 0 ? Math.round((completedForMission / totalStudents) * 100) : 0;
      return {
        missionId: m.id,
        code: m.code,
        title: m.title,
        worldId: m.worldId,
        completedCount: completedForMission,
        totalStudents,
        completionRate: rate,
      };
    });

    // World Stats
    const worldStats = {
      cinta: {
        title: 'Cinta Rupiah',
        completedMissions: missionStats.filter((m) => m.worldId === 'cinta').reduce((sum, m) => sum + m.completedCount, 0),
        totalPossible: totalStudents * 3,
        rate: 0,
      },
      bangga: {
        title: 'Bangga Rupiah',
        completedMissions: missionStats.filter((m) => m.worldId === 'bangga').reduce((sum, m) => sum + m.completedCount, 0),
        totalPossible: totalStudents * 3,
        rate: 0,
      },
      paham: {
        title: 'Paham Rupiah',
        completedMissions: missionStats.filter((m) => m.worldId === 'paham').reduce((sum, m) => sum + m.completedCount, 0),
        totalPossible: totalStudents * 3,
        rate: 0,
      },
    };

    worldStats.cinta.rate = Math.round((worldStats.cinta.completedMissions / (worldStats.cinta.totalPossible || 1)) * 100);
    worldStats.bangga.rate = Math.round((worldStats.bangga.completedMissions / (worldStats.bangga.totalPossible || 1)) * 100);
    worldStats.paham.rate = Math.round((worldStats.paham.completedMissions / (worldStats.paham.totalPossible || 1)) * 100);

    const worldBreakdown = {
      cinta: worldStats.cinta.rate,
      bangga: worldStats.bangga.rate,
      paham: worldStats.paham.rate,
    };

    return {
      totalStudents,
      activeStudents,
      avgProgress,
      totalMissionsCompleted,
      avgPracticeScore,
      totalTournamentParticipants,
      avgVerifiedScore,
      missionStats,
      worldStats,
      worldBreakdown,
      teacherClasses,
    };
  }

  public getStudentDetail(studentId: string) {
    const user = this.getUsers().find((u) => u.id === studentId);
    const member = this.getClassMembers().find((m) => m.userId === studentId);
    const userClass = member ? this.getClassById(member.classId) : undefined;
    const missions = this.getMissions().sort((a, b) => a.orderIndex - b.orderIndex);
    const progressList = this.getStudentProgress().filter((p) => p.studentId === studentId);
    const practiceAttempts = this.getPracticeAttemptsByStudent(studentId);
    const reflections = this.getReflections();
    const badges = this.getBadges();
    const tournamentResults = this.getTournamentResults().filter((r) => r.studentId === studentId);
    const tournamentEvents = this.getTournamentEvents();

    const missionStatusList = missions.map((m) => {
      const prog = progressList.find((p) => p.missionId === m.id);
      const refl = reflections.find((r) => r.missionId === m.id);
      const b = badges.find((bg) => bg.missionId === m.id);

      return {
        mission: m,
        progress: prog,
        status: prog?.status || 'not_started',
        score: prog?.score || 0,
        completedAt: prog?.completedAt,
        reflectionAnswer: prog?.reflectionAnswer,
        reflectionPrompt: refl?.prompt,
        badge: b,
        badgeAwarded: prog?.badgeAwarded,
      };
    });

    const tournamentDetails = tournamentResults.map((res) => {
      const evt = tournamentEvents.find((e) => e.id === res.eventId);
      return {
        result: res,
        event: evt,
      };
    });

    return {
      user,
      userClass,
      missionStatusList,
      practiceAttempts,
      tournamentDetails,
    };
  }

  public getConceptAnalysisData() {
    const questions = this.getPracticeQuestions();
    const results = this.getTournamentResults();
    
    // Group competencies
    const compMap = new Map<string, { total: number; correct: number; questions: string[]; recommendation: string }>();

    // Initial competencies mapping
    const defaultCompetencies = [
      { name: 'Metode 3D (Dilihat, Diraba, Diterawang)', total: 40, correct: 35, recommendation: 'Pemahaman umum sangat baik. Perkuat kembali pengamatan tanda air (watermark) dan gambar tersembunyi.' },
      { name: 'Prinsip 5J Rawat Fisik Rupiah', total: 40, correct: 24, recommendation: 'Perlu bimbingan intensif! Masih banyak siswa yang keliru mengenai larangan menstapler dan meremas uang.' },
      { name: 'Unsur Pengaman Latent Image & Rectoverso', total: 35, correct: 22, recommendation: 'Perlu praktik langsung menggunakan kaca pembesar / cahaya senter pada lembar uang Rp100.000.' },
      { name: 'Simbol Kedaulatan & Pahlawan Nasional', total: 30, correct: 27, recommendation: 'Siswa sangat bangga dan antusias mengenal pahlawan nasional pada pecahan uang Rupiah.' },
      { name: 'Kebutuhan vs Keinginan Finansial', total: 35, correct: 25, recommendation: 'Siswa perlu latihan membuat skala prioritas belanja harian secara tertulis di lembar kerja.' },
      { name: 'Keamanan Transaksi Digital (QRIS)', total: 30, correct: 26, recommendation: 'Pemahaman kode QRIS dan verifikasi nama merchant sudah dikuasai dengan baik.' },
      { name: 'Perencanaan Tabungan Masa Depan', total: 25, correct: 20, recommendation: 'Motivasi siswa untuk membuat celengan target impian dan membiasakan menyisihkan uang saku.' },
    ];

    defaultCompetencies.forEach((c) => {
      compMap.set(c.name, {
        total: c.total,
        correct: c.correct,
        questions: [],
        recommendation: c.recommendation,
      });
    });

    // Update with real details from tournament results
    results.forEach((res) => {
      if (res.details) {
        res.details.forEach((d) => {
          if (d.competencyCategory) {
            const entry = compMap.get(d.competencyCategory) || {
              total: 0,
              correct: 0,
              questions: [],
              recommendation: 'Lakukan pengulangan konsep dasar di kelas.',
            };
            entry.total++;
            if (d.isCorrect) entry.correct++;
            compMap.set(d.competencyCategory, entry);
          }
        });
      }
    });

    const analysisList = Array.from(compMap.entries()).map(([name, data]) => {
      const accuracy = Math.round((data.correct / (data.total || 1)) * 100);
      let severity: 'danger' | 'warning' | 'good' = 'good';
      if (accuracy < 65) severity = 'danger';
      else if (accuracy < 80) severity = 'warning';

      return {
        competency: name,
        totalAnswered: data.total,
        correctCount: data.correct,
        accuracy,
        severity,
        recommendation: data.recommendation,
      };
    });

    return analysisList.sort((a, b) => a.accuracy - b.accuracy);
  }

  // --- TOURNAMENT MUTATIONS ---
  public createTournamentEvent(eventData: Omit<TournamentEvent, 'id'>): TournamentEvent {
    const events = this.getTournamentEvents();
    const newEvent: TournamentEvent = {
      ...eventData,
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    events.unshift(newEvent);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, events);
    return newEvent;
  }

  public updateTournamentEventStatus(
    eventId: string,
    status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled'
  ) {
    const events = this.getTournamentEvents();
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      events[idx].status = status;
      this.setStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, events);
    }
  }

  public updateTournamentEvent(eventId: string, partial: Partial<TournamentEvent>) {
    const events = this.getTournamentEvents();
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      events[idx] = { ...events[idx], ...partial };
      this.setStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, events);
    }
  }

  public deleteTournamentEvent(eventId: string) {
    const events = this.getTournamentEvents().filter((e) => e.id !== eventId);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_EVENTS, events);
  }

  public addTournamentParticipant(participant: Omit<TournamentParticipant, 'id'>): TournamentParticipant {
    const list = this.getTournamentParticipants();
    const newParticipant: TournamentParticipant = {
      ...participant,
      id: `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    list.push(newParticipant);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_PARTICIPANTS, list);
    return newParticipant;
  }

  public updateTournamentParticipant(id: string, partial: Partial<TournamentParticipant>) {
    const list = this.getTournamentParticipants();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial };
      this.setStorage(STORAGE_KEYS.TOURNAMENT_PARTICIPANTS, list);
    }
  }

  public recordTournamentResult(result: Omit<TournamentResult, 'id'>): TournamentResult {
    const list = this.getTournamentResults();
    const newResult: TournamentResult = {
      ...result,
      id: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    list.push(newResult);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_RESULTS, list);
    return newResult;
  }

  public createMakeUpEvent(parentEventId: string): TournamentEvent | undefined {
    const events = this.getTournamentEvents();
    const parent = events.find((e) => e.id === parentEventId);
    if (!parent) return undefined;

    const makeUp: Omit<TournamentEvent, 'id'> = {
      packageId: parent.packageId,
      code: `${parent.code || 'TRN'}-MKP`,
      title: `Susulan: ${parent.title}`,
      school: parent.school,
      classId: parent.classId,
      className: parent.className,
      teacherId: parent.teacherId,
      category: parent.category,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      targetDurationMinutes: parent.targetDurationMinutes || 30,
      totalQuestions: parent.totalQuestions || 20,
      passingScore: parent.passingScore || 75,
      status: 'scheduled',
      isMakeup: true,
      parentEventId: parent.id,
    };

    return this.createTournamentEvent(makeUp);
  }

  // --- STUDENT PROGRESSION LOGIC ---
  public getEffectiveStudentId(explicitStudentId?: string): string {
    if (explicitStudentId && explicitStudentId !== 'std_01') {
      return explicitStudentId;
    }
    const current = this.getCurrentUser();
    if (current && current.id) {
      return current.id;
    }
    return explicitStudentId || 'std_01';
  }

  public getMissionState(missionId: string, studentId?: string): 'locked' | 'available' | 'in_progress' | 'completed' {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const currentUser = this.getCurrentUser();
    const isGuest = this.isCurrentGuest() || currentUser?.isGuest || currentUser?.id === 'USR-GUEST';
    const isTester =
      !isGuest &&
      (activeStudentId === 'USR-TESTER' ||
      currentUser?.id === 'USR-TESTER' ||
      currentUser?.email?.toLowerCase().includes('tester') ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'teacher');

    const canonical = normalizeMissionId(missionId);
    const missions = this.getMissions().sort((a, b) => a.orderIndex - b.orderIndex);
    const progressList = this.getStudentProgress().filter((p) => p.studentId === activeStudentId);
    
    const mission = missions.find((m) => m.id === canonical || m.id === missionId || m.code === canonical);
    if (!mission) return isTester ? 'available' : 'locked';

    const prog = progressList.find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.missionId === mission.id || p.missionId === canonical || pCanonical === canonical;
    });
    if (prog && prog.status === 'completed') return 'completed';
    if (prog && prog.status === 'in_progress') return 'in_progress';

    // Tester or Admin/Teacher previewing can access ALL missions without locking
    if (isTester) {
      return 'available';
    }

    // First mission is always available by default
    if (mission.orderIndex === 1 || mission.levelNumber === 1 || mission.id === 'JR-C01' || mission.id === 'MIS-01') {
      return 'available';
    }

    // Check if previous mission is completed
    const prevMission = missions.find((m) => m.orderIndex === mission.orderIndex - 1 || m.levelNumber === mission.levelNumber - 1);
    if (!prevMission) return 'available';

    const prevCanonical = normalizeMissionId(prevMission.id);
    const prevProg = progressList.find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.missionId === prevMission.id || p.missionId === prevCanonical || pCanonical === prevCanonical;
    });
    if (prevProg && prevProg.status === 'completed') {
      return 'available';
    }

    return 'locked';
  }

  public getStudentMissionProgress(missionId: string, studentId?: string): StudentProgress | undefined {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const canonical = normalizeMissionId(missionId);
    return this.getStudentProgress().find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.studentId === activeStudentId && (p.missionId === canonical || p.missionId === missionId || pCanonical === canonical);
    });
  }

  public startMission(missionId: string, studentId?: string): StudentProgress {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const canonical = normalizeMissionId(missionId);
    const list = this.getStudentProgress();
    let prog = list.find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.studentId === activeStudentId && (p.missionId === canonical || p.missionId === missionId || pCanonical === canonical);
    });

    if (!prog) {
      prog = {
        id: `PROG-${Date.now()}`,
        studentId: activeStudentId,
        missionId: canonical,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        score: 0,
        badgeAwarded: false,
        completedSections: [],
      };
      list.push(prog);
    } else {
      prog.missionId = canonical; // ensure canonical
      if (prog.status === 'not_started' || (prog.status as string) === 'available') {
        prog.status = 'in_progress';
        if (!prog.startedAt) prog.startedAt = new Date().toISOString();
      }
    }

    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
    return prog;
  }

  public saveMissionSectionProgress(
    missionId: string,
    studentId?: string,
    section: 'learn' | 'activity' | 'practice' | 'reflection' = 'learn'
  ) {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const canonical = normalizeMissionId(missionId);
    const list = this.getStudentProgress();
    let prog = list.find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.studentId === activeStudentId && (p.missionId === canonical || p.missionId === missionId || pCanonical === canonical);
    });

    if (!prog) {
      prog = {
        id: `PROG-${Date.now()}`,
        studentId: activeStudentId,
        missionId: canonical,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        score: 0,
        badgeAwarded: false,
        completedSections: [section],
      };
      list.push(prog);
    } else {
      prog.missionId = canonical;
      if (!prog.completedSections) prog.completedSections = [];
      if (!prog.completedSections.includes(section)) {
        prog.completedSections.push(section);
      }
      if (prog.status !== 'completed') {
        prog.status = 'in_progress';
      }
    }

    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
    return prog;
  }

  public unlockAllMissionsForStudent(studentId?: string) {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const missions = this.getMissions();
    const list = this.getStudentProgress().filter((p) => p.studentId !== activeStudentId);
    const badges = this.getBadges();

    missions.forEach((m, idx) => {
      const canonical = normalizeMissionId(m.id);
      list.push({
        id: `PROG-ALL-${activeStudentId}-${idx + 1}`,
        studentId: activeStudentId,
        missionId: canonical,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score: 100,
        badgeAwarded: true,
        completedSections: ['learn', 'activity', 'practice', 'reflection'],
        reflectionAnswer: 'Misi telah selesai diuji dan diverifikasi oleh Siswa Penguji.',
      });
    });

    // Also mark all badges as unlocked
    badges.forEach((b) => {
      b.unlocked = true;
      b.unlockedDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    });

    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
    this.setStorage(STORAGE_KEYS.BADGES, badges);
    this.notify();
  }

  public resetStudentProgress(studentId?: string) {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const list = this.getStudentProgress().filter((p) => p.studentId !== activeStudentId);
    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
    this.notify();
  }
  public recordPracticeAttempt(attempt: Omit<PracticeAttempt, 'id'>): PracticeAttempt {
    const activeStudentId = this.getEffectiveStudentId(attempt.studentId);
    const canonical = normalizeMissionId(attempt.missionId);
    const attempts = this.getPracticeAttempts();
    const newAttempt: PracticeAttempt = {
      ...attempt,
      studentId: activeStudentId,
      missionId: canonical,
      id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    attempts.push(newAttempt);
    this.setStorage(STORAGE_KEYS.PRACTICE_ATTEMPTS, attempts);

    // Also update student progress with the latest score
    const list = this.getStudentProgress();
    let prog = list.find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.studentId === activeStudentId && (p.missionId === canonical || p.missionId === attempt.missionId || pCanonical === canonical);
    });
    if (prog) {
      prog.missionId = canonical;
      prog.score = Math.max(prog.score || 0, attempt.score);
      prog.lastAttemptScore = attempt.score;
      prog.attemptsCount = (prog.attemptsCount || 0) + 1;
      if (!prog.completedSections) prog.completedSections = [];
      if (!prog.completedSections.includes('practice')) {
        prog.completedSections.push('practice');
      }
      this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
    }

    return newAttempt;
  }

  public completeMission(
    missionId: string,
    studentId?: string,
    score: number = 100,
    reflectionAnswer?: string
  ): { progress: StudentProgress; badgeUnlocked?: Badge; isFirstCompletion: boolean } {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const canonical = normalizeMissionId(missionId);
    const missions = this.getMissions();
    const mission = missions.find((m) => m.id === canonical || m.id === missionId);
    const list = this.getStudentProgress();
    let prog = list.find((p) => {
      const pCanonical = normalizeMissionId(p.missionId);
      return p.studentId === activeStudentId && (p.missionId === canonical || p.missionId === missionId || pCanonical === canonical);
    });

    const isFirstCompletion = !prog || prog.status !== 'completed';

    if (!prog) {
      prog = {
        id: `PROG-${Date.now()}`,
        studentId: activeStudentId,
        missionId: canonical,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score,
        badgeAwarded: true,
        completedSections: ['learn', 'activity', 'practice', 'reflection'],
        reflectionAnswer,
      };
      list.push(prog);
    } else {
      prog.missionId = canonical;
      prog.status = 'completed';
      prog.completedAt = new Date().toISOString();
      prog.score = Math.max(prog.score || 0, score);
      prog.badgeAwarded = true;
      if (reflectionAnswer) prog.reflectionAnswer = reflectionAnswer;
      if (!prog.completedSections) prog.completedSections = [];
      ['learn', 'activity', 'practice', 'reflection'].forEach((s) => {
        if (!prog!.completedSections!.includes(s as any)) prog!.completedSections!.push(s as any);
      });
    }

    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
    if (prog) {
      saveCloudDoc('student_progress', `${activeStudentId}_${canonical}`, prog).catch(() => {});
    }

    // Unlock badge if not unlocked yet
    let badgeUnlocked: Badge | undefined;
    const badges = this.getBadges();
    const badgeIdx = badges.findIndex((b) => {
      const bCanonical = normalizeMissionId(b.missionId);
      return b.missionId === canonical || b.missionId === missionId || bCanonical === canonical;
    });
    if (badgeIdx >= 0 && (!badges[badgeIdx].unlocked || isFirstCompletion)) {
      badges[badgeIdx].unlocked = true;
      badges[badgeIdx].missionId = canonical;
      badges[badgeIdx].unlockedDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
      badgeUnlocked = badges[badgeIdx];
      this.setStorage(STORAGE_KEYS.BADGES, badges);
    }

    // Award XP and Points to user
    if (isFirstCompletion && mission) {
      const users = this.getUsers();
      const userIdx = users.findIndex((u) => u.id === activeStudentId);
      if (userIdx >= 0) {
        const u = users[userIdx];
        const newXp = (u.currentXp || 0) + (mission.xpReward || 150);
        const newPoints = (u.points || 0) + (mission.pointReward || 150);
        let newLevel = u.level || 1;
        let newMaxXp = u.maxXp || 500;
        let currentXp = newXp;

        while (currentXp >= newMaxXp) {
          currentXp -= newMaxXp;
          newLevel += 1;
          newMaxXp = Math.round(newMaxXp * 1.25);
        }

        u.currentXp = currentXp;
        u.maxXp = newMaxXp;
        u.level = newLevel;
        u.points = newPoints;
        this.setStorage(STORAGE_KEYS.USERS, users);
      }
    }

    this.notify();
    return { progress: prog, badgeUnlocked, isFirstCompletion };
  }

  // --- CONTENT WORKFLOW & DIAGNOSTICS HELPERS ---
  public getMissionDiagnostics() {
    const missions = this.getMissions();
    return missions.map((m) => {
      const canonical = normalizeMissionId(m.id);
      const lessons = this.getLessonsByMission(canonical);
      const activities = this.getActivitiesByMission(canonical);
      const questions = this.getPracticeQuestionsByMission(canonical);
      const badge = this.getBadgeByMission(canonical);
      const reflection = this.getReflectionByMission(canonical);

      const allItems = [
        m.status,
        ...lessons.map((l) => l.status),
        ...activities.map((a) => a.status),
        ...questions.map((q) => q.status),
      ];

      const isAllPublished = allItems.every((s) => s === 'published');
      const isPartiallyPublished = allItems.some((s) => s === 'published');

      return {
        missionId: canonical,
        title: m.title,
        worldId: m.worldId,
        orderIndex: m.orderIndex,
        status: m.status,
        lessonCount: lessons.length,
        activityCount: activities.length,
        questionCount: questions.length,
        hasBadge: !!badge,
        badgeName: badge?.name || '-',
        hasReflection: !!reflection,
        isAllPublished,
        isPartiallyPublished,
      };
    });
  }

  public publishMissionAndRelated(missionId: string, updatedBy: string = 'Admin Kurikulum BI') {
    const canonical = normalizeMissionId(missionId);
    
    // Publish mission
    this.updateMission(canonical, { status: 'published' }, updatedBy, 'Publikasi Misi');

    // Publish all lessons
    const lessons = this.getLessons();
    let lChanged = false;
    lessons.forEach((l) => {
      if (normalizeMissionId(l.missionId) === canonical) {
        l.status = 'published';
        lChanged = true;
      }
    });
    if (lChanged) this.setStorage(STORAGE_KEYS.LESSONS, lessons);

    // Publish all activities
    const activities = this.getActivities();
    let aChanged = false;
    activities.forEach((a) => {
      if (normalizeMissionId(a.missionId) === canonical) {
        a.status = 'published';
        aChanged = true;
      }
    });
    if (aChanged) this.setStorage(STORAGE_KEYS.ACTIVITIES, activities);

    // Publish all questions
    const questions = this.getPracticeQuestions();
    let qChanged = false;
    questions.forEach((q) => {
      if (normalizeMissionId(q.missionId) === canonical) {
        q.status = 'published';
        qChanged = true;
      }
    });
    if (qChanged) this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, questions);

    this.notify();
  }

  public unpublishMissionAndRelated(missionId: string, updatedBy: string = 'Admin Kurikulum BI') {
    const canonical = normalizeMissionId(missionId);
    
    // Set mission to draft
    this.updateMission(canonical, { status: 'draft' }, updatedBy, 'Nonaktifkan Misi (Set Draft)');

    // Set all lessons to draft
    const lessons = this.getLessons();
    let lChanged = false;
    lessons.forEach((l) => {
      if (normalizeMissionId(l.missionId) === canonical) {
        l.status = 'draft';
        lChanged = true;
      }
    });
    if (lChanged) this.setStorage(STORAGE_KEYS.LESSONS, lessons);

    // Set all activities to draft
    const activities = this.getActivities();
    let aChanged = false;
    activities.forEach((a) => {
      if (normalizeMissionId(a.missionId) === canonical) {
        a.status = 'draft';
        aChanged = true;
      }
    });
    if (aChanged) this.setStorage(STORAGE_KEYS.ACTIVITIES, activities);

    // Set all questions to draft
    const questions = this.getPracticeQuestions();
    let qChanged = false;
    questions.forEach((q) => {
      if (normalizeMissionId(q.missionId) === canonical) {
        q.status = 'draft';
        qChanged = true;
      }
    });
    if (qChanged) this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, questions);

    this.notify();
  }

  public toggleMissionPublish(missionId: string, updatedBy: string = 'Admin Kurikulum BI'): ContentStatus {
    const mission = this.getMissionById(missionId);
    if (!mission) return 'draft';

    if (mission.status === 'published') {
      this.unpublishMissionAndRelated(missionId, updatedBy);
      return 'draft';
    } else {
      this.publishMissionAndRelated(missionId, updatedBy);
      return 'published';
    }
  }

  public publishAllMissions(updatedBy: string = 'Admin Kurikulum BI') {
    this.publishAllContent(updatedBy);
  }

  public unpublishAllMissions(updatedBy: string = 'Admin Kurikulum BI') {
    const missions = this.getMissions().map((m) => ({ ...m, status: 'draft' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.MISSIONS, missions);

    const lessons = this.getLessons().map((l) => ({ ...l, status: 'draft' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.LESSONS, lessons);

    const activities = this.getActivities().map((a) => ({ ...a, status: 'draft' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.ACTIVITIES, activities);

    const questions = this.getPracticeQuestions().map((q) => ({ ...q, status: 'draft' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, questions);

    this.notify();
  }

  public publishAllContent(updatedBy: string = 'Admin Kurikulum BI') {
    // Publish all missions
    const missions = this.getMissions().map((m) => ({ ...m, status: 'published' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.MISSIONS, missions);

    // Publish all lessons
    const lessons = this.getLessons().map((l) => ({ ...l, status: 'published' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.LESSONS, lessons);

    // Publish all activities
    const activities = this.getActivities().map((a) => ({ ...a, status: 'published' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.ACTIVITIES, activities);

    // Publish all practice questions
    const questions = this.getPracticeQuestions().map((q) => ({ ...q, status: 'published' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, questions);

    // Publish tournament packages
    const pkgs = this.getTournamentPackages().map((p) => ({ ...p, status: 'published' as ContentStatus }));
    this.setStorage(STORAGE_KEYS.TOURNAMENT_PACKAGES, pkgs);

    this.notify();
  }

  public getStudentOverallStats(studentId?: string) {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const missions = this.getMissions();
    const progressList = this.getStudentProgress().filter((p) => p.studentId === activeStudentId);
    const badges = this.getBadges();
    const currentUser = this.getCurrentUser();
    const isTester = activeStudentId === 'USR-TESTER' || currentUser?.id === 'USR-TESTER';

    const completedMissions = progressList.filter((p) => p.status === 'completed');
    const unlockedBadges = badges.filter((b) => b.unlocked);

    const worldStats = {
      cinta: { total: 3, completed: 0, percentage: 0 },
      bangga: { total: 3, completed: 0, percentage: 0 },
      paham: { total: 3, completed: 0, percentage: 0 },
    };

    missions.forEach((m) => {
      const mCanonical = normalizeMissionId(m.id);
      const isComp = completedMissions.some((p) => {
        const pCanonical = normalizeMissionId(p.missionId);
        return p.missionId === m.id || p.missionId === mCanonical || pCanonical === mCanonical;
      });
      if (m.worldId === 'cinta' && isComp) worldStats.cinta.completed++;
      if (m.worldId === 'bangga' && isComp) worldStats.bangga.completed++;
      if (m.worldId === 'paham' && isComp) worldStats.paham.completed++;
    });

    worldStats.cinta.percentage = Math.round((worldStats.cinta.completed / 3) * 100);
    worldStats.bangga.percentage = Math.round((worldStats.bangga.completed / 3) * 100);
    worldStats.paham.percentage = Math.round((worldStats.paham.completed / 3) * 100);

    const user = this.getUsers().find((u) => u.id === activeStudentId) || currentUser;

    return {
      completedMissionsCount: completedMissions.length,
      totalMissions: missions.length || 9,
      unlockedBadgesCount: isTester ? 9 : unlockedBadges.length,
      totalBadges: badges.length || 9,
      worldStats,
      user,
      isTester,
    };
  }

  // --- MUTATIONS ---
  public addAuditLog(log: ImportAuditLog) {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    this.setStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  public updateStudentProgress(progress: StudentProgress) {
    const list = this.getStudentProgress();
    const idx = list.findIndex((p) => p.studentId === progress.studentId && p.missionId === progress.missionId);
    if (idx >= 0) {
      list[idx] = progress;
    } else {
      list.push(progress);
    }
    this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, list);
  }

  public updateUserProfile(userId: string, partial: Partial<User>) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...partial };
      this.setStorage(STORAGE_KEYS.USERS, users);
    }
  }

  // --- BULK IMPORT FROM EXCEL ENGINE ---
  public bulkImportData(
    data: {
      missions?: Mission[];
      lessons?: Lesson[];
      activities?: Activity[];
      practiceQuestions?: PracticeQuestion[];
      badges?: Badge[];
      reflections?: Reflection[];
      references?: Reference[];
      tournamentPackages?: TournamentPackage[];
      tournamentQuestions?: TournamentQuestion[];
      tournamentEvents?: TournamentEvent[];
    },
    duplicateHandling: 'update' | 'skip' | 'replace_clean' = 'update',
    auditInfo: { fileName: string; importedBy: string }
  ): {
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: string[];
    log: ImportAuditLog;
  } {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    function processTable<T extends { id: string }>(
      currentList: T[],
      newItems: T[] | undefined,
      isMissionTable: boolean = false
    ): T[] {
      if (!newItems || newItems.length === 0) return currentList;

      if (duplicateHandling === 'replace_clean') {
        const result: T[] = [];
        for (const item of newItems) {
          if (!item.id) continue;
          const key = isMissionTable ? normalizeMissionId(item.id || (item as any).code) : item.id;
          const normalizedItem = isMissionTable
            ? ({ ...item, id: key, code: (item as any).code || key } as unknown as T)
            : item;
          result.push(normalizedItem);
          createdCount++;
        }
        return result;
      }

      const map = new Map<string, T>();
      currentList.forEach((item) => {
        const key = isMissionTable ? normalizeMissionId(item.id || (item as any).code) : item.id;
        map.set(key, item);
      });

      for (const item of newItems) {
        if (!item.id) continue;
        const key = isMissionTable ? normalizeMissionId(item.id || (item as any).code) : item.id;
        const normalizedItem = isMissionTable
          ? ({ ...item, id: key, code: (item as any).code || key } as unknown as T)
          : item;

        if (map.has(key)) {
          if (duplicateHandling === 'update') {
            const existing = map.get(key)!;
            map.set(key, { ...existing, ...normalizedItem });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          map.set(key, normalizedItem);
          createdCount++;
        }
      }

      return Array.from(map.values());
    }

    // Process all tables
    if (data.missions) {
      const updated = processTable(this.getMissions(), data.missions, true);
      this.setStorage(STORAGE_KEYS.MISSIONS, updated);
    }
    if (data.lessons) {
      const updated = processTable(this.getLessons(), data.lessons);
      this.setStorage(STORAGE_KEYS.LESSONS, updated);
    }
    if (data.activities) {
      const updated = processTable(this.getActivities(), data.activities);
      this.setStorage(STORAGE_KEYS.ACTIVITIES, updated);
    }
    if (data.practiceQuestions) {
      const updated = processTable(this.getPracticeQuestions(), data.practiceQuestions);
      this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, updated);
    }
    if (data.badges) {
      const updated = processTable(this.getBadges(), data.badges);
      this.setStorage(STORAGE_KEYS.BADGES, updated);
    }
    if (data.reflections) {
      const updated = processTable(this.getReflections(), data.reflections);
      this.setStorage(STORAGE_KEYS.REFLECTIONS, updated);
    }
    if (data.references) {
      const updated = processTable(this.getReferences(), data.references);
      this.setStorage(STORAGE_KEYS.REFERENCES, updated);
    }
    if (data.tournamentPackages) {
      const updated = processTable(this.getTournamentPackages(), data.tournamentPackages);
      this.setStorage(STORAGE_KEYS.TOURNAMENT_PACKAGES, updated);
    }
    if (data.tournamentQuestions) {
      const updated = processTable(this.getTournamentQuestions(), data.tournamentQuestions);
      this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, updated);
    }

    const totalRows = (data.missions?.length || 0) +
      (data.lessons?.length || 0) +
      (data.activities?.length || 0) +
      (data.practiceQuestions?.length || 0) +
      (data.badges?.length || 0) +
      (data.reflections?.length || 0) +
      (data.references?.length || 0) +
      (data.tournamentPackages?.length || 0) +
      (data.tournamentQuestions?.length || 0);

    const log: ImportAuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      importedBy: auditInfo.importedBy || 'Admin Kurikulum Bank Indonesia',
      fileName: auditInfo.fileName || 'import_content_master.xlsx',
      totalRows,
      createdCount,
      updatedCount,
      skippedCount,
      errorCount: errors.length,
      details: {
        missionsCount: data.missions?.length || 0,
        lessonsCount: data.lessons?.length || 0,
        activitiesCount: data.activities?.length || 0,
        questionsCount: data.practiceQuestions?.length || 0,
        badgesCount: data.badges?.length || 0,
        reflectionsCount: data.reflections?.length || 0,
        referencesCount: data.references?.length || 0,
        packagesCount: data.tournamentPackages?.length || 0,
        tournamentQuestionsCount: data.tournamentQuestions?.length || 0,
        eventsCount: data.tournamentEvents?.length || 0,
        errorsList: errors,
      },
      statusSummary: errors.length > 0 ? 'warning' : 'success',
    };

    this.addAuditLog(log);
    this.notify();

    return {
      createdCount,
      updatedCount,
      skippedCount,
      errors,
      log,
    };
  }

  // --- STATS ---
  public getDatabaseStats() {
    return {
      worlds: this.getWorlds().length,
      missions: this.getMissions().length,
      lessons: this.getLessons().length,
      activities: this.getActivities().length,
      practiceQuestions: this.getPracticeQuestions().length,
      badges: this.getBadges().length,
      reflections: this.getReflections().length,
      references: this.getReferences().length,
      tournamentPackages: this.getTournamentPackages().length,
      tournamentQuestions: this.getTournamentQuestions().length,
      users: this.getUsers().length,
      classes: this.getClasses().length,
      auditLogs: this.getAuditLogs().length,
    };
  }

  // --- CONTENT STATUS SUMMARY ---
  public getContentStatusCounts() {
    const missions = this.getMissions();
    const lessons = this.getLessons();
    const activities = this.getActivities();
    const questions = this.getPracticeQuestions();
    const tournamentQuestions = this.getTournamentQuestions();

    const allItems = [
      ...missions.map((m) => ({ type: 'mission', status: m.status })),
      ...lessons.map((l) => ({ type: 'lesson', status: l.status })),
      ...activities.map((a) => ({ type: 'activity', status: a.status })),
      ...questions.map((q) => ({ type: 'question', status: q.status })),
      ...tournamentQuestions.map((tq) => ({ type: 'tournament_question', status: tq.status })),
    ];

    const counts = {
      draft: allItems.filter((i) => i.status === 'draft').length,
      review: allItems.filter((i) => i.status === 'review').length,
      approved: allItems.filter((i) => i.status === 'approved').length,
      published: allItems.filter((i) => i.status === 'published').length,
      archived: allItems.filter((i) => i.status === 'archived').length,
      total: allItems.length,
      byType: {
        missions: {
          draft: missions.filter((m) => m.status === 'draft').length,
          review: missions.filter((m) => m.status === 'review').length,
          approved: missions.filter((m) => m.status === 'approved').length,
          published: missions.filter((m) => m.status === 'published').length,
          archived: missions.filter((m) => m.status === 'archived').length,
          total: missions.length,
        },
        lessons: {
          draft: lessons.filter((l) => l.status === 'draft').length,
          review: lessons.filter((l) => l.status === 'review').length,
          approved: lessons.filter((l) => l.status === 'approved').length,
          published: lessons.filter((l) => l.status === 'published').length,
          archived: lessons.filter((l) => l.status === 'archived').length,
          total: lessons.length,
        },
        activities: {
          draft: activities.filter((a) => a.status === 'draft').length,
          review: activities.filter((a) => a.status === 'review').length,
          approved: activities.filter((a) => a.status === 'approved').length,
          published: activities.filter((a) => a.status === 'published').length,
          archived: activities.filter((a) => a.status === 'archived').length,
          total: activities.length,
        },
        questions: {
          draft: questions.filter((q) => q.status === 'draft').length,
          review: questions.filter((q) => q.status === 'review').length,
          approved: questions.filter((q) => q.status === 'approved').length,
          published: questions.filter((q) => q.status === 'published').length,
          archived: questions.filter((q) => q.status === 'archived').length,
          total: questions.length,
        },
        tournamentQuestions: {
          draft: tournamentQuestions.filter((t) => t.status === 'draft').length,
          review: tournamentQuestions.filter((t) => t.status === 'review').length,
          approved: tournamentQuestions.filter((t) => t.status === 'approved').length,
          published: tournamentQuestions.filter((t) => t.status === 'published').length,
          archived: tournamentQuestions.filter((t) => t.status === 'archived').length,
          total: tournamentQuestions.length,
        },
      },
    };

    return counts;
  }

  // --- WORKFLOW & VERSIONING HELPERS ---
  public addWorkflowReviewLog(review: Omit<WorkflowReviewLog, 'id' | 'timestamp'>): WorkflowReviewLog {
    const logs = this.getWorkflowLogs();
    const newLog: WorkflowReviewLog = {
      ...review,
      id: `WFL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setStorage(STORAGE_KEYS.WORKFLOW_LOGS, logs);
    return newLog;
  }

  public recordVersionHistory(entry: Omit<ContentVersionEntry, 'id' | 'timestamp'>): ContentVersionEntry {
    const entries = this.getVersionEntries();
    // Sanitize snapshot if it contains base64 image data to prevent localStorage quota exhaustion
    let cleanSnapshot = entry.snapshot;
    if (cleanSnapshot && typeof cleanSnapshot === 'object') {
      const snapObj = { ...(cleanSnapshot as any) };
      if (snapObj.imageUrl && snapObj.imageUrl.startsWith('data:')) {
        snapObj.imageUrl = '[DATA_IMAGE]';
      }
      if (snapObj.image_url && snapObj.image_url.startsWith('data:')) {
        snapObj.image_url = '[DATA_IMAGE]';
      }
      cleanSnapshot = snapObj;
    }

    const newEntry: ContentVersionEntry = {
      ...entry,
      snapshot: cleanSnapshot,
      id: `VER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    entries.unshift(newEntry);
    if (entries.length > 30) entries.length = 30;
    this.setStorage(STORAGE_KEYS.VERSION_ENTRIES, entries);
    return newEntry;
  }

  public getReviewQueue() {
    const missions = this.getMissions().filter((m) => m.status === 'review');
    const lessons = this.getLessons().filter((l) => l.status === 'review');
    const activities = this.getActivities().filter((a) => a.status === 'review');
    const questions = this.getPracticeQuestions().filter((q) => q.status === 'review');
    const tournamentQuestions = this.getTournamentQuestions().filter((tq) => tq.status === 'review');

    return {
      missions,
      lessons,
      activities,
      questions,
      tournamentQuestions,
      totalPending: missions.length + lessons.length + activities.length + questions.length + tournamentQuestions.length,
    };
  }

  // --- MISSION CRUD ---
  public createMission(mission: Omit<Mission, 'id'>): Mission {
    const list = this.getMissions();
    const id = mission.code || `MIS-${String(list.length + 1).padStart(2, '0')}`;
    const newMission: Mission = {
      ...mission,
      id,
      code: mission.code || id,
      orderIndex: mission.orderIndex || list.length + 1,
      levelNumber: mission.levelNumber || list.length + 1,
      status: mission.status || 'draft',
    };
    list.push(newMission);
    this.setStorage(STORAGE_KEYS.MISSIONS, list);

    this.recordVersionHistory({
      entityType: 'mission',
      entityId: newMission.id,
      versionNumber: 'v1.0',
      updatedBy: 'Admin Kurikulum BI',
      changeSummary: 'Misi baru berhasil dibuat dalam status Draft.',
      snapshot: newMission,
    });

    return newMission;
  }

  public updateMission(
    id: string,
    updates: Partial<Mission>,
    updatedBy: string = 'Admin Kurikulum BI',
    changeSummary: string = 'Pembaruan data misi'
  ): Mission | undefined {
    const canonical = normalizeMissionId(id);
    const list = this.getMissions();
    const idx = list.findIndex((m) => {
      const mCanonical = normalizeMissionId(m.id);
      return (
        m.id === id ||
        m.id === canonical ||
        m.code === id ||
        m.code === canonical ||
        mCanonical === canonical
      );
    });
    if (idx < 0) return undefined;

    const previous = list[idx];
    const updated: Mission = { ...previous, ...updates };
    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.MISSIONS, list);

    this.recordVersionHistory({
      entityType: 'mission',
      entityId: id,
      versionNumber: `v1.${Date.now().toString().slice(-2)}`,
      updatedBy,
      changeSummary,
      snapshot: updated,
    });

    this.notify();
    return updated;
  }

  public deleteMission(id: string): boolean {
    const canonical = normalizeMissionId(id);
    const list = this.getMissions();
    const filtered = list.filter((m) => {
      const mCanonical = normalizeMissionId(m.id || m.code);
      return m.id !== id && m.code !== id && mCanonical !== canonical;
    });
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.MISSIONS, filtered);
    this.notify();

    // Remove from Firestore
    try {
      deleteCloudDoc('missions', canonical).catch(() => {});
      if (id !== canonical) deleteCloudDoc('missions', id).catch(() => {});
    } catch {
      // ignore
    }
    return true;
  }

  public deleteAllMissions(clearAllContent: boolean = true): boolean {
    const current = this.getMissions();
    this.setStorage(STORAGE_KEYS.MISSIONS, []);
    if (clearAllContent) {
      this.setStorage(STORAGE_KEYS.LESSONS, []);
      this.setStorage(STORAGE_KEYS.ACTIVITIES, []);
      this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, []);
      this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, []);
      this.setStorage(STORAGE_KEYS.REFLECTIONS, []);
      this.setStorage(STORAGE_KEYS.BADGES, []);
    }
    this.notify();

    try {
      current.forEach((m) => {
        const canonical = normalizeMissionId(m.id || m.code);
        deleteCloudDoc('missions', canonical).catch(() => {});
      });
    } catch {
      // ignore
    }
    return true;
  }

  /**
   * Permanently saves current mission set & curriculum master as System Default
   * to both local browser storage, backend server, and Firebase Firestore (settings/system_default + missions collection).
   */
  public async persistSystemDefaultMaster(
    author: string = 'Admin Kurikulum BI'
  ): Promise<{
    success: boolean;
    missionsCount: number;
    lessonsCount?: number;
    cloudSynced: boolean;
    serverDiskSaved?: boolean;
  }> {
    const currentMissions = this.getMissions();
    const currentLessons = this.getLessons();
    const currentActivities = this.getActivities();
    const currentPractice = this.getPracticeQuestions();
    const currentBadges = this.getBadges();
    const currentReflections = this.getReflections();
    const currentReferences = this.getReferences();
    const currentTournamentPkgs = this.getTournamentPackages();
    const currentTournamentQuestions = this.getTournamentQuestions();
    const currentTournamentEvents = this.getTournamentEvents();
    const currentFinalMissionQuestions = this.getFinalMissionQuestions();

    const payload = {
      id: 'system_default',
      updatedAt: new Date().toISOString(),
      updatedBy: author,
      version: Date.now(),
      missions: currentMissions,
      lessons: currentLessons,
      activities: currentActivities,
      practiceQuestions: currentPractice,
      badges: currentBadges,
      reflections: currentReflections,
      references: currentReferences,
      tournamentPackages: currentTournamentPkgs,
      tournamentQuestions: currentTournamentQuestions,
      tournamentEvents: currentTournamentEvents,
      finalMissionQuestions: currentFinalMissionQuestions,
    };

    // 1. Simpan ke local browser storage untuk cache instan
    try {
      localStorage.setItem('jr_db_custom_default_master', JSON.stringify(payload));
    } catch (e) {
      console.warn('[DB] Failed saving custom default to localStorage:', e);
    }

    // 2. Kirim ke backend server agar tersimpan di disk server secara permanen
    let serverDiskSaved = false;
    try {
      const serverRes = await Promise.race([
        fetch('/api/set-system-default', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Server write timeout')), 5000)),
      ]);
      if (serverRes && serverRes.ok) {
        serverDiskSaved = true;
        console.log('[DB] Sukses simpan default sistem ke disk server.');
      }
    } catch (e) {
      console.warn('[DB] Server disk persistence error:', e);
    }

    // 3. Simpan ke Firebase Firestore secara cepat menggunakan atomic batches
    let cloudSynced = false;
    try {
      await Promise.race([
        (async () => {
          // a. Simpan ringkasan master ke settings/system_default (ringan tanpa blob)
          const summaryPayload = {
            id: 'system_default',
            updatedAt: new Date().toISOString(),
            updatedBy: author,
            version: Date.now(),
            missionsCount: currentMissions.length,
            lessonsCount: currentLessons.length,
            badgesCount: currentBadges.length,
            serverDiskSaved,
          };
          await saveCloudDoc('settings', 'system_default', summaryPayload);

          // b. Simpan semua misi secara batch atomic (1 request cepat)
          const missionDocs = currentMissions.map((m) => {
            const canonical = normalizeMissionId(m.id || m.code);
            return {
              ...m,
              id: canonical,
              code: canonical,
              _updatedAt: new Date().toISOString(),
            };
          });
          await batchSaveCloudDocs('missions', missionDocs);

          // c. Simpan semua materi (lessons) secara batch atomic
          const lessonDocs = currentLessons
            .filter((l) => l && (l.id || l.code))
            .map((l) => {
              const docId = String(l.id || l.code).replace(/[^a-zA-Z0-9_-]/g, '_');
              return {
                ...l,
                id: docId,
                _updatedAt: new Date().toISOString(),
              };
            });
          if (lessonDocs.length > 0) {
            await batchSaveCloudDocs('lessons', lessonDocs);
          }

          // d. Simpan master Misi Akhir ke settings/final_mission_master
          if (currentFinalMissionQuestions && currentFinalMissionQuestions.length > 0) {
            await saveCloudDoc('settings', 'final_mission_master', {
              id: 'final_mission_master',
              updatedAt: new Date().toISOString(),
              updatedBy: author,
              questionsCount: currentFinalMissionQuestions.length,
              questions: currentFinalMissionQuestions,
            }).catch(() => {});
          }

          cloudSynced = true;
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore cloud timeout (6 detik)')), 6000)),
      ]);
    } catch (err) {
      console.warn('[DB] Cloud sync for system default encountered error or timeout:', err);
    }

    this.notify();
    return {
      success: true,
      missionsCount: currentMissions.length,
      lessonsCount: currentLessons.length,
      cloudSynced,
      serverDiskSaved,
    };
  }

  /**
   * Pushes Final Mission questions and image metadata to Cloud Firestore & Server Disk
   */
  public async pushFinalMissionQuestionsToCloud(questions: FinalMissionQuestion[]): Promise<boolean> {
    if (!questions || !Array.isArray(questions) || questions.length === 0) return false;
    try {
      // 1. Post to backend server disk
      fetch('/api/final-mission-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          updatedAt: new Date().toISOString(),
          author: 'Super Admin',
        }),
      }).catch((e) => console.warn('[DB] Server disk final mission push notice:', e));

      // 2. Save master doc in Firestore
      const masterDoc = {
        id: 'final_mission_master',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Super Admin',
        questionsCount: questions.length,
        questions: questions,
      };
      saveCloudDoc('settings', 'final_mission_master', masterDoc).catch((e) => {
        console.warn('[Firebase] push final_mission_master notice:', e);
      });

      return true;
    } catch (err) {
      console.warn('[DB] pushFinalMissionQuestionsToCloud error:', err);
      return false;
    }
  }

  /**
   * Permanently save Final Mission bank (questions + uploaded images) to Server Disk & Cloud Firestore
   * to guarantee 100% cross-device, cross-account availability.
   */
  public async persistFinalMissionMaster(
    author: string = 'Super Admin'
  ): Promise<{
    success: boolean;
    questionsCount: number;
    cloudSynced: boolean;
    serverDiskSaved: boolean;
  }> {
    const currentQuestions = this.getFinalMissionQuestions();
    let serverDiskSaved = false;
    let cloudSynced = false;

    // 1. Simpan ke backend server disk (/api/final-mission-questions)
    try {
      const serverRes = await Promise.race([
        fetch('/api/final-mission-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author,
            updatedAt: new Date().toISOString(),
            questions: currentQuestions,
          }),
        }),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Server write timeout')), 5000)),
      ]);
      if (serverRes && serverRes.ok) {
        serverDiskSaved = true;
        console.log(`[DB] Berhasil menyimpan ${currentQuestions.length} butir soal Misi Akhir ke disk server.`);
      }
    } catch (e) {
      console.warn('[DB] Server disk persistence for final mission error:', e);
    }

    // 2. Simpan ke Cloud Firestore (settings/final_mission_master)
    try {
      await Promise.race([
        saveCloudDoc('settings', 'final_mission_master', {
          id: 'final_mission_master',
          updatedAt: new Date().toISOString(),
          updatedBy: author,
          questionsCount: currentQuestions.length,
          questions: currentQuestions,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore cloud timeout (6 detik)')), 6000)),
      ]);
      cloudSynced = true;
      console.log(`[DB] Berhasil menyinkronkan ${currentQuestions.length} butir soal Misi Akhir ke Cloud Firestore.`);
    } catch (e) {
      console.warn('[DB] Firestore cloud sync for final mission master error:', e);
    }

    this.notify();
    return {
      success: serverDiskSaved || cloudSynced,
      questionsCount: currentQuestions.length,
      cloudSynced,
      serverDiskSaved,
    };
  }

  /**
   * Manually pulls the latest System Default Master from Firebase Firestore
   * to ensure full multi-device synchronization.
   */
  public async pullSystemDefaultFromCloud(): Promise<{ success: boolean; message: string; missionsCount: number }> {
    try {
      await initFirebaseAuth();
      const docRef = doc(firestore, 'settings', 'system_default');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudMaster = snap.data() as any;
        if (cloudMaster && cloudMaster.missions && Array.isArray(cloudMaster.missions) && cloudMaster.missions.length > 0) {
          localStorage.setItem('jr_db_custom_default_master', JSON.stringify(cloudMaster));
          this.isCloudSyncing = true;
          const sorted = [...cloudMaster.missions].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
          this.setStorage(STORAGE_KEYS.MISSIONS, sorted);
          if (cloudMaster.lessons) this.setStorage(STORAGE_KEYS.LESSONS, cloudMaster.lessons);
          if (cloudMaster.activities) this.setStorage(STORAGE_KEYS.ACTIVITIES, cloudMaster.activities);
          if (cloudMaster.practiceQuestions) this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, cloudMaster.practiceQuestions);
          if (cloudMaster.badges) this.setStorage(STORAGE_KEYS.BADGES, cloudMaster.badges);
          if (cloudMaster.reflections) this.setStorage(STORAGE_KEYS.REFLECTIONS, cloudMaster.reflections);
          this.isCloudSyncing = false;
          this.notify();
          return {
            success: true,
            message: `Berhasil menarik ${cloudMaster.missions.length} misi dari Cloud Firestore!`,
            missionsCount: cloudMaster.missions.length,
          };
        }
      }

      // If no system_default document yet, try pulling from 'missions' collection
      const cloudMissions = await getCloudCollection<Mission>('missions');
      if (cloudMissions && cloudMissions.length > 0) {
        const sorted = cloudMissions.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        this.isCloudSyncing = true;
        this.setStorage(STORAGE_KEYS.MISSIONS, sorted);
        this.isCloudSyncing = false;
        this.notify();
        return {
          success: true,
          message: `Berhasil menarik ${sorted.length} misi dari koleksi Cloud!`,
          missionsCount: sorted.length,
        };
      }

      return {
        success: false,
        message: 'Belum ada data misi kustom di Cloud Firestore.',
        missionsCount: 0,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal menghubungi Cloud Firestore: ' + (err?.message || ''),
        missionsCount: 0,
      };
    }
  }

  public resetMissionsToDefault(): boolean {
    let activeMissions = seedMissions;
    let activeLessons = seedLessons;
    let activeActivities = seedActivities;
    let activePractice = seedPracticeQuestions;
    let activeTournamentQuestions = seedTournamentQuestions;
    let activeReflections = seedReflections;
    let activeBadges = seedBadges;

    try {
      const savedMasterRaw = localStorage.getItem('jr_db_custom_default_master');
      if (savedMasterRaw) {
        const parsed = JSON.parse(savedMasterRaw);
        if (Array.isArray(parsed.missions) && parsed.missions.length > 0) activeMissions = parsed.missions;
        if (Array.isArray(parsed.lessons) && parsed.lessons.length > 0) activeLessons = parsed.lessons;
        if (Array.isArray(parsed.activities) && parsed.activities.length > 0) activeActivities = parsed.activities;
        if (Array.isArray(parsed.practiceQuestions) && parsed.practiceQuestions.length > 0) activePractice = parsed.practiceQuestions;
        if (Array.isArray(parsed.tournamentQuestions) && parsed.tournamentQuestions.length > 0) activeTournamentQuestions = parsed.tournamentQuestions;
        if (Array.isArray(parsed.reflections) && parsed.reflections.length > 0) activeReflections = parsed.reflections;
        if (Array.isArray(parsed.badges) && parsed.badges.length > 0) activeBadges = parsed.badges;
      }
    } catch {}

    this.setStorage(STORAGE_KEYS.MISSIONS, activeMissions);
    this.setStorage(STORAGE_KEYS.LESSONS, activeLessons);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, activeActivities);
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, activePractice);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, activeTournamentQuestions);
    this.setStorage(STORAGE_KEYS.REFLECTIONS, activeReflections);
    this.setStorage(STORAGE_KEYS.BADGES, activeBadges);
    this.notify();
    return true;
  }

  public deleteAllPracticeQuestions(): boolean {
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, []);
    this.notify();
    return true;
  }

  public deleteAllTournamentQuestions(): boolean {
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, []);
    this.notify();
    return true;
  }

  public deleteAllActivities(): boolean {
    this.setStorage(STORAGE_KEYS.ACTIVITIES, []);
    this.notify();
    return true;
  }

  public deleteAllEvaluationAndQuestions(): boolean {
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, []);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, []);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, []);
    this.notify();
    return true;
  }

  public resetPracticeQuestionsToDefault(): boolean {
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, seedPracticeQuestions);
    this.notify();
    return true;
  }

  public resetTournamentQuestionsToDefault(): boolean {
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, seedTournamentQuestions);
    this.notify();
    return true;
  }

  public resetActivitiesToDefault(): boolean {
    this.setStorage(STORAGE_KEYS.ACTIVITIES, seedActivities);
    this.notify();
    return true;
  }

  public resetAllEvaluationToDefault(): boolean {
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, seedPracticeQuestions);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, seedTournamentQuestions);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, seedActivities);
    this.notify();
    return true;
  }

  public updateMissionStatus(
    id: string,
    status: ContentStatus,
    reviewerInfo?: { id: string; name: string; notes: string }
  ): Mission | undefined {
    const mission = this.getMissionById(id);
    if (!mission) return undefined;

    const prevStatus = mission.status;
    const updated = this.updateMission(id, { status }, reviewerInfo?.name || 'Admin BI', `Ubah status dari ${prevStatus} ke ${status}`);

    if (reviewerInfo && updated) {
      this.addWorkflowReviewLog({
        entityType: 'mission',
        entityId: updated.id,
        entityTitle: updated.title,
        previousStatus: prevStatus,
        newStatus: status,
        reviewerId: reviewerInfo.id,
        reviewerName: reviewerInfo.name,
        notes: reviewerInfo.notes,
      });
    }

    return updated;
  }

  public reorderMissions(orderedIds: string[]) {
    const list = this.getMissions();
    orderedIds.forEach((id, idx) => {
      const m = list.find((item) => item.id === id || item.code === id);
      if (m) {
        m.orderIndex = idx + 1;
        m.levelNumber = idx + 1;
      }
    });
    list.sort((a, b) => a.orderIndex - b.orderIndex);
    this.setStorage(STORAGE_KEYS.MISSIONS, list);
  }

  // --- LESSON (MATERI) CRUD ---
  public createLesson(lesson: Omit<Lesson, 'id'>): Lesson {
    const list = this.getLessons();
    const id = lesson.code || `MAT-${String(list.length + 1).padStart(3, '0')}`;
    const newLesson: Lesson = {
      ...lesson,
      id,
      code: lesson.code || id,
      orderIndex: lesson.orderIndex || list.filter((l) => l.missionId === lesson.missionId).length + 1,
      status: lesson.status || 'draft',
    };
    list.push(newLesson);
    this.setStorage(STORAGE_KEYS.LESSONS, list);

    this.recordVersionHistory({
      entityType: 'lesson',
      entityId: newLesson.id,
      versionNumber: 'v1.0',
      updatedBy: 'Admin Kurikulum BI',
      changeSummary: 'Materi baru berhasil dibuat dalam status Draft.',
      snapshot: newLesson,
    });

    this.notify();
    return newLesson;
  }

  public updateLesson(
    id: string,
    updates: Partial<Lesson>,
    updatedBy: string = 'Admin Kurikulum BI',
    changeSummary: string = 'Pembaruan materi pembelajaran'
  ): Lesson | undefined {
    const list = this.getLessons();
    let idx = list.findIndex(
      (l) =>
        l.id === id ||
        l.code === id ||
        (l as any).content_id === id ||
        l.id.toLowerCase() === id.toLowerCase() ||
        l.code.toLowerCase() === id.toLowerCase()
    );

    // Fallback match: if ID not directly found, match by missionId + contentOrder / orderIndex
    if (idx < 0 && updates.missionId && (updates.contentOrder || updates.orderIndex)) {
      const targetOrder = Number(updates.contentOrder || updates.orderIndex);
      const targetMission = normalizeMissionId(updates.missionId);
      idx = list.findIndex(
        (l) =>
          normalizeMissionId(l.missionId) === targetMission &&
          (Number(l.contentOrder || l.orderIndex) === targetOrder)
      );
    }

    if (idx < 0) {
      // If still not found in existing list, create/append it as new lesson
      const newLesson = this.createLesson({
        ...updates,
        code: updates.code || id,
        title: updates.title || 'Materi Baru',
        content: updates.content || updates.studentText || '',
        studentText: updates.studentText || updates.content || '',
        missionId: updates.missionId || 'JR-C01',
        imageUrl: updates.imageUrl || '',
        orderIndex: Number(updates.orderIndex || updates.contentOrder || 1),
        contentOrder: Number(updates.contentOrder || updates.orderIndex || 1),
        status: updates.status || 'published',
      } as any);
      return newLesson;
    }

    const previous = list[idx];
    const updated: Lesson = {
      ...previous,
      ...updates,
      id: previous.id || id,
      code: updates.code || previous.code || id,
      ...(updates.imageUrl !== undefined
        ? { image_url: updates.imageUrl, imageUrl: updates.imageUrl }
        : {}),
      ...(updates.studentText !== undefined
        ? {
            student_text: updates.studentText,
            studentText: updates.studentText,
            content: updates.studentText,
          }
        : {}),
    };

    if (updates.imageUrl !== undefined) {
      const order = Number(updated.contentOrder || updated.orderIndex || 1);
      const mission = normalizeMissionId(updated.missionId);
      const keys = buildLessonImageKeys(updated.id, mission, order, updated.code);
      if (updates.imageUrl && updates.imageUrl.trim() !== '') {
        saveImageToStore(updated.id, updates.imageUrl, keys);
      } else {
        deleteImageFromStore(keys);
      }
    }

    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.LESSONS, list);

    this.recordVersionHistory({
      entityType: 'lesson',
      entityId: id,
      versionNumber: `v1.${Date.now().toString().slice(-2)}`,
      updatedBy,
      changeSummary,
      snapshot: updated,
    });

    this.notify();
    return updated;
  }

  public deleteLesson(id: string): boolean {
    const list = this.getLessons();
    const filtered = list.filter((l) => l.id !== id && l.code !== id);
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.LESSONS, filtered);
    this.notify();
    return true;
  }

  public updateLessonStatus(
    id: string,
    status: ContentStatus,
    reviewerInfo?: { id: string; name: string; notes: string }
  ): Lesson | undefined {
    const lessons = this.getLessons();
    const lesson = lessons.find((l) => l.id === id || l.code === id);
    if (!lesson) return undefined;

    const prevStatus = lesson.status;
    const updated = this.updateLesson(id, { status }, reviewerInfo?.name || 'Admin BI', `Ubah status dari ${prevStatus} ke ${status}`);

    if (reviewerInfo && updated) {
      this.addWorkflowReviewLog({
        entityType: 'lesson',
        entityId: updated.id,
        entityTitle: updated.title,
        previousStatus: prevStatus,
        newStatus: status,
        reviewerId: reviewerInfo.id,
        reviewerName: reviewerInfo.name,
        notes: reviewerInfo.notes,
      });
    }

    return updated;
  }

  public reorderLessons(orderedIds: string[]) {
    const list = this.getLessons();
    orderedIds.forEach((id, idx) => {
      const l = list.find((item) => item.id === id || item.code === id);
      if (l) {
        l.orderIndex = idx + 1;
      }
    });
    list.sort((a, b) => a.orderIndex - b.orderIndex);
    this.setStorage(STORAGE_KEYS.LESSONS, list);
  }

  /**
   * Smart Reconciliation for Lessons:
   * When new materials are uploaded or imported, automatically checks each mission and card slot.
   * Preserves already matching & customized materials (including uploaded images), while updating/inserting new or changed items.
   */
  public reconcileLessons(incomingLessons: Partial<Lesson>[], importedBy: string = 'Admin Kurikulum'): { updated: number; added: number; preserved: number } {
    const currentList = this.getLessons();
    let updatedCount = 0;
    let addedCount = 0;
    let preservedCount = 0;

    const updatedList = [...currentList];

    for (const item of incomingLessons) {
      if (!item.missionId && !item.title) continue;

      const normalizedMission = normalizeMissionId(item.missionId);
      const targetOrder = Number(item.contentOrder || item.orderIndex || 1);

      // Check if slot or ID already exists in current database
      const existingIdx = updatedList.findIndex(
        (l) =>
          (item.id && (l.id === item.id || l.code === item.id)) ||
          (item.code && (l.code === item.code || l.id === item.code)) ||
          (normalizeMissionId(l.missionId) === normalizedMission &&
            (Number(l.contentOrder || l.orderIndex) === targetOrder))
      );

      if (existingIdx >= 0) {
        const existing = updatedList[existingIdx];
        // Check if there are real updates
        const hasChange =
          (item.title && item.title !== existing.title) ||
          (item.studentText && item.studentText !== existing.studentText) ||
          (item.content && item.content !== existing.content) ||
          (item.summary && item.summary !== existing.summary) ||
          (item.imageUrl && item.imageUrl !== existing.imageUrl);

        if (hasChange) {
          // Keep existing uploaded image if incoming doesn't provide a new image
          const preservedImage = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : existing.imageUrl;
          updatedList[existingIdx] = {
            ...existing,
            ...item,
            id: existing.id,
            code: item.code || existing.code,
            missionId: normalizedMission,
            contentOrder: targetOrder,
            orderIndex: targetOrder,
            imageUrl: preservedImage,
            image_url: preservedImage,
            studentText: item.studentText || item.content || existing.studentText || existing.content,
            content: item.studentText || item.content || existing.studentText || existing.content,
          };
          updatedCount++;
        } else {
          preservedCount++;
        }
      } else {
        // Add as new card in the curriculum
        const newId = item.code || `MAT-${String(updatedList.length + 1).padStart(3, '0')}`;
        const newLesson: Lesson = {
          id: newId,
          code: item.code || newId,
          missionId: normalizedMission,
          title: item.title || 'Materi Baru',
          summary: item.summary || '',
          studentText: item.studentText || item.content || '',
          content: item.studentText || item.content || '',
          keyTakeaways: item.keyTakeaways || (item.keyTakeaway ? [item.keyTakeaway] : []),
          keyTakeaway: item.keyTakeaway || '',
          imageUrl: item.imageUrl || '',
          image_url: item.imageUrl || '',
          imageBrief: item.imageBrief || item.imageCaption || '',
          imageCaption: item.imageCaption || item.imageBrief || '',
          interactionPrompt: item.interactionPrompt || '',
          gradeScope: item.gradeScope || 'Semua Tingkat',
          contentType: item.contentType || 'article',
          readTimeMinutes: Number(item.readTimeMinutes || 3),
          contentOrder: targetOrder,
          orderIndex: targetOrder,
          status: item.status || 'published',
        };
        updatedList.push(newLesson);
        addedCount++;
      }
    }

    // Sort strictly by mission and card order
    updatedList.sort((a, b) => {
      const missionA = a.missionId || '';
      const missionB = b.missionId || '';
      if (missionA !== missionB) return missionA.localeCompare(missionB);
      return (Number(a.contentOrder || a.orderIndex) || 1) - (Number(b.contentOrder || b.orderIndex) || 1);
    });

    this.setStorage(STORAGE_KEYS.LESSONS, updatedList);
    this.recordVersionHistory({
      entityType: 'lesson',
      entityId: 'CURRICULUM_SYNC',
      versionNumber: `v1.${Date.now().toString().slice(-2)}`,
      updatedBy: importedBy,
      changeSummary: `Penyesuaian kurikulum: ${updatedCount} diperbarui, ${addedCount} ditambahkan, ${preservedCount} tetap sesuai.`,
      snapshot: { count: updatedList.length },
    });

    this.notify();
    return { updated: updatedCount, added: addedCount, preserved: preservedCount };
  }

  // --- ACTIVITY CRUD ---
  public createActivity(activity: Omit<Activity, 'id'>): Activity {
    const list = this.getActivities();
    const id = activity.code || `ACT-${String(list.length + 1).padStart(3, '0')}`;
    const newActivity: Activity = {
      ...activity,
      id,
      code: activity.code || id,
      orderIndex: activity.orderIndex || list.filter((a) => a.missionId === activity.missionId).length + 1,
      status: activity.status || 'draft',
    };
    list.push(newActivity);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, list);

    this.recordVersionHistory({
      entityType: 'activity',
      entityId: newActivity.id,
      versionNumber: 'v1.0',
      updatedBy: 'Admin Kurikulum BI',
      changeSummary: 'Aktivitas interaktif baru dibuat dalam status Draft.',
      snapshot: newActivity,
    });

    return newActivity;
  }

  public updateActivity(
    id: string,
    updates: Partial<Activity>,
    updatedBy: string = 'Admin Kurikulum BI',
    changeSummary: string = 'Pembaruan data aktivitas'
  ): Activity | undefined {
    const list = this.getActivities();
    const idx = list.findIndex((a) => a.id === id || a.code === id);
    if (idx < 0) return undefined;

    const previous = list[idx];
    const updated: Activity = { ...previous, ...updates };
    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.ACTIVITIES, list);

    this.recordVersionHistory({
      entityType: 'activity',
      entityId: id,
      versionNumber: `v1.${Date.now().toString().slice(-2)}`,
      updatedBy,
      changeSummary,
      snapshot: updated,
    });

    return updated;
  }

  public deleteActivity(id: string): boolean {
    const list = this.getActivities();
    const filtered = list.filter((a) => a.id !== id && a.code !== id);
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.ACTIVITIES, filtered);
    return true;
  }

  public updateActivityStatus(
    id: string,
    status: ContentStatus,
    reviewerInfo?: { id: string; name: string; notes: string }
  ): Activity | undefined {
    const activities = this.getActivities();
    const act = activities.find((a) => a.id === id || a.code === id);
    if (!act) return undefined;

    const prevStatus = act.status;
    const updated = this.updateActivity(id, { status }, reviewerInfo?.name || 'Admin BI', `Ubah status dari ${prevStatus} ke ${status}`);

    if (reviewerInfo && updated) {
      this.addWorkflowReviewLog({
        entityType: 'activity',
        entityId: updated.id,
        entityTitle: updated.title,
        previousStatus: prevStatus,
        newStatus: status,
        reviewerId: reviewerInfo.id,
        reviewerName: reviewerInfo.name,
        notes: reviewerInfo.notes,
      });
    }

    return updated;
  }

  // --- PRACTICE QUESTION CRUD ---
  public createPracticeQuestion(q: Omit<PracticeQuestion, 'id'>): PracticeQuestion {
    const list = this.getPracticeQuestions();
    const id = q.code || `QST-${String(list.length + 1).padStart(3, '0')}`;
    const newQuestion: PracticeQuestion = {
      ...q,
      id,
      code: q.code || id,
      status: q.status || 'draft',
      points: q.points || 10,
    };
    list.push(newQuestion);
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, list);

    this.recordVersionHistory({
      entityType: 'question',
      entityId: newQuestion.id,
      versionNumber: 'v1.0',
      updatedBy: 'Admin Kurikulum BI',
      changeSummary: 'Soal latihan baru dibuat.',
      snapshot: newQuestion,
    });

    return newQuestion;
  }

  public updatePracticeQuestion(
    id: string,
    updates: Partial<PracticeQuestion>,
    updatedBy: string = 'Admin Kurikulum BI',
    changeSummary: string = 'Pembaruan butir soal latihan'
  ): PracticeQuestion | undefined {
    const list = this.getPracticeQuestions();
    const idx = list.findIndex((q) => q.id === id || q.code === id);
    if (idx < 0) return undefined;

    const previous = list[idx];
    const updated: PracticeQuestion = { ...previous, ...updates };
    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, list);

    this.recordVersionHistory({
      entityType: 'question',
      entityId: id,
      versionNumber: `v1.${Date.now().toString().slice(-2)}`,
      updatedBy,
      changeSummary,
      snapshot: updated,
    });

    return updated;
  }

  public deletePracticeQuestion(id: string): boolean {
    const list = this.getPracticeQuestions();
    const filtered = list.filter((q) => q.id !== id && q.code !== id);
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, filtered);
    return true;
  }

  public updatePracticeQuestionStatus(
    id: string,
    status: ContentStatus,
    reviewerInfo?: { id: string; name: string; notes: string }
  ): PracticeQuestion | undefined {
    const list = this.getPracticeQuestions();
    const question = list.find((q) => q.id === id || q.code === id);
    if (!question) return undefined;

    const prevStatus = question.status;
    const updated = this.updatePracticeQuestion(id, { status }, reviewerInfo?.name || 'Admin BI', `Ubah status dari ${prevStatus} ke ${status}`);

    if (reviewerInfo && updated) {
      this.addWorkflowReviewLog({
        entityType: 'question',
        entityId: updated.id,
        entityTitle: updated.question.slice(0, 50),
        previousStatus: prevStatus,
        newStatus: status,
        reviewerId: reviewerInfo.id,
        reviewerName: reviewerInfo.name,
        notes: reviewerInfo.notes,
      });
    }

    return updated;
  }

  public bulkUpdateQuestionStatus(ids: string[], status: ContentStatus, reviewerName: string = 'Admin BI') {
    const list = this.getPracticeQuestions();
    let count = 0;
    list.forEach((q) => {
      if (ids.includes(q.id) || ids.includes(q.code)) {
        q.status = status;
        count++;
      }
    });
    this.setStorage(STORAGE_KEYS.PRACTICE_QUESTIONS, list);
    return count;
  }

  // --- TOURNAMENT QUESTION CRUD & COMPARISON ---
  public createTournamentQuestion(tq: Omit<TournamentQuestion, 'id'>): TournamentQuestion {
    const list = this.getTournamentQuestions();
    const id = tq.code || `TQ-${String(list.length + 1).padStart(3, '0')}`;
    const newQuestion: TournamentQuestion = {
      ...tq,
      id,
      code: tq.code || id,
      status: tq.status || 'draft',
      points: tq.points || 100,
    };
    list.push(newQuestion);
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, list);

    this.recordVersionHistory({
      entityType: 'tournament_question',
      entityId: newQuestion.id,
      versionNumber: 'v1.0',
      updatedBy: 'Admin Kurikulum BI',
      changeSummary: 'Soal turnamen baru dibuat.',
      snapshot: newQuestion,
    });

    return newQuestion;
  }

  public updateTournamentQuestion(
    id: string,
    updates: Partial<TournamentQuestion>,
    updatedBy: string = 'Admin Kurikulum BI',
    changeSummary: string = 'Pembaruan butir soal turnamen'
  ): TournamentQuestion | undefined {
    const list = this.getTournamentQuestions();
    const idx = list.findIndex((q) => q.id === id || q.code === id);
    if (idx < 0) return undefined;

    const previous = list[idx];
    const updated: TournamentQuestion = { ...previous, ...updates };
    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, list);

    this.recordVersionHistory({
      entityType: 'tournament_question',
      entityId: id,
      versionNumber: `v1.${Date.now().toString().slice(-2)}`,
      updatedBy,
      changeSummary,
      snapshot: updated,
    });

    return updated;
  }

  public deleteTournamentQuestion(id: string): boolean {
    const list = this.getTournamentQuestions();
    const filtered = list.filter((q) => q.id !== id && q.code !== id);
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.TOURNAMENT_QUESTIONS, filtered);
    return true;
  }

  public updateTournamentQuestionStatus(
    id: string,
    status: ContentStatus,
    reviewerInfo?: { id: string; name: string; notes: string }
  ): TournamentQuestion | undefined {
    const list = this.getTournamentQuestions();
    const tq = list.find((q) => q.id === id || q.code === id);
    if (!tq) return undefined;

    const prevStatus = tq.status;
    const updated = this.updateTournamentQuestion(id, { status }, reviewerInfo?.name || 'Admin BI', `Ubah status dari ${prevStatus} ke ${status}`);

    if (reviewerInfo && updated) {
      this.addWorkflowReviewLog({
        entityType: 'tournament_question',
        entityId: updated.id,
        entityTitle: updated.question.slice(0, 50),
        previousStatus: prevStatus,
        newStatus: status,
        reviewerId: reviewerInfo.id,
        reviewerName: reviewerInfo.name,
        notes: reviewerInfo.notes,
      });
    }

    return updated;
  }

  // --- REFLECTION CRUD ---
  public createReflection(reflection: Omit<Reflection, 'id'> & { id?: string }): Reflection {
    const list = this.getReflections();
    const id = reflection.id || reflection.code || `RFL-${String(list.length + 1).padStart(2, '0')}`;
    const newRefl: Reflection = {
      ...reflection,
      id,
      code: reflection.code || id,
      prompt: reflection.prompt || '',
      guideQuestions: reflection.guideQuestions || [],
      status: reflection.status || 'published',
    };
    list.push(newRefl);
    this.setStorage(STORAGE_KEYS.REFLECTIONS, list);
    this.notify();
    return newRefl;
  }

  public updateReflection(id: string, updates: Partial<Reflection>, updatedBy: string = 'Admin Kurikulum BI', changeSummary: string = 'Pembaruan refleksi'): Reflection | undefined {
    const list = this.getReflections();
    const canonical = normalizeMissionId(id);
    const idx = list.findIndex((r) => r.id === id || r.code === id || r.missionId === id || normalizeMissionId(r.missionId) === canonical);
    if (idx < 0) return undefined;

    const updated: Reflection = { ...list[idx], ...updates };
    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.REFLECTIONS, list);
    this.notify();
    return updated;
  }

  public deleteReflection(id: string): boolean {
    const list = this.getReflections();
    const canonical = normalizeMissionId(id);
    const filtered = list.filter((r) => r.id !== id && r.code !== id && r.missionId !== id && normalizeMissionId(r.missionId) !== canonical);
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.REFLECTIONS, filtered);
    this.notify();
    return true;
  }

  // --- REFERENCE CRUD ---
  public createReference(ref: Omit<Reference, 'id'>): Reference {
    const list = this.getReferences();
    const id = ref.code || `REF-${String(list.length + 1).padStart(2, '0')}`;
    const newRef: Reference = {
      ...ref,
      id,
      code: ref.code || id,
      status: ref.status || 'published',
    };
    list.push(newRef);
    this.setStorage(STORAGE_KEYS.REFERENCES, list);
    return newRef;
  }

  public updateReference(id: string, updates: Partial<Reference>): Reference | undefined {
    const list = this.getReferences();
    const idx = list.findIndex((r) => r.id === id || r.code === id);
    if (idx < 0) return undefined;

    const updated: Reference = { ...list[idx], ...updates };
    list[idx] = updated;
    this.setStorage(STORAGE_KEYS.REFERENCES, list);
    return updated;
  }

  public deleteReference(id: string): boolean {
    const list = this.getReferences();
    const filtered = list.filter((r) => r.id !== id && r.code !== id);
    if (filtered.length === list.length) return false;
    this.setStorage(STORAGE_KEYS.REFERENCES, filtered);
    return true;
  }

  // --- USER MANAGEMENT CRUD ---
  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const list = this.getUsers();
    const id = `USR-${String(list.length + 1).padStart(3, '0')}`;
    const newUser: User = {
      ...user,
      id,
      points: user.points || 0,
      level: user.level || 1,
      levelTitle: user.levelTitle || (user.role === 'student' ? 'Pelajar Rupiah' : 'Staf'),
      currentXp: user.currentXp || 0,
      maxXp: user.maxXp || 100,
      avatar: user.avatar || (user.role === 'student' ? 'budi' : 'admin'),
      streakDays: user.streakDays || 1,
      createdAt: new Date().toISOString(),
      isActive: user.isActive !== undefined ? user.isActive : true,
    };
    list.push(newUser);
    this.setStorage(STORAGE_KEYS.USERS, list);
    return newUser;
  }

  public toggleUserStatus(id: string): boolean {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === id);
    if (idx < 0) return false;

    const cur = list[idx].isActive !== false;
    list[idx].isActive = !cur;
    this.setStorage(STORAGE_KEYS.USERS, list);
    return true;
  }

  // --- EXECUTIVE / PIMPINAN / VIEWER REPORTS ---
  public getExecutiveReportsSummary() {
    const users = this.getUsers();
    const students = users.filter((u) => u.role === 'student');
    const classes = this.getClasses();
    const progressList = this.getStudentProgress();
    const results = this.getTournamentResults();
    const badges = this.getBadges();
    const missions = this.getMissions().sort((a, b) => a.orderIndex - b.orderIndex);

    const totalStudents = students.length;
    const totalClasses = classes.length;

    // Completed missions across all students
    const completedProgress = progressList.filter((p) => p.status === 'completed');
    const totalPossibleMissions = (totalStudents || 1) * (missions.length || 9);
    const overallCompletionRate = Math.round((completedProgress.length / totalPossibleMissions) * 100);

    // Active students in past sessions
    const activeStudentIds = new Set(progressList.map((p) => p.studentId));
    const activeStudentsCount = activeStudentIds.size;
    const engagementRate = totalStudents > 0 ? Math.round((activeStudentsCount / totalStudents) * 100) : 0;

    // Duta Distribution
    const studentDutaMap: Record<string, number> = {};
    students.forEach((s) => {
      const studentCompletedCount = completedProgress.filter((p) => p.studentId === s.id).length;
      studentDutaMap[s.id] = studentCompletedCount;
    });

    const dutaSummary = {
      dutaUtama: Object.values(studentDutaMap).filter((c) => c >= 9).length,
      dutaMadya: Object.values(studentDutaMap).filter((c) => c >= 6 && c < 9).length,
      dutaPratama: Object.values(studentDutaMap).filter((c) => c >= 3 && c < 6).length,
      pelajarPemula: Object.values(studentDutaMap).filter((c) => c < 3).length,
    };

    // Tournament Medals Distribution
    const medalsDistribution = {
      gold: results.filter((r) => r.medal === 'gold').length,
      silver: results.filter((r) => r.medal === 'silver').length,
      bronze: results.filter((r) => r.medal === 'bronze').length,
      participant: results.filter((r) => r.medal === 'participant').length,
      verifiedCount: results.filter((r) => r.isVerified).length,
    };

    // 3 Pillars Mastery (Cinta, Bangga, Paham)
    const cintaMissions = missions.filter((m) => m.worldId === 'cinta').map((m) => m.id);
    const banggaMissions = missions.filter((m) => m.worldId === 'bangga').map((m) => m.id);
    const pahamMissions = missions.filter((m) => m.worldId === 'paham').map((m) => m.id);

    const cintaCompleted = completedProgress.filter((p) => cintaMissions.includes(p.missionId)).length;
    const banggaCompleted = completedProgress.filter((p) => banggaMissions.includes(p.missionId)).length;
    const pahamCompleted = completedProgress.filter((p) => pahamMissions.includes(p.missionId)).length;

    const pillarMastery = {
      cinta: {
        title: 'Cinta Rupiah (3D & 5J)',
        completedCount: cintaCompleted,
        possibleCount: (totalStudents || 1) * cintaMissions.length,
        rate: Math.round((cintaCompleted / ((totalStudents || 1) * (cintaMissions.length || 1))) * 100),
      },
      bangga: {
        title: 'Bangga Rupiah (Simbol & Pahlawan)',
        completedCount: banggaCompleted,
        possibleCount: (totalStudents || 1) * banggaMissions.length,
        rate: Math.round((banggaCompleted / ((totalStudents || 1) * (banggaMissions.length || 1))) * 100),
      },
      paham: {
        title: 'Paham Rupiah (Belanja Bijak & Hemat)',
        completedCount: pahamCompleted,
        possibleCount: (totalStudents || 1) * pahamMissions.length,
        rate: Math.round((pahamCompleted / ((totalStudents || 1) * (pahamMissions.length || 1))) * 100),
      },
    };

    // Class Comparisons
    const classComparisons = classes.map((cls) => {
      const members = this.getClassMembers().filter((m) => m.classId === cls.id);
      const studentIds = members.map((m) => m.userId);
      const classProg = completedProgress.filter((p) => studentIds.includes(p.studentId));
      const classPossible = (studentIds.length || 1) * (missions.length || 9);
      const classRate = Math.round((classProg.length / classPossible) * 100);

      const classResults = results.filter((r) => studentIds.includes(r.studentId));
      const avgScore = classResults.length > 0
        ? Math.round(classResults.reduce((sum, r) => sum + r.score, 0) / classResults.length)
        : 85;

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        school: cls.school,
        studentCount: studentIds.length,
        completionRate: classRate,
        avgTournamentScore: avgScore,
        medals: {
          gold: classResults.filter((r) => r.medal === 'gold').length,
          silver: classResults.filter((r) => r.medal === 'silver').length,
          bronze: classResults.filter((r) => r.medal === 'bronze').length,
        },
      };
    });

    return {
      totalStudents,
      totalClasses,
      overallCompletionRate,
      engagementRate,
      activeStudentsCount,
      dutaSummary,
      medalsDistribution,
      pillarMastery,
      classComparisons,
      totalBadgesAwarded: completedProgress.filter((p) => p.badgeAwarded).length,
    };
  }

  // =========================================================================
  // MISI AKHIR: SANG PENJELAJAH RUPIAH DATABASE METHODS
  // =========================================================================

  /**
   * Helper to sort Final Mission questions naturally by ID (Q1, Q2, ..., Q10, Q11, Q12, ..., Q50, Q51, Q52)
   */
  public sortQuestionsNaturally(questions: FinalMissionQuestion[]): FinalMissionQuestion[] {
    return [...questions].sort((a, b) => {
      return (a.id || '').localeCompare(b.id || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }

  /**
   * Sort and persist all Final Mission questions in storage naturally
   */
  public sortAllFinalMissionQuestions(): void {
    const current = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    const sorted = this.sortQuestionsNaturally(current);
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, sorted);
  }

  /**
   * Get all Final Mission questions, optionally filtered by Classification & Stage
   */
  public getFinalMissionQuestions(
    classification?: FinalMissionClassification,
    stage?: string
  ): FinalMissionQuestion[] {
    let questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    if (!questions || questions.length === 0) {
      questions = this.sortQuestionsNaturally(JSON.parse(JSON.stringify(allSeedFinalMissionQuestions)));
      this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
    } else {
      // Auto-migrate: Pastikan butir soal Anak-Anak selalu tersinkronisasi dengan Bank Soal Kuesioner Resmi BI (76 butir: Q1 s.d Q52)
      const anakQuestions = questions.filter((q) => q.classification === 'anak');
      const needsAnakUpdate =
        anakQuestions.length !== seedFinalMissionQuestionsAnak.length ||
        anakQuestions.some((q) => q.id === 'Q1_1' || q.id === 'Q12' || q.id === 'Q13a' || q.id === 'Q38') ||
        !anakQuestions.some((q) => q.id === 'Q52a');

      if (needsAnakUpdate) {
        const nonAnak = questions.filter((q) => q.classification !== 'anak');
        questions = this.sortQuestionsNaturally([...JSON.parse(JSON.stringify(seedFinalMissionQuestionsAnak)), ...nonAnak]);
        this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
      } else {
        // Pastikan Q52a dan Q52b bertipe Checkbox dengan skor 2 poin per centang
        const q52a = questions.find((q) => q.id === 'Q52a');
        const q52b = questions.find((q) => q.id === 'Q52b');
        let needsQ52Update = false;

        if (q52a && q52a.questionType !== 'Checkbox') {
          q52a.questionType = 'Checkbox';
          q52a.optionPoints = [2, 2, 2, 2, 2];
          q52a.points = 10;
          q52a.correctAnswer = 'Semua Pilihan Benar (2 Poin per Pilihan)';
          if (q52a.question.includes('[SA]')) {
            q52a.question = q52a.question.replace('[SA]', '[MA]');
          }
          needsQ52Update = true;
        }

        if (q52b && q52b.questionType !== 'Checkbox') {
          q52b.questionType = 'Checkbox';
          q52b.optionPoints = [2, 2, 2, 2, 2];
          q52b.points = 10;
          q52b.correctAnswer = 'Semua Pilihan Benar (2 Poin per Pilihan)';
          if (q52b.question.includes('[SA]')) {
            q52b.question = q52b.question.replace('[SA]', '[MA]');
          }
          needsQ52Update = true;
        }

        // Pastikan Q31a dan Q31b bertipe Checkbox (Pilihan Ganda Kompleks)
        const q31a = questions.find((q) => q.id === 'Q31a');
        const q31b = questions.find((q) => q.id === 'Q31b');
        let needsQ31Update = false;

        if (q31a && q31a.questionType !== 'Checkbox') {
          q31a.questionType = 'Checkbox';
          if (q31a.question.includes('[SA]')) {
            q31a.question = q31a.question.replace('[SA]', '[MA]');
          }
          needsQ31Update = true;
        }

        if (q31b && q31b.questionType !== 'Checkbox') {
          q31b.questionType = 'Checkbox';
          if (q31b.question.includes('[SA]')) {
            q31b.question = q31b.question.replace('[SA]', '[MA]');
          }
          needsQ31Update = true;
        }

        if (needsQ52Update || needsQ31Update) {
          this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
        }
      }

      // Auto-migrate: Pastikan butir soal Remaja tersinkronisasi dengan Bank Soal Kuesioner Resmi BI Q1 s.d Q60
      const remajaQuestions = questions.filter((q) => q.classification === 'remaja');
      const needsRemajaUpdate =
        remajaQuestions.length !== seedFinalMissionQuestionsRemaja.length ||
        !remajaQuestions.some((q) => q.id === 'Q1a_RMJ') ||
        !remajaQuestions.some((q) => q.id === 'Q60a_RMJ');

      if (needsRemajaUpdate) {
        const nonRemaja = questions.filter((q) => q.classification !== 'remaja');
        questions = this.sortQuestionsNaturally([...JSON.parse(JSON.stringify(seedFinalMissionQuestionsRemaja)), ...nonRemaja]);
        this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
      }

      // Auto-migrate: Pastikan butir soal Dewasa tersinkronisasi dengan Bank Soal Kuesioner Resmi BI Q1 s.d Q60
      const dewasaQuestions = questions.filter((q) => q.classification === 'dewasa');
      const needsDewasaUpdate =
        dewasaQuestions.length !== seedFinalMissionQuestionsDewasa.length ||
        !dewasaQuestions.some((q) => q.id === 'Q1a_DWS') ||
        !dewasaQuestions.some((q) => q.id === 'Q60a_DWS');

      if (needsDewasaUpdate) {
        const nonDewasa = questions.filter((q) => q.classification !== 'dewasa');
        questions = this.sortQuestionsNaturally([...JSON.parse(JSON.stringify(seedFinalMissionQuestionsDewasa)), ...nonDewasa]);
        this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
      }
    }

    // Always ensure questions are naturally sorted by ID
    questions = this.sortQuestionsNaturally(questions);

    if (classification) {
      questions = questions.filter((q) => q.classification === classification);
    }

    if (stage) {
      const cleanStage = stage.toLowerCase();
      questions = questions.filter((q) => {
        const qStage = String(q.stage || '').toLowerCase();
        if (cleanStage.includes('pemula') && (qStage.includes('pemula') || qStage === 'pemula')) return true;
        if (cleanStage.includes('terampil') && (qStage.includes('terampil') || qStage === 'terampil')) return true;
        if ((cleanStage.includes('master') || cleanStage.includes('sang')) && (qStage.includes('master') || qStage.includes('sang') || qStage === 'master')) return true;
        return qStage === cleanStage;
      });
    }

    return questions;
  }

  /**
   * Get single Final Mission question by ID
   */
  public getFinalMissionQuestionById(id: string): FinalMissionQuestion | undefined {
    const questions = this.getFinalMissionQuestions();
    return questions.find((q) => q.id === id);
  }

  /**
   * Save / Update a single Final Mission question (supports renaming ID via oldId)
   */
  public saveFinalMissionQuestion(question: FinalMissionQuestion, oldId?: string): void {
    let questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    
    // Jika ada ID lama yang diganti (misal Q12_1 diubah menjadi Q12)
    if (oldId && oldId !== question.id) {
      const oldIdx = questions.findIndex((q) => q.id === oldId);
      if (oldIdx >= 0) {
        // Hapus pecahan terkait jika mengubah Q12_1 ke Q12
        if (oldId === 'Q12_1' && question.id === 'Q12') {
          questions = questions.filter(
            (q) => !['Q12_1', 'Q12_2', 'Q12_3', 'Q12_4', 'Q12_5'].includes(q.id)
          );
          questions.push(question);
        } else {
          questions[oldIdx] = { ...question };
        }
        questions = this.sortQuestionsNaturally(questions);
        this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
        return;
      }
    }

    const idx = questions.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      questions[idx] = { ...questions[idx], ...question };
    } else {
      questions.push(question);
    }
    questions = this.sortQuestionsNaturally(questions);
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
  }

  /**
   * Delete a single Final Mission question by ID
   */
  public deleteFinalMissionQuestion(id: string): void {
    const questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    const updated = this.sortQuestionsNaturally(questions.filter((q) => q.id !== id));
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, updated);
  }

  /**
   * Bulk import Final Mission questions (e.g. from Excel / CSV)
   */
  public bulkImportFinalMissionQuestions(
    imported: FinalMissionQuestion[],
    replaceAll: boolean = false,
    classification?: FinalMissionClassification
  ): { added: number; updated: number; total: number } {
    let questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    let added = 0;
    let updated = 0;

    if (replaceAll) {
      if (classification) {
        // Only replace questions for this specific classification
        questions = questions.filter((q) => q.classification !== classification);
        questions.push(...imported);
        added = imported.length;
      } else {
        questions = imported;
        added = imported.length;
      }
    } else {
      // Upsert
      imported.forEach((item) => {
        const existingIdx = questions.findIndex(
          (q) => q.id === item.id && (!classification || q.classification === classification)
        );
        if (existingIdx >= 0) {
          questions[existingIdx] = { ...questions[existingIdx], ...item };
          updated++;
        } else {
          questions.push(item);
          added++;
        }
      });
    }

    questions = this.sortQuestionsNaturally(questions);
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
    return { added, updated, total: questions.length };
  }

  /**
   * Delete all questions (or questions for a specific classification)
   */
  public deleteAllFinalMissionQuestions(classification?: FinalMissionClassification): void {
    if (classification) {
      const questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
      const remaining = this.sortQuestionsNaturally(questions.filter((q) => q.classification !== classification));
      this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, remaining);
    } else {
      this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    }
  }

  /**
   * Reset questions back to default standard bank (Locks strictly to Official Bank Indonesia 2025 Survey Dataset)
   */
  public resetFinalMissionQuestionsToDefault(classification?: FinalMissionClassification): number {
    if (!classification) {
      const clonedAll: FinalMissionQuestion[] = JSON.parse(JSON.stringify(allSeedFinalMissionQuestions));
      const sorted = this.sortQuestionsNaturally(clonedAll);
      this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, sorted);
      this.notify();
      return sorted.length;
    }

    let defaultForClass: FinalMissionQuestion[] = [];
    if (classification === 'anak') {
      defaultForClass = JSON.parse(JSON.stringify(seedFinalMissionQuestionsAnak));
    } else if (classification === 'remaja') {
      defaultForClass = JSON.parse(JSON.stringify(seedFinalMissionQuestionsRemaja));
    } else {
      defaultForClass = JSON.parse(JSON.stringify(seedFinalMissionQuestionsDewasa));
    }

    const current = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    const filtered = current.filter((q) => q.classification !== classification);
    const sorted = this.sortQuestionsNaturally([...filtered, ...defaultForClass]);
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, sorted);
    this.notify();
    return defaultForClass.length;
  }

  /**
   * Set and persist image for a question (support both filename & base64/URL)
   */
  public async setFinalMissionQuestionImage(
    questionId: string,
    imageDataUrl: string,
    imageFileName?: string
  ): Promise<boolean> {
    if (!questionId || !imageDataUrl) return false;

    // Cache-busting timestamp for server URLs to ensure immediate cross-device and cross-account updates
    let finalImageUrl = imageDataUrl;
    if (imageDataUrl.startsWith('/images/')) {
      const cleanPath = imageDataUrl.split('?')[0];
      finalImageUrl = `${cleanPath}?t=${Date.now()}`;
    }

    const keys = [
      `fm_q_${questionId}`,
      `fm_q_${questionId?.toLowerCase()}`,
      questionId,
      imageFileName || '',
      imageFileName ? imageFileName.toLowerCase() : '',
    ].filter(Boolean);

    await saveImageToStore(`fm_q_${questionId}`, finalImageUrl.startsWith('data:') ? finalImageUrl : imageDataUrl, keys);

    // Update question record
    const questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    const target = questions.find((q) => q.id === questionId);
    if (target) {
      const oldFileName = target.imageFileName;
      const oldImageUrl = target.imageUrl;

      // If replacing with a different physical image file, clean up old server file & store alias
      if (oldFileName && oldFileName !== imageFileName) {
        deleteImageFromStore([oldFileName, oldFileName.toLowerCase()]).catch(() => {});
      }
      if (oldImageUrl && oldImageUrl.startsWith('/images/')) {
        const oldClean = oldImageUrl.split('?')[0];
        const newClean = finalImageUrl.split('?')[0];
        if (oldClean !== newClean) {
          deleteImageFromServer(oldClean).catch(() => {});
        }
      }

      target.imageUrl = finalImageUrl;
      if (imageFileName) target.imageFileName = imageFileName;
      this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
      // Automatically synchronize to server disk and Cloud Firestore
      this.persistFinalMissionMaster('Super Admin').catch(() => {});
    }
    return true;
  }

  /**
   * Remove image from a question
   */
  public async removeFinalMissionQuestionImage(questionId: string): Promise<boolean> {
    if (!questionId) return false;

    const questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    const target = questions.find((q) => q.id === questionId);
    const oldFileName = target?.imageFileName;
    const oldImageUrl = target?.imageUrl;

    if (target) {
      delete target.imageUrl;
      target.imageFileName = '';
      this.setStorage(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, questions);
      this.persistFinalMissionMaster('Super Admin').catch(() => {});
    }

    if (oldImageUrl && oldImageUrl.startsWith('/images/')) {
      const cleanUrl = oldImageUrl.split('?')[0];
      deleteImageFromServer(cleanUrl).catch(() => {});
    }

    const lookupKeys = [
      `fm_q_${questionId}`,
      `fm_q_${questionId?.toLowerCase()}`,
      questionId,
      oldFileName || '',
      oldFileName ? oldFileName.toLowerCase() : '',
    ].filter(Boolean);

    await deleteImageFromStore(lookupKeys);
    deleteCloudDoc('uploaded_images', `fm_q_${questionId.toLowerCase()}`).catch(() => {});
    if (oldFileName) {
      const cleanKey = `final-mission_${oldFileName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;
      deleteCloudDoc('uploaded_images', cleanKey).catch(() => {});
    }
    return true;
  }

  /**
   * Retrieve image URL for a question from ImageStore or direct URL
   */
  public getFinalMissionQuestionImage(question: FinalMissionQuestion): string {
    if (question.imageUrl) {
      const url = question.imageUrl.trim();
      if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
      }
      return `/images/final-mission/${url}`;
    }

    const lookupKeys = [
      `fm_q_${question.id}`,
      question.id,
      question.imageFileName || '',
      question.imageFileName ? question.imageFileName.toLowerCase() : '',
    ].filter(Boolean);

    const fromStore = getImageFromStore(lookupKeys);
    if (fromStore) return fromStore;

    if (question.imageFileName && typeof question.imageFileName === 'string') {
      const trimmed = question.imageFileName.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
      }
      const clean = trimmed.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
      return `/images/final-mission/${clean}`;
    }

    return '';
  }

  /**
   * Retrieve image URL for a matrix item (e.g. Q38 items)
   */
  public getFinalMissionMatrixItemImage(questionId: string, item: FinalMissionMatrixItem): string {
    if (item.imageUrl) {
      const url = item.imageUrl.trim();
      if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
      }
      return `/images/final-mission/${url}`;
    }

    const lookupKeys = [
      `fm_item_${questionId}_${item.id}`,
      `fm_item_${item.id}`,
      item.imageFileName || '',
      item.imageFileName ? item.imageFileName.toLowerCase() : '',
    ].filter(Boolean);

    const fromStore = getImageFromStore(lookupKeys);
    if (fromStore) return fromStore;

    if (item.imageFileName && typeof item.imageFileName === 'string') {
      const trimmed = item.imageFileName.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
      }
      const clean = trimmed.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
      return `/images/final-mission/${clean}`;
    }

    // Fallback to default Q38 vector artwork
    const q38Default = getDefaultQ38ItemImage(item);
    if (q38Default) return q38Default;

    return '';
  }

  /**
   * Set and persist image for a matrix item
   */
  public async setFinalMissionMatrixItemImage(
    questionId: string,
    itemId: string,
    imageDataUrl: string,
    imageFileName?: string
  ): Promise<boolean> {
    if (!questionId || !itemId || !imageDataUrl) return false;

    let finalImageUrl = imageDataUrl;
    if (imageDataUrl.startsWith('/images/')) {
      const cleanPath = imageDataUrl.split('?')[0];
      finalImageUrl = `${cleanPath}?t=${Date.now()}`;
    }

    const keys = [
      `fm_item_${questionId}_${itemId}`,
      `fm_item_${questionId?.toLowerCase()}_${itemId?.toLowerCase()}`,
      `fm_item_${itemId}`,
      imageFileName || '',
      imageFileName ? imageFileName.toLowerCase() : '',
    ].filter(Boolean);

    await saveImageToStore(`fm_item_${questionId}_${itemId}`, finalImageUrl.startsWith('data:') ? finalImageUrl : imageDataUrl, keys);

    const questions = this.getStorage<FinalMissionQuestion>(STORAGE_KEYS.FINAL_MISSION_QUESTIONS, []);
    const target = questions.find((q) => q.id === questionId);
    if (target && Array.isArray(target.matrixItems)) {
      const itm = target.matrixItems.find((i) => i.id === itemId);
      if (itm) {
        const oldImageUrl = itm.imageUrl;
        if (oldImageUrl && oldImageUrl.startsWith('/images/')) {
          const oldClean = oldImageUrl.split('?')[0];
          const newClean = finalImageUrl.split('?')[0];
          if (oldClean !== newClean) {
            deleteImageFromServer(oldClean).catch(() => {});
          }
        }
        itm.imageUrl = finalImageUrl;
        if (imageFileName) itm.imageFileName = imageFileName;
        this.saveFinalMissionQuestion(target);
        this.persistFinalMissionMaster('Super Admin').catch(() => {});
      }
    }
    return true;
  }

  /**
   * Get Final Mission progress for a user and classification
   */
  public getFinalMissionProgress(
    userId: string = 'USR-TESTER',
    classification: FinalMissionClassification = 'anak'
  ): FinalMissionProgress {
    const allProg = this.getStorage<FinalMissionProgress>(STORAGE_KEYS.FINAL_MISSION_PROGRESS, []);
    const found = allProg.find((p) => p.userId === userId && p.classification === classification);

    if (found) return found;

    const defaultProg: FinalMissionProgress = {
      id: `FMP_${userId}_${classification}`,
      userId,
      classification,
      stage1Completed: false,
      stage1Score: 0,
      stage2Completed: false,
      stage2Score: 0,
      stage3Completed: false,
      stage3Score: 0,
      grandTitleAwarded: false,
    };

    return defaultProg;
  }

  /**
   * Save Final Mission progress
   */
  public saveFinalMissionProgress(progress: FinalMissionProgress): void {
    const allProg = this.getStorage<FinalMissionProgress>(STORAGE_KEYS.FINAL_MISSION_PROGRESS, []);
    const idx = allProg.findIndex(
      (p) => p.userId === progress.userId && p.classification === progress.classification
    );

    if (idx >= 0) {
      allProg[idx] = { ...allProg[idx], ...progress };
    } else {
      allProg.push(progress);
    }

    this.setStorage(STORAGE_KEYS.FINAL_MISSION_PROGRESS, allProg);
    const id = `${progress.userId}_${progress.classification}`;
    saveCloudDoc('final_mission_progress', id, progress).catch(() => {});
  }

  /**
   * Record attempt history for Final Mission
   */
  public recordFinalMissionAttempt(attempt: FinalMissionAttempt): void {
    const attempts = this.getStorage<FinalMissionAttempt>(STORAGE_KEYS.FINAL_MISSION_ATTEMPTS, []);
    attempts.unshift(attempt);
    // Keep last 100 attempts
    if (attempts.length > 100) attempts.length = 100;
    this.setStorage(STORAGE_KEYS.FINAL_MISSION_ATTEMPTS, attempts);

    // Automatically update student progress
    const prog = this.getFinalMissionProgress(attempt.userId, attempt.classification);
    if (attempt.passed) {
      if (attempt.stage === 'pemula') {
        prog.stage1Completed = true;
        prog.stage1Score = Math.max(prog.stage1Score, attempt.score);
      } else if (attempt.stage === 'terampil') {
        prog.stage2Completed = true;
        prog.stage2Score = Math.max(prog.stage2Score, attempt.score);
      } else if (attempt.stage === 'master') {
        prog.stage3Completed = true;
        prog.stage3Score = Math.max(prog.stage3Score, attempt.score);
        prog.grandTitleAwarded = true;
        prog.completedAt = new Date().toISOString();
      }
      this.saveFinalMissionProgress(prog);
    }
  }

  /**
   * Get all Final Mission attempts
   */
  public getFinalMissionAttempts(userId?: string): FinalMissionAttempt[] {
    let attempts = this.getStorage<FinalMissionAttempt>(STORAGE_KEYS.FINAL_MISSION_ATTEMPTS, []);
    // Purge any sample dummy records if they exist in localStorage
    if (attempts && attempts.length > 0) {
      const sanitized = attempts.filter(
        (a) => !a.id?.startsWith('FMA_SAMPLE_') && !a.userId?.startsWith('USR-STU-')
      );
      if (sanitized.length !== attempts.length) {
        attempts = sanitized;
        this.setStorage(STORAGE_KEYS.FINAL_MISSION_ATTEMPTS, attempts);
      }
    } else {
      attempts = [];
    }
    if (userId) {
      return attempts.filter((a) => a.userId === userId);
    }
    return attempts;
  }

  // ==========================================
  // FINAL MISSION STAGE ACCESS & ADMIN BYPASS
  // ==========================================
  /**
   * Get Final Mission stage access config (unlock all or specific stages, and passing grade)
   */
  public getFinalMissionStageAccess(): FinalMissionStageAccessConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FINAL_MISSION_STAGE_ACCESS);
      if (!raw) return { ...DEFAULT_FINAL_MISSION_STAGE_ACCESS };
      const parsed = JSON.parse(raw);
      const passingGrade = typeof parsed.passingGrade === 'number' ? parsed.passingGrade : 80;
      return {
        unlockAll: !!parsed.unlockAll,
        unlockedStages: {
          pemula: true,
          terampil: !!parsed.unlockedStages?.terampil,
          master: !!parsed.unlockedStages?.master,
        },
        unlockForEveryone: !!parsed.unlockForEveryone,
        passingGrade,
        stagePassingGrades: {
          pemula: typeof parsed.stagePassingGrades?.pemula === 'number' ? parsed.stagePassingGrades.pemula : passingGrade,
          terampil: typeof parsed.stagePassingGrades?.terampil === 'number' ? parsed.stagePassingGrades.terampil : passingGrade,
          master: typeof parsed.stagePassingGrades?.master === 'number' ? parsed.stagePassingGrades.master : passingGrade,
        },
        eventSchedule: parsed.eventSchedule ? {
          enabled: !!parsed.eventSchedule.enabled,
          title: parsed.eventSchedule.title || 'Main Bareng Misi Akhir CBP Rupiah',
          startDate: parsed.eventSchedule.startDate || '',
          endDate: parsed.eventSchedule.endDate || '',
          schoolId: parsed.eventSchedule.schoolId || 'ALL',
          description: parsed.eventSchedule.description || '',
          updatedBy: parsed.eventSchedule.updatedBy,
          updatedAt: parsed.eventSchedule.updatedAt,
        } : { ...DEFAULT_FINAL_MISSION_STAGE_ACCESS.eventSchedule! },
      };
    } catch {
      return { ...DEFAULT_FINAL_MISSION_STAGE_ACCESS };
    }
  }

  /**
   * Save Final Mission stage access config
   */
  public saveFinalMissionStageAccess(config: Partial<FinalMissionStageAccessConfig>): FinalMissionStageAccessConfig {
    const current = this.getFinalMissionStageAccess();
    const passingGrade = config.passingGrade !== undefined ? config.passingGrade : (current.passingGrade ?? 80);
    const updated: FinalMissionStageAccessConfig = {
      unlockAll: config.unlockAll !== undefined ? config.unlockAll : current.unlockAll,
      unlockedStages: {
        pemula: true,
        terampil: config.unlockedStages?.terampil !== undefined ? config.unlockedStages.terampil : current.unlockedStages.terampil,
        master: config.unlockedStages?.master !== undefined ? config.unlockedStages.master : current.unlockedStages.master,
      },
      unlockForEveryone: config.unlockForEveryone !== undefined ? config.unlockForEveryone : current.unlockForEveryone,
      passingGrade,
      stagePassingGrades: {
        pemula: config.stagePassingGrades?.pemula !== undefined ? config.stagePassingGrades.pemula : (current.stagePassingGrades?.pemula ?? passingGrade),
        terampil: config.stagePassingGrades?.terampil !== undefined ? config.stagePassingGrades.terampil : (current.stagePassingGrades?.terampil ?? passingGrade),
        master: config.stagePassingGrades?.master !== undefined ? config.stagePassingGrades.master : (current.stagePassingGrades?.master ?? passingGrade),
      },
      eventSchedule: config.eventSchedule !== undefined ? config.eventSchedule : current.eventSchedule,
    };
    try {
      localStorage.setItem(STORAGE_KEYS.FINAL_MISSION_STAGE_ACCESS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save final mission stage access config', err);
    }
    this.notify();
    return updated;
  }

  /**
   * Reset Final Mission stage access config to default
   */
  public resetFinalMissionStageAccess(): FinalMissionStageAccessConfig {
    try {
      localStorage.removeItem(STORAGE_KEYS.FINAL_MISSION_STAGE_ACCESS);
    } catch (err) {
      console.error('Failed to reset final mission stage access config', err);
    }
    this.notify();
    return { ...DEFAULT_FINAL_MISSION_STAGE_ACCESS };
  }

  /**
   * Get Final Mission passing grade for a specific stage or global
   */
  public getFinalMissionPassingGrade(stage?: FinalMissionStage): number {
    const access = this.getFinalMissionStageAccess();
    if (stage && access.stagePassingGrades && typeof access.stagePassingGrades[stage] === 'number') {
      return access.stagePassingGrades[stage]!;
    }
    return access.passingGrade ?? 80;
  }

  /**
   * Returns count of completed missions for the student/guest.
   */
  public getCompletedMissionsCount(studentId?: string): number {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const missions = this.getMissions();
    const progressList = this.getStudentProgress().filter((p) => p.studentId === activeStudentId);

    let count = 0;
    for (const m of missions) {
      const canonical = normalizeMissionId(m.id);
      const isDone = progressList.some(
        (p) =>
          (p.missionId === m.id || p.missionId === canonical || normalizeMissionId(p.missionId) === canonical) &&
          p.status === 'completed'
      );
      if (isDone) count++;
    }
    return count;
  }

  /**
   * Detailed status for Final Mission access, considering both:
   * 1. 9 missions completion condition (Wajib)
   * 2. Event schedule ("Main Bareng") set by Admin Sekolah
   */
  public getFinalMissionEventStatus(studentId?: string, user?: User | null) {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const currentUser = user || this.getCurrentUser();
    const access = this.getFinalMissionStageAccess();
    const event = access.eventSchedule;
    const isEventMode = !!(event && event.enabled);
    const completedMissionsCount = this.getCompletedMissionsCount(activeStudentId);
    const missions = this.getMissions();
    const totalMissions = missions && missions.length > 0 ? missions.length : 9;
    const hasCompleted9Missions = completedMissionsCount >= totalMissions;

    const isGuest = this.isCurrentGuest() || currentUser?.isGuest || currentUser?.id === 'USR-GUEST';
    const isAdminOrTeacher = !isGuest && (
      currentUser?.role === 'admin' ||
      currentUser?.role === 'superadmin' ||
      currentUser?.role === 'teacher'
    );

    const schoolSettings = this.getSchoolSettings();
    const isBypassed = !!schoolSettings.bypassFinalMissionRequirement;

    let status: 'independent' | 'upcoming' | 'active' | 'ended' = 'independent';
    let isWithinSchedule = true;
    let message = '';

    if (isEventMode) {
      const now = Date.now();
      const start = event.startDate ? new Date(event.startDate).getTime() : 0;
      const end = event.endDate ? new Date(event.endDate).getTime() : 0;

      if (start > 0 && now < start) {
        status = 'upcoming';
        isWithinSchedule = false;
        message = `Sesi Main Bareng "${event.title}" belum dimulai. Dijadwalkan buka pada ${new Date(event.startDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB.`;
      } else if (end > 0 && now > end) {
        status = 'ended';
        isWithinSchedule = false;
        message = `Sesi Main Bareng "${event.title}" telah berakhir pada ${new Date(event.endDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB.`;
      } else {
        status = 'active';
        isWithinSchedule = true;
        message = isBypassed
          ? `Sesi Main Bareng "${event.title}" sedang aktif (Akses langsung tanpa syarat 9 misi diaktifkan oleh Admin Sekolah).`
          : `Sesi Main Bareng "${event.title}" sedang aktif.`;
      }
    } else {
      status = 'independent';
      isWithinSchedule = true;
      message = isBypassed
        ? 'Akses Langsung Aktif: Admin Sekolah telah mengaktifkan Misi Akhir tanpa harus menuntaskan 9 Misi.'
        : 'Mode Mandiri: Siswa dapat membuka Misi Akhir setelah menuntaskan 9 Misi.';
    }

    const canAccess = isAdminOrTeacher || ((hasCompleted9Missions || isBypassed) && (!isEventMode || isWithinSchedule));

    return {
      isEventMode,
      eventSchedule: event,
      status,
      isWithinSchedule,
      hasCompleted9Missions,
      completedMissionsCount,
      totalMissions,
      canAccess,
      message,
      isBypassed,
    };
  }

  /**
   * Check whether Misi Akhir itself is unlocked.
   * Dua mekanisme akses:
   * 1. SYARAT MUTLAK: Wajib menyelesaikan 9 misi utama (Cinta, Bangga, Paham Rupiah),
   *    atau dapat diaktifkan langsung oleh Admin Sekolah melalui tombol bypass.
   * 2. JADWAL MAIN BARENG: Jika Admin Sekolah mengaktifkan jadwal event, hanya terbuka pada rentang waktu tersebut.
   *    Jika jadwal tidak aktif (mode mandiri), terbuka kapan saja setelah 9 misi tuntas (atau saat bypass aktif).
   * Catatan: Admin, Guru, dan Akun Penguji dapat melewati batasan ini untuk telaah materi.
   */
  public isFinalMissionUnlocked(studentId?: string, user?: User | null): boolean {
    const activeStudentId = this.getEffectiveStudentId(studentId);
    const currentUser = user || this.getCurrentUser();
    const isGuest = this.isCurrentGuest() || currentUser?.isGuest || currentUser?.id === 'USR-GUEST';
    const isAdminOrTeacherOrTester =
      !isGuest &&
      (currentUser?.role === 'admin' ||
        currentUser?.role === 'superadmin' ||
        currentUser?.role === 'teacher' ||
        activeStudentId === 'USR-TESTER' ||
        currentUser?.id === 'USR-TESTER' ||
        currentUser?.email?.toLowerCase().includes('tester'));

    if (isAdminOrTeacherOrTester) {
      return true;
    }

    const access = this.getFinalMissionStageAccess();
    if (access.unlockAll && access.unlockForEveryone) {
      return true;
    }

    const schoolSettings = this.getSchoolSettings();
    const isBypassed = !!schoolSettings.bypassFinalMissionRequirement;

    const missions = this.getMissions();
    const totalRequired = missions && missions.length > 0 ? missions.length : 9;
    const completed = this.getCompletedMissionsCount(activeStudentId);

    // Syarat 1: WAJIB tuntas 9 Misi CBP Rupiah (dilewati jika Admin Sekolah mengaktifkan bypass)
    if (!isBypassed && completed < totalRequired) {
      return false;
    }

    // Syarat 2: Jika Admin Sekolah memasang jadwal Main Bareng (Event Mode)
    if (access.eventSchedule && access.eventSchedule.enabled) {
      const now = Date.now();
      const start = access.eventSchedule.startDate ? new Date(access.eventSchedule.startDate).getTime() : 0;
      const end = access.eventSchedule.endDate ? new Date(access.eventSchedule.endDate).getTime() : 0;

      // Belum masuk jadwal mulai
      if (start > 0 && now < start) {
        return false;
      }
      // Sudah lewat jadwal selesai
      if (end > 0 && now > end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Leaderboard Juara Main Bareng Misi Akhir
   * Urutan pemenang:
   * 1. Nilai / Poin Tertinggi (Score Descending)
   * 2. Waktu Pengerjaan Tercepat (Duration Ascending) jika nilai kembar
   * 3. Waktu Selesai Paling Awal (CompletedAt Ascending) jika waktu kembar
   */
  public getFinalMissionLeaderboard(filters?: {
    stage?: FinalMissionStage | 'all' | 'best';
    classId?: string;
    schoolId?: string;
  }): FinalMissionLeaderboardEntry[] {
    const attempts = this.getFinalMissionAttempts();
    const users = this.getUsers();
    const classes = this.getClasses();
    const stageFilter = filters?.stage || 'all';

    // Group or filter attempts
    const userBestMap = new Map<string, FinalMissionAttempt>();

    attempts.forEach((att) => {
      // Filter stage if specific
      if (stageFilter !== 'all' && stageFilter !== 'best' && att.stage !== stageFilter) {
        return;
      }

      const existing = userBestMap.get(att.userId);
      if (!existing) {
        userBestMap.set(att.userId, att);
      } else {
        // Compare: higher score is better. If score is equal, faster duration is better
        const attDuration = att.durationSeconds ?? 999999;
        const existDuration = existing.durationSeconds ?? 999999;

        if (att.score > existing.score) {
          userBestMap.set(att.userId, att);
        } else if (att.score === existing.score && attDuration < existDuration) {
          userBestMap.set(att.userId, att);
        }
      }
    });

    const entries: FinalMissionLeaderboardEntry[] = [];

    userBestMap.forEach((attempt) => {
      const user = users.find((u) => u.id === attempt.userId);
      const studentClass = classes.find((c) => c.id === user?.classId);

      // Filter class if specified
      if (filters?.classId && filters.classId !== 'ALL' && user?.classId !== filters.classId) {
        return;
      }

      // Filter school if specified
      if (filters?.schoolId && filters.schoolId !== 'ALL' && user?.schoolId && user.schoolId !== filters.schoolId) {
        return;
      }

      const durationSec = attempt.durationSeconds ?? 360; // fallback 6 min
      const m = Math.floor(durationSec / 60);
      const s = durationSec % 60;
      const formattedDuration = `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;

      const studentName = user?.name || `Siswa (${attempt.userId})`;
      const nisn = user?.nisn || '-';
      const className = studentClass?.name || user?.grade || 'Kelas';

      entries.push({
        rank: 1, // calculated after sort
        userId: attempt.userId,
        studentName,
        nisn,
        className,
        schoolName: user?.school || 'Sekolah',
        stage: attempt.stage,
        stageTitle: attempt.stageTitle,
        score: attempt.score,
        durationSeconds: durationSec,
        formattedDuration,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        passed: attempt.passed,
        completedAt: attempt.completedAt,
      });
    });

    // Sort entries according to exact rule:
    // 1. Nilai tertinggi
    // 2. Jika nilai kembar, waktu tercepat (durationSeconds terkecil)
    // 3. Jika masih kembar, waktu submit terawal
    entries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.durationSeconds !== b.durationSeconds) {
        return a.durationSeconds - b.durationSeconds;
      }
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    });

    // Assign 1-based ranks
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }

  /**
   * Check whether a specific stage is unlocked for a user/tester
   */
  public isFinalMissionStageUnlocked(
    stage: FinalMissionStage,
    studentProgress?: FinalMissionProgress,
    user?: User | null
  ): boolean {
    const access = this.getFinalMissionStageAccess();
    const currentUser = user || this.getCurrentUser();
    const isGuest = this.isCurrentGuest() || currentUser?.isGuest || currentUser?.id === 'USR-GUEST';
    const isAdminOrTeacherOrTester =
      !isGuest &&
      (currentUser?.role === 'admin' ||
        currentUser?.role === 'superadmin' ||
        currentUser?.role === 'teacher' ||
        currentUser?.id === 'USR-TESTER' ||
        currentUser?.email?.toLowerCase().includes('tester'));

    // 1. If global unlockAll is enabled
    if (access.unlockAll) {
      if (access.unlockForEveryone || isAdminOrTeacherOrTester) {
        return true;
      }
    }

    // Must have completed all 9 missions before any stage can be entered (unless admin/teacher/tester)
    if (!isAdminOrTeacherOrTester && !this.isFinalMissionUnlocked(currentUser?.id, currentUser)) {
      return false;
    }

    if (stage === 'pemula') return true;

    // 2. If specific stage is unlocked
    if (access.unlockedStages && access.unlockedStages[stage]) {
      if (access.unlockForEveryone || isAdminOrTeacherOrTester) {
        return true;
      }
    }

    // 3. Normal progression requirements
    if (!studentProgress) return false;
    if (stage === 'terampil') return !!studentProgress.stage1Completed;
    if (stage === 'master') return !!studentProgress.stage2Completed;

    return false;
  }

  // ==========================================
  // FIREBASE CLOUD SYNC & STATUS
  // ==========================================
  public async syncWithCloud(): Promise<boolean> {
    return triggerManualSync(
      () => ({
        schoolSettings: this.getSchoolSettings(),
        users: this.getUsers(),
        progress: this.getStorage(STORAGE_KEYS.STUDENT_PROGRESS, []),
        finalMissionProgress: this.getStorage(STORAGE_KEYS.FINAL_MISSION_PROGRESS, []),
      }),
      (cloudData: any) => {
        this.isCloudSyncing = true;
        if (cloudData.schoolSettings) {
          localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(cloudData.schoolSettings));
        }
        if (cloudData.users && cloudData.users.length > 0) {
          this.setStorage(STORAGE_KEYS.USERS, cloudData.users);
        }
        if (cloudData.progress && cloudData.progress.length > 0) {
          this.setStorage(STORAGE_KEYS.STUDENT_PROGRESS, cloudData.progress);
        }
        this.isCloudSyncing = false;
        this.notify();
      }
    );
  }

  public getFirebaseStatus(): FirebaseSyncStatus {
    return getFirebaseSyncStatus();
  }

  public subscribeFirebaseStatus(listener: (status: FirebaseSyncStatus) => void): () => void {
    return subscribeFirebaseStatus(listener);
  }
}

export const db = new DatabaseService();
