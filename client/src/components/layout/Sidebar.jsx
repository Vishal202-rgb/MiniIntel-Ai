import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Brain, ShieldCheck, Database, MessageSquare, 
  BarChart2, Hash, FileOutput, Monitor, ScrollText, ChevronLeft, 
  ChevronRight, LogOut, Users, Activity, Sparkles, FileCheck, Settings,
  Shield, HelpCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const navGroups = [
  {
    title: 'DATA & WORKFLOW',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/command-center', icon: Monitor, label: 'Command Center' },
      { to: '/extraction', icon: Brain, label: 'Data Extraction' },
      { to: '/validation', icon: ShieldCheck, label: 'Validation' }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { to: '/knowledge-base', icon: Database, label: 'Knowledge Base' },
      { to: '/ai-assistant', icon: MessageSquare, label: 'AI Assistant' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/intelligence', icon: Sparkles, label: 'Intelligence' },
      { to: '/topics', icon: Hash, label: 'Topics' }
    ]
  },
  {
    title: 'GOVERNANCE',
    items: [
      { to: '/reports', icon: FileOutput, label: 'Reports' },
      { to: '/audit', icon: ScrollText, label: 'Audit Trail' },
      { to: '/admin/users', icon: Users, label: 'User Management', adminOnly: true },
      { to: '/admin/pending-reviews', icon: FileCheck, label: 'Pending Reviews', adminOnly: true }
    ]
  }
];

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#1c1f26] border-r border-[#2d3139] flex flex-col transition-all duration-300 ease-in-out z-50
        ${isCollapsed ? 'md:w-16' : 'md:w-[240px]'} w-[240px]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-4 border-b border-[#2d3139] shrink-0 relative">
          <div className={`flex items-center gap-2.5 transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : ''}`}>
            <Shield className="w-7 h-7 text-copper-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[#f1f5f9] font-bold text-base tracking-tight leading-tight">MineIntel AI</span>
              <span className="text-[#94a3b8] text-[9px] uppercase tracking-wider font-semibold mt-0.5">Mining Intelligence</span>
            </div>
          </div>
          
          {/* Logo only when collapsed */}
          {isCollapsed && (
            <div className="hidden md:flex w-full justify-center">
              <Shield className="w-6 h-6 text-copper-500 shrink-0" />
            </div>
          )}
        </div>

        <div className="md:hidden h-2"></div>

        {/* Navigation */}
        <nav className="px-2 py-4 flex-1">
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items.filter(item => !(item.adminOnly && user?.role !== 'admin'));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className={`mb-4 ${groupIndex !== 0 && !isCollapsed ? 'mt-4' : ''}`}>
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-widest">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const targetTo = item.to === '/' ? (user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard') : item.to;
                    const isItemActive = location.pathname === targetTo || (item.to === '/' && (location.pathname === '/user-dashboard' || location.pathname === '/admin-dashboard'));
                    
                    return (
                      <NavLink
                        key={item.to}
                        to={targetTo}
                        onClick={(e) => { 
                          if (window.innerWidth < 768) closeMobileMenu(); 
                        }}
                        className={
                          `flex items-center rounded-md transition-all duration-150 group relative h-[40px] ${
                            isCollapsed ? 'md:justify-center px-0' : 'px-3'
                          } ${
                            isItemActive
                              ? 'bg-slate-800/60 text-white border-l-2 border-copper-500'
                              : 'text-[#94a3b8] hover:bg-[#ffffff05] hover:text-[#f8fafc] border-l-2 border-transparent'
                          }`
                        }
                      >
                        <item.icon className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-4 h-4' : 'w-4 h-4 mr-3'}`} strokeWidth={2} />
                        <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden opacity-100' : 'opacity-100'}`}>
                          {item.label}
                        </span>
                        {isCollapsed && (
                          <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2d3139] text-[#f1f5f9] text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[#3f4552]">
                            {item.label}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* System Group */}
          <div className={`mb-4 ${!isCollapsed ? 'mt-4' : ''}`}>
             {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-widest">
                    SYSTEM
                  </h3>
             )}
             <div className="space-y-0.5">
                {user?.role === 'admin' && (
                  <NavLink
                      to="/admin/system-health"
                      onClick={() => { if (window.innerWidth < 768) closeMobileMenu(); }}
                      className={({ isActive }) =>
                        `flex items-center rounded-md transition-all duration-150 group relative h-[40px] ${
                          isCollapsed ? 'md:justify-center px-0' : 'px-3'
                        } ${
                          isActive
                            ? 'bg-[#ffffff08] text-amber-500 border-l-2 border-amber-500'
                            : 'text-[#94a3b8] hover:bg-[#ffffff05] hover:text-[#f8fafc] border-l-2 border-transparent'
                        }`
                      }
                    >
                      <Activity className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-4 h-4' : 'w-4 h-4 mr-3'}`} />
                      <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>System Health</span>
                      {isCollapsed && (
                        <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2d3139] text-[#f1f5f9] text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[#3f4552]">
                          System Health
                        </div>
                      )}
                  </NavLink>
                )}
                <NavLink
                    to="/help"
                    onClick={(e) => { if (window.innerWidth < 768) closeMobileMenu(); }}
                    className={({ isActive }) =>
                      `flex items-center rounded-md transition-all duration-150 group relative h-[40px] ${
                        isCollapsed ? 'md:justify-center px-0' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-slate-800/60 text-white border-l-2 border-copper-500'
                          : 'text-[#94a3b8] hover:bg-[#ffffff05] hover:text-[#f8fafc] border-l-2 border-transparent'
                      }`
                    }
                  >
                    <HelpCircle className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-4 h-4' : 'w-4 h-4 mr-3'}`} />
                    <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>Help & Support</span>
                    {isCollapsed && (
                      <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2d3139] text-[#f1f5f9] text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[#3f4552]">
                        Help & Support
                      </div>
                    )}
                </NavLink>
             </div>
          </div>
        </nav>
        
        {/* Bottom Profile & Actions */}
        <div className="mt-auto border-t border-[#2d3139] bg-[#17191e] p-2">
          
          {!isCollapsed && (
            <div className="px-3 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#262D3A] text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[#f1f5f9] text-xs font-semibold truncate">{user?.username || 'User'}</span>
                <span className="text-[#64748b] text-[10px] uppercase tracking-wider truncate">{user?.role || 'Guest'}</span>
              </div>
            </div>
          )}

          {isCollapsed && (
             <div className="py-3 flex justify-center">
               <div className="w-8 h-8 rounded bg-[#262D3A] text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
               </div>
             </div>
          )}
          
          <div className="space-y-0.5">
            <NavLink
              to="/settings"
              onClick={() => { if (window.innerWidth < 768) closeMobileMenu(); }}
              className={({ isActive }) =>
                `flex items-center rounded-md transition-all duration-150 group relative h-[40px] ${
                  isCollapsed ? 'md:justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-slate-800/60 text-white border-l-2 border-copper-500'
                    : 'text-[#94a3b8] hover:bg-[#ffffff05] hover:text-[#f8fafc] border-l-2 border-transparent'
                }`
              }
            >
              <Settings className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-4 h-4' : 'w-4 h-4 mr-3'}`} />
              <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
                Settings
              </span>
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2d3139] text-[#f1f5f9] text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[#3f4552]">
                  Settings
                </div>
              )}
            </NavLink>
            
            <button
              onClick={logout}
              className={`w-full flex items-center rounded-md transition-all duration-150 group relative h-[40px] text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 border-l-2 border-transparent ${
                isCollapsed ? 'md:justify-center px-0' : 'px-3'
              }`}
            >
              <LogOut className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-4 h-4' : 'w-4 h-4 mr-3'}`} />
              <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
                Logout
              </span>
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2d3139] text-[#f1f5f9] text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[#3f4552]">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className={`absolute -right-3 top-5 hidden md:flex items-center justify-center w-6 h-6 bg-[#1c1f26] border border-[#2d3139] rounded-full text-slate-400 hover:text-copper-500 hover:border-copper-500/50 transition-all shadow-sm z-50 ${isCollapsed ? 'rotate-180' : ''}`}
        aria-label="Toggle Sidebar"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};

export default Sidebar;
