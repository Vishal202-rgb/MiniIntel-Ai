import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Brain, ShieldCheck, Database, MessageSquare, BarChart2, Hash, FileOutput, Monitor, ScrollText, ChevronLeft, ChevronRight, LogOut, Users, Activity } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/command-center', icon: Monitor, label: 'Command Center' },
  { to: '/extraction', icon: Brain, label: 'Data Extraction' },
  { to: '/validation', icon: ShieldCheck, label: 'Validation' },
  { to: '/knowledge-base', icon: Database, label: 'Knowledge Base' },
  { to: '/ai-assistant', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/topics', icon: Hash, label: 'Topics' },
  { to: '/reports', icon: FileOutput, label: 'Reports' },
  { to: '/audit', icon: ScrollText, label: 'Audit Trail' },
  { to: '/admin/users', icon: Users, label: 'Users', adminOnly: true },
  { to: '/admin/system-health', icon: Activity, label: 'System Health', adminOnly: true }
];

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu }) => {
  const { user, logout } = useContext(AuthContext);

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });
  return (
    <aside 
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-neutral-200 dark:bg-[#1A1A1A] dark:border-neutral-800 flex flex-col transition-all duration-300 ease-in-out z-40
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* Toggle Button at the TOP of sidebar (Desktop only) */}
        <div className="hidden md:flex items-center px-4 py-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
          <button 
            onClick={toggleSidebar}
            className={`flex items-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            aria-label="Toggle Sidebar"
          >
            {!isCollapsed && <span className="font-semibold text-xs tracking-wider uppercase">Menu</span>}
            <div className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </div>
          </button>
        </div>

        {/* Mobile spacing padding */}
        <div className="md:hidden h-4"></div>

        <nav className="px-3 space-y-1.5 flex-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 768) closeMobileMenu();
              }}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-200 group relative ${
                  isCollapsed ? 'md:justify-center p-3 gap-3 md:gap-0' : 'gap-3 px-4 py-2.5'
                } ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`
              }
            >
              <item.icon className={`shrink-0 ${isCollapsed ? 'md:w-6 md:h-6 w-5 h-5' : 'w-5 h-5'}`} />
              
              <span className={`truncate transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-100' : 'opacity-100'}`}>
                {item.label}
              </span>

              {/* Tooltip for collapsed state (desktop only) */}
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-2 px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
          <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <button
              onClick={logout}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group relative hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium ${
                isCollapsed ? 'md:justify-center p-3 gap-3 md:gap-0' : 'gap-3 px-4 py-2.5'
              }`}
            >
              <LogOut className={`shrink-0 ${isCollapsed ? 'md:w-6 md:h-6 w-5 h-5' : 'w-5 h-5'}`} />
              <span className={`truncate transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-100' : 'opacity-100'}`}>
                Logout
              </span>
            </button>
          </div>
        </nav>
        
        <div className={`px-8 pb-6 pt-4 text-xs font-medium tracking-wider text-neutral-400 dark:text-neutral-500 uppercase shrink-0 transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-100' : 'opacity-100'}`}>
          MineIntel AI v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
