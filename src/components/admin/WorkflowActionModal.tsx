import React, { useState } from 'react';
import { CheckCircle, XCircle, Send, Globe, Archive, FileEdit, X, User, MessageSquare } from 'lucide-react';
import { ContentStatus } from '../../types';

interface WorkflowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  entityTitle: string;
  currentStatus: ContentStatus;
  onApplyAction: (targetStatus: ContentStatus, reviewerInfo: { id: string; name: string; notes: string }) => void;
}

export const WorkflowActionModal: React.FC<WorkflowActionModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  currentStatus,
  onApplyAction,
}) => {
  if (!isOpen) return null;

  const [targetStatus, setTargetStatus] = useState<ContentStatus>(
    currentStatus === 'draft' ? 'review' : currentStatus === 'review' ? 'approved' : 'published'
  );
  const [reviewerName, setReviewerName] = useState('Dr. Hendra Gunawan (Reviewer Ahli BI)');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const statusOptions: { value: ContentStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'draft', label: 'Kembalikan ke Draft (Revisi)', icon: <FileEdit className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700' },
    { value: 'review', label: 'Ajukan Review (Menunggu Telaah)', icon: <Send className="w-4 h-4" />, color: 'bg-amber-100 text-amber-800' },
    { value: 'approved', label: 'Setujui (Approved / Siap Rilis)', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
    { value: 'published', label: 'Publikasikan ke Siswa (Live)', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-800' },
    { value: 'archived', label: 'Arsipkan Konten', icon: <Archive className="w-4 h-4" />, color: 'bg-rose-100 text-rose-800' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Catatan telaah / review wajib diisi untuk rekam jejak audit.');
      return;
    }

    onApplyAction(targetStatus, {
      id: 'USR-REV-001',
      name: reviewerName,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="workflow-modal-box"
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">Perbarui Status Alur Telaah</h3>
            <p className="text-xs text-slate-500 font-mono">{entityId} &bull; {entityType}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Target Entity Info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-500 font-semibold mb-0.5">Judul Konten:</p>
              <p className="text-sm font-bold text-slate-800 line-clamp-2">{entityTitle}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                  {currentStatus}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Status Target:
              </label>
              <div className="space-y-2">
                {statusOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      targetStatus === opt.value
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="targetStatus"
                        value={opt.value}
                        checked={targetStatus === opt.value}
                        onChange={() => {
                          setTargetStatus(opt.value);
                          setError('');
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-md ${opt.color}`}>{opt.icon}</span>
                        <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Penelaah / Reviewer Ahli:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Telaah & Rekomendasi: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setError('');
                  }}
                  placeholder="Tuliskan justifikasi, kesesuaian kurikulum BI, atau instruksi perbaikan..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Simpan & Terapkan Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
