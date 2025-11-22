import React from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  MessageSquareText, 
  GitFork, 
  LogOut,
  Radio,
  History
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  username: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, setIsOpen, onLogout, username }) => {
  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'endpoints', label: 'سیم‌کارت‌ها', icon: Smartphone },
    { id: 'messages', label: 'پیام‌های دریافتی', icon: MessageSquareText },
    { id: 'delivery-history', label: 'تاریخچه ارسال‌ها', icon: History },
    { id: 'rules', label: 'قوانین و کانال‌ها', icon: GitFork },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        className={`fixed top-0 right-0 z-30 h-screen w-64 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} shadow-xl lg:shadow-none`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="text-primary-600 dark:text-primary-500 h-6 w-6" />
            <h1 className="text-xl font-bold tracking-wider text-gray-900 dark:text-white">SimGate Panel</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-6 px-2">
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">منوی اصلی</p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-slate-500'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="px-2">
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">حساب کاربری</p>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              خروج از سیستم
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm uppercase">
              {username ? username.slice(0, 2) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate" dir="ltr">{username || 'User'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};