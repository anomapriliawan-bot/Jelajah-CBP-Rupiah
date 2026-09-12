import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Image as ImageIcon,
  Upload,
  BookOpen,
  Gamepad2,
  HelpCircle,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Layers,
  Award,
  Globe,
  Lightbulb,
  FileEdit,
  Send,
  Archive,
  RefreshCw,
} from 'lucide-react';
import {
  Mission,
  Lesson,
  Activity,
  PracticeQuestion,
  Reflection,
  ContentStatus,
  Badge,
} from '../../types';
import { db, normalizeMissionId } from '../../services/db';
import { sounds } from '../../utils/audio';
import { compressImageFile } from '../../utils/imageCompressor';
import { uploadDataUrlToServer } from '../../services/uploadService';
import { saveImageToStore, getImageFromStore } from '../../services/imageStore';

interface ComprehensiveMissionModalProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export const ComprehensiveMissionModal: React.FC<ComprehensiveMissionModalProps> = ({
  mission,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'lessons' | 'activities' | 'questions' | 'reflection'>('info');

  // Mission Info Form State
  const [infoForm, setInfoForm] = useState<{
    code: string;
    worldId: string;
    title: string;
    subtitle: string;
    storyOpening: string;
    imageUrl: string;
    badgeRewardId: string;
    orderIndex: number;
    levelNumber: number;
    status: ContentStatus;
    bigQuestion: string;
    learningPoints: string;
    passingScore: number;
    questionDisplayCount: number;
  }>({
    code: '',
    worldId: 'cinta',
    title: '',
    subtitle: '',
    storyOpening: '',
    imageUrl: '',
    badgeRewardId: 'BDG-01',
    orderIndex: 1,
    levelNumber: 1,
    status: 'draft',
    bigQuestion: '',
    learningPoints: '',
    passingScore: 70,
    questionDisplayCount: 5,
  });

  // Image Uploading States
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadMsg, setCoverUploadMsg] = useState<string | null>(null);

  // Related Entities States
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<Partial<Lesson>>({});
  const [isUploadingLessonImg, setIsUploadingLessonImg] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<Partial<Activity>>({});

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<Partial<PracticeQuestion>>({});

  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [reflectionForm, setReflectionForm] = useState<{
    title: string;
    prompt: string;
    guideQuestions: string;
  }>({
    title: '',
    prompt: '',
    guideQuestions: '',
  });

  const badges = db.getBadges();

  // Populate data whenever modal opens or mission changes
  useEffect(() => {
    if (!isOpen) return;

    if (mission) {
      const canonicalId = normalizeMissionId(mission.id || mission.code);
      setInfoForm({
        code: mission.code || canonicalId,
        worldId: mission.worldId || 'cinta',
        title: mission.title || '',
        subtitle: mission.subtitle || '',
        storyOpening: mission.storyOpening || mission.openingStory || '',
        imageUrl: mission.imageUrl || mission.openingImageUrl || getImageFromStore([canonicalId, `cbr_img_${canonicalId}`, mission.code, mission.id]) || '',
        badgeRewardId: mission.badgeRewardId || mission.badgeId || 'BDG-01',
        orderIndex: mission.orderIndex || 1,
        levelNumber: mission.levelNumber || 1,
        status: mission.status || 'draft',
        bigQuestion:
          mission.bigQuestion ||
          (typeof mission.objective === 'string' ? mission.objective : (mission as any).objective?.bigQuestion) ||
          '',
        learningPoints: (mission.learningPoints || (mission as any).objective?.learningPoints || []).join('\n'),
        passingScore: mission.passingScore || 70,
        questionDisplayCount: mission.questionDisplayCount || 5,
      });

      // Load related items
      const missionLessons = db.getLessonsByMission(canonicalId);
      setLessons(missionLessons);

      const missionActivities = db.getActivitiesByMission(canonicalId);
      setActivities(missionActivities);

      const missionQuestions = db.getPracticeQuestionsByMission(canonicalId);
      setQuestions(missionQuestions);

      const missionRefl = db.getReflectionByMission(canonicalId);
      if (missionRefl) {
        setReflection(missionRefl);
        const guideList = missionRefl.guideQuestions || (missionRefl as any).guidedQuestions || [];
        setReflectionForm({
          title: 'Refleksi Diri Misi',
          prompt: missionRefl.prompt || '',
          guideQuestions: guideList.join('\n'),
        });
      } else {
        setReflection(null);
        setReflectionForm({
          title: 'Refleksi Diri & Pemahaman Rupiah',
          prompt: 'Bagaimana perasaanmu setelah menyelesaikan misi ini?',
          guideQuestions: '1. Apa hal paling menarik yang baru kamu pelajari?\n2. Bagaimana kamu akan menerapkannya sehari-hari?',
        });
      }
    } else {
      // Create new mission template
      const allMissions = db.getMissions();
      const nextNum = allMissions.length + 1;
      setInfoForm({
        code: `MIS-${String(nextNum).padStart(2, '0')}`,
        worldId: 'cinta',
        title: '',
        subtitle: '',
        storyOpening: '',
        imageUrl: '',
        badgeRewardId: badges[0]?.id || 'BDG-01',
        orderIndex: nextNum,
        levelNumber: nextNum,
        status: 'draft',
        bigQuestion: '',
        learningPoints: 'Mengenal konsep dasar\nPraktik langsung',
        passingScore: 70,
        questionDisplayCount: 5,
      });
      setLessons([]);
      setActivities([]);
      setQuestions([]);
      setReflection(null);
    }

    setEditingLessonId(null);
    setEditingActivityId(null);
    setEditingQuestionId(null);
    setCoverUploadMsg(null);
  }, [isOpen, mission]);

  if (!isOpen) return null;

  // --- IMAGE UPLOAD HANDLERS ---
  const handleCoverFileUpload = async (file: File) => {
    try {
      setIsUploadingCover(true);
      setCoverUploadMsg(null);
      const res = await compressImageFile(file, 900, 0.78);
      if (res.dataUrl) {
        // Upload to server and Firestore uploaded_images
        const uploadRes = await uploadDataUrlToServer(file.name, res.dataUrl, 'missions');
        const finalUrl = uploadRes?.url || res.dataUrl;

        // Save into local memory & IndexedDB cache for instant display
        const targetMissionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
        saveImageToStore(targetMissionId, res.dataUrl, [finalUrl, infoForm.code]);

        setInfoForm((prev) => ({ ...prev, imageUrl: finalUrl }));
        sounds.playPop();
        setCoverUploadMsg(`✅ Foto berhasil diunggah & disinkronkan (${res.compressedSizeKb} KB)`);
      }
      setIsUploadingCover(false);
    } catch (err: any) {
      setIsUploadingCover(false);
      setCoverUploadMsg('Gagal memproses gambar: ' + (err?.message || ''));
    }
  };

  const handleLessonImageUpload = async (file: File) => {
    try {
      setIsUploadingLessonImg(true);
      const res = await compressImageFile(file, 900, 0.78);
      if (res.dataUrl) {
        // Upload to server and Firestore uploaded_images
        const uploadRes = await uploadDataUrlToServer(file.name, res.dataUrl, 'lessons');
        const finalUrl = uploadRes?.url || res.dataUrl;

        // Save into local memory & IndexedDB cache
        const lessonIdentifier = lessonForm.id || lessonForm.code || `temp_${Date.now()}`;
        saveImageToStore(lessonIdentifier, res.dataUrl, [finalUrl]);

        setLessonForm((prev) => ({ ...prev, imageUrl: finalUrl, image_url: finalUrl }));
        sounds.playPop();
      }
      setIsUploadingLessonImg(false);
    } catch (err: any) {
      setIsUploadingLessonImg(false);
      alert('Gagal memproses gambar slide: ' + (err?.message || ''));
    }
  };

  // --- SAVE MISSION INFO ---
  const handleSaveMissionInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playPop();

    const pointsArr = infoForm.learningPoints
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const payload: Partial<Mission> = {
      code: infoForm.code,
      worldId: infoForm.worldId,
      title: infoForm.title,
      subtitle: infoForm.subtitle,
      storyOpening: infoForm.storyOpening,
      openingStory: infoForm.storyOpening,
      imageUrl: infoForm.imageUrl,
      openingImageUrl: infoForm.imageUrl,
      badgeRewardId: infoForm.badgeRewardId,
      badgeId: infoForm.badgeRewardId,
      orderIndex: Number(infoForm.orderIndex),
      levelNumber: Number(infoForm.levelNumber),
      status: infoForm.status,
      passingScore: Number(infoForm.passingScore),
      questionDisplayCount: Number(infoForm.questionDisplayCount),
      bigQuestion: infoForm.bigQuestion,
      learningPoints: pointsArr,
    };

    if (mission) {
      const canonicalId = normalizeMissionId(mission.id || mission.code);
      db.updateMission(
        canonicalId,
        payload,
        'Admin Kurikulum BI',
        `Pembaruan lengkap misi ${infoForm.code}: ${infoForm.title}`
      );
      onSaved(`Misi "${infoForm.code}: ${infoForm.title}" berhasil diperbarui!`);
    } else {
      db.createMission(payload as Omit<Mission, 'id'>);
      onSaved(`Misi baru "${infoForm.code}: ${infoForm.title}" berhasil dibuat!`);
    }
  };

  // --- LESSON CRUD ---
  const handleStartEditLesson = (l: Lesson) => {
    sounds.playPop();
    setEditingLessonId(l.id);
    setLessonForm({
      ...l,
      studentText: l.studentText || l.content || (l as any).student_text || '',
      interactionPrompt: l.interactionPrompt || (l as any).interaction_prompt || '',
      imageUrl: l.imageUrl || (l as any).image_url || '',
    });
  };

  const handleNewLesson = () => {
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
    const nextOrder = lessons.length + 1;
    const newId = `MAT-${missionId}-${nextOrder}`;
    setEditingLessonId('NEW');
    setLessonForm({
      id: newId,
      code: newId,
      missionId,
      title: `Slide ${nextOrder}: Materi Pembelajaran`,
      studentText: '',
      interactionPrompt: 'Menurutmu, apa yang menarik dari topik ini?',
      contentOrder: nextOrder,
      orderIndex: nextOrder,
      imageUrl: '',
      status: 'published',
    });
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title || !lessonForm.studentText) {
      alert('Mohon lengkapi Judul Slide dan Isi Teks Materi.');
      return;
    }
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;

    const payload: Partial<Lesson> = {
      ...lessonForm,
      missionId,
      studentText: lessonForm.studentText,
      content: lessonForm.studentText,
      interactionPrompt: lessonForm.interactionPrompt || '',
      imageUrl: lessonForm.imageUrl || '',
      image_url: lessonForm.imageUrl || '',
      contentOrder: Number(lessonForm.contentOrder || lessons.length + 1),
      orderIndex: Number(lessonForm.orderIndex || lessons.length + 1),
    };

    if (editingLessonId && editingLessonId !== 'NEW') {
      db.updateLesson(editingLessonId, payload, 'Admin Kurikulum BI', 'Pembaruan materi slide');
    } else {
      db.createLesson(payload as Omit<Lesson, 'id'>);
    }

    // Refresh lessons
    const fresh = db.getLessonsByMission(missionId);
    setLessons(fresh);
    setEditingLessonId(null);
    setLessonForm({});
    onSaved('Materi slide berhasil disimpan!');
  };

  const handleDeleteLesson = (id: string) => {
    if (confirm('Hapus slide materi ini?')) {
      sounds.playPop();
      db.deleteLesson(id);
      const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
      setLessons(db.getLessonsByMission(missionId));
      if (editingLessonId === id) {
        setEditingLessonId(null);
      }
      onSaved('Slide materi dihapus.');
    }
  };

  // --- ACTIVITY CRUD ---
  const handleStartEditActivity = (a: Activity) => {
    sounds.playPop();
    setEditingActivityId(a.id);
    setActivityForm({ ...a });
  };

  const handleNewActivity = () => {
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
    const nextOrder = activities.length + 1;
    const newId = `ACT-${missionId}-${nextOrder}`;
    setEditingActivityId('NEW');
    setActivityForm({
      id: newId,
      code: newId,
      missionId,
      title: `Aktivitas ${nextOrder}: Tantangan Interaktif`,
      instruction: 'Ikuti petunjuk di bawah untuk menyelesaikan tantangan ini.',
      type: 'matching',
      pointReward: 100,
      xpReward: 50,
      orderIndex: nextOrder,
      status: 'published',
    });
  };

  const handleSaveActivity = () => {
    if (!activityForm.title) {
      alert('Mohon isi Judul Aktivitas.');
      return;
    }
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;

    const payload: Partial<Activity> = {
      ...activityForm,
      missionId,
      orderIndex: Number(activityForm.orderIndex || activities.length + 1),
      pointReward: Number(activityForm.pointReward || (activityForm as any).pointsReward || 100),
      xpReward: Number(activityForm.xpReward || 50),
    };

    if (editingActivityId && editingActivityId !== 'NEW') {
      db.updateActivity(editingActivityId, payload, 'Admin Kurikulum BI', 'Pembaruan aktivitas');
    } else {
      db.createActivity(payload as Omit<Activity, 'id'>);
    }

    const fresh = db.getActivitiesByMission(missionId);
    setActivities(fresh);
    setEditingActivityId(null);
    setActivityForm({});
    onSaved('Aktivitas interaktif berhasil disimpan!');
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm('Hapus aktivitas ini?')) {
      sounds.playPop();
      db.deleteActivity(id);
      const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
      setActivities(db.getActivitiesByMission(missionId));
      if (editingActivityId === id) {
        setEditingActivityId(null);
      }
      onSaved('Aktivitas dihapus.');
    }
  };

  // --- PRACTICE QUESTION CRUD ---
  const handleStartEditQuestion = (q: PracticeQuestion) => {
    sounds.playPop();
    setEditingQuestionId(q.id);
    setQuestionForm({ ...q });
  };

  const handleNewQuestion = () => {
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
    const nextOrder = questions.length + 1;
    const newId = `Q-${missionId}-${nextOrder}`;
    setEditingQuestionId('NEW');
    setQuestionForm({
      id: newId,
      code: newId,
      missionId,
      question: '',
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctAnswerIndex: 0,
      explanation: '',
      difficulty: 'medium',
      competencyCategory: 'Pemahaman Rupiah',
      points: 20,
      status: 'published',
    });
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question) {
      alert('Mohon isi teks pertanyaan soal.');
      return;
    }
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;

    const payload: Partial<PracticeQuestion> = {
      ...questionForm,
      missionId,
      correctAnswerIndex: Number(questionForm.correctAnswerIndex ?? (questionForm as any).correctAnswer ?? 0),
      difficulty: (questionForm.difficulty === 'hard' || questionForm.difficulty === 'easy' ? questionForm.difficulty : 'medium'),
      points: Number(questionForm.points || 20),
    };

    if (editingQuestionId && editingQuestionId !== 'NEW') {
      db.updatePracticeQuestion(editingQuestionId, payload, 'Admin Kurikulum BI', 'Pembaruan soal latihan');
    } else {
      db.createPracticeQuestion(payload as Omit<PracticeQuestion, 'id'>);
    }

    const fresh = db.getPracticeQuestionsByMission(missionId);
    setQuestions(fresh);
    setEditingQuestionId(null);
    setQuestionForm({});
    onSaved('Soal latihan berhasil disimpan!');
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Hapus butir soal ini?')) {
      sounds.playPop();
      db.deletePracticeQuestion(id);
      const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
      setQuestions(db.getPracticeQuestionsByMission(missionId));
      if (editingQuestionId === id) {
        setEditingQuestionId(null);
      }
      onSaved('Soal latihan dihapus.');
    }
  };

  // --- SAVE REFLECTION ---
  const handleSaveReflection = () => {
    sounds.playPop();
    const missionId = mission ? normalizeMissionId(mission.id || mission.code) : infoForm.code;
    const guides = reflectionForm.guideQuestions
      .split('\n')
      .map((g) => g.trim())
      .filter(Boolean);

    const payload: Partial<Reflection> = {
      missionId,
      prompt: reflectionForm.prompt,
      guideQuestions: guides,
    };

    if (reflection) {
      db.updateReflection(reflection.id, payload, 'Admin Kurikulum BI', 'Pembaruan refleksi');
    } else {
      db.createReflection({
        ...payload,
        id: `REF-${missionId}`,
        code: `REF-${missionId}`,
        prompt: reflectionForm.prompt || 'Refleksi Diri Misi',
        guideQuestions: guides,
        status: 'published',
      } as Reflection);
    }

    const freshRefl = db.getReflectionByMission(missionId);
    if (freshRefl) setReflection(freshRefl);
    onSaved('Data refleksi misi berhasil disimpan!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-indigo-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Layers className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-mono font-bold tracking-wider">
                  {infoForm.code || 'MISI BARU'}
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white truncate max-w-md">
                  {infoForm.title || 'Form Kelola Misi & Konten Terpadu'}
                </h3>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Atur info misi, materi slide, aktivitas permainan, soal latihan, dan pertanyaan refleksi dalam satu tempat
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

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-100/90 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0 py-2">
          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('info');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Info & Cover Misi</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('lessons');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'lessons'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Materi & Slide ({lessons.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('activities');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'activities'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>3. Aktivitas Interaktif ({activities.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('questions');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'questions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>4. Bank Soal ({questions.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('reflection');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'reflection'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>5. Refleksi Siswa</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: INFO & COVER MISI */}
          {activeTab === 'info' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Cover Image Upload Card */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Foto Cover / Banner Misi</h4>
                      <p className="text-xs text-slate-500">Tampil sebagai gambar utama pengantar misi saat siswa mulai belajar.</p>
                    </div>
                  </div>
                  {infoForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setInfoForm((prev) => ({ ...prev, imageUrl: '' }))}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Image Preview Box */}
                  <div className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100/60 overflow-hidden flex items-center justify-center relative group">
                    {infoForm.imageUrl ? (
                      <img
                        src={infoForm.imageUrl}
                        alt="Cover Misi"
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <ImageIcon className="w-10 h-10 mx-auto mb-1 opacity-50" />
                        <div className="text-xs font-semibold">Belum ada foto cover</div>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCoverFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all">
                          {isUploadingCover ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>{isUploadingCover ? 'Mengompres Gambar...' : 'Upload File Foto Cover'}</span>
                        </div>
                      </label>
                    </div>

                    {coverUploadMsg && (
                      <div className="text-xs font-bold text-emerald-700">{coverUploadMsg}</div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        Atau masukkan URL Gambar Eksternal:
                      </label>
                      <input
                        type="text"
                        value={infoForm.imageUrl}
                        onChange={(e) => setInfoForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Fields */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-800">Detail & Atribut Misi</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Kode Misi</label>
                    <input
                      type="text"
                      value={infoForm.code}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Ranah / Dunia</label>
                    <select
                      value={infoForm.worldId}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, worldId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    >
                      <option value="cinta">❤️ Cinta Rupiah (Mengenal & Merawat)</option>
                      <option value="bangga">🛡️ Bangga Rupiah (Kedaulatan & Simbol)</option>
                      <option value="paham">💡 Paham Rupiah (Belanja, Berhemat, QRIS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Status Publikasi</label>
                    <select
                      value={infoForm.status}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, status: e.target.value as ContentStatus }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    >
                      <option value="published">⚡ Aktif (Published - Dapat diakses Siswa)</option>
                      <option value="draft">📝 Draft (Belum tayang)</option>
                      <option value="review">🔍 Dalam Review</option>
                      <option value="approved">✅ Approved</option>
                      <option value="archived">📦 Diarsipkan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Judul Misi</label>
                    <input
                      type="text"
                      value={infoForm.title}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Kenali Rupiahmu: 3D (Dilihat, Diraba, Diterawang)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Sub-Judul / Tagline</label>
                    <input
                      type="text"
                      value={infoForm.subtitle}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="e.g. Menjadi Detektif Keaslian Uang Kertas Rupiah"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Cerita Pembuka / Narasi Pengantar</label>
                  <textarea
                    rows={3}
                    value={infoForm.storyOpening}
                    onChange={(e) => setInfoForm((prev) => ({ ...prev, storyOpening: e.target.value }))}
                    placeholder="Tuliskan narasi menarik yang mengajak siswa bertualang di misi ini..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Pertanyaan Pemantik Utama (Big Question)
                    </label>
                    <input
                      type="text"
                      value={infoForm.bigQuestion}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, bigQuestion: e.target.value }))}
                      placeholder="e.g. Bagaimana cara memastikan uang kembalian kita adalah Rupiah asli?"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Poin Capaian Pembelajaran (1 baris per poin)
                    </label>
                    <textarea
                      rows={2}
                      value={infoForm.learningPoints}
                      onChange={(e) => setInfoForm((prev) => ({ ...prev, learningPoints: e.target.value }))}
                      placeholder="Memahami ciri-ciri keaslian uang kertas&#10;Mempraktikkan teknik 3D dengan tepat"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveMissionInfo()}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Info & Atribut Misi</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MATERI & SLIDE */}
          {activeTab === 'lessons' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Slide Materi Pembelajaran Misi</h4>
                  <p className="text-xs text-slate-500">
                    Siswa membaca slide materi ini secara berurutan sebelum melanjutkan ke aktivitas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewLesson}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slide Baru</span>
                </button>
              </div>

              {/* Editing Form for Lesson */}
              {editingLessonId && (
                <div className="p-5 rounded-3xl bg-blue-50/70 border-2 border-blue-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                    <div className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>{editingLessonId === 'NEW' ? 'Tambah Slide Materi Baru' : 'Edit Slide Materi'}</span>
                    </div>
                    <button
                      onClick={() => setEditingLessonId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Judul Slide</label>
                      <input
                        type="text"
                        value={lessonForm.title || ''}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Mengenal Unsur 3D: Dilihat, Diraba, Diterawang"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Urutan Slide (1, 2, 3...)</label>
                      <input
                        type="number"
                        min={1}
                        value={lessonForm.contentOrder || 1}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, contentOrder: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Image Upload for Lesson */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Foto / Ilustrasi Penjelas Slide Materi</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {lessonForm.imageUrl ? (
                          <img
                            src={lessonForm.imageUrl}
                            alt="Slide Materi"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-[10px] text-slate-400 font-medium text-center p-2">
                            Tanpa Foto
                          </div>
                        )}
                      </div>
                      <div className="sm:col-span-3 space-y-2">
                        <label className="cursor-pointer inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleLessonImageUpload(e.target.files[0]);
                              }
                            }}
                          />
                          <div className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all">
                            {isUploadingLessonImg ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>Upload Foto Slide</span>
                          </div>
                        </label>
                        <input
                          type="text"
                          value={lessonForm.imageUrl || ''}
                          onChange={(e) => setLessonForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="Atau URL Foto: https://..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Teks Isi Pembelajaran Siswa (Materi Inti)
                    </label>
                    <textarea
                      rows={5}
                      value={lessonForm.studentText || ''}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, studentText: e.target.value }))}
                      placeholder="Tuliskan materi pembelajaran dengan bahasa yang interaktif dan mudah dipahami siswa SD..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Pemantik Interaksi / "Ayo Berpikir!" (Opsional)
                    </label>
                    <input
                      type="text"
                      value={lessonForm.interactionPrompt || ''}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, interactionPrompt: e.target.value }))}
                      placeholder="e.g. Coba raba uang kertas Rp100.000 milikmu, bagian mana yang terasa kasar?"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingLessonId(null)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLesson}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Slide</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lessons List Cards */}
              <div className="space-y-3">
                {lessons.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold text-slate-600">Belum ada slide materi pada misi ini.</div>
                    <p className="text-xs text-slate-400 mt-1">Klik tombol "Tambah Slide Baru" di atas untuk menambahkan materi.</p>
                  </div>
                ) : (
                  lessons.map((l, idx) => (
                    <div
                      key={l.id || idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex items-start gap-4"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                        {l.contentOrder || idx + 1}
                      </div>

                      {l.imageUrl && (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 truncate">{l.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {l.code || l.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-medium">
                          {l.studentText || l.content || 'Belum ada isi teks.'}
                        </p>
                        {l.interactionPrompt && (
                          <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            <span>{l.interactionPrompt}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditLesson(l)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-colors"
                          title="Edit Slide"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(l.id)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                          title="Hapus Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AKTIVITAS INTERAKTIF */}
          {activeTab === 'activities' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Aktivitas & Mini-Game Interaktif</h4>
                  <p className="text-xs text-slate-500">
                    Tantangan praktis setelah siswa menyelesaikan materi (Pencocokan, Pengelompokan, Titik Sentuh, dll).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewActivity}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Aktivitas</span>
                </button>
              </div>

              {/* Editing Form for Activity */}
              {editingActivityId && (
                <div className="p-5 rounded-3xl bg-amber-50/70 border-2 border-amber-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <div className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-amber-600" />
                      <span>{editingActivityId === 'NEW' ? 'Tambah Aktivitas Baru' : 'Edit Aktivitas Interaktif'}</span>
                    </div>
                    <button
                      onClick={() => setEditingActivityId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Judul Aktivitas</label>
                      <input
                        type="text"
                        value={activityForm.title || ''}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Pencocokan Ciri 3D Rupiah"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tipe Permainan</label>
                      <select
                        value={activityForm.type || 'matching'}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      >
                        <option value="matching">🧩 Pencocokan Pasangan (Matching)</option>
                        <option value="categorization">📦 Pengelompokan Kategori</option>
                        <option value="hotspot">🔍 Titik Sentuh Interaktif (Hotspot 3D)</option>
                        <option value="calculation">🧮 Hitung Cepat Kembalian</option>
                        <option value="multiple_choice">📝 Kuis Interaktif Singkat</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Instruksi Permainan untuk Siswa</label>
                    <textarea
                      rows={3}
                      value={activityForm.instruction || (activityForm as any).instructions || ''}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, instruction: e.target.value }))}
                      placeholder="Jelaskan cara memainkan tantangan ini dengan jelas..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Poin Reward</label>
                      <input
                        type="number"
                        value={activityForm.pointReward || (activityForm as any).pointsReward || 100}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, pointReward: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tipe Tantangan</label>
                      <select
                        value={activityForm.type || 'matching'}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      >
                        <option value="matching">Pencocokan (Matching)</option>
                        <option value="sorter">Pengurutan / Sortir</option>
                        <option value="categorization">Kategorisasi</option>
                        <option value="simulator_5j">Simulator 5J</option>
                        <option value="decision_quest">Decision Quest</option>
                        <option value="interactive">Interaktif Interaktif</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingActivityId(null)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveActivity}
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Aktivitas</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Activities List */}
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-400">
                    <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold text-slate-600">Belum ada aktivitas interaktif pada misi ini.</div>
                    <p className="text-xs text-slate-400 mt-1">Tambahkan aktivitas untuk memberi tantangan seru bagi siswa.</p>
                  </div>
                ) : (
                  activities.map((a, idx) => (
                    <div
                      key={a.id || idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition-all flex items-start gap-4"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 truncate">{a.title}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {a.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-medium">
                          {a.instruction || (a as any).instructions || 'Aktivitas tantangan interaktif.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditActivity(a)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors"
                          title="Edit Aktivitas"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(a.id)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BANK SOAL */}
          {activeTab === 'questions' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Bank Soal Latihan Formatif Misi</h4>
                  <p className="text-xs text-slate-500">
                    Soal pilihan ganda yang dikerjakan siswa untuk mengukur pemahaman materi misi ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewQuestion}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Soal Baru</span>
                </button>
              </div>

              {/* Editing Form for Question */}
              {editingQuestionId && (
                <div className="p-5 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>{editingQuestionId === 'NEW' ? 'Tambah Soal Latihan Baru' : 'Edit Soal Latihan'}</span>
                    </div>
                    <button
                      onClick={() => setEditingQuestionId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Teks Pertanyaan / Soal</label>
                    <textarea
                      rows={3}
                      value={questionForm.question || ''}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, question: e.target.value }))}
                      placeholder="Tuliskan butir soal pilihan ganda di sini..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Pilihan Jawaban & Kunci Benar:</label>
                    {[0, 1, 2, 3].map((optIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][optIdx];
                      const currentOpts = questionForm.options || ['', '', '', ''];
                      const isCorrect = Number(questionForm.correctAnswerIndex ?? (questionForm as any).correctAnswer ?? 0) === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                            isCorrect ? 'bg-emerald-100/70 border-emerald-300 ring-1 ring-emerald-400' : 'bg-white border-slate-200'
                          }`}
                        >
                          <label className="flex items-center gap-1.5 cursor-pointer shrink-0 pl-1">
                            <input
                              type="radio"
                              name="correct-opt"
                              checked={isCorrect}
                              onChange={() => setQuestionForm((prev) => ({ ...prev, correctAnswerIndex: optIdx }))}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
                              {letter}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={currentOpts[optIdx] || ''}
                            onChange={(e) => {
                              const newOpts = [...currentOpts];
                              newOpts[optIdx] = e.target.value;
                              setQuestionForm((prev) => ({ ...prev, options: newOpts }));
                            }}
                            placeholder={`Teks Pilihan ${letter}`}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-transparent text-xs font-medium focus:outline-none"
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-black text-emerald-800 uppercase px-2 py-0.5 rounded-full bg-emerald-200 shrink-0">
                              Kunci Jawaban
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tingkat Kesulitan</label>
                      <select
                        value={questionForm.difficulty || 'medium'}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      >
                        <option value="easy">🟢 Mudah (Level C1-C2)</option>
                        <option value="medium">🟡 Sedang (Level C3-C4)</option>
                        <option value="hard">🔴 Sulit (Level C5-C6 / HOTS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Poin Nilai</label>
                      <input
                        type="number"
                        value={questionForm.points || 20}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, points: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Pembahasan / Penjelasan Jawaban</label>
                    <textarea
                      rows={2}
                      value={questionForm.explanation || ''}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))}
                      placeholder="Jelaskan alasan mengapa pilihan tersebut benar..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestionId(null)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuestion}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Soal</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                {questions.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-400">
                    <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold text-slate-600">Belum ada butir soal latihan pada misi ini.</div>
                    <p className="text-xs text-slate-400 mt-1">Tambahkan soal latihan formatif untuk menguji pemahaman siswa.</p>
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex items-start gap-4"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 line-clamp-2">{q.question}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Kunci: {['A', 'B', 'C', 'D'][q.correctAnswerIndex ?? (q as any).correctAnswer ?? 0]}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {q.difficulty?.toUpperCase() || 'SEDANG'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {q.points || 20} Poin
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditQuestion(q)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                          title="Edit Soal"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REFLEKSI SISWA */}
          {activeTab === 'reflection' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Pertanyaan Refleksi Siswa</h4>
                    <p className="text-xs text-slate-500">
                      Membimbing siswa merenungkan dan merefleksikan nilai-nilai Rupiah setelah menuntaskan latihan.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Judul Halaman Refleksi</label>
                  <input
                    type="text"
                    value={reflectionForm.title}
                    onChange={(e) => setReflectionForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Refleksi & Komitmenku untuk Rupiah"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Pengantar / Instruksi Refleksi</label>
                  <textarea
                    rows={2}
                    value={reflectionForm.prompt}
                    onChange={(e) => setReflectionForm((prev) => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Tuliskan pengalaman belajarmu secara jujur..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Pertanyaan Panduan Refleksi (1 baris per pertanyaan)
                  </label>
                  <textarea
                    rows={4}
                    value={reflectionForm.guideQuestions}
                    onChange={(e) => setReflectionForm((prev) => ({ ...prev, guideQuestions: e.target.value }))}
                    placeholder="1. Apa ciri Rupiah yang paling mudah kamu kenali?&#10;2. Apa kebiasaan baru yang akan kamu lakukan untuk merawat uang kertasmu?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveReflection}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Refleksi</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleSaveMissionInfo();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Selesai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
