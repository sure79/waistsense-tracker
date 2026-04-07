'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TabBar from '@/components/TabBar';
import { checkAndFireScheduledNotifications, checkAndSendStreakWarning } from '@/lib/notifications';

const TodayTab = dynamic(() => import('@/components/TodayTab'), { ssr: false });
const CheckTab = dynamic(() => import('@/components/CheckTab'), { ssr: false });
const StatusTab = dynamic(() => import('@/components/StatusTab'), { ssr: false });
const SettingsTab = dynamic(() => import('@/components/SettingsTab'), { ssr: false });

export default function Home() {
  const [activeTab, setActiveTab] = useState('today');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 앱 열릴 때 즉시 한 번 체크
    checkAndFireScheduledNotifications();
    checkAndSendStreakWarning();

    // 이후 매 1분마다 스케줄 체크
    const timer = setInterval(() => {
      checkAndFireScheduledNotifications();
      checkAndSendStreakWarning();
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">WS</span>
          </div>
          <p className="text-primary font-semibold">WaistSense Tracker</p>
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">WS</span>
            </div>
            <span className="font-bold text-navy dark:text-white">WaistSense</span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-safe overflow-y-auto">
        <div className={activeTab === 'today' ? 'block' : 'hidden'}>
          <TodayTab />
        </div>
        <div className={activeTab === 'check' ? 'block' : 'hidden'}>
          <CheckTab />
        </div>
        <div className={activeTab === 'status' ? 'block' : 'hidden'}>
          <StatusTab />
        </div>
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <SettingsTab />
        </div>
      </main>

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
