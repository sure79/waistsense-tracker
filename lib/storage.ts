export interface CompletedTasks {
  [taskId: string]: {
    completedAt: string;
    note?: string;
  };
}

export interface CostEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  week: number;
}

export interface AppSettings {
  dailyAlarmHour: number;
  dailyAlarmMinute: number;
  weeklyReviewEnabled: boolean;
  streakWarningEnabled: boolean;
  darkMode: boolean;
  notificationPermission: string;
}

const KEYS = {
  COMPLETED_TASKS: 'waistsense_completed',
  STREAK: 'waistsense_streak',
  LAST_CHECK_DATE: 'waistsense_last_check',
  COSTS: 'waistsense_costs',
  SETTINGS: 'waistsense_settings',
  NOTES: 'waistsense_notes',
  ENCOURAGEMENT_INDEX: 'waistsense_enc_idx',
  TASKS_TODAY: 'waistsense_tasks_today',
  TASKS_TODAY_DATE: 'waistsense_tasks_today_date',
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function safeGet<T>(key: string, defaultValue: T): T {
  if (!isClient()) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function safeSet(key: string, value: unknown): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

// Completed tasks
export function getCompletedTasks(): CompletedTasks {
  return safeGet<CompletedTasks>(KEYS.COMPLETED_TASKS, {});
}

export function markTaskComplete(taskId: string, note?: string): void {
  const completed = getCompletedTasks();
  completed[taskId] = {
    completedAt: new Date().toISOString(),
    note,
  };
  safeSet(KEYS.COMPLETED_TASKS, completed);
  updateStreak();
  incrementTodayCount();
}

export function unmarkTaskComplete(taskId: string): void {
  const completed = getCompletedTasks();
  delete completed[taskId];
  safeSet(KEYS.COMPLETED_TASKS, completed);
}

export function isTaskComplete(taskId: string): boolean {
  const completed = getCompletedTasks();
  return !!completed[taskId];
}

// Today's task count
export function getTodayTaskCount(): number {
  if (!isClient()) return 0;
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(KEYS.TASKS_TODAY_DATE);
  if (savedDate !== today) {
    localStorage.setItem(KEYS.TASKS_TODAY_DATE, today);
    localStorage.setItem(KEYS.TASKS_TODAY, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(KEYS.TASKS_TODAY) || '0', 10);
}

function incrementTodayCount(): void {
  if (!isClient()) return;
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(KEYS.TASKS_TODAY_DATE);
  if (savedDate !== today) {
    localStorage.setItem(KEYS.TASKS_TODAY_DATE, today);
    localStorage.setItem(KEYS.TASKS_TODAY, '1');
  } else {
    const count = parseInt(localStorage.getItem(KEYS.TASKS_TODAY) || '0', 10);
    localStorage.setItem(KEYS.TASKS_TODAY, String(count + 1));
  }
}

// Streak
export interface StreakData {
  count: number;
  lastDate: string;
}

export function getStreak(): StreakData {
  return safeGet<StreakData>(KEYS.STREAK, { count: 0, lastDate: '' });
}

export function updateStreak(): void {
  const streak = getStreak();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (streak.lastDate === today) {
    // Already updated today
    return;
  } else if (streak.lastDate === yesterday) {
    // Continue streak
    safeSet(KEYS.STREAK, { count: streak.count + 1, lastDate: today });
  } else {
    // Start new streak
    safeSet(KEYS.STREAK, { count: 1, lastDate: today });
  }
}

export function getStreakCount(): number {
  const streak = getStreak();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (streak.lastDate === today || streak.lastDate === yesterday) {
    return streak.count;
  }
  return 0;
}

// Costs
export function getCosts(): CostEntry[] {
  return safeGet<CostEntry[]>(KEYS.COSTS, []);
}

export function saveCost(entry: Omit<CostEntry, 'id'>): void {
  const costs = getCosts();
  costs.push({ ...entry, id: Date.now().toString() });
  safeSet(KEYS.COSTS, costs);
}

export function deleteCost(id: string): void {
  const costs = getCosts().filter((c) => c.id !== id);
  safeSet(KEYS.COSTS, costs);
}

export function getTotalCost(): number {
  return getCosts().reduce((sum, c) => sum + c.amount, 0);
}

// Settings
const DEFAULT_SETTINGS: AppSettings = {
  dailyAlarmHour: 20,
  dailyAlarmMinute: 0,
  weeklyReviewEnabled: true,
  streakWarningEnabled: true,
  darkMode: false,
  notificationPermission: 'default',
};

export function getSettings(): AppSettings {
  return safeGet<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  safeSet(KEYS.SETTINGS, { ...current, ...settings });
}

// Notes per task
export function getNotes(): Record<string, string> {
  return safeGet<Record<string, string>>(KEYS.NOTES, {});
}

export function saveNote(taskId: string, note: string): void {
  const notes = getNotes();
  notes[taskId] = note;
  safeSet(KEYS.NOTES, notes);
}

// Encouragement index
export function getEncouragementIndex(max: number): number {
  if (!isClient()) return 0;
  const today = new Date().toDateString();
  const stored = localStorage.getItem(KEYS.ENCOURAGEMENT_INDEX);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed.index;
    } catch {}
  }
  const newIndex = Math.floor(Math.random() * max);
  localStorage.setItem(KEYS.ENCOURAGEMENT_INDEX, JSON.stringify({ date: today, index: newIndex }));
  return newIndex;
}

export function cycleEncouragementIndex(current: number, max: number): number {
  const next = (current + 1) % max;
  if (isClient()) {
    const today = new Date().toDateString();
    localStorage.setItem(KEYS.ENCOURAGEMENT_INDEX, JSON.stringify({ date: today, index: next }));
  }
  return next;
}

// Export / Import / Reset
export function exportData(): string {
  if (!isClient()) return '{}';
  const data: Record<string, unknown> = {};
  Object.entries(KEYS).forEach(([, value]) => {
    const item = localStorage.getItem(value);
    if (item) data[value] = JSON.parse(item);
  });
  return JSON.stringify(data, null, 2);
}

export function importData(jsonStr: string): boolean {
  if (!isClient()) return false;
  try {
    const data = JSON.parse(jsonStr) as Record<string, unknown>;
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return true;
  } catch {
    return false;
  }
}

export function resetData(): void {
  if (!isClient()) return;
  Object.values(KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Statistics
export function getWeekCompletionStats(weekTasks: { id: string }[]): { completed: number; total: number; pct: number } {
  const completedTasks = getCompletedTasks();
  const total = weekTasks.length;
  const completed = weekTasks.filter((t) => completedTasks[t.id]).length;
  return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
