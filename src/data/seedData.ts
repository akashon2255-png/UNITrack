import {
  ActivityEntry,
  CalendarEvent,
  Course,
  ResultRecord,
  ScheduleEntry,
  StudentBSTNode,
  StudentRecord,
  TaskItem,
  UniTrackPersistedState,
} from '../types/unitrack';
import {
  createCircularQueue,
  enqueueCircularQueue,
  insertStudentIntoBST,
  MAX_QUEUE,
  pushActivityStack,
} from '../utils/dataStructures';

export const UNIVERSITY = 'VARANDRA UNIVERSITY';
export const PROGRAM = 'B.Sc. in CSE | 3rd Semester | Section B';
export const TEAM_LABEL = 'Team One Piece · CSE 2103 Data Structures Lab';

export const COURSES: Course[] = [
  { code: 'CSE 2101', title: 'Object Oriented Programming' },
  { code: 'CSE 2102', title: 'Object Oriented Programming Lab' },
  { code: 'CSE 2103', title: 'Data Structures' },
  { code: 'CSE 2104', title: 'Data Structures Lab' },
  { code: 'CSE 2105', title: 'Digital System Design' },
  { code: 'CSE 2106', title: 'Digital System Design Lab' },
  { code: 'MAT 2141', title: 'Differential Equations' },
  { code: 'ECO 2171', title: 'Engineering Economics' },
];

export const SLOT_TIMES: string[] = [
  '09:00-10:15 AM',
  '10:15-11:30 AM',
  '11:30 AM-12:45 PM',
  '01:15-02:30 PM',
  '02:30-03:45 PM',
  '03:45-05:00 PM',
];

export const WEEK_DAYS: string[] = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
];

export function isValidCourseCode(code: string): boolean {
  return COURSES.some((c) => c.code === code);
}

export function getCourseTitle(code: string): string {
  return COURSES.find((c) => c.code === code)?.title ?? code;
}

export function gradeFromMarks(marks: number): string {
  if (marks >= 80) return 'A+';
  if (marks >= 75) return 'A';
  if (marks >= 70) return 'A-';
  if (marks >= 65) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 55) return 'B-';
  if (marks >= 50) return 'C+';
  if (marks >= 45) return 'C';
  if (marks >= 40) return 'D';
  return 'F';
}

export function gpaPointFromMarks(marks: number): number {
  if (marks >= 80) return 4.0;
  if (marks >= 75) return 3.75;
  if (marks >= 70) return 3.5;
  if (marks >= 65) return 3.25;
  if (marks >= 60) return 3.0;
  if (marks >= 55) return 2.75;
  if (marks >= 50) return 2.5;
  if (marks >= 45) return 2.25;
  if (marks >= 40) return 2.0;
  return 0.0;
}

export const DEFAULT_PROFILE = {
  name: 'Tariqul Islam',
  email: 'tariqul@unitrack.edu',
  studentIdLabel: '241311050',
  semesterLabel: '3rd Semester · Sec B',
  notificationsEnabled: true,
};

export const GRADE_SCALE = [
  { min: '80 – 100', grade: 'A+', status: 'Pass' },
  { min: '75 – 79.9', grade: 'A', status: 'Pass' },
  { min: '70 – 74.9', grade: 'A-', status: 'Pass' },
  { min: '65 – 69.9', grade: 'B+', status: 'Pass' },
  { min: '60 – 64.9', grade: 'B', status: 'Pass' },
  { min: '55 – 59.9', grade: 'B-', status: 'Pass' },
  { min: '50 – 54.9', grade: 'C+', status: 'Pass' },
  { min: '45 – 49.9', grade: 'C', status: 'Pass' },
  { min: '40 – 44.9', grade: 'D', status: 'Pass' },
  { min: '0 – 39.9', grade: 'F', status: 'Fail' },
];

export function createPreloadedRoutine(): ScheduleEntry[] {
  const entries: Array<[string, number, string, string, string, string]> = [
    ['Sunday', 1, 'CSE 2103', 'Data Structures', 'Samira Tareque', '414'],
    ['Sunday', 2, 'CSE 2104', 'Data Structures Lab', 'S.M. Mahadi Hasan / Samira Tareque', '103 DMSL'],
    ['Sunday', 3, 'CSE 2104', 'Data Structures Lab', 'S.M. Mahadi Hasan / Samira Tareque', '103 DMSL'],

    ['Monday', 2, 'CSE 2102', 'Object Oriented Programming Lab', 'Ahmed Al Amin / Md. Fatin Islam', '104 CNL'],
    ['Monday', 3, 'CSE 2102', 'Object Oriented Programming Lab', 'Ahmed Al Amin / Md. Fatin Islam', '104 CNL'],
    ['Monday', 4, 'MAT 2141', 'Differential Equations', 'Anupama Barman Shetu', '514'],
    ['Monday', 5, 'CSE 2106', 'Digital System Design Lab', 'Salma Akter Lima / D. M. Asadujjaman', '127 EEL'],

    ['Tuesday', 3, 'ECO 2171', 'Engineering Economics', 'Md. Faisal Aziz', '514'],
    ['Tuesday', 4, 'CSE 2101', 'Object Oriented Programming', 'Ahmed Al Amin', '1009'],

    ['Wednesday', 2, 'ECO 2171', 'Engineering Economics', 'Md. Faisal Aziz', '802'],
    ['Wednesday', 4, 'MAT 2141', 'Differential Equations', 'Anupama Barman Shetu', '803'],
    ['Wednesday', 5, 'CSE 2105', 'Digital System Design', 'Salma Akter Lima', '512'],

    ['Thursday', 1, 'CSE 2103', 'Data Structures', 'Samira Tareque', '1008'],
    ['Thursday', 2, 'CSE 2101', 'Object Oriented Programming', 'Ahmed Al Amin', '414'],
    ['Thursday', 3, 'CSE 2105', 'Digital System Design', 'Salma Akter Lima', '413'],
  ];

  return entries.map(([day, slot, courseCode, title, teacher, room], idx) => ({
    id: idx + 1,
    day,
    time: SLOT_TIMES[slot - 1],
    courseCode,
    title,
    teacher,
    room,
    type: 'Class',
    status: 'Scheduled',
    isPreloaded: true,
  }));
}

export function createSampleState(): UniTrackPersistedState {
  // Ordered to form a rich, balanced BST for inspection
  const sampleStudents: StudentRecord[] = [
    { id: 241311050, name: 'Tariqul Islam', department: 'CSE', phone: '01712-441050' },
    { id: 241311024, name: 'Nusrat Jahan', department: 'CSE', phone: '01819-332024' },
    { id: 241311078, name: 'Rafiqul Hasan', department: 'CSE', phone: '01911-885078' },
    { id: 241311012, name: 'Mehedi Hasan', department: 'CSE', phone: '01675-210012' },
    { id: 241311036, name: 'Farhana Yasmin', department: 'CSE', phone: '01755-642036' },
    { id: 241311064, name: 'Sakib Al Mahmud', department: 'CSE', phone: '01534-918064' },
    { id: 241311092, name: 'Tasnim Tabassum', department: 'CSE', phone: '01798-503092' },
  ];

  let studentRoot: StudentBSTNode | null = null;
  for (const s of sampleStudents) {
    studentRoot = insertStudentIntoBST(studentRoot, s).root;
  }

  let registrationQueue = createCircularQueue(MAX_QUEUE);
  const sampleRegistrations = [
    { studentID: 241311024, courseCode: 'CSE 2103', queuedAt: '10:05 AM' },
    { studentID: 241311050, courseCode: 'CSE 2101', queuedAt: '10:18 AM' },
    { studentID: 241311064, courseCode: 'MAT 2141', queuedAt: '10:42 AM' },
  ];
  for (const reg of sampleRegistrations) {
    registrationQueue = enqueueCircularQueue(registrationQueue, reg).queue;
  }

  const baseRoutine = createPreloadedRoutine();
  const schedules: ScheduleEntry[] = [
    ...baseRoutine,
    {
      id: baseRoutine.length + 1,
      day: '28-Nov-2026',
      time: '10:00-11:30 AM',
      courseCode: 'CSE 2103',
      title: 'Data Structures Midterm Exam',
      teacher: 'Samira Tareque',
      room: '414',
      type: 'Exam',
      status: 'Scheduled',
    },
    {
      id: baseRoutine.length + 2,
      day: '01-Dec-2026',
      time: '02:00-03:30 PM',
      courseCode: 'CSE 2101',
      title: 'OOP Midterm Examination',
      teacher: 'Ahmed Al Amin',
      room: '1009',
      type: 'Exam',
      status: 'Scheduled',
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: 1,
      title: 'BST & Circular Queue Lab Report',
      courseCode: 'CSE 2104',
      dueDate: '25-Nov-2026',
      status: 'Pending',
      type: 'Assignment',
    },
    {
      id: 2,
      title: 'Inheritance & Polymorphism Problem Set',
      courseCode: 'CSE 2101',
      dueDate: '27-Nov-2026',
      status: 'Pending',
      type: 'Assignment',
    },
    {
      id: 3,
      title: 'Trees & Traversal Complexity Quiz',
      courseCode: 'CSE 2103',
      dueDate: '24-Nov-2026',
      status: 'Completed',
      type: 'Quiz',
    },
    {
      id: 4,
      title: 'Karnaugh Map & Combinational Logic Quiz',
      courseCode: 'CSE 2105',
      dueDate: '29-Nov-2026',
      status: 'Pending',
      type: 'Quiz',
    },
    {
      id: 5,
      title: 'Second-Order ODE Worksheet',
      courseCode: 'MAT 2141',
      dueDate: '22-Nov-2026',
      status: 'Completed',
      type: 'Assignment',
    },
  ];

  const events: CalendarEvent[] = [
    {
      id: 1,
      title: 'CSE 2103 Lab Project Viva',
      date: '26-Nov-2026',
      description: 'Team One Piece demonstration of UniTrack Data Structures project in 103 DMSL.',
    },
    {
      id: 2,
      title: 'Midterm Examination Week Begins',
      date: '28-Nov-2026',
      description: '3rd Semester Section B midterm schedule commences across CSE & MAT courses.',
    },
    {
      id: 3,
      title: 'Semester Registration Confirmation',
      date: '05-Dec-2026',
      description: 'Final review of queued course registrations with department advisor.',
    },
    {
      id: 4,
      title: 'Annual Tech Symposium',
      date: '14-Dec-2026',
      description: 'Department of CSE software showcase and coding contest at Varandra University.',
    },
  ];

  const results: ResultRecord[] = [
    { id: 1, studentID: 241311050, courseCode: 'CSE 2103', marks: 88, grade: gradeFromMarks(88) },
    { id: 2, studentID: 241311050, courseCode: 'CSE 2101', marks: 82, grade: gradeFromMarks(82) },
    { id: 3, studentID: 241311050, courseCode: 'MAT 2141', marks: 76, grade: gradeFromMarks(76) },
    { id: 4, studentID: 241311050, courseCode: 'ECO 2171', marks: 71, grade: gradeFromMarks(71) },
    { id: 5, studentID: 241311024, courseCode: 'CSE 2103', marks: 91, grade: gradeFromMarks(91) },
    { id: 6, studentID: 241311024, courseCode: 'CSE 2105', marks: 84, grade: gradeFromMarks(84) },
    { id: 7, studentID: 241311024, courseCode: 'CSE 2101', marks: 78, grade: gradeFromMarks(78) },
    { id: 8, studentID: 241311078, courseCode: 'CSE 2103', marks: 68, grade: gradeFromMarks(68) },
    { id: 9, studentID: 241311078, courseCode: 'MAT 2141', marks: 62, grade: gradeFromMarks(62) },
    { id: 10, studentID: 241311036, courseCode: 'CSE 2105', marks: 81, grade: gradeFromMarks(81) },
  ];

  let activityStack: ActivityEntry[] = [];
  const seedActivities: Array<{ description: string; timestamp: string; category: ActivityEntry['category'] }> = [
    { description: 'Loaded Varandra University CSE 3rd Semester routine', timestamp: '09:00 AM', category: 'system' },
    { description: 'Added student: Tariqul Islam', timestamp: '09:12 AM', category: 'student' },
    { description: 'Added student: Nusrat Jahan', timestamp: '09:18 AM', category: 'student' },
    { description: 'Queued registration for student 241311024', timestamp: '10:05 AM', category: 'registration' },
    { description: 'Queued registration for student 241311050', timestamp: '10:18 AM', category: 'registration' },
    { description: 'Added Exam schedule for CSE 2103', timestamp: '10:30 AM', category: 'schedule' },
    { description: 'Completed Quiz ID 3', timestamp: '11:05 AM', category: 'task' },
    { description: 'Added result for student 241311050', timestamp: '11:20 AM', category: 'result' },
  ];
  seedActivities.forEach((act, idx) => {
    activityStack = pushActivityStack(activityStack, {
      id: `seed-act-${idx + 1}`,
      ...act,
    });
  });

  return {
    version: 1,
    studentRoot,
    registrationQueue,
    schedules,
    tasks,
    events,
    results,
    activityStack,
  };
}

export function createCoreOnlyState(): UniTrackPersistedState {
  return {
    version: 1,
    studentRoot: null,
    registrationQueue: createCircularQueue(MAX_QUEUE),
    schedules: createPreloadedRoutine(),
    tasks: [],
    events: [],
    results: [],
    activityStack: [
      {
        id: 'init-routine',
        description: 'Loaded Varandra University CSE 3rd Semester routine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'system',
      },
    ],
  };
}
