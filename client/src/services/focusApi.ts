import { request } from './api';
import { FocusSession } from '../types';

export const focusApi = {
  getSessions: async (): Promise<FocusSession[]> => request('/focus/sessions'),
  logSession: async (durationMinutes: number, type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' = 'FOCUS', notes?: string): Promise<FocusSession> =>
    request('/focus/sessions', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes, type, completed: true, notes }),
    }),
};
