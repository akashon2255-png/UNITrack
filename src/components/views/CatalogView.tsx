import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  User,
} from 'lucide-react';
import {
  COURSES,
  gradeFromMarks,
  PROGRAM,
  UNIVERSITY,
} from '../../data/seedData';
import {
  ResultRecord,
  ScheduleEntry,
  SectionId,
  TaskItem,
} from '../../types/unitrack';
import { getCourseTheme } from '../../utils/courseTheme';
import { OrderedQueueItem } from '../../utils/dataStructures';

interface CatalogViewProps {
  schedules: ScheduleEntry[];
  tasks: TaskItem[];
  results: ResultRecord[];
  pendingRegistrations: OrderedQueueItem[];
  onNavigate: (section: SectionId) => void;
}

export function CatalogView({
  schedules,
  tasks,
  results,
  pendingRegistrations,
  onNavigate,
}: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(COURSES[2].code);
  const [detailTab, setDetailTab] = useState<'overview' | 'schedule' | 'grades'>('overview');

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COURSES;
    return COURSES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedCourse =
    COURSES.find((c) => c.code === selectedCourseCode) ?? COURSES[0];
  const selectedTheme = getCourseTheme(selectedCourse.code);
  const SelectedIcon = selectedTheme.icon;

  const courseSchedules = schedules.filter(
    (s) => s.courseCode === selectedCourse.code && s.status !== 'CANCELLED'
  );
  const courseTasks = tasks.filter((t) => t.courseCode === selectedCourse.code);
  const courseResults = results.filter((r) => r.courseCode === selectedCourse.code);

  const instructors = Array.from(
    new Set(courseSchedules.map((s) => s.teacher).filter(Boolean))
  );

  const avgCourseMarks =
    courseResults.length > 0
      ? courseResults.reduce((acc, r) => acc + r.marks, 0) / courseResults.length
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
            My Courses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {UNIVERSITY} · {PROGRAM} · {COURSES.length} CSE semester courses
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-52 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-xs text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            type="button"
            onClick={() => onNavigate('registration')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap"
          >
            <span>Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Split Layout: My Courses List (left) + Course Details Card (right) matching mockup */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Course Cards List */}
        <section className="xl:col-span-7 space-y-3">
          {filteredCourses.length === 0 ? (
            <div className="rounded-3xl glass-card-3d p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No course matches &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredCourses.map((course, idx) => {
              const theme = getCourseTheme(course.code);
              const Icon = theme.icon;
              const isSelected = course.code === selectedCourse.code;

              const cResults = results.filter((r) => r.courseCode === course.code);
              const cTasks = tasks.filter((t) => t.courseCode === course.code);
              const doneTasks = cTasks.filter((t) => t.status === 'Completed').length;
              const avgScore =
                cResults.length > 0
                  ? Math.round(
                      cResults.reduce((sum, r) => sum + r.marks, 0) / cResults.length
                    )
                  : cTasks.length > 0
                    ? Math.round((doneTasks / cTasks.length) * 100)
                    : 60 + ((idx * 7) % 35);

              const progressPct = Math.min(100, Math.max(25, avgScore));
              const classCount = schedules.filter(
                (s) => s.courseCode === course.code && s.status !== 'CANCELLED'
              ).length;

              return (
                <button
                  key={course.code}
                  type="button"
                  onClick={() => setSelectedCourseCode(course.code)}
                  className={`w-full text-left p-4 rounded-2xl glass-card-3d glass-interactive-3d flex items-center gap-4 transition-all ${
                    isSelected
                      ? 'ring-2 ring-[#4B2CD4] dark:ring-violet-400'
                      : ''
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${theme.tileBg} text-white flex items-center justify-center shadow-md shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-sm sm:text-base font-bold text-[#1E194B] dark:text-white truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {course.code} · {classCount} weekly slots
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold tabular-nums text-[#1E194B] dark:text-white shrink-0">
                        {progressPct}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${theme.barColor} transition-all duration-300`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </section>

        {/* Course Details Inspector (Matching the mockup's "Course Details" screen) */}
        <aside className="xl:col-span-5 rounded-3xl glass-card-3d overflow-hidden sticky top-20">
          {/* Deep Royal Purple Course Banner */}
          <div className="p-6 unitrack-wave-header text-white space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
                <SelectedIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/15 text-violet-100">
                {selectedCourse.code}
              </span>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold leading-snug">
                {selectedCourse.title}
              </h2>
              <p className="text-xs text-violet-200 mt-1">
                {UNIVERSITY} · 3rd Semester Section B
              </p>
            </div>
          </div>

          {/* Detail Sub-tabs */}
          <div className="px-6 pt-4 border-b border-violet-200/50 dark:border-violet-800/40 flex items-center gap-6 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'schedule', label: `Schedule (${courseSchedules.length})` },
              { id: 'grades', label: `Tasks & Grades (${courseTasks.length + courseResults.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id as typeof detailTab)}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  detailTab === tab.id
                    ? 'border-[#4B2CD4] dark:border-violet-400 text-[#4B2CD4] dark:text-violet-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-[#1E194B] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            {detailTab === 'overview' && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Instructor
                  </p>
                  <div className="p-3.5 rounded-2xl glass-subpanel flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/80 text-[#4B2CD4] dark:text-violet-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E194B] dark:text-white truncate">
                        {instructors.length > 0
                          ? instructors.join(' · ')
                          : 'Department of CSE Faculty'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Course Instructor · Dept. of CSE
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    About This Course
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Core 3rd semester CSE curriculum module ({selectedCourse.code}) with{' '}
                    <span className="font-mono font-semibold tabular-nums">
                      {courseSchedules.length}
                    </span>{' '}
                    scheduled sessions and{' '}
                    <span className="font-mono font-semibold tabular-nums">
                      {
                        pendingRegistrations.filter(
                          (q) => q.item.courseCode === selectedCourse.code
                        ).length
                      }
                    </span>{' '}
                    queued registration requests.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Grades Summary
                  </p>
                  <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-[#1E194B] dark:text-white">
                      {avgCourseMarks !== null ? gradeFromMarks(avgCourseMarks) : '—'}
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {avgCourseMarks !== null
                        ? `${avgCourseMarks.toFixed(1)}%`
                        : 'No marks yet'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {detailTab === 'schedule' && (
              <div className="space-y-2.5">
                {courseSchedules.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                    No active routine slots for {selectedCourse.code}.
                  </p>
                ) : (
                  courseSchedules.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-2xl glass-subpanel flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1E194B] dark:text-white">
                          {slot.day} · {slot.type}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          Room {slot.room} · {slot.teacher}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 tabular-nums shrink-0 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {slot.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'grades' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Assignments & Quizzes
                  </p>
                  {courseTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No tasks linked to this course yet.
                    </p>
                  ) : (
                    courseTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-2xl glass-subpanel flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1E194B] dark:text-white truncate">
                            {t.title}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 font-mono">
                            {t.type} · Due {t.dueDate}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                            t.status === 'Completed'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {t.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Logged Student Results
                  </p>
                  {courseResults.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No exam results logged for this course yet.
                    </p>
                  ) : (
                    courseResults.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-2xl glass-subpanel flex items-center justify-between text-xs font-mono tabular-nums"
                      >
                        <span className="text-slate-700 dark:text-slate-300">
                          Student {r.studentID}
                        </span>
                        <span className="font-bold text-[#1E194B] dark:text-white">
                          {r.marks.toFixed(1)} ({r.grade})
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('tasks')}
                  className="w-full py-2.5 rounded-xl glass-subpanel hover:bg-white dark:hover:bg-violet-950/40 text-xs font-semibold text-[#4B2CD4] dark:text-violet-300 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Assignments & Quizzes</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
