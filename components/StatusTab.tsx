'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WEEKS, MILESTONES, TOTAL_BUDGET, getCurrentWeek } from '@/lib/data';
import {
  getCompletedTasks,
  getCosts,
  saveCost,
  deleteCost,
  getTotalCost,
} from '@/lib/storage';

export default function StatusTab() {
  const [completedTasks, setCompletedTasks] = useState<Record<string, { completedAt: string }>>({});
  const [costs, setCosts] = useState<ReturnType<typeof getCosts>>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [showAddCost, setShowAddCost] = useState(false);
  const [costForm, setCostForm] = useState({ amount: '', description: '', week: '1' });

  useEffect(() => {
    setMounted(true);
    setCompletedTasks(getCompletedTasks());
    setCosts(getCosts());
    setTotalCost(getTotalCost());
    setCurrentWeek(getCurrentWeek());
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Overall stats
  const allTasks = WEEKS.flatMap((w) => w.tasks);
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter((t) => completedTasks[t.id]).length;
  const overallPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: '완료', value: completedCount, color: '#1B998B' },
    { name: '미완료', value: totalTasks - completedCount, color: '#E5E7EB' },
  ];

  // Bar chart data
  const barData = WEEKS.map((week) => {
    const weekCompleted = week.tasks.filter((t) => completedTasks[t.id]).length;
    const weekTotal = week.tasks.length;
    const status = week.week < currentWeek ? 'past' : week.week === currentWeek ? 'current' : 'future';
    return {
      name: week.label,
      completed: weekCompleted,
      remaining: weekTotal - weekCompleted,
      total: weekTotal,
      status,
    };
  });

  const budgetPct = Math.min(100, Math.round((totalCost / TOTAL_BUDGET) * 100));

  const handleAddCost = () => {
    const amount = parseInt(costForm.amount.replace(/,/g, ''));
    if (!amount || !costForm.description) return;
    saveCost({
      date: new Date().toISOString().split('T')[0],
      amount,
      description: costForm.description,
      week: parseInt(costForm.week),
    });
    setCosts(getCosts());
    setTotalCost(getTotalCost());
    setCostForm({ amount: '', description: '', week: String(currentWeek) });
    setShowAddCost(false);
  };

  const handleDeleteCost = (id: string) => {
    deleteCost(id);
    setCosts(getCosts());
    setTotalCost(getTotalCost());
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h2 className="text-xl font-bold text-navy dark:text-white">프로젝트 현황</h2>

      {/* Overall Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-navy dark:text-white mb-4">전체 진행률</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <PieChart width={120} height={120}>
              <Pie
                data={pieData}
                cx={55}
                cy={55}
                innerRadius={38}
                outerRadius={55}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-primary">{overallPct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-3xl font-black text-navy dark:text-white">{completedCount}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">/ {totalTasks}개 완료</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-gray-500 dark:text-gray-400">완료 {completedCount}개</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">남은 {totalTasks - completedCount}개</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-navy dark:text-white mb-4">주차별 진행</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              interval={3}
            />
            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value, name) => [value, name === 'completed' ? '완료' : '남은']}
            />
            <Bar dataKey="completed" stackId="a" fill="#1B998B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="remaining" stackId="a" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-navy dark:text-white">예산 관리</h3>
          <button
            onClick={() => setShowAddCost(!showAddCost)}
            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hover:bg-primary/20 transition-colors"
          >
            + 지출 추가
          </button>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-black text-navy dark:text-white">₩{totalCost.toLocaleString()}</span>
          <span className="text-sm text-gray-400 dark:text-gray-500 pb-0.5">/ ₩{TOTAL_BUDGET.toLocaleString()}</span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              budgetPct >= 90 ? 'bg-danger' : budgetPct >= 70 ? 'bg-yellow-400' : 'bg-primary'
            }`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>

        {showAddCost && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3 space-y-2">
            <input
              type="number"
              placeholder="금액 (원)"
              value={costForm.amount}
              onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-navy dark:text-white focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="내역 (예: ESP32 구매)"
              value={costForm.description}
              onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-navy dark:text-white focus:outline-none focus:border-primary"
            />
            <select
              value={costForm.week}
              onChange={(e) => setCostForm({ ...costForm, week: e.target.value })}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-navy dark:text-white focus:outline-none focus:border-primary"
            >
              {WEEKS.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.label} - {w.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCost}
              className="w-full bg-primary text-white text-sm font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              저장
            </button>
          </div>
        )}

        {costs.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {costs.slice().reverse().map((cost) => (
              <div
                key={cost.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-xs font-medium text-navy dark:text-white">{cost.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">W{cost.week} · {cost.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-navy dark:text-white">₩{cost.amount.toLocaleString()}</span>
                  <button
                    onClick={() => handleDeleteCost(cost.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-danger transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {costs.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">아직 지출 내역이 없어요</p>
        )}
      </div>

      {/* Milestone Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-navy dark:text-white mb-4">마일스톤</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />
          <div className="space-y-4">
            {MILESTONES.map((milestone) => {
              const week = WEEKS.find((w) => w.week === milestone.week);
              const weekTasks = week ? week.tasks : [];
              const allDone = weekTasks.length > 0 && weekTasks.every((t) => completedTasks[t.id]);
              const isCurrent = milestone.week === currentWeek;
              const isPast = milestone.week < currentWeek;

              return (
                <div key={milestone.week} className="flex items-center gap-3 pl-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all duration-300 ${
                      allDone
                        ? 'bg-primary border-primary'
                        : isCurrent
                        ? 'bg-teal-50 border-primary dark:bg-teal-900/30'
                        : isPast
                        ? 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                  >
                    {allDone ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{milestone.week}</span>
                    )}
                  </div>
                  <div className={`flex-1 ${allDone ? '' : isPast ? 'opacity-60' : ''}`}>
                    <p className={`text-sm font-semibold ${allDone ? 'text-primary' : isCurrent ? 'text-primary' : 'text-navy dark:text-white'}`}>
                      {milestone.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      W{milestone.week} · {week?.dateRange}
                    </p>
                  </div>
                  {allDone && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">달성!</span>
                  )}
                  {isCurrent && !allDone && (
                    <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-primary px-2 py-0.5 rounded-full font-medium">진행중</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
