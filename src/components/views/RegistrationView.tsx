import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Play, Plus } from 'lucide-react';
import { COURSES, getCourseTitle } from '../../data/seedData';
import {
  CircularQueueState,
  ProcessedRegistrationResult,
  StudentRecord,
} from '../../types/unitrack';
import { MAX_QUEUE, OrderedQueueItem } from '../../utils/dataStructures';

interface RegistrationViewProps {
  queue: CircularQueueState;
  pendingRegistrations: OrderedQueueItem[];
  studentsList: StudentRecord[];
  lastProcessedReg: ProcessedRegistrationResult | null;
  onEnqueue: (studentID: number, courseCode: string) => { ok: boolean; error?: string };
  onProcessNext: () => ProcessedRegistrationResult | null;
}

export function RegistrationView({
  queue,
  pendingRegistrations,
  studentsList,
  lastProcessedReg,
  onEnqueue,
  onProcessNext,
}: RegistrationViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentsList[0] ? String(studentsList[0].id) : ''
  );
  const [manualId, setManualId] = useState('');
  const [useManualId, setUseManualId] = useState(studentsList.length === 0);
  const [courseCode, setCourseCode] = useState(COURSES[0].code);

  const studentNameMap = new Map(studentsList.map((s) => [s.id, s.name]));

  const handleEnqueue = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number((useManualId ? manualId : selectedStudentId).trim());
    const res = onEnqueue(idNum, courseCode);
    if (res.ok && useManualId) {
      setManualId('');
    }
  };

  // Show a 12-slot window around queue.front so wrap-around pointer movement is easy to inspect
  const windowSize = 12;
  const windowStart = Math.max(
    0,
    Math.floor(queue.front / windowSize) * windowSize
  );
  const visibleSlots = Array.from({ length: windowSize }, (_, offset) => {
    const idx = (windowStart + offset) % queue.capacity;
    return {
      idx,
      item: queue.buffer[idx],
      isFront: queue.count > 0 && idx === queue.front,
      isRear: queue.count > 0 && idx === queue.rear,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
            Course Registration (Circular Queue)
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-mono tabular-nums">
              Count: {queue.count}/{MAX_QUEUE}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">FRONT: {queue.front}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">REAR: {queue.rear}</span>
            <span aria-hidden="true">·</span>
            <span>Enqueue O(1) · Dequeue FIFO O(1)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onProcessNext}
          disabled={queue.count === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:pointer-events-none text-white text-xs font-semibold shadow-md whitespace-nowrap self-start md:self-auto"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Process Next Request (Dequeue FIFO)</span>
        </button>
      </div>

      {/* Last Processed Receipt */}
      {lastProcessedReg && (
        <div className="rounded-2xl glass-card-3d border-emerald-300/70 dark:border-emerald-700/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                Latest Processed FIFO Request
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Student:{' '}
                <span className="font-medium">
                  {lastProcessedReg.studentName ?? 'Record no longer in BST'}
                </span>{' '}
                (ID{' '}
                <span className="font-mono tabular-nums">
                  {lastProcessedReg.studentID}
                </span>
                ) · Course:{' '}
                <span className="font-mono font-medium">
                  {lastProcessedReg.courseCode}
                </span>{' '}
                ({getCourseTitle(lastProcessedReg.courseCode)})
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
            Processed at {lastProcessedReg.processedAt}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Enqueue Form */}
        <section className="xl:col-span-5 rounded-2xl glass-card-3d p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Submit Registration Request (Enqueue)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verifies student exists in BST before adding to circular queue
            </p>
          </div>

          <form onSubmit={handleEnqueue} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Student
                </label>
                {studentsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseManualId((v) => !v)}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {useManualId ? 'Pick from BST directory' : 'Type ID manually'}
                  </button>
                )}
              </div>

              {useManualId || studentsList.length === 0 ? (
                <input
                  type="number"
                  required
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Enter Student ID (must exist in BST)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-white placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                University Course
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COURSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold glass-btn-3d"
            >
              <Plus className="w-4 h-4" />
              <span>Enqueue Registration Request</span>
            </button>
          </form>
        </section>

        {/* Right: Pending Queue & Circular Buffer Visualizer */}
        <div className="xl:col-span-7 space-y-6">
          {/* Circular Buffer Visualizer */}
          <section className="rounded-3xl glass-card-3d p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
                  Circular Buffer Inspector
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Slots {windowStart}–{(windowStart + windowSize - 1) % queue.capacity} of{' '}
                  {queue.capacity} · Modular index{' '}
                  <span className="font-mono">(rear + 1) % {queue.capacity}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#4B2CD4] dark:text-violet-300 font-semibold">
                  FRONT [{queue.front}]
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  REAR [{queue.rear}]
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {visibleSlots.map((slot) => {
                const occupied = slot.item !== null;
                return (
                  <div
                    key={slot.idx}
                    className={`p-2.5 rounded-xl border text-xs transition-colors ${
                      slot.isFront && slot.isRear
                        ? 'border-[#4B2CD4] bg-violet-100/80 dark:bg-violet-950/60'
                        : slot.isFront
                          ? 'border-violet-400 bg-violet-50/70 dark:bg-violet-950/40'
                          : slot.isRear
                            ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/35'
                            : occupied
                              ? 'border-violet-200 dark:border-violet-800/50 bg-white/70 dark:bg-slate-900/60'
                              : 'border-dashed border-violet-200/80 dark:border-violet-800/40 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      <span>[{slot.idx}]</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {slot.isFront && slot.isRear
                          ? 'F/R'
                          : slot.isFront
                            ? 'FRONT'
                            : slot.isRear
                              ? 'REAR'
                              : ''}
                      </span>
                    </div>
                    {slot.item ? (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="font-mono font-semibold text-slate-900 dark:text-white truncate">
                          {slot.item.courseCode}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                          {slot.item.studentID}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2.5 text-[11px] font-mono text-slate-300 dark:text-slate-700">
                        EMPTY
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pending Requests FIFO List */}
          <section className="rounded-2xl glass-card-3d overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Pending Registration Queue
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ordered strictly from FRONT to REAR
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {pendingRegistrations.length} waiting
              </span>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No pending registration requests in the queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingRegistrations.map((entry, idx) => {
                  const sName = studentNameMap.get(entry.item.studentID);
                  return (
                    <div
                      key={`${entry.bufferIndex}-${entry.item.studentID}-${idx}`}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums w-12 shrink-0">
                          {idx === 0 ? 'FRONT' : `#${entry.queuePosition}`}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                            <span className="truncate">
                              {sName ?? `Student ${entry.item.studentID}`}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 shrink-0">
                              {entry.item.courseCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono tabular-nums">
                              ID {entry.item.studentID}
                            </span>{' '}
                            · {getCourseTitle(entry.item.courseCode)} · Slot [
                            <span className="font-mono">{entry.bufferIndex}</span>]
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                        {entry.item.queuedAt}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
