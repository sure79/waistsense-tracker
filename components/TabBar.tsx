'use client';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'today', label: '오늘', icon: '🏠' },
  { id: 'check', label: '체크', icon: '✅' },
  { id: 'status', label: '현황', icon: '📊' },
  { id: 'settings', label: '설정', icon: '⚙️' },
];

interface TabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 dark:bg-gray-900 dark:border-gray-800 tab-bar-height shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
              aria-label={tab.label}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
