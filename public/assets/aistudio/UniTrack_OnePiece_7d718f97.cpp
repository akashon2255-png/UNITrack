#include <iostream>
#include <iomanip>
#include <string>
#include <limits>
#include <sstream>
using namespace std;

/*
    UniTrack - Smart University Management System
    CSE 2103 Data Structures Lab Project

    Team: One Piece
    Project: UniTrack - University Academic Tracker

    Core structures are implemented manually:
      1. Binary Search Tree (BST) - student records
      2. Circular Queue - course registration requests
      3. Stack - recent activity history
      4. Arrays - fixed course catalog, routines, tasks, events and results

    No STL containers are used.

    COMPLEXITY SUMMARY (n = number of stored records):
      - Student BST: average insert/search/update/delete O(log n);
        worst case O(n) when the tree becomes skewed; traversal O(n).
      - Circular Queue: enqueue O(1), dequeue O(1), display O(n).
      - Activity Stack: push O(1) normally (O(n) only when full and
        old entries are shifted); display O(n), pop O(1).
      - Fixed arrays (routine/tasks/events/results): append O(1),
        sequential search O(n), display/traversal O(n), update O(1)
        after locating an index.
      - Course catalog lookup: O(n), where n is the fixed catalog size.

    Space complexity: O(n) for each stored collection; BST uses O(n)
    nodes and recursive traversal/deletion uses O(h) call-stack space,
    where h is the tree height.
*/

const int MAX_STUDENTS = 200;
const int MAX_QUEUE = 100;
const int MAX_ACTIVITY = 100;
const int MAX_ROUTINE = 200;
const int MAX_TASKS = 100;
const int MAX_EVENTS = 100;
const int MAX_RESULTS = 300;
const int MAX_COURSES = 8;

const string UNIVERSITY = "VARANDRA UNIVERSITY";
const string PROGRAM = "B.Sc. in CSE | 3rd Semester | Section B";

struct Course {
    string code, title;
};

// University-provided course list: students do not create courses or enter credits.
Course courses[MAX_COURSES] = {
    {"CSE 2101", "Object Oriented Programming"},
    {"CSE 2102", "Object Oriented Programming Lab"},
    {"CSE 2103", "Data Structures"},
    {"CSE 2104", "Data Structures Lab"},
    {"CSE 2105", "Digital System Design"},
    {"CSE 2106", "Digital System Design Lab"},
    {"MAT 2141", "Differential Equations"},
    {"ECO 2171", "Engineering Economics"}
};

// -------------------- Common input and display helpers --------------------

void line(char ch = '=', int width = 76) {
    for (int i = 0; i < width; ++i) cout << ch;
    cout << '\n';
}

void header(const string& title) {
    cout << "\n";
    line('=');
    cout << "                         " << title << '\n';
    line('=');
}

void pauseScreen() {
    cout << "\nPress ENTER to continue...";
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cin.get();
}

int readInt(const string& prompt) {
    int value;
    while (true) {
        cout << prompt;
        if (cin >> value) {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            return value;
        }
        cout << "Invalid input. Please enter a number.\n";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

string readText(const string& prompt) {
    string value;
    cout << prompt;
    getline(cin, value);
    while (value.empty()) {
        cout << "This field cannot be empty. Try again: ";
        getline(cin, value);
    }
    return value;
}

bool validCourseCode(const string& code) {
    for (int i = 0; i < MAX_COURSES; ++i)
        if (courses[i].code == code) return true;
    return false;
}

void showCourseCatalog() {
    header("UNIVERSITY COURSE CATALOG");
    cout << left << setw(15) << "COURSE CODE" << "COURSE TITLE\n";
    line('-');
    for (int i = 0; i < MAX_COURSES; ++i)
        cout << left << setw(15) << courses[i].code << courses[i].title << '\n';
    line('-');
    cout << "Note: Course names are preloaded from the university semester routine.\n";
}

// -------------------- Activity Stack --------------------

struct Activity {
    string description;
};

Activity activityStack[MAX_ACTIVITY];
int activityTop = -1;

void pushActivity(const string& description) {
    if (activityTop == MAX_ACTIVITY - 1) {
        // Keep the newest activities by shifting older entries left.
        for (int i = 1; i < MAX_ACTIVITY; ++i)
            activityStack[i - 1] = activityStack[i];
        --activityTop;
    }
    activityStack[++activityTop].description = description;
}

void showActivities() {
    header("RECENT ACTIVITY HISTORY - STACK");
    if (activityTop == -1) {
        cout << "No activity has been recorded yet.\n";
        return;
    }
    cout << "TOP (newest activity first)\n";
    line('-');
    for (int i = activityTop; i >= 0; --i)
        cout << setw(3) << (i + 1) << " | " << activityStack[i].description << '\n';
    line('-');
}

void undoLastActivityView() {
    header("LATEST ACTIVITY");
    if (activityTop == -1) {
        cout << "Activity stack is empty (underflow).\n";
        return;
    }
    cout << "Latest: " << activityStack[activityTop].description << '\n';
    cout << "Remove this history entry? (1 = Yes, 0 = No): ";
    int choice;
    if (!(cin >> choice)) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    if (choice == 1) {
        cout << "Removed: " << activityStack[activityTop].description << '\n';
        --activityTop;
    }
}

// -------------------- Student BST --------------------

struct Student {
    int id;
    string name, department, phone;
    Student* left;
    Student* right;
};

Student* studentRoot = NULL;

Student* findStudent(Student* root, int id) {
    if (root == NULL || root->id == id) return root;
    if (id < root->id) return findStudent(root->left, id);
    return findStudent(root->right, id);
}

Student* insertStudentNode(Student* root, Student* node) {
    if (root == NULL) return node;
    if (node->id < root->id) root->left = insertStudentNode(root->left, node);
    else if (node->id > root->id) root->right = insertStudentNode(root->right, node);
    return root;
}

Student* minimumStudent(Student* root) {
    while (root && root->left) root = root->left;
    return root;
}

Student* deleteStudentNode(Student* root, int id, bool& deleted) {
    if (root == NULL) return NULL;

    if (id < root->id) root->left = deleteStudentNode(root->left, id, deleted);
    else if (id > root->id) root->right = deleteStudentNode(root->right, id, deleted);
    else {
        deleted = true;
        if (root->left == NULL) {
            Student* rightChild = root->right;
            delete root;
            return rightChild;
        }
        if (root->right == NULL) {
            Student* leftChild = root->left;
            delete root;
            return leftChild;
        }
        Student* successor = minimumStudent(root->right);
        root->id = successor->id;
        root->name = successor->name;
        root->department = successor->department;
        root->phone = successor->phone;
        bool ignored = false;
        root->right = deleteStudentNode(root->right, successor->id, ignored);
    }
    return root;
}

void addStudent() {
    header("ADD STUDENT");
    int id = readInt("Student ID: ");
    if (id <= 0) {
        cout << "Student ID must be positive.\n";
        return;
    }
    if (findStudent(studentRoot, id)) {
        cout << "This student ID already exists.\n";
        return;
    }

    Student* node = new Student;
    node->id = id;
    node->name = readText("Full name: ");
    node->department = readText("Department (e.g. CSE): ");
    node->phone = readText("Phone number: ");
    node->left = node->right = NULL;
    studentRoot = insertStudentNode(studentRoot, node);

    pushActivity("Added student: " + node->name);
    cout << "\nStudent added successfully to the BST.\n";
}

void searchStudent() {
    header("SEARCH STUDENT");
    int id = readInt("Enter student ID: ");
    Student* s = findStudent(studentRoot, id);
    if (!s) {
        cout << "Student not found.\n";
        return;
    }
    line('-');
    cout << "ID         : " << s->id << '\n'
         << "Name       : " << s->name << '\n'
         << "Department : " << s->department << '\n'
         << "Phone      : " << s->phone << '\n';
    line('-');
}

void updateStudent() {
    header("UPDATE STUDENT");
    int id = readInt("Enter student ID: ");
    Student* s = findStudent(studentRoot, id);
    if (!s) {
        cout << "Student not found.\n";
        return;
    }
    cout << "Current name: " << s->name << '\n';
    s->name = readText("New full name: ");
    s->department = readText("New department: ");
    s->phone = readText("New phone number: ");
    pushActivity("Updated student ID " + to_string(id));
    cout << "Student information updated.\n";
}

void displayStudentsInOrder(Student* root) {
    if (!root) return;
    displayStudentsInOrder(root->left);
    cout << left << setw(12) << root->id
         << setw(28) << root->name
         << setw(12) << root->department
         << root->phone << '\n';
    displayStudentsInOrder(root->right);
}

void displayStudents() {
    header("STUDENT DIRECTORY - BST INORDER TRAVERSAL");
    if (!studentRoot) {
        cout << "Student database is empty.\n";
        return;
    }
    cout << left << setw(12) << "ID" << setw(28) << "NAME"
         << setw(12) << "DEPARTMENT" << "PHONE\n";
    line('-');
    displayStudentsInOrder(studentRoot);
    line('-');
}

void deleteStudent() {
    header("DELETE STUDENT");
    int id = readInt("Enter student ID to delete: ");
    bool deleted = false;
    studentRoot = deleteStudentNode(studentRoot, id, deleted);
    if (!deleted) {
        cout << "Student not found. No record was deleted.\n";
        return;
    }
    pushActivity("Deleted student ID " + to_string(id));
    cout << "Student record deleted successfully.\n";
}

void studentMenu() {
    int choice;
    do {
        header("STUDENT MANAGEMENT");
        cout << " [1] Add student\n"
             << " [2] Search student\n"
             << " [3] Update student\n"
             << " [4] Delete student\n"
             << " [5] Display all students\n"
             << " [0] Back to main menu\n";
        line('-');
        choice = readInt("Choose an option: ");
        switch (choice) {
            case 1: addStudent(); break;
            case 2: searchStudent(); break;
            case 3: updateStudent(); break;
            case 4: deleteStudent(); break;
            case 5: displayStudents(); break;
            case 0: break;
            default: cout << "Invalid option.\n";
        }
        if (choice != 0) pauseScreen();
    } while (choice != 0);
}

// -------------------- Circular Queue: Registration --------------------

struct Registration {
    int studentID;
    string courseCode;
};

Registration registrationQueue[MAX_QUEUE];
int queueFront = 0, queueRear = -1, queueCount = 0;

void enqueueRegistration() {
    header("NEW COURSE REGISTRATION REQUEST");
    if (queueCount == MAX_QUEUE) {
        cout << "Registration queue is full (overflow).\n";
        return;
    }

    int studentID = readInt("Student ID: ");
    if (!findStudent(studentRoot, studentID)) {
        cout << "Student record not found. Add the student first.\n";
        return;
    }

    showCourseCatalog();
    string code = readText("University course code: ");
    if (!validCourseCode(code)) {
        cout << "Invalid course code. Select a code from the catalog.\n";
        return;
    }

    queueRear = (queueRear + 1) % MAX_QUEUE;
    registrationQueue[queueRear].studentID = studentID;
    registrationQueue[queueRear].courseCode = code;
    ++queueCount;

    pushActivity("Queued registration for student " + to_string(studentID));
    cout << "Registration request added to the queue.\n";
}

void processRegistration() {
    header("PROCESS REGISTRATION");
    if (queueCount == 0) {
        cout << "Registration queue is empty (underflow).\n";
        return;
    }

    Registration current = registrationQueue[queueFront];
    queueFront = (queueFront + 1) % MAX_QUEUE;
    --queueCount;

    Student* s = findStudent(studentRoot, current.studentID);
    cout << "Request processed (FIFO).\n";
    cout << "Student : " << (s ? s->name : "Record no longer available") << '\n';
    cout << "ID      : " << current.studentID << '\n';
    cout << "Course  : " << current.courseCode << '\n';
    pushActivity("Processed registration for student " + to_string(current.studentID));
}

void displayRegistrationQueue() {
    header("PENDING REGISTRATION QUEUE");
    if (queueCount == 0) {
        cout << "No pending requests.\n";
        return;
    }
    cout << "FRONT ->\n";
    for (int i = 0; i < queueCount; ++i) {
        int pos = (queueFront + i) % MAX_QUEUE;
        cout << " +------------------------------------------------------+\n";
        cout << " | Student ID: " << left << setw(10) << registrationQueue[pos].studentID
             << " Course: " << setw(12) << registrationQueue[pos].courseCode << "|\n";
        cout << " +------------------------------------------------------+\n";
    }
    cout << " <- REAR\n";
}

void registrationMenu() {
    int choice;
    do {
        header("COURSE REGISTRATION - CIRCULAR QUEUE");
        cout << " [1] Submit registration request (Enqueue)\n"
             << " [2] Process next request (Dequeue)\n"
             << " [3] View pending requests\n"
             << " [0] Back to main menu\n";
        line('-');
        choice = readInt("Choose an option: ");
        switch (choice) {
            case 1: enqueueRegistration(); break;
            case 2: processRegistration(); break;
            case 3: displayRegistrationQueue(); break;
            case 0: break;
            default: cout << "Invalid option.\n";
        }
        if (choice != 0) pauseScreen();
    } while (choice != 0);
}

// -------------------- Routine and Exam Schedule --------------------

struct Schedule {
    int id;
    string day, time, courseCode, title, teacher, room, type, status;
};

Schedule schedules[MAX_ROUTINE];
int scheduleCount = 0;

const string slotTimes[6] = {
    "09:00-10:15 AM", "10:15-11:30 AM", "11:30 AM-12:45 PM",
    "01:15-02:30 PM", "02:30-03:45 PM", "03:45-05:00 PM"
};

void addRoutineEntry(const string& day, int slot, const string& code,
                     const string& title, const string& teacher, const string& room) {
    if (scheduleCount >= MAX_ROUTINE) return;
    Schedule s;
    s.id = scheduleCount + 1;
    s.day = day;
    s.time = slotTimes[slot - 1];
    s.courseCode = code;
    s.title = title;
    s.teacher = teacher;
    s.room = room;
    s.type = "Class";
    s.status = "Scheduled";
    schedules[scheduleCount++] = s;
}

void loadUniversityRoutine() {
    if (scheduleCount != 0) return;

    // Preloaded reference routine supplied with the project source.
    addRoutineEntry("Sunday", 1, "CSE 2103", "Data Structures", "Samira Tareque", "414");
    addRoutineEntry("Sunday", 2, "CSE 2104", "Data Structures Lab", "S.M. Mahadi Hasan / Samira Tareque", "103 DMSL");
    addRoutineEntry("Sunday", 3, "CSE 2104", "Data Structures Lab", "S.M. Mahadi Hasan / Samira Tareque", "103 DMSL");

    addRoutineEntry("Monday", 2, "CSE 2102", "Object Oriented Programming Lab", "Ahmed Al Amin / Md. Fatin Islam", "104 CNL");
    addRoutineEntry("Monday", 3, "CSE 2102", "Object Oriented Programming Lab", "Ahmed Al Amin / Md. Fatin Islam", "104 CNL");
    addRoutineEntry("Monday", 4, "MAT 2141", "Differential Equations", "Anupama Barman Shetu", "514");
    addRoutineEntry("Monday", 5, "CSE 2106", "Digital System Design Lab", "Salma Akter Lima / D. M. Asadujjaman", "127 EEL");

    addRoutineEntry("Tuesday", 3, "ECO 2171", "Engineering Economics", "Md. Faisal Aziz", "514");
    addRoutineEntry("Tuesday", 4, "CSE 2101", "Object Oriented Programming", "Ahmed Al Amin", "1009");

    addRoutineEntry("Wednesday", 2, "ECO 2171", "Engineering Economics", "Md. Faisal Aziz", "802");
    addRoutineEntry("Wednesday", 4, "MAT 2141", "Differential Equations", "Anupama Barman Shetu", "803");
    addRoutineEntry("Wednesday", 5, "CSE 2105", "Digital System Design", "Salma Akter Lima", "512");

    addRoutineEntry("Thursday", 1, "CSE 2103", "Data Structures", "Samira Tareque", "1008");
    addRoutineEntry("Thursday", 2, "CSE 2101", "Object Oriented Programming", "Ahmed Al Amin", "414");
    addRoutineEntry("Thursday", 3, "CSE 2105", "Digital System Design", "Salma Akter Lima", "413");
}

void printRoutineBox(const Schedule& s) {
    cout << "  +--------------------------------------------------------------------------+\n";
    cout << "  | " << left << setw(72) << (s.time + "  |  " + s.courseCode + " - " + s.title) << "|\n";
    cout << "  | " << left << setw(72) << ("Teacher: " + s.teacher) << "|\n";
    cout << "  | " << left << setw(72) << ("Room: " + s.room + "  |  Status: " + s.status) << "|\n";
    cout << "  +--------------------------------------------------------------------------+\n";
}

void viewWeeklyRoutine() {
    const string days[6] = {"Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"};
    header("WEEKLY CLASS ROUTINE");
    cout << UNIVERSITY << '\n' << PROGRAM << '\n';
    cout << "Semester routine | Preloaded university schedule\n";

    for (int d = 0; d < 6; ++d) {
        cout << "\n";
        line('=', 78);
        cout << "  " << days[d] << '\n';
        line('=', 78);
        bool found = false;

        for (int slot = 1; slot <= 6; ++slot) {
            for (int i = 0; i < scheduleCount; ++i) {
                if (schedules[i].type == "Class" &&
                    schedules[i].day == days[d] &&
                    schedules[i].time == slotTimes[slot - 1]) {
                    printRoutineBox(schedules[i]);
                    found = true;
                }
            }
        }
        if (!found) cout << "  | No scheduled class for this day.                                      |\n";
    }
    line('=');
}

void addCustomSchedule(const string& type) {
    header("ADD " + string(type) + " SCHEDULE");
    if (scheduleCount >= MAX_ROUTINE) {
        cout << "Schedule storage is full.\n";
        return;
    }

    Schedule s;
    s.id = scheduleCount + 1;
    s.type = type;
    if (type == "Class") {
        showCourseCatalog();
        s.courseCode = readText("Course code: ");
        if (!validCourseCode(s.courseCode)) {
            cout << "Unknown course code. Schedule not added.\n";
            return;
        }
    } else {
        s.courseCode = readText("Exam course code/name: ");
    }
    s.title = readText("Course title / exam name: ");
    s.day = readText("Day or exam date: ");
    s.time = readText("Time: ");
    s.room = readText("Room: ");
    s.teacher = readText("Teacher / supervisor: ");
    s.status = "Scheduled";
    schedules[scheduleCount++] = s;
    pushActivity("Added " + type + " schedule for " + s.courseCode);
    cout << type << " schedule added.\n";
}

void viewSchedules(const string& type) {
    header(type == "Exam" ? "EXAM ROUTINE" : "CUSTOM CLASS SCHEDULE");
    bool found = false;
    for (int i = 0; i < scheduleCount; ++i) {
        if (schedules[i].type == type) {
            found = true;
            cout << "  +--------------------------------------------------------------------------+\n";
            cout << "  | " << left << setw(72) << ("Schedule ID: " + to_string(schedules[i].id) +
                 " | " + schedules[i].day + " | " + schedules[i].time) << "|\n";
            cout << "  | " << left << setw(72) << (schedules[i].courseCode + " - " + schedules[i].title) << "|\n";
            cout << "  | " << left << setw(72) << ("Room: " + schedules[i].room + " | " + schedules[i].teacher) << "|\n";
            cout << "  | " << left << setw(72) << ("Status: " + schedules[i].status) << "|\n";
            cout << "  +--------------------------------------------------------------------------+\n";
        }
    }
    if (!found) cout << "No " << type << " schedule has been added.\n";
}

void updateOrCancelSchedule(bool cancel) {
    header(cancel ? "CANCEL A SCHEDULE" : "RESCHEDULE A CLASS / EXAM");
    int id = readInt("Schedule ID: ");
    if (id < 1 || id > scheduleCount) {
        cout << "Schedule ID not found.\n";
        return;
    }
    Schedule& s = schedules[id - 1];
    if (cancel) {
        s.status = "CANCELLED";
        pushActivity("Cancelled schedule ID " + to_string(id));
        cout << "Cancellation status recorded.\n";
    } else {
        s.day = readText("New day/date: ");
        s.time = readText("New time: ");
        s.room = readText("New room: ");
        s.status = "RESCHEDULED";
        pushActivity("Rescheduled schedule ID " + to_string(id));
        cout << "Schedule updated successfully.\n";
    }
}

void routineMenu() {
    int choice;
    do {
        header("ROUTINE & EXAM SCHEDULE");
        cout << " [1] View weekly university class routine\n"
             << " [2] Add an extra class schedule\n"
             << " [3] View extra class schedules\n"
             << " [4] Add exam schedule\n"
             << " [5] View exam routine\n"
             << " [6] Reschedule an entry\n"
             << " [7] Cancel an entry\n"
             << " [0] Back to main menu\n";
        line('-');
        choice = readInt("Choose an option: ");
        switch (choice) {
            case 1: viewWeeklyRoutine(); break;
            case 2: addCustomSchedule("Class"); break;
            case 3: viewSchedules("Class"); break;
            case 4: addCustomSchedule("Exam"); break;
            case 5: viewSchedules("Exam"); break;
            case 6: updateOrCancelSchedule(false); break;
            case 7: updateOrCancelSchedule(true); break;
            case 0: break;
            default: cout << "Invalid option.\n";
        }
        if (choice != 0) pauseScreen();
    } while (choice != 0);
}

// -------------------- Assignment and Quiz Management --------------------

struct Task {
    int id;
    string title, courseCode, dueDate, status, type;
};

Task tasks[MAX_TASKS];
int taskCount = 0;

void addTask(const string& type) {
    header("ADD " + type);
    if (taskCount == MAX_TASKS) {
        cout << "Task storage is full.\n";
        return;
    }
    Task t;
    t.id = taskCount + 1;
    t.type = type;
    t.title = readText(type + " title: ");
    showCourseCatalog();
    t.courseCode = readText("Course code: ");
    if (!validCourseCode(t.courseCode)) {
        cout << "Invalid course code. Task not added.\n";
        return;
    }
    t.dueDate = readText("Due date (e.g. 25-Nov-2026): ");
    t.status = "Pending";
    tasks[taskCount++] = t;
    pushActivity("Added " + type + ": " + t.title);
    cout << type << " saved successfully.\n";
}

void viewTasks(const string& type) {
    header(type == "All" ? "ALL ASSIGNMENTS & QUIZZES" : type + " LIST");
    bool found = false;
    for (int i = 0; i < taskCount; ++i) {
        if (type == "All" || tasks[i].type == type) {
            found = true;
            cout << "  +--------------------------------------------------------------------------+\n";
            cout << "  | " << left << setw(72) << (tasks[i].type + " #" + to_string(tasks[i].id) +
                 "  |  " + tasks[i].title) << "|\n";
            cout << "  | " << left << setw(72) << ("Course: " + tasks[i].courseCode +
                 "  |  Due: " + tasks[i].dueDate) << "|\n";
            cout << "  | " << left << setw(72) << ("Status: " + tasks[i].status) << "|\n";
            cout << "  +--------------------------------------------------------------------------+\n";
        }
    }
    if (!found) cout << "No matching task found.\n";
}

void markTaskComplete(const string& type) {
    header("MARK " + type + " AS COMPLETED");
    int id = readInt("Task ID: ");
    if (id < 1 || id > taskCount || tasks[id - 1].type != type) {
        cout << "Matching task ID not found.\n";
        return;
    }
    tasks[id - 1].status = "Completed";
    pushActivity("Completed " + type + " ID " + to_string(id));
    cout << type << " marked as completed.\n";
}

void taskMenu() {
    int choice;
    do {
        header("ASSIGNMENT & QUIZ TRACKER");
        cout << " [1] Add assignment\n"
             << " [2] View assignments\n"
             << " [3] Mark assignment completed\n"
             << " [4] Add quiz\n"
             << " [5] View quizzes\n"
             << " [6] Mark quiz completed\n"
             << " [7] View all tasks\n"
             << " [0] Back to main menu\n";
        line('-');
        choice = readInt("Choose an option: ");
        switch (choice) {
            case 1: addTask("Assignment"); break;
            case 2: viewTasks("Assignment"); break;
            case 3: markTaskComplete("Assignment"); break;
            case 4: addTask("Quiz"); break;
            case 5: viewTasks("Quiz"); break;
            case 6: markTaskComplete("Quiz"); break;
            case 7: viewTasks("All"); break;
            case 0: break;
            default: cout << "Invalid option.\n";
        }
        if (choice != 0) pauseScreen();
    } while (choice != 0);
}

// -------------------- Academic Calendar --------------------

struct Event {
    int id;
    string title, date, description;
};

Event events[MAX_EVENTS];
int eventCount = 0;

void addEvent() {
    header("ADD ACADEMIC CALENDAR EVENT");
    if (eventCount == MAX_EVENTS) {
        cout << "Calendar storage is full.\n";
        return;
    }
    Event e;
    e.id = eventCount + 1;
    e.title = readText("Event title: ");
    e.date = readText("Date: ");
    e.description = readText("Short description: ");
    events[eventCount++] = e;
    pushActivity("Added calendar event: " + e.title);
    cout << "Event added successfully.\n";
}

void viewEvents() {
    header("ACADEMIC CALENDAR");
    if (eventCount == 0) {
        cout << "No academic events have been added.\n";
        return;
    }
    for (int i = 0; i < eventCount; ++i) {
        cout << "  +--------------------------------------------------------------------------+\n";
        cout << "  | " << left << setw(72) << ("EVENT #" + to_string(events[i].id) +
             "  |  " + events[i].title) << "|\n";
        cout << "  | " << left << setw(72) << ("Date: " + events[i].date) << "|\n";
        cout << "  | " << left << setw(72) << events[i].description << "|\n";
        cout << "  +--------------------------------------------------------------------------+\n";
    }
}

void calendarMenu() {
    int choice;
    do {
        header("ACADEMIC CALENDAR");
        cout << " [1] Add event\n"
             << " [2] View all events\n"
             << " [0] Back to main menu\n";
        line('-');
        choice = readInt("Choose an option: ");
        if (choice == 1) addEvent();
        else if (choice == 2) viewEvents();
        else if (choice != 0) cout << "Invalid option.\n";
        if (choice != 0) pauseScreen();
    } while (choice != 0);
}

// -------------------- Result and Performance Analysis --------------------

struct Result {
    int studentID;
    string courseCode;
    float marks;
    string grade;
};

Result results[MAX_RESULTS];
int resultCount = 0;

string gradeFromMarks(float marks) {
    if (marks >= 80) return "A+";
    if (marks >= 75) return "A";
    if (marks >= 70) return "A-";
    if (marks >= 65) return "B+";
    if (marks >= 60) return "B";
    if (marks >= 55) return "B-";
    if (marks >= 50) return "C+";
    if (marks >= 45) return "C";
    if (marks >= 40) return "D";
    return "F";
}

void addResult() {
    header("ADD STUDENT RESULT");
    if (resultCount == MAX_RESULTS) {
        cout << "Result storage is full.\n";
        return;
    }
    Result r;
    r.studentID = readInt("Student ID: ");
    if (!findStudent(studentRoot, r.studentID)) {
        cout << "Student not found. Register the student first.\n";
        return;
    }
    showCourseCatalog();
    r.courseCode = readText("Course code: ");
    if (!validCourseCode(r.courseCode)) {
        cout << "Invalid course code.\n";
        return;
    }
    cout << "Marks (0-100): ";
    if (!(cin >> r.marks)) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid marks input.\n";
        return;
    }
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    if (r.marks < 0 || r.marks > 100) {
        cout << "Marks must be between 0 and 100.\n";
        return;
    }
    r.grade = gradeFromMarks(r.marks);
    results[resultCount++] = r;
    pushActivity("Added result for student " + to_string(r.studentID));
    cout << "Result saved. Grade: " << r.grade << '\n';
}

void viewResults() {
    header("RESULT RECORDS");
    if (resultCount == 0) {
        cout << "No result records available.\n";
        return;
    }
    cout << left << setw(14) << "STUDENT ID" << setw(16) << "COURSE"
         << setw(12) << "MARKS" << "GRADE\n";
    line('-');
    for (int i = 0; i < resultCount; ++i)
        cout << left << setw(14) << results[i].studentID
             << setw(16) << results[i].courseCode
             << setw(12) << fixed << setprecision(2) << results[i].marks
             << results[i].grade << '\n';
    line('-');
}

void studentPerformance() {
    header("STUDENT PERFORMANCE SUMMARY");
    int id = readInt("Student ID: ");
    Student* student = findStudent(studentRoot, id);
    if (!student) {
        cout << "Student not found.\n";
        return;
    }

    int count = 0, passed = 0;
    float total = 0, highest = -1, lowest = 101;
    cout << "\nStudent: " << student->name << " (" << student->id << ")\n";
    line('-');
    cout << left << setw(16) << "COURSE" << setw(12) << "MARKS" << "GRADE\n";
    for (int i = 0; i < resultCount; ++i) {
        if (results[i].studentID == id) {
            ++count;
            total += results[i].marks;
            if (results[i].marks > highest) highest = results[i].marks;
            if (results[i].marks < lowest) lowest = results[i].marks;
            if (results[i].marks >= 40) ++passed;
            cout << left << setw(16) << results[i].courseCode
                 << setw(12) << fixed << setprecision(2) << results[i].marks
                 << results[i].grade << '\n';
        }
    }
    line('-');
    if (count == 0) {
        cout << "No result is available for this student.\n";
        return;
    }
    cout << "Recorded courses : " << count << '\n';
    cout << "Passed            : " << passed << '\n';
    cout << "Average marks     : " << fixed << setprecision(2) << total / count << '\n';
    cout << "Highest marks     : " << highest << '\n';
    cout << "Lowest marks      : " << lowest << '\n';
    cout << "Note: This is a marks-based summary, not an official credit-weighted GPA/CGPA.\n";
}

void resultMenu() {
    int choice;
    do {
        header("RESULT & PERFORMANCE");
        cout << " [1] Add result\n"
             << " [2] View all results\n"
             << " [3] Student performance summary\n"
             << " [0] Back to main menu\n";
        line('-');
        choice = readInt("Choose an option: ");
        switch (choice) {
            case 1: addResult(); break;
            case 2: viewResults(); break;
            case 3: studentPerformance(); break;
            case 0: break;
            default: cout << "Invalid option.\n";
        }
        if (choice != 0) pauseScreen();
    } while (choice != 0);
}

// -------------------- Dashboard and cleanup --------------------

void dashboard() {
    int students = 0;
    // Count the BST without using an STL container.
    Student* stack[MAX_STUDENTS];
    int top = -1;
    if (studentRoot) stack[++top] = studentRoot;
    while (top >= 0) {
        Student* current = stack[top--];
        ++students;
        if (current->left && top < MAX_STUDENTS - 1) stack[++top] = current->left;
        if (current->right && top < MAX_STUDENTS - 1) stack[++top] = current->right;
    }

    header("UNITRACK - DASHBOARD");
    cout << "University       : " << UNIVERSITY << '\n';
    cout << "Academic program : " << PROGRAM << '\n';
    line('-');
    cout << "Registered students       : " << students << '\n';
    cout << "University course catalog : " << MAX_COURSES << " courses (preloaded)\n";
    cout << "Pending registration       : " << queueCount << '\n';
    cout << "Routine entries            : " << scheduleCount << '\n';
    cout << "Assignments / quizzes      : " << taskCount << '\n';
    cout << "Academic calendar events   : " << eventCount << '\n';
    cout << "Result records             : " << resultCount << '\n';
    line('-');
}

void deleteStudentTree(Student* root) {
    if (!root) return;
    deleteStudentTree(root->left);
    deleteStudentTree(root->right);
    delete root;
}

int main() {
    loadUniversityRoutine();

    int choice;
    do {
        header("UNITRACK | UNIVERSITY INTELLIGENCE");
        cout << "                 TEAM ONE PIECE\n";
        cout << "              CSE 2103 DATA STRUCTURES LAB\n";
        line('=');
        cout << " [1] Dashboard\n"
             << " [2] Student Management (BST)\n"
             << " [3] Course Catalog (University Provided)\n"
             << " [4] Course Registration (Circular Queue)\n"
             << " [5] Class Routine & Exam Schedule\n"
             << " [6] Assignment & Quiz Tracker\n"
             << " [7] Academic Calendar\n"
             << " [8] Result & Performance Analysis\n"
             << " [9] Recent Activity History (Stack)\n"
             << " [10] View latest activity\n"
             << " [0] Exit\n";
        line('-');
        choice = readInt("Enter your choice: ");

        switch (choice) {
            case 1: dashboard(); break;
            case 2: studentMenu(); break;
            case 3: showCourseCatalog(); break;
            case 4: registrationMenu(); break;
            case 5: routineMenu(); break;
            case 6: taskMenu(); break;
            case 7: calendarMenu(); break;
            case 8: resultMenu(); break;
            case 9: showActivities(); break;
            case 10: undoLastActivityView(); break;
            case 0:
                cout << "\nThank you for using UniTrack.\n";
                cout << "Team One Piece | UniTrack | CSE 2103 Data Structures Lab\n";
                break;
            default:
                cout << "Invalid choice. Please select a listed option.\n";
        }
        if (choice != 0 && (choice == 1 || choice == 3 || choice == 9 || choice == 10))
            pauseScreen();

    } while (choice != 0);

    deleteStudentTree(studentRoot);
    studentRoot = NULL;
    return 0;
}
