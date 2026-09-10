import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Shield, Sun, Moon, Menu, Bell, CheckCircle2, 
  AlertTriangle, Info, Check, LogOut, Settings, 
  HelpCircle, ChevronDown, User, ExternalLink, X 
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import notificationApi from '../../api/notificationApi';

const PAGE_TITLES = {
  '/dashboard': 'Executive Dashboard',
  '/user-dashboard': 'Executive Dashboard',
  '/admin-dashboard': 'Admin Command & Ingestion',
  '/command-center': 'Command Center Operations',
  '/extraction': 'Multi-Modal Data Extraction',
  '/validation': 'Statutory Validation Engine',
  '/knowledge-base': 'Vector Knowledge Base',
  '/ai-assistant': 'Mining Intelligence Assistant',
  '/reports': 'Evidence-Grounded Report Generator',
  '/analytics': 'Production & Dispatch Analytics',
  '/intelligence': 'Autonomous Intelligence Discovery',
  '/topics': 'Topic & Entity Taxonomy',
  '/audit': 'Compliance Audit Trail',
  '/settings': 'System Settings',
  '/help': 'Documentation & Support',
  '/admin/users': 'User Management & Access Control',
  '/admin/system-health': 'System Infrastructure & Telemetry',
  '/admin/pending-reviews': 'Administrative Review & Sign-Off Queue'
};

const Header = ({ toggleMobileMenu, isSidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const activeTitle = PAGE_TITLES[location.pathname] || 'Mining Intelligence Console';

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications({ limit: 20 });
      const data = res.data || res;
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : (Array.isArray(data) ? data.filter(n => !n.read).length : 0));
    } catch (e) {
      // Non-blocking notification fetch
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await notificationApi.markAsRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }

    setShowNotifications(false);

    // If related report exists, navigate to report generator with query param
    if (notif.relatedId) {
      navigate(`/reports?id=${notif.relatedId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifLoading(true);
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className={`fixed top-0 right-0 z-40 h-16 bg-white dark:bg-[#161A22] border-b border-slate-200 dark:border-[#262D3A] flex items-center justify-between px-4 md:px-6 transition-all duration-300 ${isSidebarCollapsed ? 'md:left-16' : 'md:left-[240px]'} left-0 shadow-xs`}>
      
      {/* Left: Context & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E232E] text-slate-500 dark:text-[#94A3B8] transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Mobile Logo */}
        <div className="flex md:hidden items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">MineIntel</span>
        </div>

        {/* Desktop Breadcrumb & Context */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-[#64748B] font-medium">MineIntel Console</span>
          <span className="text-slate-300 dark:text-[#262D3A]">/</span>
          <h1 className="font-bold text-slate-900 dark:text-white truncate tracking-tight text-xs sm:text-sm">
            {activeTitle}
          </h1>
        </div>
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center gap-2.5">
        
        {/* Notification Bell with Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#1E232E] text-slate-600 dark:text-[#94A3B8] transition-colors relative focus:outline-none"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-copper-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono ring-2 ring-white dark:ring-[#161B26] animate-in fade-in zoom-in">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-[#262D3A] flex items-center justify-between bg-slate-50/70 dark:bg-[#12151C]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-copper-500/10 text-copper-600 dark:text-copper-400 font-semibold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={notifLoading}
                    className="text-[11px] font-semibold text-copper-600 dark:text-copper-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-[#262D3A]/60 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">No notifications</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">You're up to date on report reviews and operational events.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isApproval = notif.category === 'approval' || notif.message?.toLowerCase().includes('approved');
                    const isRejection = notif.category === 'rejection' || notif.message?.toLowerCase().includes('rejected');
                    
                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-[#1F2430] transition-colors cursor-pointer flex items-start gap-3 ${
                          !notif.read ? 'bg-slate-50/80 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          isApproval 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isRejection 
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}>
                          {isApproval ? <CheckCircle2 className="w-4 h-4" /> : isRejection ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-xs font-bold ${
                              isApproval ? 'text-emerald-700 dark:text-emerald-400' :
                              isRejection ? 'text-red-700 dark:text-red-400' :
                              'text-slate-900 dark:text-white'
                            }`}>
                              {isApproval ? 'Report Approved' : isRejection ? 'Report Rejected' : 'Operational Alert'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                              {formatTime(notif.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 dark:text-[#CBD5E1] leading-snug break-words">
                            {notif.message}
                          </p>

                          {notif.relatedId && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              <span>Open Report</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        {/* Unread Dot */}
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-slate-100 dark:border-[#262D3A] bg-slate-50/50 dark:bg-[#12151C] text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Real-time persistent alerts • MongoDB Synced</span>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#1E232E] text-slate-600 dark:text-[#94A3B8] transition-colors focus:outline-none"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Menu with Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#1E232E] transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded bg-[#262D3A] text-slate-200 text-xs font-bold flex items-center justify-center font-mono border border-slate-700">
              {getInitials(user?.username || user?.name)}
            </div>
            <div className="hidden lg:flex flex-col text-left mr-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user?.username || 'User'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 capitalize">
                {user?.role === 'admin' ? 'Administrator' : 'Operations Officer'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* User Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 py-1">
              
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-[#262D3A]">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.username || 'User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'officer@mineintel.gov.in'}</p>
                <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider ${
                  user?.role === 'admin' 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' 
                    : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                }`}>
                  {user?.role === 'admin' ? 'System Administrator' : 'Operations Officer'}
                </span>
              </div>

              <div className="py-1 text-xs">
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1E232E] flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings &amp; Preferences</span>
                </button>

                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/help'); }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1E232E] flex items-center gap-2 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Help &amp; Operational Guide</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-[#262D3A] pt-1">
                <button
                  onClick={() => { setShowProfileMenu(false); logout(); navigate('/'); }}
                  className="w-full px-3.5 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </header>
  );
};

export default Header;
