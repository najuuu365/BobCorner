import { request } from './api';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  getMe: async (): Promise<{ user: User }> => {
    return request('/auth/me');
  },

  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
