import React from 'react';
import { Shield, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ toggleMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 w-full z-40 h-16 bg-white border-b border-neutral-200 dark:bg-[#1A1A1A] dark:border-neutral-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-200">
      <div className="flex items-center gap-4">
        {/* Mobile-only hamburger */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Logo and Title strictly first on desktop */}
        <div className="flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-blue-600 dark:text-blue-500 shrink-0" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            MineIntel AI
          </h1>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};

export default Header;
