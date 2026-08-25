import { localRequest } from './storage/localApi';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('haven_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('haven_token', token);
  } else {
    localStorage.removeItem('haven_token');
  }
};

export async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return localRequest<T>(endpoint, options);
}
