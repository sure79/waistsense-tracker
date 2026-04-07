import { getSettings, getStreak } from './storage';

const NOTIF_SENT_KEY = 'waistsense_notif_sent';

// ─── 평일 알림 스케줄 (월~금) ───────────────────────────────────────────────
const WEEKDAY_SCHEDULE = [
  {
    id: 'morning',
    hour: 7,
    minute: 50,
    title: '🌅 WaistSense — 아침 미션',
    body: '출근 전 딱 하나만! 오늘의 첫 번째 행동을 시작해봐요 💪',
  },
  {
    id: 'lunch',
    hour: 13,
    minute: 10,
    title: '☀️ WaistSense — 점심 체크',
    body: '점심 후 5분! 오늘 미션 확인했나요? 작은 한 걸음이면 돼요',
  },
  {
    id: 'evening',
    hour: 20,
    minute: 30,
    title: '🔥 WaistSense — 저녁 골든타임',
    body: '퇴근 후 30분! 오늘의 미션 지금 바로 시작해요. 딱 30분만!',
  },
];

// ─── 주말 알림 스케줄 (토·일) — 8시 기준 3시간 간격 ────────────────────────
const WEEKEND_SCHEDULE = [
  {
    id: 'w0800',
    hour: 8,
    minute: 0,
    title: '🌄 WaistSense — 주말 아침',
    body: '주말 아침! 오늘 미션 2~3개 목표로 해봐요. 할 수 있어요! 🎯',
  },
  {
    id: 'w1100',
    hour: 11,
    minute: 0,
    title: '☀️ WaistSense — 오전 중간 체크',
    body: '오전 미션 진행 중인가요? 지금 시작해도 충분해요 👍',
  },
  {
    id: 'w1400',
    hour: 14,
    minute: 0,
    title: '🍽️ WaistSense — 오후 집중 타임',
    body: '점심 먹고 30분 집중! 가장 중요한 미션 하나만 해봐요',
  },
  {
    id: 'w1700',
    hour: 17,
    minute: 0,
    title: '🌅 WaistSense — 오후 3시간 남았어요',
    body: '아직 기회 있어요! 저녁 전에 하나 더 완료하면 어떨까요? 🔥',
  },
  {
    id: 'w2000',
    hour: 20,
    minute: 0,
    title: '🌙 WaistSense — 저녁 미션',
    body: '오늘의 마지막 황금 시간! 지금까지 투자한 노력이 아까우니까 💪',
  },
  {
    id: 'w2300',
    hour: 23,
    minute: 0,
    title: '⭐ WaistSense — 하루 마무리',
    body: '오늘 완료한 항목이 있으면 체크하고 마무리해요. 수고했어요 🌙',
  },
];

// ─── 현재 요일에 맞는 스케줄 반환 ───────────────────────────────────────────
export function getTodaySchedule() {
  const day = new Date().getDay(); // 0=일, 6=토
  const isWeekend = day === 0 || day === 6;
  return isWeekend ? WEEKEND_SCHEDULE : WEEKDAY_SCHEDULE;
}

// ─── 권한 요청 ────────────────────────────────────────────────────────────────
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  try {
    const { saveSettings } = await import('./storage');
    saveSettings({ notificationPermission: permission });
  } catch {}
  return permission;
}

// ─── 알림 전송 ────────────────────────────────────────────────────────────────
export function sendNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    // Service Worker를 통해 전송 (더 신뢰성 높음)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SEND_NOTIFICATION',
        title,
        body,
        icon: '/icon.svg',
      });
    } else {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
      } as NotificationOptions);
    }
  } catch {
    try {
      new Notification(title, { body, icon: '/icon.svg' } as NotificationOptions);
    } catch {}
  }
}

// ─── 오늘 전송된 알림 ID 목록 ─────────────────────────────────────────────────
function getSentToday(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(NOTIF_SENT_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as { date: string; sent: string[] };
    const today = new Date().toDateString();
    if (parsed.date !== today) return [];
    return parsed.sent;
  } catch {
    return [];
  }
}

function markSent(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toDateString();
    const sent = getSentToday();
    sent.push(id);
    localStorage.setItem(NOTIF_SENT_KEY, JSON.stringify({ date: today, sent }));
  } catch {}
}

// ─── 메인 체커 — 매 1분마다 호출 ─────────────────────────────────────────────
export function checkAndFireScheduledNotifications(): void {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const settings = getSettings();
  // 알림 전체 비활성화된 경우
  if (settings.notificationPermission === 'denied') return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const schedule = getTodaySchedule();
  const sentToday = getSentToday();

  for (const item of schedule) {
    if (sentToday.includes(item.id)) continue;

    // 정확한 시간 ±1분 범위 내에 있을 때 전송
    const totalNow = currentHour * 60 + currentMinute;
    const totalTarget = item.hour * 60 + item.minute;

    if (totalNow >= totalTarget && totalNow <= totalTarget + 1) {
      sendNotification(item.title, item.body);
      markSent(item.id);
      break; // 한 번에 하나씩만 전송
    }
  }
}

// ─── 스트릭 경고 ─────────────────────────────────────────────────────────────
export function checkAndSendStreakWarning(): void {
  if (typeof window === 'undefined') return;
  const settings = getSettings();
  if (!settings.streakWarningEnabled || Notification.permission !== 'granted') return;

  const streak = getStreak();
  if (!streak.lastDate) return;

  const lastDate = new Date(streak.lastDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 2) {
    const sentKey = 'waistsense_streak_warn_' + today.toDateString();
    if (typeof window !== 'undefined' && !localStorage.getItem(sentKey)) {
      sendNotification(
        '스트릭이 꺼지려 해요! 🔥',
        `${diffDays}일째 쉬고 있어요. 오늘 딱 한 가지만 완료하면 다시 불꽃이 살아나요!`
      );
      localStorage.setItem(sentKey, '1');
    }
  }
}

// ─── 주간 리뷰 알림 (일요일 21:00) ──────────────────────────────────────────
export function checkAndSendWeeklyReview(weekCompleted: number, weekTotal: number): void {
  if (typeof window === 'undefined') return;
  const settings = getSettings();
  if (!settings.weeklyReviewEnabled || Notification.permission !== 'granted') return;

  const now = new Date();
  if (now.getDay() !== 0) return; // 일요일만
  if (now.getHours() !== 21 || now.getMinutes() > 1) return;

  const sentKey = 'waistsense_weekly_' + now.toDateString();
  if (localStorage.getItem(sentKey)) return;

  const pct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
  const msg =
    pct >= 80
      ? `이번 주 ${weekCompleted}/${weekTotal} 완료! 훌륭해요 🎉 다음 주도 이 기세로!`
      : pct >= 50
      ? `이번 주 ${weekCompleted}/${weekTotal} 완료. 절반 넘겼어요 💪 밀린 건 내주 초에 해봐요!`
      : `이번 주 ${weekCompleted}/${weekTotal} 완료. 괜찮아요, 다음 주에 더 잘할 수 있어요 🌱`;

  sendNotification('📊 주간 리뷰', msg);
  localStorage.setItem(sentKey, '1');
}

// ─── scheduleDaily 호환성 유지 (SettingsTab에서 사용) ────────────────────────
export function scheduleDaily(hour: number, minute: number): void {
  // 현재는 고정 스케줄 사용 — 이 함수는 하위 호환성을 위해 유지
  const { saveSettings } = require('./storage');
  saveSettings({ dailyAlarmHour: hour, dailyAlarmMinute: minute });
}
