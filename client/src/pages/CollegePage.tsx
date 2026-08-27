import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { 
  CheckSquare, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Calculator, 
  FolderPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  ExternalLink,
  Tag,
  Search
} from 'lucide-react';
import { collegeApi } from '../services/collegeApi';
import { Task, Subject, Assignment, TimetableEntry, GpaRecord, SubjectResource } from '../types';
import { PerformancePanel } from '../components/ui/PerformancePanel';
import { LineChart } from '../components/ui/LineChart';

export const CollegePage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('tasks');

  const reactWithNori = (
    activity: 'happy' | 'celebrating' | 'excited' | 'focused' | 'love' | 'surprised',
    message: string
  ) => {
    window.dispatchEvent(
      new CustomEvent('nori:react', {
        detail: { activity, message },
      })
    );
  };

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [gpaRecords, setGpaRecords] = useState<GpaRecord[]>([]);
  const [resources, setResources] = useState<SubjectResource[]>([]);

  // Filter state for tasks
  const [taskStatusFilter, setTaskStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskSort, setTaskSort] = useState<'priority' | 'due' | 'created'>('due');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isGpaModalOpen, setIsGpaModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({ title: '', description: '', subjectId: '', priority: 'MEDIUM', dueDate: '', estimatedMinutes: '25', tags: '', subtasks: '', recurrence: 'NONE' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', color: '#6366f1', description: '' });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', subjectId: '', dueDate: '', totalMarks: '100' });
  const [timetableForm, setTimetableForm] = useState({ subjectId: '', dayOfWeek: 'MON', startTime: '09:00', endTime: '10:30', room: '', professor: '' });
  const [gpaForm, setGpaForm] = useState({ semester: 'Fall 2026', courseName: '', credits: '3', grade: 'A' });
  const [gpaSemester, setGpaSemester] = useState('ALL');
  const [resourceForm, setResourceForm] = useState({ subjectId: '', title: '', url: '', note: '' });

  const loadData = async () => {
    try {
      const [t, s, a, tt, g, r] = await Promise.all([
        collegeApi.getTasks(),
        collegeApi.getSubjects(),
        collegeApi.getAssignments(),
        collegeApi.getTimetable(),
        collegeApi.getGpaRecords(),
        collegeApi.getResources(),
      ]);
      setTasks(t);
      setSubjects(s);
      setAssignments(a);
      setTimetable(tt);
      setGpaRecords(g);
      setResources(r);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    try {
      await collegeApi.createTask({
        ...taskForm,
        priority: taskForm.priority as 'LOW' | 'MEDIUM' | 'HIGH',
        estimatedMinutes: Number(taskForm.estimatedMinutes) || 25,
        tags: taskForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        subtasks: taskForm.subtasks.split('\n').map((title) => title.trim()).filter(Boolean).map((title) => ({ id: crypto.randomUUID(), title, completed: false })),
        recurrence: taskForm.recurrence as 'NONE' | 'DAILY' | 'WEEKLY',
      });
      showToast('Task added successfully', 'success');
      reactWithNori('happy', 'new task added. we have a plan now. ✨');
      setIsTaskModalOpen(false);
      setTaskForm({ title: '', description: '', subjectId: '', priority: 'MEDIUM', dueDate: '', estimatedMinutes: '25', tags: '', subtasks: '', recurrence: 'NONE' });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
  const nextStatus =
    task.status === 'COMPLETED'
      ? 'TODO'
      : 'COMPLETED';

  try {
    await collegeApi.updateTask(task.id, {
      status: nextStatus,
    });

    if (nextStatus === 'COMPLETED') {
      window.dispatchEvent(
        new CustomEvent('nori-event', {
          detail: {
            type: 'TASK_COMPLETED',
            message: `"${task.title}" completed! WE DID IT!! 🎉`,
          },
        })
      );
    }

    loadData();
  } catch (err: any) {
    showToast(err.message, 'error');
  }
};

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const subtasks = (task.subtasks || []).map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask);
    try {
      const updated = await collegeApi.updateTask(task.id, { subtasks });
      const completedSubtask = subtasks.find((subtask) => subtask.id === subtaskId);
      const allDone = subtasks.length > 0 && subtasks.every((subtask) => subtask.completed);

      if (completedSubtask?.completed) {
        reactWithNori(
          allDone ? 'celebrating' : 'happy',
          allDone
            ? `every little step of ${task.title} is done! tiny victory dance!! 🎉`
            : 'nice. one step closer. 💛'
        );
      }

      setTasks((previous) => previous.map((item) => item.id === task.id ? updated : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update subtask.', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await collegeApi.deleteTask(id);
      showToast('Task deleted', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject and its linked course records?')) return;
    try { await collegeApi.deleteSubject(id); setSubjects((previous) => previous.filter((subject) => subject.id !== id)); showToast('Subject deleted', 'info'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not delete subject.', 'error'); }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    try { await collegeApi.deleteAssignment(id); setAssignments((previous) => previous.filter((assignment) => assignment.id !== id)); showToast('Assignment deleted', 'info'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not delete assignment.', 'error'); }
  };

  const handleToggleAssignment = async (assignment: Assignment) => {
    const nextStatus = assignment.status === 'PENDING' ? 'SUBMITTED' : assignment.status === 'SUBMITTED' ? 'GRADED' : 'PENDING';
    try {
      const updated = await collegeApi.updateAssignment(assignment.id, { status: nextStatus });
      setAssignments((previous) => previous.map((item) => item.id === assignment.id ? updated : item));

      if (nextStatus === 'SUBMITTED') {
        reactWithNori('celebrating', `${assignment.title} submitted! that deserves a celebration. 🎉`);
      } else if (nextStatus === 'GRADED') {
        reactWithNori('excited', `${assignment.title} got graded! I am extremely curious now.`);
      } else {
        reactWithNori('happy', `${assignment.title} is back to pending. we still have this.`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update assignment.', 'error');
    }
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    if (!window.confirm('Remove this class from the timetable?')) return;
    try { await collegeApi.deleteTimetableEntry(id); setTimetable((previous) => previous.filter((entry) => entry.id !== id)); showToast('Class removed from timetable', 'info'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove class.', 'error'); }
  };

  // Handlers for Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) return;
    try {
      await collegeApi.createSubject(subjectForm);
      showToast('Subject created', 'success');
      reactWithNori('happy', 'new subject unlocked. more things for us to learn together. 📚');
      setIsSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '', color: '#6366f1', description: '' });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handlers for Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.subjectId || !assignmentForm.dueDate) return;
    try {
      await collegeApi.createAssignment({
        ...assignmentForm,
        totalMarks: parseFloat(assignmentForm.totalMarks),
      });
      showToast('Assignment added', 'success');
      reactWithNori('focused', 'assignment added. focus mode is ready when you are. 🎯');
      setIsAssignmentModalOpen(false);
      setAssignmentForm({ title: '', subjectId: '', dueDate: '', totalMarks: '100' });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handlers for Timetable
  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableForm.subjectId) return;
    try {
      await collegeApi.createTimetableEntry({
        ...timetableForm,
        dayOfWeek: timetableForm.dayOfWeek as any,
      });
      showToast('Timetable slot added', 'success');
      reactWithNori('happy', 'schedule updated. I will keep you company through it.');
      setIsTimetableModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handlers for GPA
  const handleAddGpaRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpaForm.courseName) return;
    try {
      await collegeApi.addGpaRecord({
        ...gpaForm,
        credits: parseFloat(gpaForm.credits),
      });
      showToast('Course grade added', 'success');
      reactWithNori('excited', 'another grade recorded! our academic story grows. ✨');
      setIsGpaModalOpen(false);
      setGpaForm({ semester: 'Fall 2026', courseName: '', credits: '3', grade: 'A' });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handlers for Resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.title || !resourceForm.subjectId) return;
    try {
      await collegeApi.createResource(resourceForm);
      showToast('Resource added', 'success');
      reactWithNori('happy', 'resource saved. future us is going to appreciate that. 📚');
      setIsResourceModalOpen(false);
      setResourceForm({ subjectId: '', title: '', url: '', note: '' });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Dynamic GPA calculation
  const totalCredits = gpaRecords.reduce((sum, r) => sum + r.credits, 0);
  const totalPoints = gpaRecords.reduce((sum, r) => sum + r.credits * r.gradePoints, 0);
  const overallCgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  const semesters = Array.from(new Set(gpaRecords.map((record) => record.semester))).sort();
  const visibleGpaRecords = gpaRecords.filter((record) => gpaSemester === 'ALL' || record.semester === gpaSemester);
  const trendLabels = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });
  const trendDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const completedTaskTrend = trendDates.map((date) => tasks.filter((task) => task.completedAt && new Date(task.completedAt).toDateString() === date.toDateString()).length);
  const dueAssignmentTrend = trendDates.map((date) => assignments.filter((assignment) => new Date(assignment.dueDate).toDateString() === date.toDateString()).length);
  const semesterSummaries = semesters.map((semester) => {
    const records = gpaRecords.filter((record) => record.semester === semester);
    const credits = records.reduce((sum, record) => sum + record.credits, 0);
    const points = records.reduce((sum, record) => sum + record.credits * Number(record.gradePoints || 0), 0);
    return { semester, credits, courses: records.length, gpa: credits ? (points / credits).toFixed(2) : '0.00' };
  });

  const filteredTasks = tasks
    .filter((t) => (taskStatusFilter === 'ALL' ? true : t.status === taskStatusFilter))
    .filter((t) => `${t.title} ${t.description || ''} ${(t.tags || []).join(' ')}`.toLowerCase().includes(taskSearch.toLowerCase()))
    .sort((a, b) => taskSort === 'priority'
      ? ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority])
      : taskSort === 'created' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER) - (b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER));

  const tabItems = [
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare />, count: tasks.filter(t => t.status !== 'COMPLETED').length },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen />, count: subjects.length },
    { id: 'assignments', label: 'Assignments', icon: <GraduationCap />, count: assignments.filter(a => a.status === 'PENDING').length },
    { id: 'timetable', label: 'Timetable', icon: <Calendar /> },
    { id: 'gpa', label: 'GPA Calculator', icon: <Calculator /> },
    { id: 'resources', label: 'Resources', icon: <FolderPlus />, count: resources.length },
  ];

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
            College Productivity Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize tasks, track assignments, calculate GPA, and manage your weekly timetable.
          </p>
        </div>

        <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-amber-50 dark:bg-amber-950/30"><span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Open tasks</span><p className="text-2xl font-mono font-bold mt-1">{tasks.filter((task) => task.status !== 'COMPLETED').length}</p></Card>
        <Card className="bg-rose-50 dark:bg-rose-950/30"><span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">High priority</span><p className="text-2xl font-mono font-bold mt-1">{tasks.filter((task) => task.status !== 'COMPLETED' && task.priority === 'HIGH').length}</p></Card>
        <Card className="bg-sky-50 dark:bg-sky-950/30"><span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Assignments</span><p className="text-2xl font-mono font-bold mt-1">{assignments.filter((assignment) => assignment.status === 'PENDING').length}</p></Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/30"><span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Current GPA</span><p className="text-2xl font-mono font-bold mt-1">{overallCgpa}</p></Card>
      </div>
      

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* TAB 1: TASKS */}
        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter pills */}
              <div className="flex items-center gap-1.5 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl">
                {(['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTaskStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      taskStatusFilter === st
                        ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All Tasks' : st === 'TODO' ? 'To Do' : st === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative"><Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" /><input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="Search tasks..." className="w-full sm:w-44 pl-8 pr-3 py-2 rounded-xl border border-haven-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" /></div>
                <select value={taskSort} onChange={(event) => setTaskSort(event.target.value as typeof taskSort)} className="rounded-xl border border-haven-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"><option value="due">Sort by due date</option><option value="priority">Sort by priority</option><option value="created">Sort by newest</option></select>
              </div>

              <Button
                variant="primary"
                onClick={() => setIsTaskModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add New Task
              </Button>
            </div>

            {/* Task list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t) => {
                  const isDone = t.status === 'COMPLETED';
                  return (
                    <Card
                      key={t.id}
                      className={`flex items-start justify-between gap-4 transition-all ${
                        isDone ? 'opacity-65 bg-haven-50/50 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleTaskStatus(t)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-haven-300 dark:border-slate-700 hover:border-amber-500'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold text-slate-900 dark:text-white ${
                              isDone ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                          {t.subtasks && t.subtasks.length > 0 && (
                            <div className="space-y-1 pt-1">
                              {t.subtasks.map((subtask) => (
                                <button key={subtask.id} onClick={() => handleToggleSubtask(t, subtask.id)} className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-amber-700">
                                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${subtask.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>{subtask.completed && <Check className="w-2.5 h-2.5" />}</span>
                                  <span className={subtask.completed ? 'line-through' : ''}>{subtask.title}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {t.subject && (
                              <span
                                className="px-2 py-0.5 text-[10px] font-semibold rounded-md"
                                style={{ backgroundColor: `${t.subject.color}20`, color: t.subject.color }}
                              >
                                {t.subject.name}
                              </span>
                            )}

                            {t.dueDate && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={t.priority === 'HIGH' ? 'danger' : t.priority === 'MEDIUM' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {t.priority}
                        </Badge>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-haven-300 dark:border-slate-800">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No tasks found in this view.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsTaskModalOpen(true)}>
                    Create First Task
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: SUBJECTS */}
        {activeTab === 'subjects' && (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif font-semibold text-slate-900 dark:text-white">
                Course Subjects ({subjects.length})
              </h2>
              <Button
                variant="primary"
                onClick={() => setIsSubjectModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Subject
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subjects.map((s) => (
                <Card key={s.id} className="space-y-4 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                        {s.code || 'COURSE'}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                        {s.name}
                      </h3>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {s.description}
                    </p>
                  )}

                  <div className="pt-2 flex justify-between items-center text-xs border-t border-haven-100 dark:border-slate-800 text-slate-500">
                    <span>Tasks: {s.tasks?.length || 0}</span>
                    <span>Assignments: {s.assignments?.length || 0}</span>
                    <span>Resources: {s.resources?.length || 0}</span>
                    <button onClick={() => handleDeleteSubject(s.id)} className="text-slate-400 hover:text-rose-500" title="Delete subject"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <motion.div
            key="assignments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif font-semibold text-slate-900 dark:text-white">
                Assignments & Projects Tracker
              </h2>
              <Button
                variant="primary"
                onClick={() => setIsAssignmentModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Assignment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <Card key={a.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className="px-2 py-0.5 text-[10px] font-semibold rounded"
                        style={{
                          backgroundColor: `${a.subject?.color || '#6366f1'}20`,
                          color: a.subject?.color || '#6366f1',
                        }}
                      >
                        {a.subject?.name || 'Subject'}
                      </span>
                      <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white mt-1">
                        {a.title}
                      </h3>
                    </div>
                    <button onClick={() => handleToggleAssignment(a)} title="Advance assignment status"><Badge variant={a.status === 'GRADED' ? 'success' : a.status === 'SUBMITTED' ? 'info' : 'warning'}>
                      {a.status}
                    </Badge></button>
                  </div>

                  {a.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {a.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-haven-100 dark:border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(a.dueDate).toLocaleDateString()}
                    </span>

                    {a.totalMarks && (
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        Marks: {a.gainedMarks !== undefined && a.gainedMarks !== null ? `${a.gainedMarks} / ` : ''}{a.totalMarks}
                      </span>
                    )}
                    <button onClick={() => handleDeleteAssignment(a.id)} className="text-slate-400 hover:text-rose-500" title="Delete assignment"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 4: TIMETABLE */}
        {activeTab === 'timetable' && (
          <motion.div
            key="timetable"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif font-semibold text-slate-900 dark:text-white">
                Weekly Class Schedule
              </h2>
              <Button
                variant="primary"
                onClick={() => setIsTimetableModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Class Slot
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {daysOfWeek.map((day) => {
                const dayEntries = timetable.filter((e) => e.dayOfWeek === day);
                return (
                  <div key={day} className="space-y-2">
                    <div className="p-2 bg-haven-100 dark:bg-slate-800 rounded-xl text-center">
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {day}
                      </span>
                    </div>

                    <div className="space-y-2 min-h-[140px]">
                      {dayEntries.map((e) => (
                        <div
                          key={e.id}
                          className="p-3 rounded-xl border text-left space-y-1 shadow-2xs"
                          style={{
                            backgroundColor: `${e.subject?.color || '#6366f1'}15`,
                            borderColor: `${e.subject?.color || '#6366f1'}40`,
                          }}
                        >
                          <p className="text-xs font-bold truncate" style={{ color: e.subject?.color }}>
                            {e.subject?.name}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 font-mono">
                            {e.startTime} - {e.endTime}
                          </p>
                          {e.room && <p className="text-[10px] text-slate-500">Room: {e.room}</p>}
                          {e.professor && <p className="text-[10px] text-slate-500">Prof: {e.professor}</p>}
                          <button onClick={() => handleDeleteTimetableEntry(e.id)} className="text-slate-400 hover:text-rose-500 pt-1" title="Remove class"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}

                      {dayEntries.length === 0 && (
                        <div className="h-full flex items-center justify-center p-4 border border-dashed border-haven-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-400">
                          No classes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 5: GPA CALCULATOR */}
        {activeTab === 'gpa' && (
          <motion.div
            key="gpa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* CGPA Summary Banner */}
            <Card className="bg-gradient-to-r from-amber-600 to-haven-700 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-amber-200 block">
                  Cumulative Academic Performance
                </span>
                <h3 className="text-4xl font-serif font-bold mt-1">
                  CGPA: {overallCgpa} <span className="text-sm font-sans text-amber-100">/ 4.00</span>
                </h3>
                <p className="text-xs text-amber-100 mt-1">
                  Based on {gpaRecords.length} courses across {totalCredits} total credits.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => setIsGpaModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Course Grade
              </Button>
            </Card>

            {semesterSummaries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {semesterSummaries.map((summary) => (
                  <Card key={summary.semester} className="bg-white dark:bg-slate-900 border-haven-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{summary.semester}</span>
                      <Badge variant="primary">{summary.gpa} GPA</Badge>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <span><strong className="text-slate-900 dark:text-white">{summary.courses}</strong> courses</span>
                      <span><strong className="text-slate-900 dark:text-white">{summary.credits}</strong> credits</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Course Grades Table */}
            <Card className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Course Records</h3>
                <select value={gpaSemester} onChange={(event) => setGpaSemester(event.target.value)} className="rounded-lg border border-haven-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"><option value="ALL">All semesters</option>{semesters.map((semester) => <option key={semester} value={semester}>{semester}</option>)}</select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="text-xs uppercase bg-haven-50 dark:bg-slate-800 text-slate-500 font-mono">
                    <tr>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Course Name</th>
                      <th className="p-3">Credits</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Grade Points</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-haven-100 dark:divide-slate-800">
                    {visibleGpaRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-haven-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.semester}</td>
                        <td className="p-3 font-medium">{r.courseName}</td>
                        <td className="p-3">{r.credits}</td>
                        <td className="p-3">
                          <Badge variant="primary">{r.grade}</Badge>
                        </td>
                        <td className="p-3 font-mono font-semibold">{Number(r.gradePoints || 0).toFixed(1)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={async () => {
                              await collegeApi.deleteGpaRecord(r.id);
                              loadData();
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* TAB 6: RESOURCES */}
        {activeTab === 'resources' && (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif font-semibold text-slate-900 dark:text-white">
                Course Resources & Links
              </h2>
              <Button
                variant="primary"
                onClick={() => setIsResourceModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Resource
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resources.map((res) => (
                <Card key={res.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="info">{res.subject?.name || 'Resource'}</Badge>
                    <button
                      onClick={async () => {
                        await collegeApi.deleteResource(res.id);
                        loadData();
                      }}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">
                    {res.title}
                  </h3>

                  {res.note && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {res.note}
                    </p>
                  )}

                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline pt-2"
                    >
                      <span>Open External Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PerformancePanel title="Academic performance report" subtitle="Your current workload across the College Hub." metrics={[
        { label: 'Completion', value: tasks.length ? `${Math.round((tasks.filter((task) => task.status === 'COMPLETED').length / tasks.length) * 100)}%` : '0%', detail: 'tasks complete', tone: 'emerald' },
        { label: 'Subjects', value: subjects.length, detail: 'courses tracked', tone: 'sky' },
        { label: 'Assignments', value: assignments.filter((assignment) => assignment.status === 'PENDING').length, detail: 'still pending', tone: 'rose' },
        { label: 'GPA', value: overallCgpa, detail: `${totalCredits} credits`, tone: 'amber' },
      ]} />
      <LineChart title="College workload trends" subtitle="Seven-day task completion and assignment due dates." labels={trendLabels} series={[{ name: 'Tasks completed', values: completedTaskTrend, color: '#059669' }, { name: 'Assignments due', values: dueAssignmentTrend, color: '#e11d48' }]} />

      {/* CREATE TASK MODAL */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Solve Calc Problems #4"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={taskForm.subjectId}
              onChange={(e) => setTaskForm({ ...taskForm, subjectId: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
            >
              <option value="">No Associated Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimated minutes" type="number" min="1" value={taskForm.estimatedMinutes} onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: e.target.value })} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Repeat</label>
              <select value={taskForm.recurrence} onChange={(e) => setTaskForm({ ...taskForm, recurrence: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm">
                <option value="NONE">Does not repeat</option>
                <option value="DAILY">Every day</option>
                <option value="WEEKLY">Every week</option>
              </select>
            </div>
          </div>

          <Input label="Tags" placeholder="reading, exam, admin" value={taskForm.tags} onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Subtasks</label>
            <textarea rows={3} placeholder="One step per line" value={taskForm.subtasks} onChange={(e) => setTaskForm({ ...taskForm, subtasks: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Additional details..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE SUBJECT MODAL */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Add Course Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Computer Science 101"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            required
          />
          <Input
            label="Course Code"
            placeholder="e.g. CS-101"
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Color Accent
            </label>
            <input
              type="color"
              value={subjectForm.color}
              onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
              className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title="Add Assignment">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            placeholder="e.g. Midterm Lab Report"
            value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={assignmentForm.subjectId}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
              required
            >
              <option value="">Select Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Due Date"
            type="date"
            value={assignmentForm.dueDate}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE TIMETABLE ENTRY MODAL */}
      <Modal isOpen={isTimetableModalOpen} onClose={() => setIsTimetableModalOpen(false)} title="Add Class Slot">
        <form onSubmit={handleCreateTimetable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={timetableForm.subjectId}
              onChange={(e) => setTimetableForm({ ...timetableForm, subjectId: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
              required
            >
              <option value="">Select Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Day of Week
            </label>
            <select
              value={timetableForm.dayOfWeek}
              onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
            >
              {daysOfWeek.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={timetableForm.startTime}
              onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={timetableForm.endTime}
              onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
              required
            />
          </div>

          <Input
            label="Room / Hall"
            placeholder="e.g. Lab 302"
            value={timetableForm.room}
            onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsTimetableModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE GPA RECORD MODAL */}
      <Modal isOpen={isGpaModalOpen} onClose={() => setIsGpaModalOpen(false)} title="Add Course Grade">
        <form onSubmit={handleAddGpaRecord} className="space-y-4">
          <Input
            label="Semester Name"
            placeholder="e.g. Fall 2026"
            value={gpaForm.semester}
            onChange={(e) => setGpaForm({ ...gpaForm, semester: e.target.value })}
            required
          />
          <Input
            label="Course Name"
            placeholder="e.g. Data Structures"
            value={gpaForm.courseName}
            onChange={(e) => setGpaForm({ ...gpaForm, courseName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Credits"
              type="number"
              step="0.5"
              value={gpaForm.credits}
              onChange={(e) => setGpaForm({ ...gpaForm, credits: e.target.value })}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Grade
              </label>
              <select
                value={gpaForm.grade}
                onChange={(e) => setGpaForm({ ...gpaForm, grade: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
              >
                {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsGpaModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE RESOURCE MODAL */}
      <Modal isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)} title="Add Resource">
        <form onSubmit={handleCreateResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={resourceForm.subjectId}
              onChange={(e) => setResourceForm({ ...resourceForm, subjectId: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
              required
            >
              <option value="">Select Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Resource Title"
            placeholder="e.g. Lecture 4 Slides"
            value={resourceForm.title}
            onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
            required
          />
          <Input
            label="URL Link"
            placeholder="https://..."
            value={resourceForm.url}
            onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};