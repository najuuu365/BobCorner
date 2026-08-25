export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  theme?: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  color: string;
  icon: string;
  description?: string;
  tasks?: Task[];
  assignments?: Assignment[];
  resources?: SubjectResource[];
}

export interface Task {
  id: string;
  userId: string;
  subjectId?: string;
  subject?: Subject;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  estimatedMinutes?: number;
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY';
  completedAt?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  userId: string;
  subjectId: string;
  subject?: Subject;
  title: string;
  description?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  dueDate: string;
  totalMarks?: number;
  gainedMarks?: number;
}

export interface TimetableEntry {
  id: string;
  userId: string;
  subjectId: string;
  subject?: Subject;
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string;
  endTime: string;
  room?: string;
  professor?: string;
}

export interface GpaRecord {
  id: string;
  userId: string;
  semester: string;
  courseName: string;
  credits: number;
  grade: string;
  gradePoints: number;
}

export interface SubjectResource {
  id: string;
  userId: string;
  subjectId: string;
  subject?: Subject;
  title: string;
  url?: string;
  type: 'LINK' | 'PDF' | 'DOCUMENT' | 'NOTE';
  note?: string;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  filePath?: string;
  fileType: 'EPUB' | 'PDF' | 'NONE';
  status: 'WANT_TO_READ' | 'READING' | 'FINISHED' | 'ON_HOLD';
  rating?: number;
  totalPages?: number;
  currentPage?: number;
  currentCfi?: string;
  genre?: string;
  favorite: boolean;
  notes?: BookNote[];
  quotes?: BookQuote[];
  bookmarks?: Bookmark[];
  journalEntries?: ReadingJournalEntry[];
  updatedAt?: string;
}

export interface BookNote {
  id: string;
  userId: string;
  bookId: string;
  chapterTitle?: string;
  pageNumber?: number;
  content: string;
  createdAt: string;
}

export interface BookQuote {
  id: string;
  userId: string;
  bookId?: string;
  book?: Book;
  quote: string;
  author: string;
  sourceBookTitle?: string;
  pageNumber?: number;
  isFavorite: boolean;
  createdAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  cfiOrPage: string;
  label: string;
  createdAt: string;
}

export interface GameScore {
  id: string;
  userId: string;
  gameKey: string;
  score: number;
  highScore: number;
  statsJson?: string;
}

export interface GameStatistic {
  id: string;
  userId: string;
  gameKey: string;
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  extraStatsJson?: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  durationMinutes: number;
  type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  completed: boolean;
  createdAt: string;
  notes?: string;
}

export interface Companion {
  id: string;
  userId: string;
  name: string;
  type: string;
  equippedAccessory?: string;
  unlockedAccessoriesJson: string;
  moodState: 'HAPPY' | 'SLEEPY' | 'FOCUSED' | 'CELEBRATING';
}

export interface DailyChallenge {
  key: string;
  title: string;
  description: string;
  targetValue: number;
  reward: string;
  currentValue?: number;
  completed?: boolean;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  category: 'Productivity' | 'Focus' | 'Reading' | 'Games' | 'Garden' | 'Exploration' | 'Streaks';
  rewardItem?: string;
  unlocked?: boolean;
  unlockedAt?: string;
  icon?: string;
  progress?: number;
  target?: number;
}

export interface MoodCheckIn {
  id: string;
  userId: string;
  mood: 'Great' | 'Good' | 'Meh' | 'Tired' | 'Motivated' | 'Surviving';
  dateStr: string;
  createdAt: string;
}

export interface ReadingJournalEntry {
  id: string;
  userId: string;
  bookId: string;
  book?: Book;
  entryDate: string;
  progressPages?: number;
  thoughts: string;
  favoriteCharacter?: string;
  rating?: number;
  promptAnswersJson?: string;
  createdAt: string;
}

export interface GardenPlant {
  id: string;
  userId: string;
  plantType: 'SUNFLOWER' | 'MONSTERA' | 'ROSES' | 'TULIPS' | 'SUCCULENT';
  stage: number; // 1 to 4
  waterPoints: number;
  plantedAt: string;
  updatedAt: string;
  lastWateredAt?: string;
}

export interface GardenDecoration {
  id: string;
  userId: string;
  itemKey: string;
  placedX: number;
  placedY: number;
}
