import React from 'react';
import {
  BarChart3,
  BookOpen,
  Code2,
  Cpu,
  Database,
  Layers,
  Network,
  Sigma,
  Terminal,
} from 'lucide-react';

export interface CourseVisualTheme {
  tileBg: string;
  barColor: string;
  tintBg: string;
  tintText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COURSE_THEME_MAP: Record<string, CourseVisualTheme> = {
  'CSE 2101': {
    tileBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    barColor: 'bg-blue-500',
    tintBg: 'bg-blue-100/80 dark:bg-blue-950/60',
    tintText: 'text-blue-700 dark:text-blue-300',
    icon: Code2,
  },
  'CSE 2102': {
    tileBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    barColor: 'bg-orange-500',
    tintBg: 'bg-orange-100/80 dark:bg-orange-950/60',
    tintText: 'text-orange-700 dark:text-orange-300',
    icon: Terminal,
  },
  'CSE 2103': {
    tileBg: 'bg-gradient-to-br from-violet-600 to-indigo-600',
    barColor: 'bg-violet-600',
    tintBg: 'bg-violet-100/80 dark:bg-violet-950/60',
    tintText: 'text-violet-700 dark:text-violet-300',
    icon: Layers,
  },
  'CSE 2104': {
    tileBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    barColor: 'bg-emerald-500',
    tintBg: 'bg-emerald-100/80 dark:bg-emerald-950/60',
    tintText: 'text-emerald-700 dark:text-emerald-300',
    icon: Database,
  },
  'CSE 2105': {
    tileBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    barColor: 'bg-sky-500',
    tintBg: 'bg-sky-100/80 dark:bg-sky-950/60',
    tintText: 'text-sky-700 dark:text-sky-300',
    icon: Cpu,
  },
  'CSE 2106': {
    tileBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    barColor: 'bg-indigo-500',
    tintBg: 'bg-indigo-100/80 dark:bg-indigo-950/60',
    tintText: 'text-indigo-700 dark:text-indigo-300',
    icon: Network,
  },
  'MAT 2141': {
    tileBg: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    barColor: 'bg-cyan-500',
    tintBg: 'bg-cyan-100/80 dark:bg-cyan-950/60',
    tintText: 'text-cyan-700 dark:text-cyan-300',
    icon: Sigma,
  },
  'ECO 2171': {
    tileBg: 'bg-gradient-to-br from-emerald-400 to-green-600',
    barColor: 'bg-emerald-500',
    tintBg: 'bg-emerald-100/80 dark:bg-emerald-950/60',
    tintText: 'text-emerald-700 dark:text-emerald-300',
    icon: BarChart3,
  },
};

export function getCourseTheme(courseCode: string): CourseVisualTheme {
  return (
    COURSE_THEME_MAP[courseCode] ?? {
      tileBg: 'bg-gradient-to-br from-violet-600 to-indigo-600',
      barColor: 'bg-violet-600',
      tintBg: 'bg-violet-100/80 dark:bg-violet-950/60',
      tintText: 'text-violet-700 dark:text-violet-300',
      icon: BookOpen,
    }
  );
}
