import React, { useState } from 'react';
import {
  Bell,
  Check,
  Database,
  Info,
  Moon,
  RotateCcw,
  Sun,
  UserCheck,
} from 'lucide-react';
import { PROGRAM, TEAM_LABEL, UNIVERSITY } from '../../data/seedData';
import { UserProfile } from '../../types/unitrack';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenDataModal: () => void;
  stats: {
    students: number;
    courses: number;
    tasks: number;
    results: number;
  };
}

export function ProfileView({
  profile,
  onUpdateProfile,
  theme,
  onToggleTheme,
  onOpenDataModal,
  stats,
}: ProfileViewProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [studentIdLabel, setStudentIdLabel] = useState(profile.studentIdLabel);
  const [semesterLabel, setSemesterLabel] = useState(profile.semesterLabel);
  const [savedNotice, setSavedNotice] = useState(false);

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'UT';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      studentIdLabel: studentIdLabel.trim() || profile.studentIdLabel,
      semesterLabel: semesterLabel.trim() || profile.semesterLabel,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1E194B] dark:text-white">
          Student Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Personalize your dashboard greeting, notifications, appearance, and workspace backups
        </p>
      </div>

      {/* Main Profile Card with signature curved purple bottom wave */}
      <section className="rounded-3xl glass-card-3d overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Avatar + Identity Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-violet-200/60 dark:border-violet-800/40">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5B3CE6] to-[#4324C4] text-white font-display text-xl font-bold flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#1E194B] dark:text-white">
                  {profile.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile.email} · ID <span className="font-mono tabular-nums">{profile.studentIdLabel}</span>
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-300 font-medium mt-0.5">
                  {UNIVERSITY} · {profile.semesterLabel}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: 'Courses', value: stats.courses },
                { label: 'Students', value: stats.students },
                { label: 'Tasks', value: stats.tasks },
                { label: 'Results', value: stats.results },
              ].map((s) => (
                <div key={s.label} className="px-3 py-2 rounded-2xl glass-subpanel">
                  <p className="font-mono text-base font-bold tabular-nums text-[#1E194B] dark:text-white">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Editable Profile Form */}
            <form onSubmit={handleSave} className="md:col-span-7 space-y-4">
              <h3 className="font-display text-base font-semibold text-[#1E194B] dark:text-white">
                Account Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    value={studentIdLabel}
                    onChange={(e) => setStudentIdLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm font-mono tabular-nums text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Semester Label
                  </label>
                  <input
                    type="text"
                    required
                    value={semesterLabel}
                    onChange={(e) => setSemesterLabel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-800/60 bg-white/80 dark:bg-slate-900/70 text-sm text-[#1E194B] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-semibold glass-btn-3d whitespace-nowrap"
                >
                  {savedNotice ? <Check className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  <span>{savedNotice ? 'Profile Updated' : 'Save Profile'}</span>
                </button>
              </div>
            </form>

            {/* Quick Settings Rows matching Profile screen */}
            <div className="md:col-span-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-[#1E194B] dark:text-white">
                App Controls
              </h3>

              <div className="rounded-2xl glass-subpanel divide-y divide-violet-200/50 dark:divide-violet-800/40">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-violet-600 dark:text-violet-300" />
                    <div>
                      <p className="text-sm font-medium text-[#1E194B] dark:text-white">
                        Notifications
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Top bar task & queue counter
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.notificationsEnabled}
                    onClick={() =>
                      onUpdateProfile({
                        notificationsEnabled: !profile.notificationsEnabled,
                      })
                    }
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                      profile.notificationsEnabled
                        ? 'bg-[#4B2CD4]'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        profile.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/60 dark:hover:bg-violet-950/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-4 h-4 text-violet-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#1E194B] dark:text-white">
                        Appearance
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Switch Light / Dark glass theme
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onOpenDataModal}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/60 dark:hover:bg-violet-950/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-violet-600 dark:text-violet-300" />
                    <div>
                      <p className="text-sm font-medium text-[#1E194B] dark:text-white">
                        Backup, Export & Reset
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Manage browser localStorage records
                      </p>
                    </div>
                  </div>
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <div className="p-3.5 flex items-start gap-3">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <p className="font-medium text-[#1E194B] dark:text-slate-200">
                      About UniTrack
                    </p>
                    <p>{PROGRAM} · {TEAM_LABEL}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Curved Purple Wave Footer from the Reference Mockup */}
        <div className="relative h-20 unitrack-wave-header overflow-hidden">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="absolute top-0 left-0 w-full h-12 text-white/90 dark:text-[#161238]"
            aria-hidden="true"
          >
            <path
              d="M0,0 L1200,0 L1200,32 C980,95 680,15 360,68 C190,96 70,58 0,34 Z"
              fill="currentColor"
              opacity="0.22"
            />
          </svg>
          <div className="relative z-10 h-full px-6 sm:px-8 flex items-center justify-between text-xs text-violet-100">
            <span className="font-display font-semibold">UniTrack Academic Workspace</span>
            <span className="font-mono tabular-nums opacity-90">{UNIVERSITY}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
