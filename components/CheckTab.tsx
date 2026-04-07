'use client';

import { useState, useEffect, useCallback } from 'react';
import { WEEKS, getTaskTypeBadge, getCurrentWeek } from '@/lib/data';
import {
  getCompletedTasks,
  markTaskComplete,
  unmarkTaskComplete,
  getNotes,
  saveNote,
} from '@/lib/storage';

type WeekStatus = 'completed' | 'current' | 'future' | 'overdue';

function getWeekStatus(weekNum: number, currentWeek: number): WeekStatus {
  if (weekNum < currentWeek) return 'completed';
  if (weekNum === currentWeek) return 'current';
  return 'future';
}

interface ToastState {
  visible: boolean;
  message: string;
}

export default function CheckTab() {
  const [completedTasks, setCompletedTasks] = useState<Record<string, { completedAt: string; note?: string }>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    setMounted(true);
    const cw = getCurrentWeek();
    setCurrentWeek(cw);
    setCompletedTasks(getCompletedTasks());
    setNotes(getNotes());
    setExpandedWeeks(new Set([cw]));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }, []);

  const handleToggleTask = useCallback(
    (taskId: string, weekNum: number) => {
      if (weekNum > currentWeek) {
        showToast('아직이에요! 현재 주에 집중하세요 😊');
        return;
      }

      const completed = getCompletedTasks();
      if (completed[taskId]) {
        unmarkTaskComplete(taskId);
      } else {
        markTaskComplete(taskId);
      }
      setCompletedTasks(getCompletedTasks());
    },
    [currentWeek, showToast]
  );

  const handleToggleWeek = useCallback((weekNum: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) {
        next.delete(weekNum);
      } else {
        next.add(weekNum);
      }
      return next;
    });
  }, []);

  const handleSaveNote = useCallback(
    (taskId: string) => {
      saveNote(taskId, noteInput);
      setNotes(getNotes());
      setEditingNote(null);
      setNoteInput('');
    },
    [noteInput]
  );

  const getWeekBorderClass = (status: WeekStatus): string => {
    switch (status) {
      case 'completed':
        return 'border-success/30';
      case 'current':
        return 'border-primary blink-teal';
      case 'overdue':
        return 'border-danger';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  const getWeekHeaderBg = (status: WeekStatus): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'current':
        return 'bg-teal-50 dark:bg-teal-900/20';
      case 'overdue':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const getWeekStatusBadge = (status: WeekStatus, weekNum: number, completed: number, total: number) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">✅완료</span>;
      case 'current':
        return <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">🔵현재</span>;
      case 'overdue':
        return <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded-full font-medium">⚠️밀림</span>;
      default:
        return <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-medium">⬜미래</span>;
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-navy dark:text-white">24주 체크리스트</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {Object.keys(completedTasks).length}개 완료 / {WEEKS.reduce((a, w) => a + w.tasks.length, 0)}개 전체
        </p>
      </div>

      <div className="space-y-3">
        {WEEKS.map((week) => {
          const status = getWeekStatus(week.week, currentWeek);
          const isExpanded = expandedWeeks.has(week.week);
          const weekCompleted = week.tasks.filter((t) => completedTasks[t.id]).length;
          const weekTotal = week.tasks.length;
          const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

          return (
            <div
              key={week.week}
              className={`rounded-2xl border-2 overflow-hidden ${getWeekBorderClass(status)}`}
            >
              {/* Week Header */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 ${getWeekHeaderBg(status)} transition-all duration-200`}
                onClick={() => handleToggleWeek(week.week)}
              >
                <div className="flex-1 flex items-center gap-2 text-left min-w-0">
                  <span className="font-bold text-sm text-navy dark:text-white whitespace-nowrap">
                    {week.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {week.dateRange}
                  </span>
                  <span className="font-medium text-sm text-navy dark:text-white truncate">
                    {week.title}
                  </span>
                  <span className="text-xs whitespace-nowrap">
                    {'⭐'.repeat(week.importance)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getWeekStatusBadge(status, week.week, weekCompleted, weekTotal)}
                  <span className="text-xs text-gray-400 whitespace-nowrap">{weekCompleted}/{weekTotal}</span>
                  <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>
              </button>

              {/* Progress bar */}
              {weekCompleted > 0 && (
                <div className="px-4 pt-1">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-primary rounded-full h-1 transition-all duration-500"
                      style={{ width: `${weekPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tasks */}
              {isExpanded && (
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-50 dark:divide-gray-700/50">
                  {week.tasks.map((task) => {
                    const isComplete = !!completedTasks[task.id];
                    const taskNote = notes[task.id] || '';
                    const isEditingThis = editingNote === task.id;

                    return (
                      <div key={task.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleTask(task.id, week.week)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                              isComplete
                                ? 'bg-primary border-primary'
                                : status === 'future'
                                ? 'border-gray-200 dark:border-gray-600 opacity-50'
                                : 'border-gray-300 dark:border-gray-500 hover:border-primary'
                            }`}
                          >
                            {isComplete && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {/* Task info row */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTaskTypeBadge(task.type).color}`}>
                                {getTaskTypeBadge(task.type).label}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">⏱{task.duration}</span>
                            </div>

                            <p className={`text-sm font-medium leading-snug ${isComplete ? 'line-through text-gray-400 dark:text-gray-500' : 'text-navy dark:text-white'}`}>
                              {task.title}
                            </p>

                            {/* First action hint */}
                            {task.firstAction && !isComplete && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                                → {task.firstAction}
                              </p>
                            )}

                            {/* Note */}
                            {isEditingThis ? (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  value={noteInput}
                                  onChange={(e) => setNoteInput(e.target.value)}
                                  placeholder="메모 입력..."
                                  className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-navy dark:text-white focus:outline-none focus:border-primary"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveNote(task.id);
                                    if (e.key === 'Escape') { setEditingNote(null); setNoteInput(''); }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveNote(task.id)}
                                  className="text-xs bg-primary text-white px-2 py-1.5 rounded-lg"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => { setEditingNote(null); setNoteInput(''); }}
                                  className="text-xs text-gray-400 px-1"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingNote(task.id);
                                  setNoteInput(taskNote);
                                }}
                                className="mt-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
                              >
                                {taskNote ? `📝 ${taskNote}` : '+ 메모'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-2xl toast-enter whitespace-nowrap">
          {toast.message}
        </div>
      )}
    </div>
  );
}
