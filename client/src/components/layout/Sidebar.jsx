import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Brain, ShieldCheck, Database, MessageSquare, BarChart, Tag, FileOutput, Monitor, Scroll } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/command-center', icon: Monitor, label: 'Command Center' },
  { to: '/extraction', icon: Brain, label: 'Data Extraction' },
  { to: '/validation', icon: ShieldCheck, label: 'Validation' },
  { to: '/knowledge-base', icon: Database, label: 'Knowledge Base' },
  { to: '/ai-assistant', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/analytics', icon: BarChart, label: 'Analytics' },
  { to: '/topics', icon: Tag, label: 'Topics' },
  { to: '/reports', icon: FileOutput, label: 'Reports' },
  { to: '/audit', icon: Scroll, label: 'Audit Trail' }
];

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-neutral-200 dark:bg-dark-card dark:border-neutral-800 flex flex-col justify-between py-6 transition-colors duration-200 overflow-y-auto">
      <nav className="px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-4 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-white'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-8 mt-6 pb-2 text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
        MineIntel AI v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
