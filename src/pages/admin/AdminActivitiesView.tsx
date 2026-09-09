import React, { useState } from 'react';
import {
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  Eye,
  History,
  Send,
  Sparkles,
  Save,
  X,
  Filter,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Activity, ContentStatus } from '../../types';
import { db } from '../../services/db';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { VersionHistoryDrawer } from '../../components/admin/VersionHistoryDrawer';
import { WorkflowActionModal } from '../../components/admin/WorkflowActionModal';
import { StudentPreviewModal } from '../../components/admin/StudentPreviewModal';

export const AdminActivitiesView: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(
    db.getActivities().sort((a, b) => a.orderIndex - b.orderIndex)
  );
  const missions = db.getMissions();

  // Filters
  const [selectedMissionFilter, setSelectedMissionFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);
  const [historyEntity, setHistoryEntity] = useState<{ id: string; title: string } | null>(null);
  const [workflowEntity, setWorkflowEntity] = useState<{ activity: Activity } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    missionId: string;
    type: Activity['type'];
    title: string;
    instruction: string;
    pointsAwarded: number;
    orderIndex: number;
    status: ContentStatus;
    sampleConfig: string;
  }>({
    code: '',
    missionId: 'MIS-01',
    type: 'matching',
    title: '',
    instruction: '',
    pointsAwarded: 50,
    orderIndex: 1,
    status: 'draft',
    sampleConfig: '{"pairs": [{"left": "Metode Dilihat", "right": "Warna terang & benang pengaman"}]}',
  });

  const refreshData = () => {
    setActivities(db.getActivities().sort((a, b) => a.orderIndex - b.orderIndex));
  };

  const handleOpenCreate = () => {
    const nextOrder = activities.length + 1;
    const nextCode = `ACT-${String(nextOrder).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      missionId: missions[0]?.id || 'MIS-01',
      type: 'matching',
      title: '',
      instruction: 'Tarik garis atau klik item yang saling berpasangan secara tepat.',
      pointsAwarded: 50,
      orderIndex: nextOrder,
      status: 'draft',
      sampleConfig: '{\n  "pairs": [\n    {"left": "Dilihat", "right": "Warna uang cerah dan tajam"},\n    {"left": "Diraba", "right": "Tekstur kasar pada angka nominal"},\n    {"left": "Diterawang", "right": "Tanda air pahlawan dan electrotype"}\n  ]\n}',
    });
    setEditingActivity(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setFormData({
      code: act.code,
      missionId: act.missionId,
      type: act.type as any,
      title: act.title,
      instruction: act.instruction,
      pointsAwarded: act.pointsAwarded || 50,
      orderIndex: act.orderIndex,
      status: act.status,
      sampleConfig: JSON.stringify(act.config || {}, null, 2),
    });
    setIsCreateOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedConfig = {};
    try {
      if (formData.sampleConfig.trim()) {
        parsedConfig = JSON.parse(formData.sampleConfig);
      }
    } catch {
      parsedConfig = { raw: formData.sampleConfig };
    }

    const payload: Partial<Activity> = {
      code: formData.code,
      missionId: formData.missionId,
      type: formData.type,
      title: formData.title,
      instruction: formData.instruction,
      pointsAwarded: Number(formData.pointsAwarded),
      orderIndex: Number(formData.orderIndex),
      status: formData.status,
      config: parsedConfig,
    };

    if (editingActivity) {
      db.updateActivity(
        editingActivity.id,
        payload,
        'Admin Kurikulum BI',
        `Pembaruan aktivitas ${formData.code}: ${formData.title}`
      );
    } else {
      db.createActivity(payload as Omit<Activity, 'id'>);
    }

    refreshData();
    setIsCreateOpen(false);
    setEditingActivity(null);
  };

  const handleDelete = (id: string) => {
    db.deleteActivity(id);
    refreshData();
    setConfirmDeleteId(null);
  };

  const filteredActivities = activities.filter((a) => {
    if (selectedMissionFilter !== 'all' && a.missionId !== selectedMissionFilter) return false;
    if (selectedTypeFilter !== 'all' && a.type !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-purple-600" />
            <span>Kelola Aktivitas Gamifikasi (Interactive Activities)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi tantangan interaktif: Matching (Pasangkan), Kategorisasi, Titik Hotspot, Hitung Belanja, dan Pilihan Ganda.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aktivitas Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aktivitas atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={selectedMissionFilter}
          onChange={(e) => setSelectedMissionFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
        >
          <option value="all">Semua Misi (1-9)</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.title.slice(0, 20)}...
            </option>
          ))}
        </select>

        <select
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
        >
          <option value="all">Semua Tipe Interaksi</option>
          <option value="matching">Matching (Pasangkan)</option>
          <option value="categorization">Categorization (Kelompokkan)</option>
          <option value="hotspot">Hotspot (Titik Interaktif)</option>
          <option value="calculation">Calculation (Hitung Belanja)</option>
          <option value="multiple_choice">Multiple Choice (Pilihan Ganda)</option>
        </select>
      </div>

      {/* Activity Cards */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl font-bold">
            🎮
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak ada aktivitas interaktif yang ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Katalog aktivitas kosong atau tidak ada yang sesuai dengan filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((act) => {
          const mission = missions.find((m) => m.id === act.missionId || m.code === act.missionId);

          return (
            <div
              key={act.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {act.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {act.status}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                    {mission ? `${mission.code} &bull; ${mission.title}` : act.missionId}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {act.title}
                  </h3>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-950">
                  <strong className="block text-purple-900 mb-0.5">Tipe: {act.type.toUpperCase()}</strong>
                  <p className="line-clamp-2 text-slate-600">{act.instruction}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Hadiah: <strong className="text-amber-600">+{act.pointsAwarded || 50} Poin</strong></span>
                  <span className="font-mono text-[11px]">Urutan #{act.orderIndex}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setPreviewActivity(act)}
                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setWorkflowEntity({ activity: act })}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                    title="Alur Status"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setHistoryEntity({ id: act.id, title: act.title })}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                    title="Riwayat Versi"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(act)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                    title="Edit Aktivitas"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(act.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Hapus Aktivitas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* CREATE / EDIT ACTIVITY MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {editingActivity ? `Edit Aktivitas (${formData.code})` : 'Tambah Aktivitas Gamifikasi'}
                </h3>
                <p className="text-xs text-slate-500">Konfigurasi interaksi, instruksi anak, dan bobot poin</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode Aktivitas</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Misi Terkait</label>
                    <select
                      value={formData.missionId}
                      onChange={(e) => setFormData({ ...formData, missionId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    >
                      {missions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.title.slice(0, 20)}...
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Interaksi</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                    >
                      <option value="matching">Matching (Pasangkan)</option>
                      <option value="categorization">Categorization (Kelompokkan)</option>
                      <option value="hotspot">Hotspot (Titik Interaktif)</option>
                      <option value="calculation">Calculation (Hitung Belanja)</option>
                      <option value="multiple_choice">Multiple Choice (Pilihan Ganda)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Aktivitas</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Contoh: Pasangkan Ciri 3D dengan Penjelasannya"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi Bermain Siswa</label>
                  <textarea
                    rows={2}
                    value={formData.instruction}
                    onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                    required
                    placeholder="Instruksi jelas untuk siswa SD..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Konfigurasi Interaksi (JSON)</label>
                  <textarea
                    rows={4}
                    value={formData.sampleConfig}
                    onChange={(e) => setFormData({ ...formData, sampleConfig: e.target.value })}
                    placeholder='{"pairs": [{"left": "A", "right": "B"}]}'
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Poin Hadiah Gamifikasi</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={formData.pointsAwarded}
                      onChange={(e) => setFormData({ ...formData, pointsAwarded: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Aktivitas</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 uppercase font-bold"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Aktivitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewActivity && (
        <StudentPreviewModal
          isOpen={true}
          onClose={() => setPreviewActivity(null)}
          activity={previewActivity}
        />
      )}

      {/* Version History */}
      {historyEntity && (
        <VersionHistoryDrawer
          isOpen={true}
          onClose={() => setHistoryEntity(null)}
          entityId={historyEntity.id}
          entityTitle={historyEntity.title}
          entityType="activity"
        />
      )}

      {/* Workflow */}
      {workflowEntity && (
        <WorkflowActionModal
          isOpen={true}
          onClose={() => setWorkflowEntity(null)}
          entityId={workflowEntity.activity.id}
          entityTitle={workflowEntity.activity.title}
          entityType="activity"
          currentStatus={workflowEntity.activity.status}
          onApplyAction={(targetStatus, reviewerInfo) => {
            db.updateActivityStatus(workflowEntity.activity.id, targetStatus, reviewerInfo);
            refreshData();
            setWorkflowEntity(null);
          }}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Hapus Aktivitas Interaktif?"
        message="Aktivitas ini akan dihapus dari alur misi. Pastikan data tidak sedang dipakai siswa aktif."
        confirmLabel="Ya, Hapus Aktivitas"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
