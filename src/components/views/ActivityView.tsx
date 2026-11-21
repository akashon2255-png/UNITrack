import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Layers, Trash2 } from 'lucide-react';
import { ActivityCategory, ActivityEntry } from '../../types/unitrack';
import { MAX_ACTIVITY } from '../../utils/dataStructures';

interface ActivityViewProps {
  activityStack: ActivityEntry[];
  onPopLatest: () => ActivityEntry | null;
}

export function ActivityView({
  activityStack,
  onPopLatest,
}: ActivityViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActivityCategory>('all');
  const [confirmPop, setConfirmPop] = useState(false);

  const topIndex = activityStack.length - 1;
  const latestActivity = topIndex >= 0 ? activityStack[topIndex] : null;

  // Render TOP (newest) first, matching the C++ stack traversal
  const stackNewestFirst = useMemo(() => {
    const indexed = activityStack.map((entry, idx) => ({
      stackPosition: idx + 1,
      isTop: idx === activityStack.length - 1,
      entry,
    }));
    const reversed = [...indexed].reverse();
    if (categoryFilter === 'all') return reversed;
    return reversed.filter((item) => item.entry.category === categoryFilter);
  }, [activityStack, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
            Recent Activity History (Stack)
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-mono tabular-nums">
              Size: {activityStack.length}/{MAX_ACTIVITY}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">TOP index: {topIndex}</span>
            <span aria-hidden="true">·</span>
            <span>LIFO (Last In, First Out) · Push O(1) · Pop O(1)</span>
          </div>
        </div>

        {latestActivity && !confirmPop && (
          <button
            type="button"
            onClick={() => setConfirmPop(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 glass-subpanel hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Pop Latest Entry</span>
          </button>
        )}
      </div>

      {/* Latest Activity Inspector / Pop Confirmation */}
      <section className="rounded-3xl glass-card-3d p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#4B2CD4] dark:text-violet-300 font-mono font-semibold">
              <Layers className="w-4 h-4" />
              <span>TOP OF STACK (LATEST ACTIVITY)</span>
            </div>
            {latestActivity ? (
              <>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {latestActivity.description}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Category: {latestActivity.category} · Recorded at{' '}
                  <span className="font-mono tabular-nums">
                    {latestActivity.timestamp}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Activity stack is empty (underflow). Perform an action in any module to push an entry.
              </p>
            )}
          </div>

          {confirmPop && latestActivity && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 shrink-0">
              <span className="text-xs font-medium text-rose-800 dark:text-rose-200 mr-1">
                Remove top entry?
              </span>
              <button
                type="button"
                onClick={() => {
                  onPopLatest();
                  setConfirmPop(false);
                }}
                className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
              >
                Confirm Pop
              </button>
              <button
                type="button"
                onClick={() => setConfirmPop(false)}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Visual LIFO Stack Diagram */}
        <section className="xl:col-span-5 rounded-2xl glass-card-3d p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                LIFO Stack Frame Diagram
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizes the top 8 frames pushed onto the stack
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <ArrowUp className="w-3.5 h-3.5 text-[#4B2CD4] dark:text-violet-400" />
              <span>Push / Pop</span>
              <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {activityStack.length === 0 ? (
            <div className="h-48 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-2xl flex items-center justify-center text-xs font-mono text-slate-400">
              activityTop = -1 (EMPTY STACK)
            </div>
          ) : (
            <div className="space-y-2 border-x-2 border-b-2 border-violet-200/80 dark:border-violet-800/60 rounded-b-2xl p-3 bg-white/40 dark:bg-slate-950/40">
              {[...activityStack]
                .map((entry, idx) => ({ entry, idx }))
                .reverse()
                .slice(0, 8)
                .map(({ entry, idx }) => {
                  const isTopFrame = idx === topIndex;
                  return (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isTopFrame
                          ? 'border-[#4B2CD4]/70 bg-violet-500/15 dark:bg-violet-500/20 text-[#1E194B] dark:text-white shadow-sm'
                          : 'glass-subpanel text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span
                          className={
                            isTopFrame
                              ? 'text-[#4B2CD4] dark:text-violet-300 font-semibold'
                              : 'text-slate-400'
                          }
                        >
                          {isTopFrame ? `TOP [${idx}]` : `SLOT [${idx}]`}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 font-medium truncate">{entry.description}</p>
                    </div>
                  );
                })}
              {activityStack.length > 8 && (
                <p className="text-center font-mono text-[11px] text-slate-400 pt-1">
                  + {activityStack.length - 8} older frame(s) below
                </p>
              )}
            </div>
          )}
        </section>

        {/* Full Stack History Table */}
        <section className="xl:col-span-7 rounded-2xl glass-card-3d overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Complete Stack Trace
            </h2>
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'all' | ActivityCategory)
              }
              aria-label="Filter stack by category"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-fit"
            >
              <option value="all">All Categories</option>
              <option value="student">Student BST</option>
              <option value="registration">Registration Queue</option>
              <option value="schedule">Routine & Exams</option>
              <option value="task">Tasks & Quizzes</option>
              <option value="calendar">Academic Calendar</option>
              <option value="result">Results</option>
              <option value="system">System</option>
            </select>
          </div>

          {stackNewestFirst.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No activity entries match this filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stackNewestFirst.map(({ stackPosition, isTop, entry }) => (
                <div
                  key={entry.id}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono text-xs tabular-nums w-12 shrink-0 ${
                        isTop
                          ? 'text-[#4B2CD4] dark:text-violet-300 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isTop ? 'TOP' : `#${stackPosition}`}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {entry.description}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {entry.category}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                    {entry.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
