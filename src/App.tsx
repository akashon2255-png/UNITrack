import { useState } from 'react';
import { DataManagementModal } from './components/DataManagementModal';
import { LayoutShell } from './components/LayoutShell';
import { ToastContainer } from './components/ToastContainer';
import { ActivityView } from './components/views/ActivityView';
import { CalendarView } from './components/views/CalendarView';
import { CatalogView } from './components/views/CatalogView';
import { DashboardView } from './components/views/DashboardView';
import { ProfileView } from './components/views/ProfileView';
import { RegistrationView } from './components/views/RegistrationView';
import { ResultsView } from './components/views/ResultsView';
import { RoutineView } from './components/views/RoutineView';
import { StudentsView } from './components/views/StudentsView';
import { TasksView } from './components/views/TasksView';
import { COURSES } from './data/seedData';
import { useUniTrackStore } from './hooks/useUniTrackStore';
import { SectionId } from './types/unitrack';

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [dataModalOpen, setDataModalOpen] = useState(false);

  const store = useUniTrackStore();
  const pendingTasks = store.state.tasks.filter((t) => t.status === 'Pending');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardView
            profile={store.profile}
            studentCount={store.studentCount}
            bstHeight={store.bstHeight}
            pendingRegistrations={store.pendingRegistrations}
            schedules={store.state.schedules}
            tasks={store.state.tasks}
            events={store.state.events}
            results={store.state.results}
            activityStack={store.state.activityStack}
            onNavigate={setActiveSection}
            onToggleTask={store.toggleTaskStatus}
            onSearchStudent={store.searchStudentById}
          />
        );
      case 'students':
        return (
          <StudentsView
            studentRoot={store.state.studentRoot}
            studentsList={store.studentsList}
            studentCount={store.studentCount}
            bstHeight={store.bstHeight}
            onAddStudent={store.addStudent}
            onSearchStudent={store.searchStudentById}
            onUpdateStudent={store.updateStudent}
            onDeleteStudent={store.deleteStudent}
          />
        );
      case 'catalog':
        return (
          <CatalogView
            schedules={store.state.schedules}
            tasks={store.state.tasks}
            results={store.state.results}
            pendingRegistrations={store.pendingRegistrations}
            onNavigate={setActiveSection}
          />
        );
      case 'registration':
        return (
          <RegistrationView
            queue={store.state.registrationQueue}
            pendingRegistrations={store.pendingRegistrations}
            studentsList={store.studentsList}
            lastProcessedReg={store.lastProcessedReg}
            onEnqueue={store.enqueueRegistration}
            onProcessNext={store.processNextRegistration}
          />
        );
      case 'routine':
        return (
          <RoutineView
            schedules={store.state.schedules}
            onAddSchedule={store.addSchedule}
            onReschedule={store.rescheduleEntry}
            onCancelSchedule={store.cancelScheduleEntry}
            onRestoreSchedule={store.restoreScheduleEntry}
          />
        );
      case 'tasks':
        return (
          <TasksView
            tasks={store.state.tasks}
            onAddTask={store.addTask}
            onToggleTaskStatus={store.toggleTaskStatus}
            onDeleteTask={store.deleteTask}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            events={store.state.events}
            onAddEvent={store.addEvent}
          />
        );
      case 'results':
        return (
          <ResultsView
            results={store.state.results}
            studentsList={store.studentsList}
            onAddResult={store.addResult}
          />
        );
      case 'activity':
        return (
          <ActivityView
            activityStack={store.state.activityStack}
            onPopLatest={store.popLatestActivity}
          />
        );
      case 'profile':
        return (
          <ProfileView
            profile={store.profile}
            onUpdateProfile={store.updateProfile}
            theme={store.theme}
            onToggleTheme={store.toggleTheme}
            onOpenDataModal={() => setDataModalOpen(true)}
            stats={{
              students: store.studentCount,
              courses: COURSES.length,
              tasks: store.state.tasks.length,
              results: store.state.results.length,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <LayoutShell
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        theme={store.theme}
        onToggleTheme={store.toggleTheme}
        onOpenDataModal={() => setDataModalOpen(true)}
        profile={store.profile}
        pendingTasks={pendingTasks}
        upcomingEvents={store.state.events}
        counts={{
          students: store.studentCount,
          catalog: COURSES.length,
          queue: store.pendingRegistrations.length,
          schedules: store.state.schedules.length,
          tasks: store.state.tasks.length,
          events: store.state.events.length,
          results: store.state.results.length,
          activities: store.state.activityStack.length,
        }}
      >
        {renderSection()}
      </LayoutShell>

      <DataManagementModal
        isOpen={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
        onExport={store.exportWorkspaceJson}
        onImport={store.importWorkspaceJson}
        onResetSample={store.resetToSampleData}
        onClearRecords={store.clearUserRecords}
      />

      <ToastContainer toasts={store.toasts} onDismiss={store.dismissToast} />
    </>
  );
}
