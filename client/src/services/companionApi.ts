import { request } from './api';
import { Companion } from '../types';

export const companionApi = {
  getCompanion: async (): Promise<Companion> => request('/companion'),
  updateCompanion: async (data: Partial<Companion>): Promise<Companion> =>
    request('/companion', { method: 'PUT', body: JSON.stringify(data) }),
};
