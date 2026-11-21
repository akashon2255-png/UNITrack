import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Plus,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  COURSES,
  getCourseTitle,
  gpaPointFromMarks,
  GRADE_SCALE,
  gradeFromMarks,
} from '../../data/seedData';
import { ResultRecord, StudentRecord } from '../../types/unitrack';
import { MAX_RESULTS } from '../../utils/dataStructures';

interface ResultsViewProps {
  results: ResultRecord[];
  studentsList: StudentRecord[];
  onAddResult: (payload: {
    studentID: number;
    courseCode: string;
    marks: number;
  }) => { ok: boolean; error?: string };
}

export function ResultsView({
  results,
  studentsList,
  onAddResult,
}: ResultsViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentsList[0] ? String(studentsList[0].id) : ''
  );
  const [manualFormId, setManualFormId] = useState('');
  const [useManualId, setUseManualId] = useState(studentsList.length === 0);
  const [courseCode, setCourseCode] = useState(COURSES[0].code);
  const [marksInput, setMarksInput] = useState('');

  const [summaryStudentId, setSummaryStudentId] = useState<string>(
    studentsList[0] ? String(studentsList[0].id) : ''
  );
  const [tableSearch, setTableSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [chartTab, setChartTab] = useState<'gpa' | 'pass'>('gpa');

  const studentMap = useMemo(
    () => new Map(studentsList.map((s) => [s.id, s])),
    [studentsList]
  );

  // Global overview metrics
  const overviewStats = useMemo(() => {
    if (results.length === 0) {
      return {
        gpa: '0.00',
        avgMarks: '0.0',
        passRate: 0,
        courseCoveragePct: 0,
        coveredCount: 0,
      };
    }
    const gpaSum = results.reduce((acc, r) => acc + gpaPointFromMarks(r.marks), 0);
    const marksSum = results.reduce((acc, r) => acc + r.marks, 0);
    const passedCount = results.filter((r) => r.marks >= 40).length;
    const coveredCount = new Set(results.map((r) => r.courseCode)).size;
    return {
      gpa: (gpaSum / results.length).toFixed(2),
      avgMarks: (marksSum / results.length).toFixed(1),
      passRate: Math.round((passedCount / results.length) * 100),
      courseCoveragePct: Math.round((coveredCount / COURSES.length) * 100),
      coveredCount,
    };
  }, [results]);

  // SVG GPA Trend Points across courses
  const trendPoints = useMemo(() => {
    const grouped = COURSES.slice(0, 6).map((c) => {
      const list = results.filter((r) => r.courseCode === c.code);
      const gpa =
        list.length > 0
          ? list.reduce((s, r) => s + gpaPointFromMarks(r.marks), 0) / list.length
          : 3.1;
      return { label: c.code.replace('CSE ', 'C').replace('MAT ', 'M').replace('ECO ', 'E'), gpa };
    });
    return grouped;
  }, [results]);

  const previewMarks = Number(marksInput);
  const hasValidPreview =
    marksInput.trim() !== '' &&
    !Number.isNaN(previewMarks) &&
    previewMarks >= 0 &&
    previewMarks <= 100;

  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number((useManualId ? manualFormId : selectedStudentId).trim());
    const marksNum = Number(marksInput.trim());
    const res = onAddResult({
      studentID: idNum,
      courseCode,
      marks: marksNum,
    });
    if (res.ok) {
      setMarksInput('');
      setSummaryStudentId(String(idNum));
    }
  };

  const activeSummaryId = Number(summaryStudentId);
  const summaryStudent = Number.isInteger(activeSummaryId)
    ? studentMap.get(activeSummaryId) ?? null
    : null;

  const studentResults = useMemo(() => {
    if (!Number.isInteger(activeSummaryId)) return [];
    return results.filter((r) => r.studentID === activeSummaryId);
  }, [results, activeSummaryId]);

  const performanceStats = useMemo(() => {
    if (studentResults.length === 0) return null;
    let total = 0;
    let gpaTotal = 0;
    let passed = 0;
    let highest = -1;
    let lowest = 101;
    for (const r of studentResults) {
      total += r.marks;
      gpaTotal += gpaPointFromMarks(r.marks);
      if (r.marks >= 40) passed += 1;
      if (r.marks > highest) highest = r.marks;
      if (r.marks < lowest) lowest = r.marks;
    }
    return {
      count: studentResults.length,
      passed,
      gpa: gpaTotal / studentResults.length,
      average: total / studentResults.length,
      highest,
      lowest,
    };
  }, [studentResults]);

  const filteredAllResults = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return results.filter((r) => {
      if (courseFilter !== 'All' && r.courseCode !== courseFilter) return false;
      if (!q) return true;
      const sName = studentMap.get(r.studentID)?.name.toLowerCase() ?? '';
      return (
        String(r.studentID).includes(q) ||
        sName.includes(q) ||
        r.courseCode.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q)
      );
    });
  }, [results, courseFilter, tableSearch, studentMap]);

  const gradeColorClass = (grade: string) => {
    if (grade === 'F') return 'text-rose-600 dark:text-rose-400 font-semibold';
    if (grade === 'D' || grade === 'C')
      return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  };

  // Donut geometry for Pass Rate
  const donutRadius = 36;
  const donutCirc = 2 * Math.PI * donutRadius;
  const donutOffset = donutCirc - (overviewStats.passRate / 100) * donutCirc;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
          Academic Overview & Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span className="font-mono tabular-nums">
            {results.length}/{MAX_RESULTS}
          </span>{' '}
          results logged · Automatic grading (A+ through F) and GPA analytics
        </p>
      </div>

      {/* Top Mockup Section: Academic Overview Card + Analytics Chart Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Academic Overview Card (Matching Mockup Screen 5) */}
        <section className="xl:col-span-6 rounded-3xl glass-card-3d p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Overall GPA
              </p>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="font-display text-4xl font-bold tabular-nums text-[#1E194B] dark:text-white">
                  {overviewStats.gpa}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  / 4.00
                </span>
              </div>
            </div>

            {/* Mini rising bars graphic */}
            <div className="flex items-end gap-1.5 h-14">
              {[38, 52, 66, 78, 92].map((h, idx) => (
                <div
                  key={h}
                  className="w-2.5 rounded-t-md"
                  style={{
                    height: `${h}%`,
                    background:
                      idx >= 3
                        ? 'linear-gradient(180deg, #6D4AFF 0%, #4B2CD4 100%)'
                        : 'rgba(139, 92, 246, 0.35)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1E194B] dark:text-slate-200">
                Course Evaluation Progress
              </span>
              <span className="font-mono font-bold text-[#4B2CD4] dark:text-violet-300 tabular-nums">
                {overviewStats.courseCoveragePct}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-violet-100 dark:bg-violet-950/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4B2CD4] to-[#7C4DFF] transition-all duration-300"
                style={{ width: `${overviewStats.courseCoveragePct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {overviewStats.coveredCount} / {COURSES.length} Courses Graded
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { label: 'Courses', value: COURSES.length, icon: BookOpen, tint: 'bg-violet-100 text-[#4B2CD4] dark:bg-violet-950/70 dark:text-violet-300' },
              { label: 'Students', value: studentsList.length, icon: Users, tint: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300' },
              { label: 'Records', value: results.length, icon: Award, tint: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300' },
              { label: 'Avg Marks', value: overviewStats.avgMarks, icon: CheckCircle2, tint: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="p-3 rounded-2xl glass-subpanel space-y-2">
                  <div className={`w-7 h-7 rounded-xl ${item.tint} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold tabular-nums text-[#1E194B] dark:text-white leading-none">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Analytics Line & Donut Chart Card (Matching Mockup Screen 10) */}
        <section className="xl:col-span-6 rounded-3xl glass-card-3d p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
                Performance Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Course GPA curve & pass ratio
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full glass-subpanel">
              <button
                type="button"
                onClick={() => setChartTab('gpa')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  chartTab === 'gpa'
                    ? 'bg-[#4B2CD4] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                GPA Curve
              </button>
              <button
                type="button"
                onClick={() => setChartTab('pass')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  chartTab === 'pass'
                    ? 'bg-[#4B2CD4] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pass Rate
              </button>
            </div>
          </div>

          {chartTab === 'gpa' ? (
            <div className="p-4 rounded-2xl glass-subpanel">
              <svg viewBox="0 0 360 150" className="w-full h-40 overflow-visible">
                {[4.0, 3.0, 2.0].map((tick, idx) => {
                  const y = 20 + idx * 45;
                  return (
                    <g key={tick}>
                      <line
                        x1="32"
                        y1={y}
                        x2="345"
                        y2={y}
                        stroke="currentColor"
                        className="text-violet-200/70 dark:text-violet-800/50"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="24"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {tick.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
                {(() => {
                  const coords = trendPoints.map((pt, i) => {
                    const x = 54 + i * 54;
                    const y = 110 - Math.max(0, Math.min(2, pt.gpa - 2)) * 45;
                    return { ...pt, x, y };
                  });
                  const pathD = coords
                    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
                    .join(' ');
                  return (
                    <>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#4B2CD4"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {coords.map((c) => (
                        <g key={c.label}>
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r="4.5"
                            className="fill-[#4B2CD4] stroke-white dark:stroke-slate-900"
                            strokeWidth="2"
                          />
                          <text
                            x={c.x}
                            y="138"
                            textAnchor="middle"
                            className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                          >
                            {c.label}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          ) : (
            <div className="p-4 rounded-2xl glass-subpanel flex items-center justify-around gap-6 h-48">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="none"
                    stroke="currentColor"
                    className="text-violet-200/70 dark:text-violet-900/50"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="none"
                    stroke="#4B2CD4"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={donutCirc}
                    strokeDashoffset={donutOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-bold tabular-nums text-[#1E194B] dark:text-white">
                    {overviewStats.passRate}%
                  </span>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4B2CD4]" />
                  <span className="font-semibold text-[#1E194B] dark:text-white">
                    Passed (&ge; 40)
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {results.filter((r) => r.marks >= 40).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-200 dark:bg-violet-900" />
                  <span className="font-semibold text-[#1E194B] dark:text-white">
                    Below 40 (F)
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {results.filter((r) => r.marks < 40).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add Result + Per-Student Performance Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-4 rounded-3xl glass-card-3d p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
              Add Student Result
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Student ID must exist in the BST directory
            </p>
          </div>

          <form onSubmit={handleAddResult} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Student
                </label>
                {studentsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseManualId((v) => !v)}
                    className="text-[11px] font-semibold text-[#4B2CD4] dark:text-violet-300 hover:underline"
                  >
                    {useManualId ? 'Select from directory' : 'Enter ID manually'}
                  </button>
                )}
              </div>

              {useManualId || studentsList.length === 0 ? (
                <input
                  type="number"
                  required
                  value={manualFormId}
                  onChange={(e) => setManualFormId(e.target.value)}
                  placeholder="Enter Student ID"
                  className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono tabular-nums text-[#1E194B] dark:text-white"
                />
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white"
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name}
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
                className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white"
              >
                {COURSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Marks (0–100)
                </label>
                {hasValidPreview && (
                  <span className="text-xs font-mono">
                    Grade:{' '}
                    <span className={gradeColorClass(gradeFromMarks(previewMarks))}>
                      {gradeFromMarks(previewMarks)}
                    </span>
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                required
                value={marksInput}
                onChange={(e) => setMarksInput(e.target.value)}
                placeholder="e.g. 84.5"
                className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono tabular-nums text-[#1E194B] dark:text-white placeholder:font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold glass-btn-3d"
            >
              <Plus className="w-4 h-4" />
              <span>Save Result</span>
            </button>
          </form>

          <div className="pt-4 border-t border-violet-200/50 dark:border-violet-800/40">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Grading Scale
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {GRADE_SCALE.map((row) => (
                <div key={row.grade} className="flex items-center justify-between">
                  <span>{row.min}</span>
                  <span className="font-semibold text-[#1E194B] dark:text-slate-200">
                    {row.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Student Performance Summary */}
        <section className="xl:col-span-8 rounded-3xl glass-card-3d overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-200/50 dark:border-violet-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
                Student Performance Summary
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a student from BST to analyze recorded courses
              </p>
            </div>
            <select
              value={summaryStudentId}
              onChange={(e) => setSummaryStudentId(e.target.value)}
              aria-label="Select student for performance summary"
              className="px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-xs font-semibold text-[#1E194B] dark:text-white max-w-xs"
            >
              {studentsList.length === 0 ? (
                <option value="">No registered students</option>
              ) : (
                studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="p-5 space-y-5">
            {!summaryStudent ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                Select or register a student to view their performance summary.
              </p>
            ) : !performanceStats ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-sm font-semibold text-[#1E194B] dark:text-white">
                  {summaryStudent.name} ({summaryStudent.id})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No result is available for this student yet.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-violet-200/40 dark:border-violet-800/30">
                  <div>
                    <p className="font-display text-lg font-bold text-[#1E194B] dark:text-white">
                      {summaryStudent.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums">
                        ID {summaryStudent.id}
                      </span>{' '}
                      · {summaryStudent.department} · {summaryStudent.phone}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#4B2CD4] dark:text-violet-300 tabular-nums">
                    GPA {performanceStats.gpa.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Courses', value: String(performanceStats.count) },
                    { label: 'Passed (>=40)', value: String(performanceStats.passed) },
                    { label: 'Average', value: performanceStats.average.toFixed(2) },
                    { label: 'Highest', value: performanceStats.highest.toFixed(2) },
                    { label: 'Lowest', value: performanceStats.lowest.toFixed(2) },
                  ].map((stat) => (
                    <div key={stat.label} className="p-3 rounded-2xl glass-subpanel">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </p>
                      <p className="font-mono text-lg font-bold tabular-nums text-[#1E194B] dark:text-white mt-0.5">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {studentResults.map((r) => (
                    <div key={r.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="min-w-0 truncate">
                          <span className="font-mono font-semibold text-[#4B2CD4] dark:text-violet-300 mr-2">
                            {r.courseCode}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {getCourseTitle(r.courseCode)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                          <span className="text-slate-700 dark:text-slate-200">
                            {r.marks.toFixed(2)}
                          </span>
                          <span className={`w-6 text-right ${gradeColorClass(r.grade)}`}>
                            {r.grade}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-violet-100 dark:bg-violet-950/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            r.marks < 40
                              ? 'bg-rose-500'
                              : r.marks >= 80
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-[#4B2CD4] to-[#7C4DFF]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, r.marks))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* All Result Records Table */}
      <section className="rounded-3xl glass-card-3d overflow-hidden">
        <div className="px-5 py-4 border-b border-violet-200/50 dark:border-violet-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
            All Result Records
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter results by course"
              className="px-3 py-1.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-xs text-[#1E194B] dark:text-white"
            >
              <option value="All">All Courses</option>
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <div className="relative w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search ID, student, grade..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-xs text-[#1E194B] dark:text-white"
              />
            </div>
          </div>
        </div>

        {filteredAllResults.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No matching result records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-violet-200/50 dark:border-violet-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-950/30">
                  <th className="py-2.5 px-5">Student ID</th>
                  <th className="py-2.5 px-5">Student Name</th>
                  <th className="py-2.5 px-5">Course</th>
                  <th className="py-2.5 px-5 text-right">Marks</th>
                  <th className="py-2.5 px-5 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/70 dark:divide-violet-900/40 text-sm">
                {filteredAllResults.map((r) => {
                  const s = studentMap.get(r.studentID);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSummaryStudentId(String(r.studentID))}
                      className="cursor-pointer hover:bg-violet-50/70 dark:hover:bg-violet-950/30 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-xs tabular-nums text-[#1E194B] dark:text-slate-100">
                        {r.studentID}
                      </td>
                      <td className="py-3 px-5 font-semibold text-[#1E194B] dark:text-white">
                        {s ? s.name : 'Student removed'}
                      </td>
                      <td className="py-3 px-5 text-xs">
                        <span className="font-mono font-semibold text-[#4B2CD4] dark:text-violet-300 mr-2">
                          {r.courseCode}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {getCourseTitle(r.courseCode)}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
                        {r.marks.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 px-5 text-right font-mono text-xs ${gradeColorClass(
                          r.grade
                        )}`}
                      >
                        {r.grade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
