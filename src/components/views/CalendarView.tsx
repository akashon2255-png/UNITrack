import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Search } from 'lucide-react';
import { CalendarEvent } from '../../types/unitrack';
import { MAX_EVENTS } from '../../utils/dataStructures';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (payload: {
    title: string;
    date: string;
    description: string;
  }) => { ok: boolean };
}

export function CalendarView({ events, onAddEvent }: CalendarViewProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.date.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onAddEvent({ title, date, description });
    if (res.ok) {
      setTitle('');
      setDate('');
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
          Academic Calendar
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span className="font-mono tabular-nums">
            {events.length}/{MAX_EVENTS}
          </span>{' '}
          events stored · Semester milestones, viva dates, and departmental events
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-4 rounded-3xl glass-card-3d p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
            Add Calendar Event
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Event Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Final Project Presentation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. 15-Dec-2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono text-[#1E194B] dark:text-white placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Short Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Venue, batch, or preparation notes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold glass-btn-3d"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </form>
        </section>

        <section className="xl:col-span-8 rounded-3xl glass-card-3d overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-200/50 dark:border-violet-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
              Scheduled Events
            </h2>
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events or dates..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-xs text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {events.length === 0
                ? 'No academic events have been added yet.'
                : 'No events match your search.'}
            </div>
          ) : (
            <div className="p-4 space-y-2.5">
              {filteredEvents.map((ev) => (
                <article
                  key={ev.id}
                  className="p-4 rounded-2xl glass-subpanel flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">EVENT #{ev.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[#4B2CD4] dark:text-violet-300 font-semibold tabular-nums">
                        {ev.date}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#1E194B] dark:text-white">
                      {ev.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B3CE6] to-[#4324C4] text-white shadow-sm shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
