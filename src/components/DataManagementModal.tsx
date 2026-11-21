import React, { useRef, useState } from 'react';
import { Download, RotateCcw, Trash2, Upload, X, AlertTriangle } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (jsonText: string) => boolean;
  onResetSample: () => void;
  onClearRecords: () => void;
}

export function DataManagementModal({
  isOpen,
  onClose,
  onExport,
  onImport,
  onResetSample,
  onClearRecords,
}: DataManagementModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmMode, setConfirmMode] = useState<'none' | 'reset' | 'clear'>('none');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ok = onImport(reader.result);
        if (ok) onClose();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-modal-title"
        className="w-full max-w-lg rounded-2xl glass-card-3d overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-200/60 dark:border-violet-800/40">
          <div>
            <h2
              id="data-modal-title"
              className="font-display text-lg font-semibold text-[#1E194B] dark:text-slate-100"
            >
              Workspace Data & Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browser localStorage persistence · Export, import, or reset records
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmMode('none');
              onClose();
            }}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-violet-950/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExport}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium glass-btn-3d whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-subpanel hover:bg-white/90 dark:hover:bg-violet-950/40 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Import JSON Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Reset Options
            </p>

            {confirmMode === 'none' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmMode('reset')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reset to Sample Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmMode('clear')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Clear User Records</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p>
                    {confirmMode === 'reset'
                      ? 'This replaces all current workspace changes with the initial sample students, tasks, events, and results.'
                      : 'This removes all students, queued registrations, tasks, events, exams, and results while keeping the 8 university courses and weekly routine.'}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmMode('none')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmMode === 'reset') onResetSample();
                      else onClearRecords();
                      setConfirmMode('none');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-700"
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
