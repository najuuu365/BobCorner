import { storage } from './database';
import { awardXp } from './progress';
import { recordActivity } from './activity';
import {
  Achievement,
  Assignment,
  Book,
  BookNote,
  BookQuote,
  Companion,
  DailyChallenge,
  FocusSession,
  GameScore,
  GameStatistic,
  GardenDecoration,
  GardenPlant,
  GpaRecord,
  MoodCheckIn,
  ReadingJournalEntry,
  Subject,
  SubjectResource,
  Task,
  TimetableEntry,
  User,
} from '../../types';

type RecordValue = Record<string, unknown>;
type LocalUser = User & { password: string };
type Collection = 'tasks' | 'subjects' | 'assignments' | 'timetable' | 'gpa' | 'resources' | 'books' | 'bookNotes' | 'quotes' | 'journal' | 'focus' | 'moods' | 'gameScores' | 'plants' | 'decorations';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const dateKey = () => new Date().toISOString().slice(0, 10);
const userKey = () => localStorage.getItem('haven_user_id') ?? 'anonymous';
const recordKey = (collection: Collection, recordId: string) => `${userKey()}:${collection}:${recordId}`;
const collectionKey = (collection: Collection) => `${userKey()}:${collection}`;

async function getCollection<T>(collection: Collection): Promise<T[]> {
  return (await storage.get<T[]>(collectionKey(collection))) ?? [];
}

async function saveCollection<T>(collection: Collection, records: T[]): Promise<T[]> {
  return storage.set(collectionKey(collection), records);
}

async function bodyValue(options: RequestInit): Promise<RecordValue> {
  if (!options.body) return {};
  if (options.body instanceof FormData) {
    return Object.fromEntries(options.body.entries()) as RecordValue;
  }
  return JSON.parse(String(options.body)) as RecordValue;
}

const baseRecord = (data: RecordValue, userId = userKey()) => ({ ...data, id: String(data.id ?? id()), userId, createdAt: String(data.createdAt ?? now()) });

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error ?? new Error('Unable to read cover image.'));
  reader.readAsDataURL(file);
});

const bookForClient = (book: RecordValue): RecordValue => {
  if (book.filePath instanceof Blob) {
    return { ...book, filePath: URL.createObjectURL(book.filePath) };
  }
  return book;
};

const defaultAchievements = (): Achievement[] => [
  { key: 'first_task', title: 'First Step', description: 'Complete your first task.', category: 'Productivity', icon: '✅', target: 1 },
  { key: 'task_5', title: 'Getting Things Done', description: 'Complete five tasks.', category: 'Productivity', icon: '📋', target: 5 },
  { key: 'task_25', title: 'Momentum', description: 'Complete twenty-five tasks.', category: 'Productivity', icon: '🚀', target: 25 },
  { key: 'task_100', title: 'Steady Hands', description: 'Complete one hundred tasks.', category: 'Productivity', icon: '🏅', target: 100 },
  { key: 'first_focus', title: 'Finding Focus', description: 'Complete your first focus session.', category: 'Focus', icon: '🎯', target: 1 },
  { key: 'focus_5', title: 'Deep Worker', description: 'Complete five focus sessions.', category: 'Focus', icon: '🧠', target: 5 },
  { key: 'focus_300', title: 'Five Hours In', description: 'Log 300 focus minutes.', category: 'Focus', icon: '⏱️', target: 300 },
  { key: 'first_book', title: 'Open a Book', description: 'Add your first book to the library.', category: 'Reading', icon: '📖', target: 1 },
  { key: 'book_3', title: 'Shelf Builder', description: 'Add three books to the library.', category: 'Reading', icon: '📚', target: 3 },
  { key: 'book_finished', title: 'The End', description: 'Finish your first book.', category: 'Reading', icon: '🌟', target: 1 },
  { key: 'pages_1000', title: 'Page Turner', description: 'Read one thousand pages.', category: 'Reading', icon: '🪶', target: 1000 },
  { key: 'first_game', title: 'Let the Games Begin', description: 'Play your first arcade game.', category: 'Games', icon: '🎮', target: 1 },
  { key: 'game_10', title: 'Arcade Regular', description: 'Play ten arcade games.', category: 'Games', icon: '🕹️', target: 10 },
  { key: 'game_win', title: 'Winner Winner', description: 'Win your first game.', category: 'Games', icon: '🏆', target: 1 },
  { key: 'high_score', title: 'Personal Best', description: 'Set a score above zero.', category: 'Games', icon: '📈', target: 1 },
  { key: 'first_bloom', title: 'In Full Bloom', description: 'Grow a plant to full bloom.', category: 'Garden', icon: '🌻', target: 1 },
  { key: 'garden_3', title: 'Little Conservatory', description: 'Grow three plants.', category: 'Garden', icon: '🌿', target: 3 },
  { key: 'garden_decor', title: 'Garden Designer', description: 'Place your first garden decoration.', category: 'Garden', icon: '🪴', target: 1 },
  { key: 'visitor', title: 'Good Neighbor', description: 'Meet a garden visitor.', category: 'Garden', icon: '🐸', target: 1 },
  { key: 'streak_3', title: 'Three in a Row', description: 'Build a three-day activity streak.', category: 'Streaks', icon: '🔥', target: 3 },
  { key: 'streak_7', title: 'A Full Week', description: 'Build a seven-day activity streak.', category: 'Streaks', icon: '🌞', target: 7 },
  { key: 'explore_3', title: 'Curious Mind', description: 'Use three different Haven spaces.', category: 'Exploration', icon: '🧭', target: 3 },
  { key: 'backup', title: 'Prepared', description: 'Export a Haven backup.', category: 'Exploration', icon: '💾', target: 1 },
];

const gradePoint = (grade: string): number => ({ 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, D: 1, F: 0 }[grade] ?? 0);

async function unlockAchievement(key: string): Promise<void> {
  const unlocked = (await storage.get<string[]>(`${userKey()}:unlocked-achievements`)) ?? [];
  if (!unlocked.includes(key)) await storage.set(`${userKey()}:unlocked-achievements`, [...unlocked, key]);
}

export async function localRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const [path] = endpoint.split('?');
  const data = await bodyValue(options);
  const method = options.method ?? 'GET';
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'auth') {
    if (parts[1] === 'register' || parts[1] === 'login') {
      const users = (await storage.get<LocalUser[]>('users')) ?? [];
      const existing = users.find((user) => user.email === data.email);
      const demoUser = data.email === 'bob@mark.com' && data.password === 'bobbb123'
        ? { id: id(), email: 'bob@mark.com', name: 'Weeee', theme: 'light', createdAt: now(), password: 'bobbb123' }
        : undefined;
      const resolvedUser = existing ?? demoUser;
      if (parts[1] === 'login' && (!resolvedUser || resolvedUser.password !== data.password)) throw new Error('Invalid email or password.');
      if (parts[1] === 'register' && existing) throw new Error('An account with that email already exists.');
      const user = resolvedUser ?? { id: id(), email: String(data.email), name: String(data.name), theme: 'light', createdAt: now(), password: String(data.password) };
      await storage.set('users', existing ? users : [...users, user]);
      localStorage.setItem('haven_user_id', user.id);
      await recordActivity('auth', existing ? 'Signed in to Haven' : 'Created a Haven account');
      return { user, token: `local-${user.id}` } as T;
    }
    if (parts[1] === 'me') {
      const users = (await storage.get<LocalUser[]>('users')) ?? [];
      const user = users.find((entry) => entry.id === userKey());
      if (!user) throw new Error('Session expired.');
      return { user } as T;
    }
    if (parts[1] === 'profile' && method === 'PUT') {
      const users = (await storage.get<LocalUser[]>('users')) ?? [];
      const index = users.findIndex((entry) => entry.id === userKey());
      if (index < 0) throw new Error('User not found.');
      users[index] = { ...users[index], ...data } as LocalUser;
      await storage.set('users', users);
      return { user: users[index] } as T;
    }
  }

  if (parts[0] === 'garden') {
    const plants = await getCollection<GardenPlant>('plants');
    const decorations = await getCollection<GardenDecoration>('decorations');
    if (method === 'GET' && parts.length === 1) return { plants, decorations } as T;
    if (parts[1] === 'plant' && method === 'POST') {
      const plant = baseRecord({ plantType: data.plantType, stage: 1, waterPoints: 0, plantedAt: now(), updatedAt: now() }) as unknown as GardenPlant;
      await saveCollection('plants', [...plants, plant]);
      await recordActivity('garden', `Planted a ${String(data.plantType).toLowerCase()} seed`);
      return plant as T;
    }
    if (parts[1] === 'water' && method === 'POST') {
      const index = plants.findIndex((plant) => plant.id === parts[2]);
      if (index < 0) throw new Error('Plant not found.');
      const lastWateredAt = plants[index].lastWateredAt ? new Date(plants[index].lastWateredAt).getTime() : 0;
      if (Date.now() - lastWateredAt < 10_000) throw new Error('This plant needs a little time to drink first.');
      const waterPoints = plants[index].waterPoints + 1;
      const plant = { ...plants[index], waterPoints, stage: Math.min(4, 1 + Math.floor(waterPoints / 30)), lastWateredAt: now(), updatedAt: now() };
      plants[index] = plant;
      await saveCollection('plants', plants);
      if (plant.stage === 4) await unlockAchievement('first_bloom');
      if (plant.stage === 4) await awardXp(10);
      await recordActivity('garden', 'Watered a garden plant', `Growth stage ${plant.stage}`);
      return plant as T;
    }
    if (parts[1] === 'plant' && method === 'DELETE') {
      await saveCollection('plants', plants.filter((plant) => plant.id !== parts[2]));
      return { id: parts[2] } as T;
    }
    if (parts[1] === 'visitor' && method === 'POST') {
      const visitorKey = `${userKey()}:garden-visitor:${dateKey()}`;
      const alreadyMet = Boolean(await storage.get<boolean>(visitorKey));
      if (!alreadyMet) {
        await storage.set(visitorKey, true);
        await awardXp(5);
      }
      return { visitor: ['frog', 'butterfly', 'bee', 'ladybug', 'snail'][new Date().getDate() % 5], reward: alreadyMet ? 0 : 5, alreadyMet } as T;
    }
    if (parts[1] === 'decorations' && method === 'POST') {
      const decoration = baseRecord({ ...data, placedX: Number(data.placedX ?? 0), placedY: Number(data.placedY ?? 0) }) as unknown as GardenDecoration;
      await saveCollection('decorations', [...decorations, decoration]);
      return decoration as T;
    }
    if (parts[1] === 'decorations' && method === 'DELETE') {
      await saveCollection('decorations', decorations.filter((decoration) => decoration.id !== parts[2]));
      return { id: parts[2] } as T;
    }
  }

  if (parts[0] === 'games' && method === 'GET') {
    return { scores: await getCollection<GameScore>('gameScores'), stats: (await storage.get<GameStatistic[]>(`${userKey()}:gameStats`)) ?? [] } as T;
  }
  if (parts[0] === 'games' && method === 'POST') {
    const scores = await getCollection<GameScore>('gameScores');
    const stats = (await storage.get<GameStatistic[]>(`${userKey()}:gameStats`)) ?? [];
    const scoreIndex = scores.findIndex((entry) => entry.gameKey === data.gameKey);
    const statIndex = stats.findIndex((entry) => entry.gameKey === data.gameKey);
    const previousScore = scoreIndex >= 0 ? scores[scoreIndex] : undefined;
    const previousStat = statIndex >= 0 ? stats[statIndex] : undefined;
    const gameScore: GameScore = { ...(previousScore ?? {}), id: previousScore?.id ?? id(), userId: userKey(), gameKey: String(data.gameKey), score: Number(data.score), highScore: Math.max(previousScore?.highScore ?? 0, Number(data.score)), statsJson: data.statsJson as string | undefined };
    const gameStat: GameStatistic = { ...(previousStat ?? {}), id: previousStat?.id ?? id(), userId: userKey(), gameKey: String(data.gameKey), gamesPlayed: (previousStat?.gamesPlayed ?? 0) + 1, gamesWon: (previousStat?.gamesWon ?? 0) + (data.won ? 1 : 0), bestScore: Math.max(previousStat?.bestScore ?? 0, Number(data.score)), currentStreak: data.won ? (previousStat?.currentStreak ?? 0) + 1 : 0, longestStreak: Math.max(previousStat?.longestStreak ?? 0, data.won ? (previousStat?.currentStreak ?? 0) + 1 : 0), extraStatsJson: data.extraStats ? JSON.stringify(data.extraStats) : previousStat?.extraStatsJson };
    if (scoreIndex >= 0) scores[scoreIndex] = gameScore; else scores.push(gameScore);
    if (statIndex >= 0) stats[statIndex] = gameStat; else stats.push(gameStat);
    await saveCollection('gameScores', scores);
    await storage.set(`${userKey()}:gameStats`, stats);
    await unlockAchievement('first_game');
    if (Number(data.score) > 0) await awardXp(5);
    await recordActivity('game', `Played ${String(data.gameKey)}`, `Score ${Number(data.score)}`);
    return { gameScore, gameStat } as T;
  }
  if (parts[0] === 'achievements') {
    const unlocked = (await storage.get<string[]>(`${userKey()}:unlocked-achievements`)) ?? [];
    if (method === 'GET') return defaultAchievements().map((achievement) => ({ ...achievement, progress: unlocked.includes(achievement.key) ? achievement.target : 0, unlocked: unlocked.includes(achievement.key) })) as T;
    if (method === 'POST') {
      const key = String(data.achievementKey);
      await storage.set(`${userKey()}:unlocked-achievements`, [...new Set([...unlocked, key])]);
      return { ...defaultAchievements().find((achievement) => achievement.key === key), unlocked: true } as T;
    }
  }

  if (parts[0] === 'challenges') {
    const key = `${userKey()}:challenges:${dateKey()}`;
    const challenges = (await storage.get<DailyChallenge[]>(key)) ?? [{ key: 'focus', title: 'Make Space', description: 'Complete a focus session.', targetValue: 1, reward: '25 XP' }];
    if (method === 'GET') return { dateStr: dateKey(), challenges } as T;
    const challenge = challenges.find((entry) => entry.key === data.challengeKey);
    if (!challenge) throw new Error('Challenge not found.');
    challenge.currentValue = Math.min(challenge.targetValue, (challenge.currentValue ?? 0) + Number(data.increment ?? 1));
    challenge.completed = challenge.currentValue >= challenge.targetValue;
    await storage.set(key, challenges);
    return challenge as T;
  }

  if (parts[0] === 'companion') {
    const companion = (await storage.get<Companion>(`${userKey()}:companion`)) ?? { id: id(), userId: userKey(), name: 'Bobbb ', type: 'CAT', equippedAccessory: 'none', unlockedAccessoriesJson: '["none"]', moodState: 'HAPPY' };
    if (method === 'PUT') return storage.set(`${userKey()}:companion`, { ...companion, ...data }) as Promise<T>;
    return companion as T;
  }

  if (parts[0] === 'library' && parts[1] === 'books' && parts[3] === 'notes' && method === 'POST') {
    const notes = await getCollection<BookNote>('bookNotes');
    const note = baseRecord({ ...data, bookId: parts[2] }) as unknown as BookNote;
    await saveCollection('bookNotes', [...notes, note]);
    return note as T;
  }

  const collectionMap: Record<string, Collection> = { tasks: 'tasks', subjects: 'subjects', assignments: 'assignments', timetable: 'timetable', gpa: 'gpa', resources: 'resources', books: 'books', quotes: 'quotes', journal: 'journal', sessions: 'focus', focus: 'focus', mood: 'moods' };
  const collection = collectionMap[parts[1] ?? parts[0]];
  if (!collection) throw new Error(`Unsupported local endpoint: ${endpoint}`);
  const records = await getCollection<RecordValue>(collection);
  if (method === 'GET') {
    if (collection === 'tasks') {
      const recurring = records.filter((record) => {
        const daysSinceGeneration = record.lastGeneratedDate ? Math.floor((Date.parse(dateKey()) - Date.parse(String(record.lastGeneratedDate))) / 86_400_000) : 1;
        return record.recurrence === 'DAILY' && daysSinceGeneration >= 1 || record.recurrence === 'WEEKLY' && daysSinceGeneration >= 7;
      });
      if (recurring.length > 0) {
        recurring.forEach((record) => {
          record.lastGeneratedDate = dateKey();
          records.push({ ...record, id: id(), status: 'TODO', createdAt: now(), completedAt: undefined, recurrence: 'NONE', dueDate: now() });
        });
        await saveCollection(collection, records);
      }
    }
    if (parts[2]) return (collection === 'books' ? bookForClient(records.find((record) => record.id === parts[2]) ?? {}) : records.find((record) => record.id === parts[2])) as T;
    if (collection === 'moods') return (records.find((record) => record.dateStr === dateKey()) ?? null) as T;
    if (collection === 'gpa') return records.map((record) => ({ ...record, gradePoints: Number(record.gradePoints ?? gradePoint(String(record.grade))) })) as T;
    return (collection === 'books' ? records.map(bookForClient) : records) as T;
  }
  if (method === 'DELETE') {
    await saveCollection(collection, records.filter((record) => record.id !== parts[2]));
    return { id: parts[2] } as T;
  }
  const normalizedData = collection === 'gpa'
    ? { ...data, gradePoints: Number(data.gradePoints ?? gradePoint(String(data.grade))) }
    : data;
  const coverUrl = collection === 'books' && data.coverFile instanceof File ? await fileToDataUrl(data.coverFile) : data.coverUrl;
  const bookData = collection === 'books' && data.bookFile instanceof File
    ? { ...normalizedData, coverUrl, filePath: data.bookFile, fileType: String(data.bookFile.name).toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF' }
    : collection === 'books' ? { ...normalizedData, coverUrl } : normalizedData;
  delete bookData.bookFile;
  delete bookData.coverFile;
  const record = baseRecord(bookData) as RecordValue;
  if (parts[2]) {
    const index = records.findIndex((entry) => entry.id === parts[2]);
    const wasCompleted = records[index]?.status === 'COMPLETED';
    const updated: RecordValue = { ...records[index], ...bookData, id: parts[2], userId: userKey(), completedAt: bookData.status === 'COMPLETED' ? now() : undefined };
    records[index] = updated;
    await saveCollection(collection, records);
    if (collection === 'tasks' && updated.status === 'COMPLETED') await unlockAchievement('first_task');
    if (collection === 'tasks' && updated.status === 'COMPLETED' && !wasCompleted) await awardXp(15);
    return (collection === 'books' ? bookForClient(updated) : updated) as T;
  }
  await saveCollection(collection, [...records, record]);
  if (collection === 'books') { await unlockAchievement('first_book'); await recordActivity('reading', `Added ${String(record.title || 'a book')} to the library`); }
  if (collection === 'focus' && record.type === 'FOCUS') {
    await unlockAchievement('first_focus');
    await awardXp(25);
    await recordActivity('focus', `Completed a ${String(record.durationMinutes)} minute focus session`);
  }
  if (collection === 'tasks') await recordActivity('task', `Added task: ${String(record.title || 'Untitled task')}`);
  return (collection === 'books' ? bookForClient(record) : record) as T;
}