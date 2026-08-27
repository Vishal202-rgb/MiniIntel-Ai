import React from 'react';
import { Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 w-full z-50 h-16 bg-white border-b border-neutral-200 dark:bg-dark-card dark:border-neutral-800 flex items-center justify-between px-6 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          MineIntel AI
        </h1>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          SIH 2026
        </span>
      </div>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};

export default Header;
