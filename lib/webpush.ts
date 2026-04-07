import webpush from 'web-push';
import { getSubscriptions, deleteSubscription } from './db';

export function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:sure7@waistsense.dev',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY!;
}

// KST = UTC+9
function getKSTNow(): { hour: number; minute: number; day: number } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    day: kst.getUTCDay(), // 0=일, 6=토
  };
}

// 평일 스케줄
const WEEKDAY_SLOTS = [
  {
    id: 'morning',
    hour: 7, minute: 50,
    title: '🌅 WaistSense — 아침 미션',
    body: '출근 전 딱 하나만! 오늘의 첫 번째 행동을 시작해봐요 💪',
  },
  {
    id: 'lunch',
    hour: 13, minute: 10,
    title: '☀️ WaistSense — 점심 체크',
    body: '점심 후 5분! 오늘 미션 확인했나요? 작은 한 걸음이면 돼요',
  },
  {
    id: 'evening',
    hour: 20, minute: 30,
    title: '🔥 WaistSense — 저녁 골든타임',
    body: '퇴근 후 30분! 오늘의 미션 지금 바로 시작해요. 딱 30분만!',
  },
];

// 주말 스케줄 (8시 기준 3시간 간격)
const WEEKEND_SLOTS = [
  { id: 'w0800', hour: 8,  minute: 0, title: '🌄 WaistSense — 주말 아침',    body: '주말 아침! 오늘 미션 2~3개 목표로 해봐요. 할 수 있어요! 🎯' },
  { id: 'w1100', hour: 11, minute: 0, title: '☀️ WaistSense — 오전 체크',    body: '오전 미션 진행 중인가요? 지금 시작해도 충분해요 👍' },
  { id: 'w1400', hour: 14, minute: 0, title: '🍽️ WaistSense — 오후 집중',    body: '점심 먹고 30분 집중! 가장 중요한 미션 하나만 해봐요' },
  { id: 'w1700', hour: 17, minute: 0, title: '🌅 WaistSense — 3시간 남았어요', body: '아직 기회 있어요! 저녁 전에 하나 더 완료해봐요 🔥' },
  { id: 'w2000', hour: 20, minute: 0, title: '🌙 WaistSense — 저녁 미션',    body: '오늘의 마지막 황금 시간! 지금까지 투자한 노력이 아까우니까 💪' },
  { id: 'w2300', hour: 23, minute: 0, title: '⭐ WaistSense — 하루 마무리',  body: '오늘 완료한 항목이 있으면 체크하고 마무리해요. 수고했어요 🌙' },
];

export interface NotificationSlot {
  id: string;
  title: string;
  body: string;
}

// 현재 KST 시각에 해당하는 알림 슬롯 반환 (±5분 윈도우)
export function getCurrentSlot(): NotificationSlot | null {
  const { hour, minute, day } = getKSTNow();
  const isWeekend = day === 0 || day === 6;
  const slots = isWeekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
  const totalNow = hour * 60 + minute;

  for (const slot of slots) {
    const totalTarget = slot.hour * 60 + slot.minute;
    if (totalNow >= totalTarget && totalNow < totalTarget + 10) {
      return { id: slot.id, title: slot.title, body: slot.body };
    }
  }
  return null;
}

export async function sendPushToAll(title: string, body: string): Promise<{ sent: number; failed: number }> {
  initVapid();
  const subs = await getSubscriptions();
  let sent = 0;
  let failed = 0;

  const payload = JSON.stringify({ title, body, icon: '/icon.svg', url: '/' });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          },
          payload
        );
        sent++;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'statusCode' in err) {
          const statusCode = (err as { statusCode: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // 만료된 구독 삭제
            await deleteSubscription(sub.endpoint);
          }
        }
        failed++;
      }
    })
  );

  return { sent, failed };
}
