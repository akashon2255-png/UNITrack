import React, { useMemo, useState } from 'react';
import {
  Ban,
  CalendarClock,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  COURSES,
  PROGRAM,
  SLOT_TIMES,
  UNIVERSITY,
  WEEK_DAYS,
} from '../../data/seedData';
import { ScheduleEntry, ScheduleType } from '../../types/unitrack';
import { getCourseTheme } from '../../utils/courseTheme';

interface RoutineViewProps {
  schedules: ScheduleEntry[];
  onAddSchedule: (payload: {
    type: ScheduleType;
    courseCode: string;
    title: string;
    day: string;
    time: string;
    room: string;
    teacher: string;
  }) => { ok: boolean; error?: string };
  onReschedule: (
    id: number,
    updates: { day: string; time: string; room: string }
  ) => { ok: boolean };
  onCancelSchedule: (id: number) => void;
  onRestoreSchedule: (id: number) => void;
}

export function RoutineView({
  schedules,
  onAddSchedule,
  onReschedule,
  onCancelSchedule,
  onRestoreSchedule,
}: RoutineViewProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'list' | 'extra' | 'exam'>('grid');

  // Add Modal
  const [addType, setAddType] = useState<ScheduleType | null>(null);
  const [courseCode, setCourseCode] = useState(COURSES[0].code);
  const [title, setTitle] = useState(COURSES[0].title);
  const [day, setDay] = useState('Sunday');
  const [time, setTime] = useState(SLOT_TIMES[0]);
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');

  // Reschedule Modal
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduleEntry | null>(null);
  const [newDay, setNewDay] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newRoom, setNewRoom] = useState('');

  const classSchedules = useMemo(
    () => schedules.filter((s) => s.type === 'Class'),
    [schedules]
  );
  const extraClassSchedules = useMemo(
    () => schedules.filter((s) => s.type === 'Class' && !s.isPreloaded),
    [schedules]
  );
  const examSchedules = useMemo(
    () => schedules.filter((s) => s.type === 'Exam'),
    [schedules]
  );

  const openAddModal = (type: ScheduleType) => {
    setAddType(type);
    if (type === 'Class') {
      setCourseCode(COURSES[0].code);
      setTitle(COURSES[0].title);
      setDay('Saturday');
      setTime(SLOT_TIMES[0]);
    } else {
      setCourseCode('');
      setTitle('');
      setDay('');
      setTime('10:00-11:30 AM');
    }
    setRoom('');
    setTeacher('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addType) return;
    const res = onAddSchedule({
      type: addType,
      courseCode,
      title,
      day,
      time,
      room,
      teacher,
    });
    if (res.ok) {
      setAddType(null);
      if (addType === 'Exam') setActiveTab('exam');
      else setActiveTab('extra');
    }
  };

  const openReschedule = (entry: ScheduleEntry) => {
    setRescheduleTarget(entry);
    setNewDay(entry.day);
    setNewTime(entry.time);
    setNewRoom(entry.room);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    const res = onReschedule(rescheduleTarget.id, {
      day: newDay,
      time: newTime,
      room: newRoom,
    });
    if (res.ok) setRescheduleTarget(null);
  };

  const renderStatusText = (status: ScheduleEntry['status']) => {
    if (status === 'CANCELLED') {
      return (
        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          CANCELLED
        </span>
      );
    }
    if (status === 'RESCHEDULED') {
      return (
        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          RESCHEDULED
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        Scheduled
      </span>
    );
  };

  const renderScheduleActions = (entry: ScheduleEntry) => (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => openReschedule(entry)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <CalendarClock className="w-3 h-3" />
        <span>Reschedule</span>
      </button>
      {entry.status === 'CANCELLED' ? (
        <button
          type="button"
          onClick={() => onRestoreSchedule(entry.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restore</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onCancelSchedule(entry.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <Ban className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
            Routine & Exam Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {UNIVERSITY} · {PROGRAM} · Preloaded weekly routine & custom schedules
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal('Class')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-subpanel hover:bg-white/90 dark:hover:bg-violet-950/50 text-xs font-semibold text-[#1E194B] dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Extra Class</span>
          </button>
          <button
            type="button"
            onClick={() => openAddModal('Exam')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam Schedule</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-full glass-subpanel w-fit max-w-full overflow-x-auto">
        {[
          { id: 'grid', label: 'Weekly Grid' },
          { id: 'list', label: 'Day-by-Day Routine' },
          { id: 'extra', label: `Extra Classes (${extraClassSchedules.length})` },
          { id: 'exam', label: `Exam Routine (${examSchedules.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#4B2CD4] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#1E194B] dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Weekly Timetable Grid */}
      {activeTab === 'grid' && (
        <section className="rounded-3xl glass-card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left border-collapse">
              <thead>
                <tr className="border-b border-violet-200/50 dark:border-violet-800/40 bg-white/40 dark:bg-slate-950/30 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 w-32">Day</th>
                  {SLOT_TIMES.map((slot) => (
                    <th key={slot} className="py-3 px-3 font-mono tabular-nums">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/70 dark:divide-violet-900/40 text-xs">
                {WEEK_DAYS.map((dayName) => (
                  <tr key={dayName} className="align-top">
                    <td className="py-3.5 px-4 font-display font-bold text-sm text-[#1E194B] dark:text-white bg-white/30 dark:bg-slate-950/20">
                      {dayName}
                    </td>
                    {SLOT_TIMES.map((slotTime) => {
                      const matches = classSchedules.filter(
                        (s) => s.day === dayName && s.time === slotTime
                      );
                      return (
                        <td
                          key={`${dayName}-${slotTime}`}
                          className="p-2 border-l border-violet-100/70 dark:border-violet-900/30 min-w-[145px]"
                        >
                          {matches.length === 0 ? (
                            <span className="block py-3 text-center text-slate-300 dark:text-slate-700">
                              —
                            </span>
                          ) : (
                            <div className="space-y-2">
                              {matches.map((item) => {
                                const theme = getCourseTheme(item.courseCode);
                                return (
                                  <div
                                    key={item.id}
                                    className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                      item.status === 'CANCELLED'
                                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/25 opacity-75'
                                        : item.status === 'RESCHEDULED'
                                          ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/25'
                                          : `border-violet-200/60 dark:border-violet-800/40 ${theme.tintBg}`
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`font-mono font-bold ${theme.tintText}`}>
                                        {item.courseCode}
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-400">
                                        #{item.id}
                                      </span>
                                    </div>
                                    <p
                                      className={`font-semibold text-[#1E194B] dark:text-slate-100 leading-snug ${
                                        item.status === 'CANCELLED' ? 'line-through' : ''
                                      }`}
                                    >
                                      {item.title}
                                    </p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                      Rm {item.room} · {item.teacher}
                                    </p>
                                    <div className="pt-1 flex items-center justify-between gap-1">
                                      {renderStatusText(item.status)}
                                      <button
                                        type="button"
                                        onClick={() => openReschedule(item)}
                                        className="text-[10px] font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Day-by-Day List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {WEEK_DAYS.map((dayName) => {
            const items = classSchedules
              .filter((s) => s.day === dayName)
              .sort(
                (a, b) => SLOT_TIMES.indexOf(a.time) - SLOT_TIMES.indexOf(b.time)
              );

            return (
              <section
                key={dayName}
                className="rounded-3xl glass-card-3d overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-violet-200/50 dark:border-violet-800/40 bg-white/40 dark:bg-slate-950/30 flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold text-[#1E194B] dark:text-white">
                    {dayName}
                  </h2>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {items.length} {items.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                    No scheduled class for this day.
                  </p>
                ) : (
                  <div className="p-3.5 space-y-2.5">
                    {items.map((item) => {
                      const theme = getCourseTheme(item.courseCode);
                      const CourseIcon = theme.icon;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl glass-subpanel flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl ${theme.tileBg} text-white flex items-center justify-center shrink-0`}
                            >
                              <CourseIcon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-mono font-semibold text-[#1E194B] dark:text-slate-200 tabular-nums">
                                  {item.time}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono font-semibold text-[#4B2CD4] dark:text-violet-300">
                                  {item.courseCode}
                                </span>
                                <span aria-hidden="true">·</span>
                                {renderStatusText(item.status)}
                              </div>
                              <p
                                className={`text-sm font-bold text-[#1E194B] dark:text-white ${
                                  item.status === 'CANCELLED' ? 'line-through opacity-60' : ''
                                }`}
                              >
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item.teacher} · Room {item.room}
                              </p>
                            </div>
                          </div>
                          {renderScheduleActions(item)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Extra Classes or Exam Routine */}
      {(activeTab === 'extra' || activeTab === 'exam') && (
        <section className="rounded-2xl glass-card-3d overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {activeTab === 'exam' ? 'Exam Routine' : 'Extra Class Schedules'}
            </h2>
            <button
              type="button"
              onClick={() => openAddModal(activeTab === 'exam' ? 'Exam' : 'Class')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add {activeTab === 'exam' ? 'Exam' : 'Extra Class'}
            </button>
          </div>

          {(activeTab === 'exam' ? examSchedules : extraClassSchedules).length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No {activeTab === 'exam' ? 'exam' : 'extra class'} schedule has been added.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(activeTab === 'exam' ? examSchedules : extraClassSchedules).map(
                (item) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">Schedule #{item.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                          {item.day}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{item.time}</span>
                        <span aria-hidden="true">·</span>
                        {renderStatusText(item.status)}
                      </div>
                      <p
                        className={`text-sm font-semibold text-slate-900 dark:text-white ${
                          item.status === 'CANCELLED' ? 'line-through opacity-60' : ''
                        }`}
                      >
                        <span className="font-mono text-blue-600 dark:text-blue-400 mr-2">
                          {item.courseCode}
                        </span>
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Room: {item.room} · Supervisor / Teacher: {item.teacher}
                      </p>
                    </div>
                    {renderScheduleActions(item)}
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* Add Class / Exam Modal */}
      {addType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl glass-card-3d overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Add {addType === 'Class' ? 'Extra Class' : 'Exam'} Schedule
              </h2>
              <button
                type="button"
                onClick={() => setAddType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addType === 'Class' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    University Course
                  </label>
                  <select
                    value={courseCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setCourseCode(code);
                      const found = COURSES.find((c) => c.code === code);
                      if (found) setTitle(found.title);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    {COURSES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Exam Course Code / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. CSE 2103"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {addType === 'Class' ? 'Course Title / Topic' : 'Exam Name'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={addType === 'Class' ? 'Extra Lab Makeup' : 'Final Examination'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {addType === 'Class' ? 'Day' : 'Exam Date'}
                  </label>
                  {addType === 'Class' ? (
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    >
                      {WEEK_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      placeholder="e.g. 10-Dec-2026"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Time Slot
                  </label>
                  {addType === 'Class' ? (
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    >
                      {SLOT_TIMES.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="10:00-11:30 AM"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Room
                  </label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. 414"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Teacher / Supervisor
                  </label>
                  <input
                    type="text"
                    required
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="Instructor name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddType(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl glass-card-3d overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Reschedule #{rescheduleTarget.id}
              </h2>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {rescheduleTarget.courseCode}
                </span>{' '}
                · {rescheduleTarget.title}
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Day / Date
                </label>
                <input
                  type="text"
                  required
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Time
                </label>
                <input
                  type="text"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Room
                </label>
                <input
                  type="text"
                  required
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d"
                >
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
