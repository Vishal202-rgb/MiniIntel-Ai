const fs = require('fs');

const content = \import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Brain, ShieldCheck, Database, MessageSquare, 
  BarChart2, Hash, FileOutput, Monitor, ScrollText, ChevronLeft, 
  ChevronRight, LogOut, Users, Activity, Sparkles, FileCheck, Settings 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const navGroups = [
  {
    title: 'DATA',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/command-center', icon: Monitor, label: 'Command Center' },
      { to: '/extraction', icon: Brain, label: 'Data Extraction' },
      { to: '/knowledge-base', icon: Database, label: 'Knowledge Base' }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { to: '/ai-assistant', icon: MessageSquare, label: 'AI Assistant' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/intelligence', icon: Sparkles, label: 'Intelligence' },
      { to: '/topics', icon: Hash, label: 'Topics' }
    ]
  },
  {
    title: 'GOVERNANCE',
    items: [
      { to: '/validation', icon: ShieldCheck, label: 'Validation' },
      { to: '/reports', icon: FileOutput, label: 'Reports' },
      { to: '/admin/pending-reviews', icon: FileCheck, label: 'Pending Reviews', adminOnly: true }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/audit', icon: ScrollText, label: 'Audit Trail' },
      { to: '/admin/users', icon: Users, label: 'Users', adminOnly: true },
      { to: '/admin/system-health', icon: Activity, label: 'System Health', adminOnly: true }
    ]
  }
];

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();

  return (
    <aside 
      className={\\\ixed left-0 top-16 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-40
        \\\ w-64
        \\\
      \\\\}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* Toggle Button */}
        <div className="hidden md:flex items-center px-4 py-4 border-b border-slate-800 mb-4">
          <button 
            onClick={toggleSidebar}
            className={\\\lex items-center text-slate-400 hover:text-white transition-colors w-full \\\\\\}
            aria-label="Toggle Sidebar"
          >
            {!isCollapsed && <span className="font-semibold text-xs tracking-wider uppercase">Menu</span>}
            <div className="p-1 rounded-md hover:bg-slate-800 transition-colors">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </div>
          </button>
        </div>

        <div className="md:hidden h-4"></div>

        <nav className="px-3 flex-1">
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items.filter(item => !(item.adminOnly && user?.role !== 'admin'));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className={\\\mb-6 \\\\\\}>
                {!isCollapsed && (
                  <h3 className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => { if (window.innerWidth < 768) closeMobileMenu(); }}
                      className={({ isActive }) =>
                        \\\lex items-center rounded-lg transition-all duration-200 group relative \\\ \\\\\\
                      }
                    >
                      <item.icon className={\\\shrink-0 \\\\\\} />
                      <span className={\\\	runcate transition-opacity duration-200 text-sm font-medium \\\\\\}>
                        {t(item.label.toLowerCase().replace(/ /g, '')) || item.label}
                      </span>
                      {isCollapsed && (
                        <div className="hidden md:block absolute left-full ml-4 px-2 py-1.5 bg-slate-800 text-white text-[13px] font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                          {t(item.label.toLowerCase().replace(/ /g, '')) || item.label}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Bottom Actions */}
        <div className="mt-4 border-t border-slate-800 pt-4 px-3 pb-6 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => { if (window.innerWidth < 768) closeMobileMenu(); }}
            className={({ isActive }) =>
              \\\lex items-center rounded-lg transition-all duration-200 group relative \\\ \\\\\\
            }
          >
            <Settings className={\\\shrink-0 \\\\\\} />
            <span className={\\\	runcate transition-opacity duration-200 text-sm font-medium \\\\\\}>
              {t('settings') || 'Settings'}
            </span>
            {isCollapsed && (
              <div className="hidden md:block absolute left-full ml-4 px-2 py-1.5 bg-slate-800 text-white text-[13px] font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                {t('settings') || 'Settings'}
              </div>
            )}
          </NavLink>
          
          <button
            onClick={logout}
            className={\\\w-full flex items-center rounded-lg transition-all duration-200 group relative text-slate-400 hover:bg-slate-800 hover:text-red-400 \\\\\\}
          >
            <LogOut className={\\\shrink-0 \\\\\\} />
            <span className={\\\	runcate transition-opacity duration-200 text-sm font-medium \\\\\\}>
              {t('logout') || 'Logout'}
            </span>
            {isCollapsed && (
              <div className="hidden md:block absolute left-full ml-4 px-2 py-1.5 bg-slate-800 text-white text-[13px] font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                {t('logout') || 'Logout'}
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
\;

fs.writeFileSync('./src/components/layout/Sidebar.jsx', content, 'utf8');
