import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  FileText,
  FolderKanban,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { COURSES, getCourseTitle } from '../../data/seedData';
import { TaskItem, TaskStatus, TaskType } from '../../types/unitrack';
import { getCourseTheme } from '../../utils/courseTheme';
import { MAX_TASKS } from '../../utils/dataStructures';

interface TasksViewProps {
  tasks: TaskItem[];
  onAddTask: (payload: {
    type: TaskType;
    title: string;
    courseCode: string;
    dueDate: string;
  }) => { ok: boolean; error?: string };
  onToggleTaskStatus: (id: number) => void;
  onDeleteTask: (id: number) => void;
}

export function TasksView({
  tasks,
  onAddTask,
  onToggleTaskStatus,
  onDeleteTask,
}: TasksViewProps) {
  const [typeFilter, setTypeFilter] = useState<'All' | TaskType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [newType, setNewType] = useState<TaskType>('Assignment');
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(COURSES[0].code);
  const [newDueDate, setNewDueDate] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !t.courseCode.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [tasks, typeFilter, statusFilter, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onAddTask({
      type: newType,
      title: newTitle,
      courseCode: newCourse,
      dueDate: newDueDate,
    });
    if (res.ok) {
      setNewTitle('');
      setNewDueDate('');
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
          Assignments & Quizzes
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span className="font-mono tabular-nums">
            {tasks.length}/{MAX_TASKS} tasks
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{pendingCount} upcoming</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{completedCount} completed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Add Task Form */}
        <section className="xl:col-span-4 rounded-3xl glass-card-3d p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
            Add Assignment or Quiz
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Task Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Assignment', 'Quiz'] as TaskType[]).map((typeOption) => (
                  <button
                    key={typeOption}
                    type="button"
                    onClick={() => setNewType(typeOption)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      newType === typeOption
                        ? 'bg-[#4B2CD4] text-white shadow-sm'
                        : 'glass-subpanel text-slate-600 dark:text-slate-300 hover:text-[#4B2CD4]'
                    }`}
                  >
                    {typeOption}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`e.g. ${newType === 'Assignment' ? 'Linked List Implementation' : 'Trees & Heaps Quiz'}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                University Course
              </label>
              <select
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {COURSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                type="text"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="e.g. 25-Nov-2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono text-[#1E194B] dark:text-white placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold glass-btn-3d"
            >
              <Plus className="w-4 h-4" />
              <span>Save {newType}</span>
            </button>
          </form>
        </section>

        {/* Task List (Matching Mockup Assignments Screen) */}
        <section className="xl:col-span-8 rounded-3xl glass-card-3d overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-200/50 dark:border-violet-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-full glass-subpanel">
                {(['All', 'Pending', 'Completed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#4B2CD4] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#1E194B] dark:hover:text-white'
                    }`}
                  >
                    {st === 'Pending' ? 'Upcoming' : st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-full glass-subpanel">
                {(['All', 'Assignment', 'Quiz'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      typeFilter === t
                        ? 'bg-white dark:bg-violet-900/70 text-[#1E194B] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t === 'All' ? 'All Types' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-xs text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching assignment or quiz found.
            </div>
          ) : (
            <div className="p-4 space-y-2.5">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'Completed';
                const theme = getCourseTheme(task.courseCode);
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl glass-subpanel flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          isDone
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                            : task.type === 'Quiz'
                              ? 'bg-gradient-to-br from-rose-500 to-orange-500'
                              : theme.tileBg
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : task.type === 'Assignment' ? (
                          <FolderKanban className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <p
                          className={`text-sm font-bold text-[#1E194B] dark:text-white ${
                            isDone ? 'line-through opacity-65' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-semibold text-[#4B2CD4] dark:text-violet-300">
                            {task.courseCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{task.dueDate}</span>
                          <span aria-hidden="true">·</span>
                          <span>{getCourseTitle(task.courseCode)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span
                        className={`text-xs font-semibold mr-1 ${
                          isDone
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isDone ? 'Completed' : 'Upcoming'}
                      </span>

                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(task.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isDone
                            ? 'border-violet-200 dark:border-violet-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-violet-950/40'
                            : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            <span>Reopen</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </>
                        )}
                      </button>

                      {confirmDeleteId === task.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteTask(task.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-xl glass-subpanel text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(task.id)}
                          aria-label={`Delete ${task.title}`}
                          className="p-2 rounded-xl glass-subpanel text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
