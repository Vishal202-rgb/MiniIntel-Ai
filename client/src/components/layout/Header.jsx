import React from 'react';
import { Shield, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ toggleMobileMenu, isSidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`fixed top-0 right-0 z-40 h-16 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-[250px]'} left-0`}>
      <div className="flex items-center gap-4">
        {/* Mobile-only hamburger */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Logo only on mobile since Sidebar handles desktop logo */}
        <div className="flex md:hidden items-center gap-2.5">
          <Shield className="w-6 h-6 text-blue-500 shrink-0" />
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
            MineIntel
          </h1>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};

export default Header;
