'use client';

import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportData, importData, resetData } from '@/lib/storage';
import { getTodaySchedule } from '@/lib/notifications';

async function subscribeWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const res = await fetch('/api/push/vapid-public-key');
    const { publicKey } = await res.json();

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    });
    return true;
  } catch (e) {
    console.error('Web Push 구독 실패:', e);
    return false;
  }
}

async function unsubscribeWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    dailyAlarmHour: 20,
    dailyAlarmMinute: 0,
    weeklyReviewEnabled: true,
    streakWarningEnabled: true,
    darkMode: false,
    notificationPermission: 'default',
  });
  const [todaySchedule, setTodaySchedule] = useState<{ id: string; hour: number; minute: number; title: string; body: string }[]>([]);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = getSettings();
    setSettings(s);
    setTodaySchedule(getTodaySchedule());
    if (s.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // 현재 Web Push 구독 상태 확인
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushSubscribed(!!sub);
        });
      });
    }
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleToggle = (key: keyof typeof settings) => {
    const newValue = !settings[key as keyof typeof settings];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings as typeof settings);
    saveSettings({ [key]: newValue });

    if (key === 'darkMode') {
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleWebPushToggle = async () => {
    setPushLoading(true);
    if (pushSubscribed) {
      const ok = await unsubscribeWebPush();
      if (ok) {
        setPushSubscribed(false);
        showToast('백그라운드 알림을 해제했어요');
      } else {
        showToast('해제 실패. 다시 시도해주세요');
      }
    } else {
      const ok = await subscribeWebPush();
      if (ok) {
        setPushSubscribed(true);
        showToast('백그라운드 알림 활성화! 앱이 꺼져도 알림이 와요 🔔');
        saveSettings({ notificationPermission: 'granted' });
        setSettings((prev) => ({ ...prev, notificationPermission: 'granted' }));
      } else {
        showToast('알림 권한이 필요해요. 브라우저 설정에서 허용해주세요');
      }
    }
    setPushLoading(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waistsense-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('데이터를 내보냈어요 📦');
  };

  const handleImport = () => {
    if (!importInput.trim()) {
      showToast('JSON 데이터를 붙여넣어주세요');
      return;
    }
    const success = importData(importInput);
    if (success) {
      showToast('데이터를 가져왔어요! 앱을 새로고침해주세요 ✅');
      setImportInput('');
      setShowImport(false);
    } else {
      showToast('올바른 JSON 형식이 아니에요 ❌');
    }
  };

  const handleReset = () => {
    resetData();
    setShowResetConfirm(false);
    showToast('모든 데이터가 초기화됐어요');
    setTimeout(() => window.location.reload(), 1500);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h2 className="text-xl font-bold text-navy dark:text-white">설정</h2>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
          <h3 className="text-sm font-bold text-navy dark:text-white">알림 설정</h3>
        </div>

        {/* Web Push 구독 */}
        <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-navy dark:text-white">백그라운드 알림</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {pushSubscribed ? '✅ 활성화 — 앱이 꺼져도 알림이 와요' : '앱이 꺼져도 정시 알림 수신'}
              </p>
            </div>
            <button
              onClick={handleWebPushToggle}
              disabled={pushLoading}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                pushLoading
                  ? 'bg-gray-200 text-gray-400'
                  : pushSubscribed
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-danger'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {pushLoading ? '처리 중…' : pushSubscribed ? '해제' : '켜기'}
            </button>
          </div>

          {/* 알림 스케줄 표 */}
          <div className="space-y-1.5">
            {todaySchedule.map((item) => {
              const h = item.hour.toString().padStart(2, '0');
              const m = item.minute.toString().padStart(2, '0');
              const label = item.title.split('—')[1]?.trim() || item.title;
              return (
                <div key={item.id} className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                  <span className="text-sm font-mono font-bold text-primary">{h}:{m}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{label}</span>
                  <span className="text-xs">{pushSubscribed ? '🔔' : '🔕'}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {(() => {
              const day = new Date().getDay();
              return (day === 0 || day === 6) ? '주말 — 8시 기준 3시간 간격 (6회)' : '평일 — 아침·점심·저녁 (3회)';
            })()}
          </p>
        </div>

        {/* Weekly review */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50">
          <div>
            <p className="text-sm font-medium text-navy dark:text-white">주간 리뷰 알림</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">일요일 21:00</p>
          </div>
          <button
            onClick={() => handleToggle('weeklyReviewEnabled')}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
              settings.weeklyReviewEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                settings.weeklyReviewEnabled ? 'left-5.5 translate-x-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Streak warning */}
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy dark:text-white">스트릭 경고</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">2일 이상 미완료시</p>
          </div>
          <button
            onClick={() => handleToggle('streakWarningEnabled')}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
              settings.streakWarningEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                settings.streakWarningEnabled ? 'left-5.5 translate-x-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
          <h3 className="text-sm font-bold text-navy dark:text-white">화면 설정</h3>
        </div>
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy dark:text-white">다크 모드</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">어두운 테마 사용</p>
          </div>
          <button
            onClick={() => handleToggle('darkMode')}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
              settings.darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                settings.darkMode ? 'left-5.5 translate-x-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
          <h3 className="text-sm font-bold text-navy dark:text-white">데이터 관리</h3>
        </div>

        <button
          onClick={handleExport}
          className="w-full px-4 py-3.5 flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-navy dark:text-white">데이터 내보내기</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JSON 파일로 백업</p>
          </div>
          <span className="text-gray-300 dark:text-gray-600">›</span>
        </button>

        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full px-4 py-3.5 flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-navy dark:text-white">데이터 가져오기</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JSON 파일로 복원</p>
          </div>
          <span className="text-gray-300 dark:text-gray-600">›</span>
        </button>

        {showImport && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-50 dark:border-gray-700/50">
            <textarea
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="백업 JSON 데이터를 붙여넣어주세요..."
              className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-navy dark:text-white focus:outline-none focus:border-primary h-24 resize-none"
            />
            <button
              onClick={handleImport}
              className="mt-2 w-full bg-primary text-white text-sm font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              가져오기
            </button>
          </div>
        )}

        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-danger">데이터 초기화</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">모든 진행상황 삭제</p>
          </div>
          <span className="text-gray-300 dark:text-gray-600">›</span>
        </button>
      </div>

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <h3 className="text-lg font-bold text-navy dark:text-white mb-2">정말 초기화할까요?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              모든 완료 내역, 메모, 비용 데이터가 삭제됩니다. 되돌릴 수 없어요.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-navy dark:text-white font-medium py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-danger text-white font-medium py-2.5 rounded-xl hover:bg-danger/90 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-black text-lg">WS</span>
        </div>
        <p className="font-bold text-navy dark:text-white">WaistSense Tracker</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">v1.0.0 | 서복동</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">2026.4.7 ~ 2026.9.22</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-2xl toast-enter whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
