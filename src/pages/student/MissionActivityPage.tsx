import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Gamepad2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Info,
  Check,
  X,
  ChevronRight,
  Eye,
  Hand,
  Sun,
  ShieldCheck,
  Coins,
  Calculator,
  Wallet,
  FileCheck,
  AlertTriangle,
  Award,
  Layers,
  ShoppingBag,
  CreditCard,
  Building,
  HeartHandshake,
} from 'lucide-react';
import { Activity, Mission } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';

interface MissionActivityPageProps {
  missionId: string;
  onBackToDetail: (missionId: string) => void;
  onContinueToPractice: (missionId: string) => void;
}

export const MissionActivityPage: React.FC<MissionActivityPageProps> = ({
  missionId,
  onBackToDetail,
  onContinueToPractice,
}) => {
  const currentUser = db.getCurrentUser();
  const effectiveStudentId = currentUser?.id || 'std_01';

  const [mission, setMission] = useState<Mission | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActIdx, setCurrentActIdx] = useState(0);

  // General Interactive State
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Simulator 5J State
  const [fiveJState, setFiveJState] = useState<{
    completedRules: string[];
    currentScenarioIdx: number;
    scenarios: Array<{
      id: string;
      actionText: string;
      isGoodCare: boolean;
      ruleName: string;
      ruleKey: 'dilipat' | 'dicoret' | 'distapler' | 'diremas' | 'dibasahi';
      explanation: string;
    }>;
  }>({
    completedRules: [],
    currentScenarioIdx: 0,
    scenarios: [],
  });

  // Ordering Mechanic State
  const [orderItems, setOrderItems] = useState<{ id: string; text: string; correctIndex: number }[]>([]);

  // Categorization Mechanic State
  const [categories, setCategories] = useState<{
    bucketA: { name: string; items: string[] };
    bucketB: { name: string; items: string[] };
    remainingItems: { id: string; text: string; correctBucket: 'A' | 'B'; tip?: string }[];
  }>({
    bucketA: { name: 'Kategori A', items: [] },
    bucketB: { name: 'Kategori B', items: [] },
    remainingItems: [],
  });

  // Sorter State (Dompet / Nominal)
  const [walletBills, setWalletBills] = useState<
    Array<{ id: string; nominal: number; label: string; color: string; correctIndex: number }>
  >([]);

  // Hotspot Mechanic State
  const [discoveredHotspots, setDiscoveredHotspots] = useState<string[]>([]);
  const [activeHotspotInfo, setActiveHotspotInfo] = useState<string | null>(null);

  // Simple Calculation State
  const [calcInput, setCalcInput] = useState<string>('');
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);

  // Decision Choice State
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  useEffect(() => {
    const m = db.getMissionById(missionId);
    setMission(m);
    if (m) {
      const acts = db.getActivitiesByMission(m.id);
      setActivities(acts);
      if (acts.length > 0) {
        initActivity(acts[0], m);
      }
    }
  }, [missionId]);

  const initActivity = (act: Activity, m: Mission) => {
    setIsCompleted(false);
    setHintMessage(null);
    setDiscoveredHotspots([]);
    setActiveHotspotInfo(null);
    setCalcInput('');
    setCalcFeedback(null);
    setSelectedDecision(null);

    const actType = (act.type || '').toLowerCase();
    const actTitle = (act.title || '').toLowerCase();
    const mid = (m.id || '').toUpperCase();

    // 1. 5J Simulator (JR-C02 / ACT-003 / title contains '5j' or 'merawat')
    if (actType === 'simulator_5j' || actTitle.includes('5j') || (mid.includes('C02') && act.orderIndex === 1)) {
      const defaultScenarios = [
        {
          id: '5j-1',
          actionText: 'Menyimpan uang lembaran secara rapi lurus di dompet panjang tanpa ditekuk tajam.',
          isGoodCare: true,
          ruleName: 'Jangan Dilipat',
          ruleKey: 'dilipat' as const,
          explanation: 'Tepat! Menyimpan uang lurus menjaga serat kertas dan fitur pengaman tetap utuh.',
        },
        {
          id: '5j-2',
          actionText: 'Mencatat nomor telepon atau hitungan belanja di atas permukaan uang kertas menggunakan pulpen.',
          isGoodCare: false,
          ruleName: 'Jangan Dicoret',
          ruleKey: 'dicoret' as const,
          explanation: 'Benar, mencoret uang merusak keindahan dan dapat menutupi gambar pahlawan serta kode pengaman.',
        },
        {
          id: '5j-3',
          actionText: 'Menggunakan staples kawat besi untuk menyatukan uang belanjaan dengan nota.',
          isGoodCare: false,
          ruleName: 'Jangan Distapler',
          ruleKey: 'distapler' as const,
          explanation: 'Benar! Staples membuat lubang robek pada kertas uang yang mempercepat kerusakan.',
        },
        {
          id: '5j-4',
          actionText: 'Meremas uang menjadi gumpalan bulat lalu dimasukkan sembarangan ke kantong celana sempit.',
          isGoodCare: false,
          ruleName: 'Jangan Diremas',
          ruleKey: 'diremas' as const,
          explanation: 'Tepat! Meremas uang membuat permukaan kusut, lusuh, dan sulit dideteksi mesin hitung.',
        },
        {
          id: '5j-5',
          actionText: 'Membiarkan uang terendam di saku baju saat dicuci atau terkena tumpahan sirup.',
          isGoodCare: false,
          ruleName: 'Jangan Dibasahi',
          ruleKey: 'dibasahi' as const,
          explanation: 'Hebat! Menjauhkan uang dari air dan kelembapan menjaga kualitas serat kapas Rupiah.',
        },
      ];
      setFiveJState({
        completedRules: [],
        currentScenarioIdx: 0,
        scenarios: defaultScenarios,
      });
      return;
    }

    // 2. Tata Dompet Rapi / Sorter Nominal (JR-C02 ACT-004 / wallet)
    if (actType === 'sorter' && (actTitle.includes('dompet') || actTitle.includes('nominal'))) {
      const initialBills = [
        { id: 'b-50k', nominal: 50000, label: 'Rp50.000 (Biru)', color: 'bg-blue-600', correctIndex: 5 },
        { id: 'b-2k', nominal: 2000, label: 'Rp2.000 (Abu-abu)', color: 'bg-slate-600', correctIndex: 1 },
        { id: 'b-100k', nominal: 100000, label: 'Rp100.000 (Merah)', color: 'bg-rose-600', correctIndex: 6 },
        { id: 'b-10k', nominal: 10000, label: 'Rp10.000 (Ungu)', color: 'bg-purple-600', correctIndex: 3 },
        { id: 'b-1k', nominal: 1000, label: 'Rp1.000 (Kuning/Cokelat)', color: 'bg-amber-600', correctIndex: 0 },
        { id: 'b-20k', nominal: 20000, label: 'Rp20.000 (Hijau)', color: 'bg-emerald-600', correctIndex: 4 },
        { id: 'b-5k', nominal: 5000, label: 'Rp5.000 (Cokelat Muda)', color: 'bg-amber-700', correctIndex: 2 },
      ];
      // Shuffle initially
      setWalletBills([...initialBills].sort(() => Math.random() - 0.5));
      return;
    }

    // 3. Inspektur ULE vs UTLE (JR-C03 / ACT-005)
    if (actTitle.includes('layak edar') || actTitle.includes('ule') || mid.includes('C03')) {
      setCategories({
        bucketA: { name: 'Uang Layak Edar (ULE)', items: [] },
        bucketB: { name: 'Uang Tidak Layak Edar (UTLE)', items: [] },
        remainingItems: [
          { id: 'ule-1', text: 'Uang kertas TE 2022 bersih, lurus, dan warna cerah', correctBucket: 'A' },
          { id: 'ule-2', text: 'Uang kertas dengan coretan spidol tebal melintang', correctBucket: 'B' },
          { id: 'ule-3', text: 'Uang robek lebih dari 3 cm di bagian tengah', correctBucket: 'B' },
          { id: 'ule-4', text: 'Uang mulus yang disimpan rapi di dalam dompet', correctBucket: 'A' },
          { id: 'ule-5', text: 'Uang yang berlubang bekas tusukan staples kawat', correctBucket: 'B' },
          { id: 'ule-6', text: 'Uang logam berkilau tanpa karat maupun lekukan', correctBucket: 'A' },
        ],
      });
      return;
    }

    // 4. Kebutuhan vs Keinginan (JR-P08 / ACT-015 / budget / categorization)
    if (actType === 'categorization' || actTitle.includes('kebutuhan') || mid.includes('P08')) {
      setCategories({
        bucketA: { name: 'Kebutuhan Pokok', items: [] },
        bucketB: { name: 'Keinginan (Dapat Ditunda)', items: [] },
        remainingItems: [
          { id: 'item-1', text: 'Buku Tulis & Pensil 2B Sekolah', correctBucket: 'A' },
          { id: 'item-2', text: 'Mainan Robot Elektronik Baru', correctBucket: 'B' },
          { id: 'item-3', text: 'Bekal Makanan Siang Bergizi', correctBucket: 'A' },
          { id: 'item-4', text: 'Beli Diamond Top-Up Game Online', correctBucket: 'B' },
          { id: 'item-5', text: 'Sepatu Sekolah Mengganti yang Rusak', correctBucket: 'A' },
          { id: 'item-6', text: 'Camilan Manis Berlebihan', correctBucket: 'B' },
        ],
      });
      return;
    }

    // 5. Ordering / 3D Keaslian (JR-C01 / ACT-001 / ordering)
    if (actType === 'ordering' || actTitle.includes('3d') || mid.includes('C01')) {
      const defaultItems = [
        { id: '1', text: '1. Dilihat: Periksa warna cerah, nominal, dan gambar pahlawan nasional', correctIndex: 0 },
        { id: '2', text: '2. Diraba: Rasakan tekstur cetak kasar pada angka nominal dan lambang Garuda', correctIndex: 1 },
        { id: '3', text: '3. Diterawang: Arahkan ke cahaya untuk melihat tanda air (watermark) & logo BI utuh', correctIndex: 2 },
      ];
      setOrderItems([...defaultItems].sort(() => Math.random() - 0.5));
      return;
    }

    // 6. Generic Decision Quest / Skenario
    if (actType === 'decision_quest' || actType === 'decision' || actType === 'quiz') {
      setSelectedDecision(null);
      return;
    }
  };

  const currentActivity = activities[currentActIdx];

  // Helper Switch Activity in mission
  const handleSwitchActivity = (idx: number) => {
    sounds.playPop();
    setCurrentActIdx(idx);
    if (mission && activities[idx]) {
      initActivity(activities[idx], mission);
    }
  };

  // Helper 5J Simulator actions
  const handleFiveJChoice = (chosenIsGood: boolean) => {
    const scenario = fiveJState.scenarios[fiveJState.currentScenarioIdx];
    if (!scenario) return;

    if (chosenIsGood === scenario.isGoodCare) {
      sounds.playSuccess();
      const updatedRules = [...fiveJState.completedRules];
      if (!updatedRules.includes(scenario.ruleName)) {
        updatedRules.push(scenario.ruleName);
      }

      setHintMessage(`🎉 Benar! ${scenario.explanation}`);
      const nextIdx = fiveJState.currentScenarioIdx + 1;

      if (nextIdx >= fiveJState.scenarios.length) {
        setIsCompleted(true);
        setFiveJState({
          ...fiveJState,
          completedRules: updatedRules,
          currentScenarioIdx: nextIdx,
        });
        if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
      } else {
        setFiveJState({
          ...fiveJState,
          completedRules: updatedRules,
          currentScenarioIdx: nextIdx,
        });
      }
    } else {
      sounds.playPop();
      setHintMessage(`⚠️ Kurang tepat. Tindakan ini merupakan ${scenario.isGoodCare ? 'cara merawat yang baik' : 'pelanggaran prinsip 5J (' + scenario.ruleName + ')'}. Coba perhatikan lagi tujuannya.`);
    }
  };

  // Helper Wallet Sorting
  const moveWalletBill = (index: number, direction: 'up' | 'down') => {
    sounds.playPop();
    const newBills = [...walletBills];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBills.length) return;

    const temp = newBills[index];
    newBills[index] = newBills[targetIndex];
    newBills[targetIndex] = temp;
    setWalletBills(newBills);
  };

  const checkWalletOrder = () => {
    const isCorrect = walletBills.every((item, idx) => item.correctIndex === idx);
    if (isCorrect) {
      sounds.playSuccess();
      setIsCompleted(true);
      setHintMessage('🌟 Sempurna! Uang tersusun rapi dari nominal terkecil (Rp1.000) hingga terbesar (Rp100.000) tanpa terlipat!');
      if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
    } else {
      sounds.playPop();
      setHintMessage('💡 Urutan belum tepat. Susun dari nominal terkecil: Rp1.000 ➔ Rp2.000 ➔ Rp5.000 ➔ Rp10.000 ➔ Rp20.000 ➔ Rp50.000 ➔ Rp100.000.');
    }
  };

  // Helper Order Mechanic (3D, dll)
  const moveOrderItem = (index: number, direction: 'up' | 'down') => {
    sounds.playPop();
    const newItems = [...orderItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setOrderItems(newItems);
  };

  const checkOrderCompletion = () => {
    const isCorrect = orderItems.every((item, idx) => item.correctIndex === idx);
    if (isCorrect) {
      sounds.playSuccess();
      setIsCompleted(true);
      setHintMessage('Luar biasa! Urutan langkah 3D (Dilihat, Diraba, Diterawang) sudah tepat 100%!');
      if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
    } else {
      sounds.playPop();
      setHintMessage('Urutan belum pas nih! Petunjuk: Mulai dari indra mata (Dilihat), tangan (Diraba), lalu cahaya (Diterawang).');
    }
  };

  // Helper Categorization
  const assignCategory = (itemId: string, bucket: 'A' | 'B') => {
    sounds.playPop();
    const item = categories.remainingItems.find((i) => i.id === itemId);
    if (!item) return;

    if (item.correctBucket !== bucket) {
      setHintMessage(`Kurang tepat untuk "${item.text}". Perhatikan fungsinya baik-baik.`);
      return;
    }

    setHintMessage(null);
    sounds.playSuccess();

    const newRemaining = categories.remainingItems.filter((i) => i.id !== itemId);
    const newCat = { ...categories };
    if (bucket === 'A') {
      newCat.bucketA.items.push(item.text);
    } else {
      newCat.bucketB.items.push(item.text);
    }
    newCat.remainingItems = newRemaining;
    setCategories(newCat);

    if (newRemaining.length === 0) {
      setIsCompleted(true);
      setHintMessage('🎉 Hebat! Semua kartu berhasil dikelompokkan dengan benar!');
      if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
    }
  };

  // Helper Hotspot
  const handleHotspotClick = (spotId: string, title: string, info: string) => {
    sounds.playPop();
    setActiveHotspotInfo(`${title}: ${info}`);
    if (!discoveredHotspots.includes(spotId)) {
      const updated = [...discoveredHotspots, spotId];
      setDiscoveredHotspots(updated);
      if (updated.length >= 4) {
        sounds.playSuccess();
        setIsCompleted(true);
        if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
      }
    }
  };

  // Helper Calculation
  const handleCheckCalculation = (targetTotal: number) => {
    const parsed = parseInt(calcInput.replace(/\D/g, ''), 10);
    if (parsed === targetTotal) {
      sounds.playSuccess();
      setCalcFeedback('Tepat sekali! Kembalian yang kamu hitung sangat akurat.');
      setIsCompleted(true);
      if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
    } else {
      sounds.playPop();
      setCalcFeedback('Perhitungannya belum pas. Coba hitung lagi: Uang Pembayaran dikurangi Total Belanja.');
    }
  };

  // Helper Decision choice
  const handleDecisionSelect = (choiceId: string, isCorrect: boolean, feedback: string) => {
    sounds.playPop();
    setSelectedDecision(choiceId);
    setHintMessage(feedback);
    if (isCorrect) {
      sounds.playSuccess();
      setIsCompleted(true);
      if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
    }
  };

  if (!mission || activities.length === 0 || !currentActivity) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md">
          <p className="text-base font-bold text-slate-700">Aktivitas sedang disiapkan untuk misi ini.</p>
          <button
            onClick={() => onBackToDetail(missionId)}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-xs cursor-pointer"
          >
            Kembali ke Detail Misi
          </button>
        </div>
      </div>
    );
  }

  // Detect which UI component should render
  const actType = (currentActivity.type || '').toLowerCase();
  const actTitle = (currentActivity.title || '').toLowerCase();
  const mid = (mission.id || '').toUpperCase();

  const is5JSimulator =
    actType === 'simulator_5j' || actTitle.includes('5j') || (mid.includes('C02') && currentActivity.orderIndex === 1);

  const isWalletSorter =
    actType === 'sorter' && (actTitle.includes('dompet') || actTitle.includes('nominal'));

  const isCategorizationOrSorter =
    !is5JSimulator &&
    !isWalletSorter &&
    (actType === 'categorization' ||
      actType === 'sorter' ||
      actTitle.includes('layak edar') ||
      actTitle.includes('kebutuhan') ||
      categories.remainingItems.length > 0 ||
      categories.bucketA.items.length > 0);

  const isOrdering =
    !is5JSimulator &&
    !isWalletSorter &&
    !isCategorizationOrSorter &&
    (actType === 'ordering' || actTitle.includes('3d') || orderItems.length > 0);

  const isHotspot =
    !is5JSimulator &&
    !isWalletSorter &&
    !isCategorizationOrSorter &&
    !isOrdering &&
    (actType === 'hotspot' || actTitle.includes('detektif') || actTitle.includes('fitur'));

  const isCalculation =
    !is5JSimulator &&
    !isWalletSorter &&
    !isCategorizationOrSorter &&
    !isOrdering &&
    !isHotspot &&
    (actType === 'calculation' || actTitle.includes('kantin') || actTitle.includes('kalkulator'));

  const isDecision =
    !is5JSimulator &&
    !isWalletSorter &&
    !isCategorizationOrSorter &&
    !isOrdering &&
    !isHotspot &&
    !isCalculation;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800 antialiased selection:bg-blue-200 selection:text-blue-900">
      {/* Top Navigation */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              sounds.playPop();
              onBackToDetail(missionId);
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Detail Misi</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-3 py-1 rounded-full border border-purple-200">
              Tahap 2: Aktivitas Praktik
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 font-mono">
            {isCompleted ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
              </span>
            ) : (
              <span className="bg-slate-100 px-2.5 py-1 rounded-full">Tantangan Aktif</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Multi-Activity Pill Selector if mission has > 1 activities */}
        {activities.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {activities.map((act, idx) => (
              <button
                key={act.id || idx}
                onClick={() => handleSwitchActivity(idx)}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  currentActIdx === idx
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Aktivitas {idx + 1}: {act.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold border border-purple-200">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Simulasi & Praktik Interaktif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {currentActivity.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {currentActivity.instruction || (currentActivity as any).instructions || 'Selesaikan tantangan di bawah ini sesuai petunjuk.'}
            </p>
          </div>

          {/* Feedback & Hint Callout */}
          {hintMessage && (
            <div
              className={`p-4 rounded-2xl border-2 flex items-start gap-3 text-xs sm:text-sm font-bold animate-fadeIn ${
                isCompleted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : hintMessage.includes('Benar') || hintMessage.includes('Luar biasa') || hintMessage.includes('Tepat')
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="flex-1 leading-relaxed">{hintMessage}</p>
            </div>
          )}

          {/* =========================================================
              1. SIMULATOR 5J (MERAWAT RUPIAH)
              ========================================================= */}
          {is5JSimulator && (
            <div className="space-y-6 pt-2">
              {/* 5J Rule Badges Status */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Penguasaan 5 Prinsip 5J:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Jangan Dilipat', icon: Layers },
                    { label: 'Jangan Dicoret', icon: FileCheck },
                    { label: 'Jangan Distapler', icon: AlertTriangle },
                    { label: 'Jangan Diremas', icon: Hand },
                    { label: 'Jangan Dibasahi', icon: Sun },
                  ].map((rule, idx) => {
                    const isDone = fiveJState.completedRules.includes(rule.label) || isCompleted;
                    const IconComp = rule.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : <IconComp className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[10px] font-black leading-tight">{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Scenario Card */}
              {fiveJState.currentScenarioIdx < fiveJState.scenarios.length ? (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-white border-2 border-indigo-200/80 shadow-md space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-full">
                      Tantangan {fiveJState.currentScenarioIdx + 1} dari {fiveJState.scenarios.length}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Tentukan Sikap Merawat Uang
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs">
                    <p className="text-sm sm:text-base font-extrabold text-slate-800 leading-relaxed">
                      "{fiveJState.scenarios[fiveJState.currentScenarioIdx].actionText}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-600">
                      Apakah tindakan di atas merupakan cara merawat uang yang tepat?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleFiveJChoice(true)}
                        className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Benar (Merawat Rupiah)</span>
                      </button>
                      <button
                        onClick={() => handleFiveJChoice(false)}
                        className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer transition-all active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        <span>Salah (Merusak Rupiah / 5J)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-3 shadow-md">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-950">
                    Luar Biasa! Kamu Duta Perawat Rupiah Sejati!
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-emerald-900 leading-relaxed max-w-lg mx-auto">
                    Kamu telah memahami dengan sempurna cara menerapkan 5J (Jangan Dilipat, Dicoret, Distapler, Diremas, dan Dibasahi) untuk menjaga Rupiah selalu layak edar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              2. TATA DOMPET RAPI (SORTER NOMINAL)
              ========================================================= */}
          {isWalletSorter && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Susun uang dari nominal <strong>terkecil (Rp1.000)</strong> ke <strong>terbesar (Rp100.000)</strong>:</span>
              </div>

              <div className="space-y-2.5">
                {walletBills.map((bill, idx) => (
                  <div
                    key={bill.id}
                    className="p-4 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className={`px-3 py-1 rounded-xl text-white text-xs font-black ${bill.color}`}>
                        {bill.label}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveWalletBill(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveWalletBill(idx, 'down')}
                        disabled={idx === walletBills.length - 1}
                        className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={checkWalletOrder}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  Periksa Susunan Dompet
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              3. CATEGORIZATION / EMBER KATEGORI (ULE vs UTLE, dll)
              ========================================================= */}
          {isCategorizationOrSorter && (
            <div className="space-y-6 pt-2">
              {categories.remainingItems.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-600 block">
                    Pilih kategori yang tepat untuk kartu di bawah ini:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.remainingItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300"
                      >
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                          {item.text}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => assignCategory(item.id, 'A')}
                            className="flex-1 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-black cursor-pointer transition-colors active:scale-95 text-center"
                          >
                            + {categories.bucketA.name}
                          </button>
                          <button
                            onClick={() => assignCategory(item.id, 'B')}
                            className="flex-1 py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-black cursor-pointer transition-colors active:scale-95 text-center"
                          >
                            + {categories.bucketB.name}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center font-bold text-xs text-emerald-800">
                  🎉 Semua item berhasil dikelompokkan dengan tepat!
                </div>
              )}

              {/* 2 Result Buckets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2">
                  <span className="text-xs font-black uppercase text-emerald-800 block">
                    {categories.bucketA.name} ({categories.bucketA.items.length})
                  </span>
                  <ul className="space-y-1">
                    {categories.bucketA.items.map((it, idx) => (
                      <li key={idx} className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-2">
                  <span className="text-xs font-black uppercase text-amber-800 block">
                    {categories.bucketB.name} ({categories.bucketB.items.length})
                  </span>
                  <ul className="space-y-1">
                    {categories.bucketB.items.map((it, idx) => (
                      <li key={idx} className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              4. ORDERING (3D / LANGKAH URUT)
              ========================================================= */}
          {isOrdering && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Gunakan tombol panah Naik / Turun untuk menyusun urutan yang benar:</span>
              </div>

              <div className="space-y-2.5">
                {orderItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 shadow-xs hover:bg-slate-100/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                        {item.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveOrderItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveOrderItem(idx, 'down')}
                        disabled={idx === orderItems.length - 1}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={checkOrderCompletion}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  Periksa Urutan
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              5. HOTSPOT DETEKTIF RUPIAH
              ========================================================= */}
          {isHotspot && (
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-slate-600 block">
                Klik titik-titik lingkaran pada lembaran Rupiah untuk memeriksa fitur pengaman asli (Temukan minimal 4 titik):
              </span>

              <div className="relative w-full h-56 sm:h-64 rounded-3xl bg-gradient-to-r from-red-100 via-rose-100 to-amber-100 border-2 border-rose-300 p-4 overflow-hidden shadow-inner flex items-center justify-center select-none">
                <div className="absolute left-10 top-12 w-24 h-24 rounded-full border border-rose-300 bg-white/40 flex items-center justify-center text-xs font-bold text-rose-400">
                  Tanda Air
                </div>
                <div className="absolute right-12 top-8 text-2xl font-black text-rose-700">100.000</div>

                <button
                  onClick={() =>
                    handleHotspotClick(
                      'spot-1',
                      'Tanda Air (Watermark)',
                      'Gambar pahlawan nasional tampak jelas saat uang diterawang ke arah cahaya.'
                    )
                  }
                  className={`absolute left-14 top-16 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs cursor-pointer transition-transform hover:scale-125 ${
                    discoveredHotspots.includes('spot-1')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white animate-ping'
                  }`}
                >
                  1
                </button>

                <button
                  onClick={() =>
                    handleHotspotClick(
                      'spot-2',
                      'Benang Pengaman (Security Thread)',
                      'Garis anyaman yang berubah warna saat dilihat dari sudut pandang berbeda.'
                    )
                  }
                  className={`absolute left-1/2 -translate-x-6 top-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs cursor-pointer transition-transform hover:scale-125 ${
                    discoveredHotspots.includes('spot-2')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white animate-bounce'
                  }`}
                >
                  2
                </button>

                <button
                  onClick={() =>
                    handleHotspotClick(
                      'spot-3',
                      'Cetak Kasar (Intaglio)',
                      'Lambang Garuda dan nominal terasa kasar saat diraba dengan ujung jari.'
                    )
                  }
                  className={`absolute right-16 bottom-12 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs cursor-pointer transition-transform hover:scale-125 ${
                    discoveredHotspots.includes('spot-3')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  3
                </button>

                <button
                  onClick={() =>
                    handleHotspotClick(
                      'spot-4',
                      'Rectoverso (Gambar Saling Isi)',
                      'Logo Bank Indonesia yang saling mengisi secara sempurna saat diterawang.'
                    )
                  }
                  className={`absolute left-24 bottom-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs cursor-pointer transition-transform hover:scale-125 ${
                    discoveredHotspots.includes('spot-4')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white animate-bounce'
                  }`}
                >
                  4
                </button>
              </div>

              {activeHotspotInfo && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-bold text-blue-900">
                  🔍 {activeHotspotInfo}
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Titik Ditemukan: {discoveredHotspots.length} / 4</span>
              </div>
            </div>
          )}

          {/* =========================================================
              6. CALCULATION / KANTIN SEHAT
              ========================================================= */}
          {isCalculation && (
            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 space-y-3">
                <span className="text-xs font-black uppercase text-sky-800 block">Skenario Belanja Kantin Sehat:</span>
                <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                  Budi membeli nasi kuning seharga <span className="text-blue-700">Rp12.000</span> dan jus buah seharga{' '}
                  <span className="text-blue-700">Rp5.000</span> (Total belanja: Rp17.000). Budi membayar dengan selembar uang{' '}
                  <span className="text-rose-700 font-extrabold">Rp20.000</span>.
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-900">
                  Berapa uang kembalian yang harus diterima Budi?
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-slate-600">Rp</span>
                  <input
                    type="text"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder="Contoh: 3000"
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 w-40 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleCheckCalculation(3000)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Hitung
                  </button>
                </div>

                {calcFeedback && (
                  <p className="text-xs font-bold text-blue-900 pt-1">{calcFeedback}</p>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              7. DECISION QUEST / UNIVERSAL CASE STUDY
              ========================================================= */}
          {isDecision && (
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-slate-600 block">
                Pilih tindakan paling tepat dan bijak sesuai skenario berikut:
              </span>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'd-1',
                    text: 'Membayar seluruh transaksi menggunakan uang Rupiah dan menolak penggunaan mata uang asing di wilayah NKRI.',
                    isCorrect: true,
                    feedback: 'Tepat sekali! Sesuai UU No. 7 Tahun 2011, Rupiah adalah satu-satunya alat pembayaran sah di seluruh wilayah NKRI.',
                  },
                  {
                    id: 'd-2',
                    text: 'Menerima pembayaran dengan mata uang asing di toko kelontong lokal karena mengira nilainya lebih besar.',
                    isCorrect: false,
                    feedback: 'Kurang tepat. Semua transaksi domestik di Indonesia wajib menggunakan Rupiah demi kedaulatan ekonomi.',
                  },
                  {
                    id: 'd-3',
                    text: 'Menyimpan uang kertas secara kusut dan dilipat-lipat kecil ke dalam saku celana.',
                    isCorrect: false,
                    feedback: 'Kurang tepat. Uang harus disimpan lurus dan rapi untuk menjaga kualitas fisik dan kehormatan simbol negara.',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleDecisionSelect(item.id, item.isCorrect, item.feedback)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedDecision === item.id
                        ? item.isCorrect
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-rose-50 border-rose-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                      {item.text}
                    </span>
                    {selectedDecision === item.id && (
                      <span className="shrink-0">
                        {item.isCorrect ? <Check className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-rose-600" />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => initActivity(currentActivity, mission)}
              className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Simulasi</span>
            </button>

            <button
              onClick={() => {
                sounds.playSuccess();
                if (mission) db.saveMissionSectionProgress(mission.id, effectiveStudentId, 'activity');
                onContinueToPractice(missionId);
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer group"
            >
              <span>Lanjut ke Latihan Soal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

