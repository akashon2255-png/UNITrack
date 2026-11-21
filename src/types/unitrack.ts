export type SectionId =
  | 'dashboard'
  | 'students'
  | 'catalog'
  | 'registration'
  | 'routine'
  | 'tasks'
  | 'calendar'
  | 'results'
  | 'activity'
  | 'profile';

export interface UserProfile {
  name: string;
  email: string;
  studentIdLabel: string;
  semesterLabel: string;
  notificationsEnabled: boolean;
}

export interface Course {
  code: string;
  title: string;
}

export interface StudentRecord {
  id: number;
  name: string;
  department: string;
  phone: string;
}

export interface StudentBSTNode extends StudentRecord {
  left: StudentBSTNode | null;
  right: StudentBSTNode | null;
}

export interface RegistrationItem {
  studentID: number;
  courseCode: string;
  queuedAt: string;
}

export interface CircularQueueState {
  buffer: (RegistrationItem | null)[];
  front: number;
  rear: number;
  count: number;
  capacity: number;
}

export type ScheduleType = 'Class' | 'Exam';
export type ScheduleStatus = 'Scheduled' | 'RESCHEDULED' | 'CANCELLED';

export interface ScheduleEntry {
  id: number;
  day: string;
  time: string;
  courseCode: string;
  title: string;
  teacher: string;
  room: string;
  type: ScheduleType;
  status: ScheduleStatus;
  isPreloaded?: boolean;
}

export type TaskType = 'Assignment' | 'Quiz';
export type TaskStatus = 'Pending' | 'Completed';

export interface TaskItem {
  id: number;
  title: string;
  courseCode: string;
  dueDate: string;
  status: TaskStatus;
  type: TaskType;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  description: string;
}

export interface ResultRecord {
  id: number;
  studentID: number;
  courseCode: string;
  marks: number;
  grade: string;
}

export type ActivityCategory =
  | 'student'
  | 'registration'
  | 'schedule'
  | 'task'
  | 'calendar'
  | 'result'
  | 'system';

export interface ActivityEntry {
  id: string;
  description: string;
  timestamp: string;
  category: ActivityCategory;
}

export interface ProcessedRegistrationResult {
  studentID: number;
  studentName: string | null;
  courseCode: string;
  processedAt: string;
}

export interface UniTrackPersistedState {
  version: number;
  studentRoot: StudentBSTNode | null;
  registrationQueue: CircularQueueState;
  schedules: ScheduleEntry[];
  tasks: TaskItem[];
  events: CalendarEvent[];
  results: ResultRecord[];
  activityStack: ActivityEntry[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
