import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createCoreOnlyState,
  createSampleState,
  DEFAULT_PROFILE,
  gradeFromMarks,
  isValidCourseCode,
} from '../data/seedData';
import {
  ActivityCategory,
  ActivityEntry,
  CalendarEvent,
  ProcessedRegistrationResult,
  ResultRecord,
  ScheduleStatus,
  ScheduleType,
  StudentRecord,
  TaskType,
  ToastMessage,
  UniTrackPersistedState,
  UserProfile,
} from '../types/unitrack';
import {
  countStudentsBST,
  deleteStudentFromBST,
  dequeueCircularQueue,
  enqueueCircularQueue,
  findStudentInBST,
  getBSTHeight,
  getOrderedCircularQueueItems,
  inorderStudentsBST,
  insertStudentIntoBST,
  MAX_EVENTS,
  MAX_RESULTS,
  MAX_ROUTINE,
  MAX_STUDENTS,
  MAX_TASKS,
  popActivityStack,
  pushActivityStack,
  updateStudentInBST,
} from '../utils/dataStructures';

const STORAGE_KEY = 'unitrack_workspace_v1';
const THEME_KEY = 'unitrack_theme';
const PROFILE_KEY = 'unitrack_profile_v1';

function loadInitialProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: parsed.name?.trim() || DEFAULT_PROFILE.name,
      email: parsed.email?.trim() || DEFAULT_PROFILE.email,
      studentIdLabel: parsed.studentIdLabel?.trim() || DEFAULT_PROFILE.studentIdLabel,
      semesterLabel: parsed.semesterLabel?.trim() || DEFAULT_PROFILE.semesterLabel,
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean'
          ? parsed.notificationsEnabled
          : DEFAULT_PROFILE.notificationsEnabled,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function loadInitialState(): UniTrackPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSampleState();
    const parsed = JSON.parse(raw) as UniTrackPersistedState;
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.registrationQueue &&
      Array.isArray(parsed.schedules) &&
      Array.isArray(parsed.tasks) &&
      Array.isArray(parsed.events) &&
      Array.isArray(parsed.results) &&
      Array.isArray(parsed.activityStack)
    ) {
      return parsed;
    }
  } catch {
    // Fallback cleanly if localStorage is corrupted
  }
  return createSampleState();
}

export function useUniTrackStore() {
  const [state, setState] = useState<UniTrackPersistedState>(loadInitialState);
  const [profile, setProfile] = useState<UserProfile>(loadInitialProfile);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastProcessedReg, setLastProcessedReg] =
    useState<ProcessedRegistrationResult | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    const rootEl = document.documentElement;
    if (theme === 'dark') {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
  }, [profile]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const makeActivity = (
    description: string,
    category: ActivityCategory
  ): ActivityEntry => ({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description,
    timestamp: nowTimeLabel(),
    category,
  });

  // Derived data
  const studentsList = useMemo(
    () => inorderStudentsBST(state.studentRoot),
    [state.studentRoot]
  );
  const studentCount = useMemo(
    () => countStudentsBST(state.studentRoot),
    [state.studentRoot]
  );
  const bstHeight = useMemo(
    () => getBSTHeight(state.studentRoot),
    [state.studentRoot]
  );
  const pendingRegistrations = useMemo(
    () => getOrderedCircularQueueItems(state.registrationQueue),
    [state.registrationQueue]
  );

  // ==================== Student BST Actions ====================

  const addStudent = useCallback(
    (record: StudentRecord): { ok: boolean; error?: string; path?: number[] } => {
      if (!Number.isInteger(record.id) || record.id <= 0) {
        const msg = 'Student ID must be a positive integer.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (!record.name.trim() || !record.department.trim() || !record.phone.trim()) {
        const msg = 'All student fields are required.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (countStudentsBST(state.studentRoot) >= MAX_STUDENTS) {
        const msg = `Maximum student limit (${MAX_STUDENTS}) reached.`;
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      const existing = findStudentInBST(state.studentRoot, record.id);
      if (existing.student) {
        const msg = `Student ID ${record.id} already exists in the BST.`;
        addToast('error', msg);
        return { ok: false, error: msg };
      }

      const cleanRecord: StudentRecord = {
        id: record.id,
        name: record.name.trim(),
        department: record.department.trim(),
        phone: record.phone.trim(),
      };
      const inserted = insertStudentIntoBST(state.studentRoot, cleanRecord);

      setState((prev) => ({
        ...prev,
        studentRoot: inserted.root,
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Added student: ${cleanRecord.name}`, 'student')
        ),
      }));
      addToast('success', `Added ${cleanRecord.name} (ID ${cleanRecord.id}) to BST.`);
      return { ok: true, path: inserted.path };
    },
    [state.studentRoot, addToast]
  );

  const searchStudentById = useCallback(
    (id: number) => {
      return findStudentInBST(state.studentRoot, id);
    },
    [state.studentRoot]
  );

  const updateStudent = useCallback(
    (id: number, updates: Omit<StudentRecord, 'id'>): { ok: boolean; error?: string } => {
      if (!updates.name.trim() || !updates.department.trim() || !updates.phone.trim()) {
        const msg = 'Name, department, and phone cannot be empty.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      const res = updateStudentInBST(state.studentRoot, id, {
        name: updates.name.trim(),
        department: updates.department.trim(),
        phone: updates.phone.trim(),
      });
      if (!res.updated) {
        const msg = `Student ID ${id} not found.`;
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      setState((prev) => ({
        ...prev,
        studentRoot: res.root,
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Updated student ID ${id}`, 'student')
        ),
      }));
      addToast('success', `Updated student ID ${id}.`);
      return { ok: true };
    },
    [state.studentRoot, addToast]
  );

  const deleteStudent = useCallback(
    (id: number): { ok: boolean } => {
      const res = deleteStudentFromBST(state.studentRoot, id);
      if (!res.deleted) {
        addToast('error', `Student ID ${id} not found.`);
        return { ok: false };
      }
      setState((prev) => ({
        ...prev,
        studentRoot: res.root,
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Deleted student ID ${id}`, 'student')
        ),
      }));
      addToast('info', `Removed student ID ${id} from BST.`);
      return { ok: true };
    },
    [state.studentRoot, addToast]
  );

  // ==================== Circular Queue Actions ====================

  const enqueueRegistration = useCallback(
    (studentID: number, courseCode: string): { ok: boolean; error?: string } => {
      const found = findStudentInBST(state.studentRoot, studentID);
      if (!found.student) {
        const msg = 'Student record not found in BST. Add the student first.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (!isValidCourseCode(courseCode)) {
        const msg = 'Invalid course code. Select a course from the university catalog.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }

      const res = enqueueCircularQueue(state.registrationQueue, {
        studentID,
        courseCode,
        queuedAt: nowTimeLabel(),
      });
      if (res.error) {
        addToast('error', res.error);
        return { ok: false, error: res.error };
      }

      setState((prev) => ({
        ...prev,
        registrationQueue: res.queue,
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Queued registration for student ${studentID}`, 'registration')
        ),
      }));
      addToast('success', `Queued ${courseCode} for student ${studentID}.`);
      return { ok: true };
    },
    [state.studentRoot, state.registrationQueue, addToast]
  );

  const processNextRegistration = useCallback((): ProcessedRegistrationResult | null => {
    const res = dequeueCircularQueue(state.registrationQueue);
    if (res.error || !res.item) {
      addToast('error', res.error ?? 'Registration queue is empty (underflow).');
      return null;
    }

    const found = findStudentInBST(state.studentRoot, res.item.studentID);
    const outcome: ProcessedRegistrationResult = {
      studentID: res.item.studentID,
      studentName: found.student ? found.student.name : null,
      courseCode: res.item.courseCode,
      processedAt: nowTimeLabel(),
    };

    setLastProcessedReg(outcome);
    setState((prev) => ({
      ...prev,
      registrationQueue: res.queue,
      activityStack: pushActivityStack(
        prev.activityStack,
        makeActivity(
          `Processed registration for student ${res.item!.studentID}`,
          'registration'
        )
      ),
    }));
    addToast(
      'success',
      `Processed FIFO request: ${outcome.courseCode} for ${outcome.studentName ?? `ID ${outcome.studentID}`}.`
    );
    return outcome;
  }, [state.registrationQueue, state.studentRoot, addToast]);

  // ==================== Routine & Exam Schedule Actions ====================

  const addSchedule = useCallback(
    (payload: {
      type: ScheduleType;
      courseCode: string;
      title: string;
      day: string;
      time: string;
      room: string;
      teacher: string;
    }): { ok: boolean; error?: string } => {
      if (state.schedules.length >= MAX_ROUTINE) {
        const msg = 'Schedule storage is full.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (payload.type === 'Class' && !isValidCourseCode(payload.courseCode)) {
        const msg = 'Unknown course code. Select a valid university course.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (
        !payload.courseCode.trim() ||
        !payload.title.trim() ||
        !payload.day.trim() ||
        !payload.time.trim() ||
        !payload.room.trim() ||
        !payload.teacher.trim()
      ) {
        const msg = 'All schedule fields are required.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }

      const nextId =
        state.schedules.length > 0
          ? Math.max(...state.schedules.map((s) => s.id)) + 1
          : 1;

      setState((prev) => ({
        ...prev,
        schedules: [
          ...prev.schedules,
          {
            id: nextId,
            type: payload.type,
            courseCode: payload.courseCode.trim(),
            title: payload.title.trim(),
            day: payload.day.trim(),
            time: payload.time.trim(),
            room: payload.room.trim(),
            teacher: payload.teacher.trim(),
            status: 'Scheduled',
          },
        ],
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(
            `Added ${payload.type} schedule for ${payload.courseCode.trim()}`,
            'schedule'
          )
        ),
      }));
      addToast('success', `${payload.type} schedule added.`);
      return { ok: true };
    },
    [state.schedules, addToast]
  );

  const rescheduleEntry = useCallback(
    (id: number, updates: { day: string; time: string; room: string }): { ok: boolean } => {
      if (!updates.day.trim() || !updates.time.trim() || !updates.room.trim()) {
        addToast('error', 'New day/date, time, and room are required.');
        return { ok: false };
      }
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) =>
          s.id === id
            ? {
                ...s,
                day: updates.day.trim(),
                time: updates.time.trim(),
                room: updates.room.trim(),
                status: 'RESCHEDULED' as ScheduleStatus,
              }
            : s
        ),
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Rescheduled schedule ID ${id}`, 'schedule')
        ),
      }));
      addToast('success', `Schedule #${id} updated.`);
      return { ok: true };
    },
    [addToast]
  );

  const cancelScheduleEntry = useCallback(
    (id: number) => {
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) =>
          s.id === id ? { ...s, status: 'CANCELLED' as ScheduleStatus } : s
        ),
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Cancelled schedule ID ${id}`, 'schedule')
        ),
      }));
      addToast('info', `Schedule #${id} marked as CANCELLED.`);
    },
    [addToast]
  );

  const restoreScheduleEntry = useCallback(
    (id: number) => {
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) =>
          s.id === id ? { ...s, status: 'Scheduled' as ScheduleStatus } : s
        ),
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Restored schedule ID ${id}`, 'schedule')
        ),
      }));
      addToast('success', `Schedule #${id} restored.`);
    },
    [addToast]
  );

  // ==================== Assignment & Quiz Tracker Actions ====================

  const addTask = useCallback(
    (payload: {
      type: TaskType;
      title: string;
      courseCode: string;
      dueDate: string;
    }): { ok: boolean; error?: string } => {
      if (state.tasks.length >= MAX_TASKS) {
        const msg = 'Task storage is full.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (!isValidCourseCode(payload.courseCode)) {
        const msg = 'Invalid course code.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (!payload.title.trim() || !payload.dueDate.trim()) {
        const msg = 'Title and due date are required.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }

      const nextId =
        state.tasks.length > 0 ? Math.max(...state.tasks.map((t) => t.id)) + 1 : 1;

      setState((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: nextId,
            type: payload.type,
            title: payload.title.trim(),
            courseCode: payload.courseCode,
            dueDate: payload.dueDate.trim(),
            status: 'Pending',
          },
        ],
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Added ${payload.type}: ${payload.title.trim()}`, 'task')
        ),
      }));
      addToast('success', `${payload.type} saved.`);
      return { ok: true };
    },
    [state.tasks, addToast]
  );

  const toggleTaskStatus = useCallback(
    (id: number) => {
      const target = state.tasks.find((t) => t.id === id);
      if (!target) return;
      const nextStatus = target.status === 'Pending' ? 'Completed' : 'Pending';
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, status: nextStatus } : t
        ),
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(
            `${nextStatus === 'Completed' ? 'Completed' : 'Reopened'} ${target.type} ID ${id}`,
            'task'
          )
        ),
      }));
      addToast(
        'success',
        `${target.type} #${id} marked as ${nextStatus}.`
      );
    },
    [state.tasks, addToast]
  );

  const deleteTask = useCallback(
    (id: number) => {
      const target = state.tasks.find((t) => t.id === id);
      if (!target) {
        addToast('error', `Task #${id} not found.`);
        return;
      }
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Deleted ${target.type} ID ${id}: ${target.title}`, 'task')
        ),
      }));
      addToast('info', `Deleted ${target.type} #${id}.`);
    },
    [state.tasks, addToast]
  );

  // ==================== Academic Calendar Actions ====================

  const addEvent = useCallback(
    (payload: { title: string; date: string; description: string }): { ok: boolean } => {
      if (state.events.length >= MAX_EVENTS) {
        addToast('error', 'Calendar storage is full.');
        return { ok: false };
      }
      if (!payload.title.trim() || !payload.date.trim() || !payload.description.trim()) {
        addToast('error', 'Title, date, and description are required.');
        return { ok: false };
      }
      const nextId =
        state.events.length > 0 ? Math.max(...state.events.map((e) => e.id)) + 1 : 1;

      setState((prev) => ({
        ...prev,
        events: [
          ...prev.events,
          {
            id: nextId,
            title: payload.title.trim(),
            date: payload.date.trim(),
            description: payload.description.trim(),
          },
        ],
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Added calendar event: ${payload.title.trim()}`, 'calendar')
        ),
      }));
      addToast('success', 'Academic calendar event added.');
      return { ok: true };
    },
    [state.events, addToast]
  );

  // ==================== Result & Performance Actions ====================

  const addResult = useCallback(
    (payload: {
      studentID: number;
      courseCode: string;
      marks: number;
    }): { ok: boolean; error?: string } => {
      if (state.results.length >= MAX_RESULTS) {
        const msg = 'Result storage is full.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      const found = findStudentInBST(state.studentRoot, payload.studentID);
      if (!found.student) {
        const msg = 'Student not found in BST. Register the student first.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (!isValidCourseCode(payload.courseCode)) {
        const msg = 'Invalid course code.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }
      if (Number.isNaN(payload.marks) || payload.marks < 0 || payload.marks > 100) {
        const msg = 'Marks must be between 0 and 100.';
        addToast('error', msg);
        return { ok: false, error: msg };
      }

      const grade = gradeFromMarks(payload.marks);
      const nextId =
        state.results.length > 0
          ? Math.max(...state.results.map((r) => r.id)) + 1
          : 1;

      setState((prev) => ({
        ...prev,
        results: [
          ...prev.results,
          {
            id: nextId,
            studentID: payload.studentID,
            courseCode: payload.courseCode,
            marks: Number(payload.marks.toFixed(2)),
            grade,
          },
        ],
        activityStack: pushActivityStack(
          prev.activityStack,
          makeActivity(`Added result for student ${payload.studentID}`, 'result')
        ),
      }));
      addToast('success', `Result saved for ID ${payload.studentID} (Grade: ${grade}).`);
      return { ok: true };
    },
    [state.results, state.studentRoot, addToast]
  );

  // ==================== Activity Stack Actions ====================

  const popLatestActivity = useCallback(() => {
    const res = popActivityStack(state.activityStack);
    if (!res.popped) {
      addToast('error', 'Activity stack is empty (underflow).');
      return null;
    }
    setState((prev) => ({
      ...prev,
      activityStack: res.stack,
    }));
    addToast('info', `Removed latest activity: "${res.popped.description}"`);
    return res.popped;
  }, [state.activityStack, addToast]);

  // ==================== Backup, Export, Import, Reset ====================

  const exportWorkspaceJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unitrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Workspace JSON exported.');
  }, [state, addToast]);

  const importWorkspaceJson = useCallback(
    (jsonText: string): boolean => {
      try {
        const parsed = JSON.parse(jsonText) as UniTrackPersistedState;
        if (
          !parsed ||
          !parsed.registrationQueue ||
          !Array.isArray(parsed.schedules) ||
          !Array.isArray(parsed.tasks) ||
          !Array.isArray(parsed.events) ||
          !Array.isArray(parsed.results) ||
          !Array.isArray(parsed.activityStack)
        ) {
          addToast('error', 'Invalid UniTrack backup file structure.');
          return false;
        }
        setState(parsed);
        setLastProcessedReg(null);
        addToast('success', 'Workspace backup imported successfully.');
        return true;
      } catch {
        addToast('error', 'Could not parse JSON backup file.');
        return false;
      }
    },
    [addToast]
  );

  const resetToSampleData = useCallback(() => {
    setState(createSampleState());
    setLastProcessedReg(null);
    addToast('info', 'Workspace reset to preloaded sample data.');
  }, [addToast]);

  const clearUserRecords = useCallback(() => {
    setState(createCoreOnlyState());
    setLastProcessedReg(null);
    addToast('info', 'Cleared user records. University courses and routine preserved.');
  }, [addToast]);

  return {
    state,
    profile,
    updateProfile,
    theme,
    toggleTheme,
    toasts,
    dismissToast,
    studentsList,
    studentCount,
    bstHeight,
    pendingRegistrations,
    lastProcessedReg,
    addStudent,
    searchStudentById,
    updateStudent,
    deleteStudent,
    enqueueRegistration,
    processNextRegistration,
    addSchedule,
    rescheduleEntry,
    cancelScheduleEntry,
    restoreScheduleEntry,
    addTask,
    toggleTaskStatus,
    deleteTask,
    addEvent,
    addResult,
    popLatestActivity,
    exportWorkspaceJson,
    importWorkspaceJson,
    resetToSampleData,
    clearUserRecords,
  };
}
