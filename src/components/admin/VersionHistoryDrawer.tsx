import React from 'react';
import { History, X, Clock, User, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { ContentVersionEntry } from '../../types';
import { db } from '../../services/db';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityTitle?: string;
  entityType: 'mission' | 'lesson' | 'activity' | 'question' | 'tournament_question';
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  entityId,
  entityTitle,
  entityType,
}) => {
  if (!isOpen) return null;

  const entries = db.getVersionEntries(entityId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Riwayat Versi Konten</h3>
              <p className="text-xs text-slate-500 font-mono">{entityId} &bull; {entityType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Title Banner */}
        {entityTitle && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-blue-900 truncate">{entityTitle}</span>
          </div>
        )}

        {/* List of Version Entries */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada riwayat revisi tercatat</p>
              <p className="text-xs mt-1 text-slate-400">Setiap perubahan data akan otomatis tersimpan di sini</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-2.25 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                    idx === 0 ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-slate-300'
                  }`} />

                  <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border border-slate-200/80 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {entry.versionNumber}
                        {idx === 0 && <span className="text-[10px] text-blue-600 ml-1 font-normal">(Terkini)</span>}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(entry.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium my-2 leading-relaxed">
                      {entry.changeSummary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{entry.updatedBy}</span>
                      </div>
                      {entry.snapshot && (
                        <span className="text-emerald-700 font-medium flex items-center gap-0.5 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Snapshot Valid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};
