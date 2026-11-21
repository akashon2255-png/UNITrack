import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Flame,
  GraduationCap,
  ListOrdered,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import {
  COURSES,
  gpaPointFromMarks,
  PROGRAM,
  TEAM_LABEL,
  UNIVERSITY,
  WEEK_DAYS,
} from '../../data/seedData';
import {
  ActivityEntry,
  CalendarEvent,
  ResultRecord,
  ScheduleEntry,
  SectionId,
  StudentRecord,
  TaskItem,
  UserProfile,
} from '../../types/unitrack';
import { getCourseTheme } from '../../utils/courseTheme';
import { OrderedQueueItem } from '../../utils/dataStructures';

interface DashboardViewProps {
  profile: UserProfile;
  studentCount: number;
  bstHeight: number;
  pendingRegistrations: OrderedQueueItem[];
  schedules: ScheduleEntry[];
  tasks: TaskItem[];
  events: CalendarEvent[];
  results: ResultRecord[];
  activityStack: ActivityEntry[];
  onNavigate: (section: SectionId) => void;
  onToggleTask: (id: number) => void;
  onSearchStudent: (id: number) => { student: StudentRecord | null; path: number[] };
}

export function DashboardView({
  profile,
  studentCount,
  bstHeight,
  pendingRegistrations,
  schedules,
  tasks,
  events,
  results,
  activityStack,
  onNavigate,
  onToggleTask,
  onSearchStudent,
}: DashboardViewProps) {
  const todayIndex = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[todayIndex];
  const defaultDay = WEEK_DAYS.includes(currentDayName) ? currentDayName : 'Sunday';

  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);
  const [quickId, setQuickId] = useState('');
  const [quickResult, setQuickResult] = useState<{
    searchedId: number;
    student: StudentRecord | null;
    path: number[];
  } | null>(null);

  const hour = new Date().getHours();
  const greetingText =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile.name.split(' ')[0] || 'Student';

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'Pending'),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'Completed'),
    [tasks]
  );

  // Semester progress calculation driven by completed tasks & covered courses
  const semesterProgressPct = useMemo(() => {
    const taskRatio = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
    const coveredCourses = new Set(results.map((r) => r.courseCode)).size;
    const courseRatio = COURSES.length > 0 ? coveredCourses / COURSES.length : 0;
    const combined = Math.round((taskRatio * 0.5 + courseRatio * 0.5) * 100);
    return Math.min(100, Math.max(12, combined));
  }, [tasks.length, completedTasks.length, results]);

  // Real average GPA on 4.00 scale from logged results
  const averageGpa = useMemo(() => {
    if (results.length === 0) return '0.00';
    const sum = results.reduce((acc, r) => acc + gpaPointFromMarks(r.marks), 0);
    return (sum / results.length).toFixed(2);
  }, [results]);

  // Course activity bars (6 courses for ascending mini bar chart)
  const courseBarData = useMemo(() => {
    return COURSES.slice(0, 6).map((course, idx) => {
      const courseResults = results.filter((r) => r.courseCode === course.code);
      const avgMark =
        courseResults.length > 0
          ? courseResults.reduce((sum, r) => sum + r.marks, 0) / courseResults.length
          : 48 + idx * 8;
      return {
        code: course.code.replace(' ', ''),
        heightPct: Math.min(100, Math.max(24, Math.round(avgMark))),
      };
    });
  }, [results]);

  const dayClasses = schedules.filter(
    (s) => s.type === 'Class' && s.day === selectedDay
  );
  const nextPendingTask = pendingTasks[0] ?? null;
  const recentActivities = [...activityStack].reverse().slice(0, 5);

  // Ring geometry
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (semesterProgressPct / 100) * ringCircumference;

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(quickId.trim());
    if (!Number.isInteger(num) || num <= 0) return;
    const res = onSearchStudent(num);
    setQuickResult({ searchedId: num, ...res });
  };

  const quickModules: Array<{
    label: string;
    value: number;
    detail: string;
    section: SectionId;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      label: 'Students (BST)',
      value: studentCount,
      detail: `Height ${bstHeight}`,
      section: 'students',
      icon: Users,
    },
    {
      label: 'My Courses',
      value: COURSES.length,
      detail: 'CSE 3rd Sem',
      section: 'catalog',
      icon: BookOpen,
    },
    {
      label: 'Queue (FIFO)',
      value: pendingRegistrations.length,
      detail: 'Pending regs',
      section: 'registration',
      icon: ListOrdered,
    },
    {
      label: 'Routine & Exams',
      value: schedules.length,
      detail: `${schedules.filter((s) => s.type === 'Exam').length} exams`,
      section: 'routine',
      icon: Clock,
    },
    {
      label: 'Tasks & Quizzes',
      value: tasks.length,
      detail: `${pendingTasks.length} pending`,
      section: 'tasks',
      icon: CheckSquare,
    },
    {
      label: 'Calendar',
      value: events.length,
      detail: 'Milestones',
      section: 'calendar',
      icon: Calendar,
    },
    {
      label: 'Results',
      value: results.length,
      detail: `GPA ${averageGpa}`,
      section: 'results',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Two-Column Responsive Layout matching the Mockup */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Greeting + Semester Progress Ring Card + Today's Schedule + Featured Cards */}
        <div className="xl:col-span-7 space-y-6">
          {/* Greeting Header & Semester Progress Hero Card */}
          <section className="relative rounded-3xl glass-card-3d p-6 overflow-hidden">
            {/* Subtle Translucent Graduation Cap Watermark Graphic on Top-Right */}
            <GraduationCap
              aria-hidden="true"
              className="w-36 h-36 text-violet-500/[0.08] dark:text-violet-300/[0.07] absolute -right-4 -top-4 rotate-12 pointer-events-none"
            />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                  {UNIVERSITY}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1E194B] dark:text-white text-balance">
                  {greetingText}, {firstName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/90 dark:bg-violet-950/70 text-[#4B2CD4] dark:text-violet-200 text-xs font-semibold hover:bg-violet-200/80 dark:hover:bg-violet-900/70 transition-colors"
                  >
                    <span>{profile.semesterLabel}</span>
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {TEAM_LABEL}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('students')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            {/* Semester Progress Ring + Ascending Bar Chart (Mockup Hero Card) */}
            <div className="relative z-10 mt-6 p-5 rounded-2xl glass-subpanel flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <defs>
                      <linearGradient id="unitrackRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6D4AFF" />
                        <stop offset="55%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#22D3EE" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      fill="none"
                      stroke="currentColor"
                      className="text-violet-200/70 dark:text-violet-900/60"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      fill="none"
                      stroke="url(#unitrackRingGrad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-display text-2xl font-bold tabular-nums text-[#1E194B] dark:text-white leading-none">
                      {semesterProgressPct}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Semester
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-display text-sm font-semibold text-[#1E194B] dark:text-white">
                    Semester Progress
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="font-mono font-semibold text-[#4B2CD4] dark:text-violet-300 tabular-nums">
                      {completedTasks.length}/{tasks.length}
                    </span>{' '}
                    tasks completed ·{' '}
                    <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                      {results.length}
                    </span>{' '}
                    results logged
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('results')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline pt-1"
                  >
                    <span>View Academic Overview</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Ascending Bar Chart */}
              <div className="flex items-end gap-2.5 h-24 px-2 shrink-0" aria-label="Course progress bars">
                {courseBarData.map((bar, idx) => (
                  <div key={bar.code} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-4 sm:w-5 h-full flex items-end rounded-lg bg-violet-100/70 dark:bg-violet-950/50 overflow-hidden p-0.5">
                      <div
                        className="w-full rounded-md transition-all duration-300"
                        style={{
                          height: `${bar.heightPct}%`,
                          background:
                            idx >= 4
                              ? 'linear-gradient(180deg, #6D4AFF 0%, #4B2CD4 100%)'
                              : 'linear-gradient(180deg, #C4B5FD 0%, #A78BFA 100%)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Featured 3 Cards Row: GPA Gradient Card + Next Assignment + Weekly Streak Card */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* GPA Purple Gradient Card */}
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="text-left rounded-3xl unitrack-gpa-card p-5 text-white flex flex-col justify-between min-h-[144px] glass-interactive-3d relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-violet-100">
                  <GraduationCap className="w-4 h-4" />
                  <span>GPA</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-violet-200" />
              </div>
              <div className="flex items-end justify-between gap-2 mt-4">
                <span className="font-display text-3xl font-bold tabular-nums tracking-tight">
                  {averageGpa}
                </span>
                <svg viewBox="0 0 64 28" className="w-16 h-7 text-violet-200/80 shrink-0" fill="none">
                  <path
                    d="M2 24 C16 20, 24 12, 36 14 C46 16, 52 8, 62 4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </button>

            {/* Next Assignment Card */}
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-left rounded-3xl glass-card-3d glass-interactive-3d p-5 flex flex-col justify-between min-h-[144px]"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-[#4B2CD4] dark:text-violet-300 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span>Next Assignment</span>
              </div>
              {nextPendingTask ? (
                <div className="mt-3">
                  <p className="font-display text-sm font-bold text-[#1E194B] dark:text-white line-clamp-2 leading-snug">
                    {nextPendingTask.title}
                  </p>
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-1.5 font-mono tabular-nums">
                    Due: {nextPendingTask.dueDate}
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    All Caught Up
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    No pending tasks
                  </p>
                </div>
              )}
            </button>

            {/* Midnight Study / Activity Streak Card */}
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="text-left rounded-3xl unitrack-streak-card p-5 text-white flex flex-col justify-between min-h-[144px] glass-interactive-3d relative overflow-hidden"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <span>Activity Stack</span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {activityStack.length} Logs
                  </p>
                  <p className="text-[11px] text-violet-300 mt-0.5">LIFO Trail Active</p>
                </div>
                <svg viewBox="0 0 70 30" className="w-16 h-8 shrink-0" fill="none">
                  <path
                    d="M2 26 Q18 24 28 16 T52 10 T68 4"
                    stroke="#A78BFA"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </button>
          </section>

          {/* Today's Schedule (Mockup Style with Color Icon Tiles) */}
          <section className="rounded-3xl glass-card-3d overflow-hidden">
            <div className="px-6 py-4 border-b border-violet-200/50 dark:border-violet-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1E194B] dark:text-white">
                  Today&apos;s Schedule
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDay} · {dayClasses.length} scheduled{' '}
                  {dayClasses.length === 1 ? 'class' : 'classes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline whitespace-nowrap self-start sm:self-auto"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-violet-200/40 dark:border-violet-800/30 flex items-center gap-1.5 overflow-x-auto bg-white/40 dark:bg-slate-950/25">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    selectedDay === day
                      ? 'bg-[#4B2CD4] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#4B2CD4] dark:hover:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-2.5">
              {dayClasses.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No scheduled classes for {selectedDay}.
                </div>
              ) : (
                dayClasses.map((cls) => {
                  const theme = getCourseTheme(cls.courseCode);
                  const CourseIcon = theme.icon;
                  return (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-2xl glass-subpanel flex items-center justify-between gap-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl ${theme.tileBg} text-white flex items-center justify-center shadow-sm shrink-0`}
                        >
                          <CourseIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold text-[#1E194B] dark:text-white truncate ${
                              cls.status === 'CANCELLED' ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {cls.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Room {cls.room} · {cls.courseCode}
                            {cls.status !== 'Scheduled' ? ` · ${cls.status}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#1E194B] dark:text-violet-200 tabular-nums shrink-0">
                        {cls.time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right 5 Cols: Quick Student Lookup + Pending Tasks + Module Jump Cards + Activity */}
        <div className="xl:col-span-5 space-y-6">
          {/* Quick Student BST Lookup */}
          <section className="rounded-3xl glass-card-3d p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
                Quick Student BST Lookup
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline whitespace-nowrap"
              >
                Open BST View
              </button>
            </div>
            <form onSubmit={handleQuickSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={quickId}
                  onChange={(e) => setQuickId(e.target.value)}
                  placeholder="Student ID (e.g. 241311050)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono tabular-nums text-[#1E194B] dark:text-white placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap shrink-0"
              >
                Search
              </button>
            </form>

            {quickResult && (
              <div className="p-3.5 rounded-2xl glass-subpanel text-sm">
                {quickResult.student ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1E194B] dark:text-white">
                        {quickResult.student.name}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 tabular-nums">
                        ID {quickResult.student.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {quickResult.student.department} · {quickResult.student.phone}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                      BST path: {quickResult.path.join(' → ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Student ID {quickResult.searchedId} not found. Visited:{' '}
                    <span className="font-mono">
                      {quickResult.path.length > 0 ? quickResult.path.join(' → ') : 'Empty BST'}
                    </span>
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Pending Tasks & Quizzes */}
          <section className="rounded-3xl glass-card-3d overflow-hidden">
            <div className="px-5 py-4 border-b border-violet-200/50 dark:border-violet-800/40 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
                  Upcoming Tasks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingTasks.length} pending · {completedTasks.length} completed
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline whitespace-nowrap"
              >
                Manage All
              </button>
            </div>

            <div className="p-3.5 space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  All assignments and quizzes are completed.
                </div>
              ) : (
                pendingTasks.slice(0, 4).map((task) => {
                  const theme = getCourseTheme(task.courseCode);
                  const CourseIcon = theme.icon;
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl glass-subpanel flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${theme.tileBg} text-white flex items-center justify-center shrink-0`}
                        >
                          <CourseIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1E194B] dark:text-white truncate">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                            {task.courseCode} · Due {task.dueDate}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Compact Module Quick Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3" aria-label="Workspace modules">
            {quickModules.slice(0, 6).map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.label}
                  type="button"
                  onClick={() => onNavigate(mod.section)}
                  className="text-left p-4 rounded-2xl glass-card-3d glass-interactive-3d flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xl font-bold tabular-nums text-[#1E194B] dark:text-white">
                      {mod.value}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                      {mod.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {mod.detail}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-violet-100/90 dark:bg-violet-950/70 text-[#4B2CD4] dark:text-violet-300 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </section>

          {/* Recent Activity Stack Preview */}
          <section className="rounded-3xl glass-card-3d overflow-hidden">
            <div className="px-5 py-3.5 border-b border-violet-200/50 dark:border-violet-800/40 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#1E194B] dark:text-white">
                Recent Activity (LIFO Stack)
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('activity')}
                className="text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline"
              >
                Inspect
              </button>
            </div>
            <div className="divide-y divide-violet-100/70 dark:divide-violet-900/40">
              {recentActivities.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  Activity stack is empty.
                </div>
              ) : (
                recentActivities.map((act, idx) => (
                  <div
                    key={act.id}
                    className="px-5 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-[#4B2CD4] dark:text-violet-300 tabular-nums shrink-0">
                        {idx === 0 ? 'TOP' : `#${activityStack.length - idx}`}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {act.description}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                      {act.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Quiet Academic Footer */}
      <footer className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-2">
        <span>{UNIVERSITY} · {PROGRAM}</span>
        <span>{TEAM_LABEL}</span>
      </footer>
    </div>
  );
}
