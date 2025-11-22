import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar removed as requested */}

        <button 
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title={isDarkMode ? 'روشن' : 'تاریک'}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};