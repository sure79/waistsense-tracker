'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  WEEKS,
  ENCOURAGEMENTS,
  PROJECT_START,
  PROJECT_END,
  TOTAL_BUDGET,
  getTaskTypeBadge,
  getCurrentWeek,
} from '@/lib/data';
import {
  getCompletedTasks,
  markTaskComplete,
  getStreakCount,
  getTodayTaskCount,
  getEncouragementIndex,
  cycleEncouragementIndex,
  getTotalCost,
} from '@/lib/storage';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return '좋은 아침 ☀️';
  if (hour >= 12 && hour < 18) return '오늘도 고생 💪';
  if (hour >= 18 && hour < 21) return '퇴근 후 30분, 오늘의 미션 🔥';
  return '수고했어요, 내일을 위해 🌙';
}

function getFlameSize(streak: number): string {
  if (streak >= 15) return 'text-4xl';
  if (streak >= 8) return 'text-3xl';
  return 'text-2xl';
}

export default function TodayTab() {
  const [completedTasks, setCompletedTasks] = useState<Record<string, { completedAt: string; note?: string }>>({});
  const [streakCount, setStreakCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [encouragementIdx, setEncouragementIdx] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [praise, setPraise] = useState('');
  const [showPraise, setShowPraise] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCompletedTasks(getCompletedTasks());
    setStreakCount(getStreakCount());
    setTodayCount(getTodayTaskCount());
    setEncouragementIdx(getEncouragementIndex(ENCOURAGEMENTS.length));
    setTotalCost(getTotalCost());
    setCurrentWeek(getCurrentWeek());
  }, []);

  // Calculate D-Day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const projectEnd = new Date(PROJECT_END);
  projectEnd.setHours(0, 0, 0, 0);
  const projectStart = new Date(PROJECT_START);
  projectStart.setHours(0, 0, 0, 0);

  const dDay = Math.ceil((projectEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  // Find first incomplete task in current week
  const currentWeekData = WEEKS.find((w) => w.week === currentWeek) || WEEKS[0];
  const firstIncompleteTask = currentWeekData.tasks.find((t) => !completedTasks[t.id]);
  const weekCompletedCount = currentWeekData.tasks.filter((t) => completedTasks[t.id]).length;
  const weekTotalCount = currentWeekData.tasks.length;
  const weekPct = weekTotalCount > 0 ? Math.round((weekCompletedCount / weekTotalCount) * 100) : 0;

  const budgetPct = Math.min(100, Math.round((totalCost / TOTAL_BUDGET) * 100));
  const budgetColor = budgetPct >= 90 ? 'bg-danger' : budgetPct >= 70 ? 'bg-yellow-400' : 'bg-primary';

  const handleComplete = useCallback(async () => {
    if (!firstIncompleteTask || isCompleting) return;
    setIsCompleting(true);

    markTaskComplete(firstIncompleteTask.id);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(200);

    // Confetti
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1B998B', '#27AE60', '#1B2A4A', '#FFD700'],
      });
    } catch {}

    const newTodayCount = todayCount + 1;
    setTodayCount(newTodayCount);

    const praises = [
      '완벽해요! 🎉',
      '한 걸음 더! 💚',
      '오늘도 성장 중 🌱',
      '대단해요! ⭐',
      '계속 이 페이스로! 🔥',
    ];

    let praiseMsgText = praises[Math.floor(Math.random() * praises.length)];
    if (newTodayCount >= 2) {
      praiseMsgText = `오늘 ${newTodayCount}개나! 진짜 대단해요 🎊`;
    }

    setPraise(praiseMsgText);
    setShowPraise(true);
    setTimeout(() => setShowPraise(false), 3000);

    setCompletedTasks(getCompletedTasks());
    setStreakCount(getStreakCount());
    setIsCompleting(false);
  }, [firstIncompleteTask, isCompleting, todayCount]);

  const handleCycleEncouragement = () => {
    const next = cycleEncouragementIndex(encouragementIdx, ENCOURAGEMENTS.length);
    setEncouragementIdx(next);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allWeekDone = weekCompletedCount === weekTotalCount;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">서복동님,</p>
          <h1 className="text-xl font-bold text-navy dark:text-white">{getGreeting()}</h1>
        </div>
        <div className={`${getFlameSize(streakCount)} leading-none`}>
          {streakCount > 0 ? '🔥' : '💤'}
        </div>
      </div>

      {/* Streak */}
      {streakCount > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-4 py-2">
          <span className={`${getFlameSize(streakCount)}`}>🔥</span>
          <span className="font-bold text-orange-600 dark:text-orange-400">{streakCount}일 연속!</span>
          <span className="text-sm text-orange-500 dark:text-orange-400">유지 중이에요</span>
        </div>
      )}

      {/* D-Day card */}
      <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-teal-100 text-sm font-medium">와디즈 오픈까지</p>
            <p className="text-4xl font-black">
              {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-DAY!' : `D+${Math.abs(dDay)}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-teal-100 text-xs">현재 진행률</p>
            <p className="text-2xl font-bold">{progressPct}%</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-teal-100 text-xs mt-1.5">
          <span>2026.4.7</span>
          <span>{currentWeekData.label} - {currentWeekData.title}</span>
          <span>2026.9.22</span>
        </div>
      </div>

      {/* Today's Mission */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            오늘의 미션
          </span>
          <span className="text-xs text-gray-400">{currentWeekData.label} · {currentWeekData.dateRange}</span>
        </div>

        {allWeekDone ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold text-navy dark:text-white">이번 주 완료!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentWeekData.tasks.length}개 모두 완료했어요. 대단해요!
            </p>
          </div>
        ) : firstIncompleteTask ? (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">오늘 딱 이것만 하세요</p>
            <div className="flex items-start gap-2 mb-3">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 whitespace-nowrap ${getTaskTypeBadge(firstIncompleteTask.type).color}`}>
                {getTaskTypeBadge(firstIncompleteTask.type).label}
              </span>
              <p className="font-semibold text-navy dark:text-white leading-snug">
                {firstIncompleteTask.title}
              </p>
            </div>

            {firstIncompleteTask.firstAction && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">💡 첫 행동</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{firstIncompleteTask.firstAction}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">⏱ {firstIncompleteTask.duration}</span>
            </div>

            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 btn-pulse active:scale-95 disabled:opacity-70"
            >
              {isCompleting ? '처리 중...' : '완료! ✅'}
            </button>
          </>
        ) : null}
      </div>

      {/* Weekly Mini Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-navy dark:text-white">이번 주 진행</span>
          <span className="text-sm font-bold text-primary">{weekCompletedCount}/{weekTotalCount} ({weekPct}%)</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${weekPct}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {currentWeekData.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex-1 h-1.5 rounded-full ${completedTasks[task.id] ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}
            />
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-navy dark:text-white">예산 현황</span>
          <span className={`text-sm font-bold ${budgetPct >= 90 ? 'text-danger' : 'text-navy dark:text-white'}`}>
            ₩{totalCost.toLocaleString()} / ₩500,000
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`${budgetColor} rounded-full h-2 transition-all duration-500`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {budgetPct >= 90 ? '⚠️ 예산 주의' : budgetPct >= 70 ? '📊 예산 점검 필요' : `잔액 ₩${(TOTAL_BUDGET - totalCost).toLocaleString()}`}
        </p>
      </div>

      {/* Encouragement */}
      <button
        onClick={handleCycleEncouragement}
        className="w-full bg-navy dark:bg-gray-800 rounded-2xl p-4 text-left transition-all duration-200 active:scale-98 shadow-sm"
      >
        <p className="text-xs text-teal-300 dark:text-teal-400 mb-1">💬 오늘의 한 마디 (탭하면 바뀜)</p>
        <p className="text-sm text-white font-medium leading-relaxed">
          "{ENCOURAGEMENTS[encouragementIdx]}"
        </p>
      </button>

      {/* Praise Toast */}
      {showPraise && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-6 py-3 rounded-2xl shadow-2xl toast-enter">
          <p className="font-bold text-center">{praise}</p>
        </div>
      )}
    </div>
  );
}
