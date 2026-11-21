import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Database,
  GraduationCap,
  Home,
  ListOrdered,
  Menu,
  Moon,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { PROGRAM, UNIVERSITY } from '../data/seedData';
import {
  CalendarEvent,
  SectionId,
  TaskItem,
  UserProfile,
} from '../types/unitrack';

export interface NavItemConfig {
  id: SectionId;
  label: string;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface LayoutShellProps {
  activeSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenDataModal: () => void;
  profile: UserProfile;
  pendingTasks: TaskItem[];
  upcomingEvents: CalendarEvent[];
  counts: {
    students: number;
    catalog: number;
    queue: number;
    schedules: number;
    tasks: number;
    events: number;
    results: number;
    activities: number;
  };
  children: React.ReactNode;
}

export function UniTrackLogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-gradient-to-br from-[#5B3CE6] via-[#6D4AFF] to-[#4324C4] flex items-center justify-center text-white shadow-md shadow-violet-600/30 shrink-0`}
    >
      <GraduationCap className="w-[58%] h-[58%]" />
    </div>
  );
}

export function LayoutShell({
  activeSection,
  onSelectSection,
  theme,
  onToggleTheme,
  onOpenDataModal,
  profile,
  pendingTasks,
  upcomingEvents,
  counts,
  children,
}: LayoutShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'catalog', label: 'My Courses', count: counts.catalog, icon: BookOpen },
    { id: 'routine', label: 'Routine & Exams', count: counts.schedules, icon: Clock },
    { id: 'tasks', label: 'Assignments & Quizzes', count: counts.tasks, icon: CheckSquare },
    { id: 'calendar', label: 'Academic Calendar', count: counts.events, icon: Calendar },
    { id: 'results', label: 'Analytics & Results', count: counts.results, icon: Award },
    { id: 'students', label: 'Students (BST)', count: counts.students, icon: Users },
    { id: 'registration', label: 'Registration Queue', count: counts.queue, icon: ListOrdered },
    { id: 'activity', label: 'Activity Stack', count: counts.activities, icon: Activity },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  const mobileTabs: Array<{
    id: SectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'catalog', label: 'Courses', icon: BookOpen },
    { id: 'routine', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const activeNav = navItems.find((item) => item.id === activeSection) ?? navItems[0];
  const alertCount = profile.notificationsEnabled
    ? pendingTasks.length + counts.queue
    : 0;

  const handleSelect = (id: SectionId) => {
    onSelectSection(id);
    setMobileOpen(false);
    setNotifOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full glass-surface rounded-none lg:rounded-3xl overflow-hidden">
      <div className="px-5 py-5 border-b border-violet-200/50 dark:border-violet-800/40 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-3 text-left group"
        >
          <UniTrackLogoMark className="w-9 h-9" />
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-[#1E194B] dark:text-white block leading-none">
              UniTrack
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              {profile.semesterLabel}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-violet-50 dark:hover:bg-violet-950/50"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeSection;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'text-white glass-btn-3d'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/75 dark:hover:bg-violet-950/40 hover:text-[#3A22B8] dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-violet-500/80 dark:text-violet-400/80'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`font-mono text-xs tabular-nums ml-2 shrink-0 ${
                    isActive
                      ? 'text-violet-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-violet-200/50 dark:border-violet-800/40 space-y-2">
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <p className="font-semibold text-[#1E194B] dark:text-slate-200">{UNIVERSITY}</p>
          <p className="mt-0.5">{PROGRAM}</p>
          <p className="mt-1 text-[11px]">Team One Piece · CSE 2103 Lab</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-[#F4F3FF] via-[#EEF0FA] to-[#E6E8FB] dark:from-[#0B091A] dark:via-[#110E28] dark:to-[#171336] text-[#1A1638] dark:text-slate-100 overflow-x-clip">
      {/* Ambient Lavender & Periwinkle Refraction Waves */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-28 -left-24 w-[480px] h-[480px] rounded-full bg-violet-300/35 dark:bg-violet-700/18 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[440px] h-[440px] rounded-full bg-indigo-300/30 dark:bg-indigo-600/18 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[520px] h-[420px] rounded-full bg-sky-200/40 dark:bg-cyan-700/12 blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[276px] shrink-0 sticky top-0 h-screen p-3 pr-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#120D31]/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 px-3 pt-3 sm:px-6 lg:px-8">
          <header className="h-14 glass-surface rounded-2xl px-4 sm:px-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/50"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <button
                  type="button"
                  onClick={() => handleSelect('dashboard')}
                  className="text-slate-500 dark:text-slate-400 hover:text-[#4B2CD4] dark:hover:text-violet-300 transition-colors whitespace-nowrap hidden sm:inline font-medium"
                >
                  UniTrack
                </button>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
                <span className="font-display font-semibold text-[#1E194B] dark:text-slate-100 truncate">
                  {activeNav.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Functional Notification Bell Popover */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Academic notifications"
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl glass-subpanel hover:bg-white/90 dark:hover:bg-violet-950/60 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-semibold flex items-center justify-center">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl glass-card-3d p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-[#1E194B] dark:text-white">
                        Academic Reminders
                      </p>
                      <span className="font-mono text-[11px] text-violet-600 dark:text-violet-300 tabular-nums">
                        {pendingTasks.length} pending
                      </span>
                    </div>

                    {pendingTasks.length === 0 && upcomingEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                        All tasks completed and no pending alerts.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pendingTasks.slice(0, 3).map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => handleSelect('tasks')}
                            className="w-full text-left p-2.5 rounded-xl glass-subpanel hover:border-violet-400 transition-colors"
                          >
                            <p className="text-xs font-semibold text-[#1E194B] dark:text-white truncate">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                              {task.courseCode} · Due {task.dueDate}
                            </p>
                          </button>
                        ))}
                        {upcomingEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => handleSelect('calendar')}
                            className="w-full text-left p-2.5 rounded-xl glass-subpanel hover:border-violet-400 transition-colors"
                          >
                            <p className="text-xs font-semibold text-[#1E194B] dark:text-white truncate">
                              {ev.title}
                            </p>
                            <p className="text-[11px] text-violet-600 dark:text-violet-300 mt-0.5 font-mono tabular-nums">
                              Event · {ev.date}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subpanel hover:bg-white/90 dark:hover:bg-violet-950/60 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-violet-600" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenDataModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-medium glass-btn-3d whitespace-nowrap shrink-0"
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Backup & Reset</span>
                <span className="sm:hidden">Data</span>
              </button>
            </div>
          </header>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (matching UniTrack mobile design) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-surface border-t border-violet-200/70 dark:border-violet-800/50 rounded-none"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#4B2CD4] dark:text-violet-300 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
