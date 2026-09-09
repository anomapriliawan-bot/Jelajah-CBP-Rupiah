import React, { useState, useEffect } from 'react';
import { Cloud, CloudCheck, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Database, X } from 'lucide-react';
import { db } from '../services/db';
import { FirebaseSyncStatus } from '../services/firebase';
import { sounds } from '../utils/audio';

interface FirebaseStatusBadgeProps {
  compact?: boolean;
}

export const FirebaseStatusBadge: React.FC<FirebaseStatusBadgeProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<FirebaseSyncStatus>(db.getFirebaseStatus());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribeFirebaseStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  const handleSyncNow = async () => {
    sounds.playPop();
    setIsManualSyncing(true);
    setSyncSuccessMessage(null);
    try {
      const ok = await db.syncWithCloud();
      if (ok) {
        sounds.playSuccess();
        setSyncSuccessMessage('Sinkronisasi cloud berhasil!');
        setTimeout(() => setSyncSuccessMessage(null), 4000);
      } else {
        sounds.playPop();
      }
    } catch {
      sounds.playPop();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formattedTime = status.lastSynced
    ? new Date(status.lastSynced).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Baru saja';

  if (compact) {
    return (
      <>
        <button
          id="firebase-status-compact-button"
          onClick={() => {
            sounds.playPop();
            setIsModalOpen(true);
          }}
          title={status.isConnected ? `Terhubung ke Firebase Cloud (Sinkron ${formattedTime})` : 'Firebase Offline / Menghubungkan...'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            status.isConnected
              ? 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200 shadow-2xs'
              : 'bg-amber-50 hover:bg-amber-100/90 text-amber-800 border-amber-200 shadow-2xs'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {status.isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">Cloud</span>
        </button>

        {isModalOpen && renderModal()}
      </>
    );
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sky-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Status Firebase Cloud</h3>
                <p className="text-xs text-slate-500 font-medium">Database Firestore & Cloud Sync</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details */}
          <div className="py-4 space-y-3.5">
            {/* Connection Status Card */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                status.isConnected
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    status.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {status.isConnected ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-extrabold">
                    {status.isConnected ? 'Terhubung ke Firebase' : 'Mode Offline / Lokal'}
                  </div>
                  <div className="text-xs text-slate-600">
                    {status.isConnected
                      ? 'Sinkronisasi cloud otomatis aktif'
                      : 'Periksa koneksi internet Anda'}
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Project ID:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {status.projectId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Database ID:</span>
                <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[200px] truncate" title={status.databaseId}>
                  {status.databaseId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Sinkron Terakhir:</span>
                <span className="font-bold text-slate-800">
                  {status.lastSynced ? formattedTime : 'Saat inisialisasi'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Mode Penyimpanan:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Hybrid (Cloud + Offline Cache)
                </span>
              </div>
            </div>

            {syncSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handleSyncNow}
              disabled={isManualSyncing || status.isSyncing}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isManualSyncing || status.isSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing || status.isSyncing ? 'Sedang Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        id="firebase-status-full-button"
        onClick={() => {
          sounds.playPop();
          setIsModalOpen(true);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
          status.isConnected
            ? 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
            : 'bg-amber-50/90 hover:bg-amber-100 text-amber-800 border-amber-200/90'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {status.isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
        </span>
        <Cloud className="w-3.5 h-3.5" />
        <span>{status.isConnected ? 'Firebase Cloud' : 'Offline'}</span>
      </button>

      {isModalOpen && renderModal()}
    </>
  );
};
