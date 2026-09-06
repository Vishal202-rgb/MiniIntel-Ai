import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
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
      { to: '/validation', icon: ShieldCheck, label: 'Validation' },
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
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/admin/system-health', icon: Activity, label: 'System Health', adminOnly: true },
      { to: '/help', icon: HelpCircle, label: 'Help & Support' }
    ]
  }
];

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#20252B] border-r border-[#2A313C] flex flex-col transition-all duration-300 ease-in-out z-50
        ${isCollapsed ? 'md:w-20' : 'md:w-[250px]'} w-[250px]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-[#2A313C] shrink-0">
          <div className={`flex items-center gap-3 transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : ''}`}>
            <Shield className="w-8 h-8 text-blue-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg tracking-tight leading-tight">MineIntel AI</span>
              <span className="text-[#8B949E] text-[10px] uppercase tracking-wider font-semibold">Mining Intelligence Platform</span>
            </div>
          </div>
          
          {/* Logo only when collapsed */}
          {isCollapsed && (
            <div className="hidden md:flex w-full justify-center">
              <Shield className="w-8 h-8 text-blue-500 shrink-0" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 hidden md:flex items-center justify-center w-6 h-6 bg-[#20252B] border border-[#2A313C] rounded-full text-slate-400 hover:text-white transition-colors shadow-sm z-50"
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="md:hidden h-2"></div>

        {/* Navigation */}
        <nav className="px-3 py-5 flex-1">
          {navGroups.map((group, groupIndex) => {
            const visibleItems = group.items.filter(item => !(item.adminOnly && user?.role !== 'admin'));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className={`mb-5 ${groupIndex !== 0 && !isCollapsed ? 'mt-5' : ''}`}>
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[11px] font-semibold text-[#8B949E] uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={(e) => { 
                        if (item.to === '/help') e.preventDefault();
                        if (window.innerWidth < 768) closeMobileMenu(); 
                      }}
                      className={({ isActive }) =>
                        `flex items-center rounded-md transition-all duration-150 group relative h-[42px] ${
                          isCollapsed ? 'md:justify-center px-0' : 'px-3'
                        } ${
                          isActive
                            ? 'bg-[#2A313C]/80 text-[#60A5FA] border-l-[3px] border-[#60A5FA]'
                            : 'text-[#9CA3AF] hover:bg-[#2A313C]/50 hover:text-[#E5E7EB] border-l-[3px] border-transparent'
                        }`
                      }
                    >
                      <item.icon className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-5 h-5' : 'w-5 h-5 mr-3'}`} />
                      <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden opacity-100' : 'opacity-100'}`}>
                        {item.label}
                      </span>
                      {isCollapsed && (
                        <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2A313C] text-white text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                          {item.label}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Bottom Profile & Actions */}
        <div className="mt-auto border-t border-[#2A313C] bg-[#1A1E23]">
          
          {!isCollapsed && (
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-800/30">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white text-sm font-semibold truncate">{user?.username || 'User'}</span>
                <span className="text-[#8B949E] text-xs capitalize truncate">{user?.role || 'Guest'}</span>
              </div>
            </div>
          )}

          {isCollapsed && (
             <div className="py-4 flex justify-center">
               <div className="w-9 h-9 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-800/30">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
               </div>
             </div>
          )}
          
          <div className="px-3 pb-4 space-y-0.5">
            <NavLink
              to="/settings"
              onClick={() => { if (window.innerWidth < 768) closeMobileMenu(); }}
              className={({ isActive }) =>
                `flex items-center rounded-md transition-all duration-150 group relative h-[42px] ${
                  isCollapsed ? 'md:justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-[#2A313C]/80 text-[#60A5FA] border-l-[3px] border-[#60A5FA]'
                    : 'text-[#9CA3AF] hover:bg-[#2A313C]/50 hover:text-[#E5E7EB] border-l-[3px] border-transparent'
                }`
              }
            >
              <Settings className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-5 h-5' : 'w-5 h-5 mr-3'}`} />
              <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
                Settings
              </span>
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2A313C] text-white text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  Settings
                </div>
              )}
            </NavLink>
            
            <button
              onClick={logout}
              className={`w-full flex items-center rounded-md transition-all duration-150 group relative h-[42px] text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 border-l-[3px] border-transparent ${
                isCollapsed ? 'md:justify-center px-0' : 'px-3'
              }`}
            >
              <LogOut className={`shrink-0 ${isCollapsed ? 'md:w-5 md:h-5 w-5 h-5' : 'w-5 h-5 mr-3'}`} />
              <span className={`truncate transition-opacity duration-200 text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
                Logout
              </span>
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1.5 bg-[#2A313C] text-white text-[12px] font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
