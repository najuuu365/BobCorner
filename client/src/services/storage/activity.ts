import { storage } from './database';

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  detail?: string;
  createdAt: string;
}

const key = () => `${localStorage.getItem('haven_user_id') ?? 'anonymous'}:activity`;

export async function recordActivity(type: string, title: string, detail?: string): Promise<void> {
  const events = (await storage.get<ActivityEvent[]>(key())) ?? [];
  events.unshift({ id: crypto.randomUUID(), type, title, detail, createdAt: new Date().toISOString() });
  await storage.set(key(), events.slice(0, 500));
}

export async function getActivity(): Promise<ActivityEvent[]> {
  return (await storage.get<ActivityEvent[]>(key())) ?? [];
}
