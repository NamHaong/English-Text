import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from '../types/vocabulary';

const PROGRESS_KEY = '@english_island_progress_v1';

/** Local calendar date (YYYY-MM-DD). toISOString() would use UTC and shift the day near midnight. */
const getLocalDateString = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Whole days between two YYYY-MM-DD strings (DST-safe, done in UTC). */
const diffInDays = (from: string, to: string): number => {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
};

/** Always returns a fresh object so callers can never mutate shared defaults. */
export const createDefaultProgress = (): UserProgress => ({
  currentIndex: 0,
  memorizedIds: [],
  streakDays: 1,
  lastStudyDate: getLocalDateString(),
  totalTested: 0,
  correctTested: 0,
});

/** Merge stored data with defaults so missing/corrupt fields never crash the app. */
const sanitizeProgress = (value: unknown): UserProgress => {
  const base = createDefaultProgress();
  if (!value || typeof value !== 'object') return base;
  const v = value as Partial<UserProgress>;
  return {
    currentIndex: Number.isFinite(v.currentIndex) ? Math.max(0, v.currentIndex as number) : base.currentIndex,
    memorizedIds: Array.isArray(v.memorizedIds)
      ? Array.from(new Set(v.memorizedIds.filter((id): id is string => typeof id === 'string')))
      : base.memorizedIds,
    streakDays: Number.isFinite(v.streakDays) && (v.streakDays as number) > 0 ? (v.streakDays as number) : base.streakDays,
    lastStudyDate:
      typeof v.lastStudyDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.lastStudyDate)
        ? v.lastStudyDate
        : base.lastStudyDate,
    totalTested: Number.isFinite(v.totalTested) ? (v.totalTested as number) : 0,
    correctTested: Number.isFinite(v.correctTested) ? (v.correctTested as number) : 0,
  };
};

// Serialise read-modify-write operations so rapid taps can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
const withLock = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
};

const readProgress = async (): Promise<UserProgress> => {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = sanitizeProgress(JSON.parse(raw));

    // Daily streak update
    const today = getLocalDateString();
    if (parsed.lastStudyDate !== today) {
      const diff = diffInDays(parsed.lastStudyDate, today);
      if (diff === 1) {
        parsed.streakDays += 1;
      } else if (diff !== 0) {
        parsed.streakDays = 1; // gap (or clock moved backwards) resets the streak
      }
      parsed.lastStudyDate = today;
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (error) {
    console.error('Error loading progress:', error);
    return createDefaultProgress();
  }
};

const writeProgress = async (progress: UserProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const getStoredProgress = (): Promise<UserProgress> => withLock(readProgress);

export const saveProgress = (progress: UserProgress): Promise<void> =>
  withLock(() => writeProgress(progress));

export const markWordMemorized = (wordId: string): Promise<UserProgress> =>
  withLock(async () => {
    const current = await readProgress();
    if (!current.memorizedIds.includes(wordId)) {
      current.memorizedIds = [...current.memorizedIds, wordId];
      await writeProgress(current);
    }
    return current;
  });

export const unmarkWordMemorized = (wordId: string): Promise<UserProgress> =>
  withLock(async () => {
    const current = await readProgress();
    current.memorizedIds = current.memorizedIds.filter((id) => id !== wordId);
    await writeProgress(current);
    return current;
  });

export const updateCurrentIndex = (index: number): Promise<UserProgress> =>
  withLock(async () => {
    const current = await readProgress();
    current.currentIndex = index;
    await writeProgress(current);
    return current;
  });

export const recordTestResult = (isCorrect: boolean): Promise<UserProgress> =>
  withLock(async () => {
    const current = await readProgress();
    current.totalTested += 1;
    if (isCorrect) current.correctTested += 1;
    await writeProgress(current);
    return current;
  });
