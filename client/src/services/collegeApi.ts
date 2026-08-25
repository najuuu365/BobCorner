import { request } from './api';
import { Task, Subject, Assignment, TimetableEntry, GpaRecord, SubjectResource } from '../types';

export const collegeApi = {
  // Tasks
  getTasks: async (): Promise<Task[]> => request('/college/tasks'),
  createTask: async (taskData: Partial<Task>): Promise<Task> =>
    request('/college/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
  updateTask: async (id: string, taskData: Partial<Task>): Promise<Task> =>
    request(`/college/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) }),
  deleteTask: async (id: string): Promise<{ id: string }> =>
    request(`/college/tasks/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: async (): Promise<Subject[]> => request('/college/subjects'),
  createSubject: async (subjectData: Partial<Subject>): Promise<Subject> =>
    request('/college/subjects', { method: 'POST', body: JSON.stringify(subjectData) }),
  updateSubject: async (id: string, subjectData: Partial<Subject>): Promise<Subject> =>
    request(`/college/subjects/${id}`, { method: 'PUT', body: JSON.stringify(subjectData) }),
  deleteSubject: async (id: string): Promise<{ id: string }> =>
    request(`/college/subjects/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: async (): Promise<Assignment[]> => request('/college/assignments'),
  createAssignment: async (data: Partial<Assignment>): Promise<Assignment> =>
    request('/college/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: async (id: string, data: Partial<Assignment>): Promise<Assignment> =>
    request(`/college/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: async (id: string): Promise<{ id: string }> =>
    request(`/college/assignments/${id}`, { method: 'DELETE' }),

  // Timetable
  getTimetable: async (): Promise<TimetableEntry[]> => request('/college/timetable'),
  createTimetableEntry: async (data: Partial<TimetableEntry>): Promise<TimetableEntry> =>
    request('/college/timetable', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimetableEntry: async (id: string): Promise<{ id: string }> =>
    request(`/college/timetable/${id}`, { method: 'DELETE' }),

  // GPA Records
  getGpaRecords: async (): Promise<GpaRecord[]> => request('/college/gpa'),
  addGpaRecord: async (data: Partial<GpaRecord>): Promise<GpaRecord> =>
    request('/college/gpa', { method: 'POST', body: JSON.stringify(data) }),
  deleteGpaRecord: async (id: string): Promise<{ id: string }> =>
    request(`/college/gpa/${id}`, { method: 'DELETE' }),

  // Resources
  getResources: async (): Promise<SubjectResource[]> => request('/college/resources'),
  createResource: async (data: Partial<SubjectResource>): Promise<SubjectResource> =>
    request('/college/resources', { method: 'POST', body: JSON.stringify(data) }),
  deleteResource: async (id: string): Promise<{ id: string }> =>
    request(`/college/resources/${id}`, { method: 'DELETE' }),
};
