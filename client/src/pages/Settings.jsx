import React, { useContext, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Globe, Shield, User, Bell, Palette, 
  CheckCircle, Loader2, ArrowRight
} from 'lucide-react';

const Settings = () => {
  const { lang, setLang, t } = useLanguage();
  const { user } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('language');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for forms
  const [localLang, setLocalLang] = useState(lang || 'en');
  const [localTheme, setLocalTheme] = useState(theme || 'light');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Sync external changes
  useEffect(() => {
    setLocalLang(lang);
  }, [lang]);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate network delay
    setTimeout(() => {
      if (localLang !== lang) setLang(localLang);
      if (localTheme !== theme) setTheme(localTheme);
      
      // Save notification prefs to localStorage since we don't have a backend endpoint for this
      localStorage.setItem('prefs_email_notif', emailNotif);
      localStorage.setItem('prefs_push_notif', pushNotif);
      localStorage.setItem('prefs_report_alerts', reportAlerts);

      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleCancel = () => {
    setLocalLang(lang);
    setLocalTheme(theme);
    setEmailNotif(localStorage.getItem('prefs_email_notif') !== 'false');
    setPushNotif(localStorage.getItem('prefs_push_notif') !== 'false');
    setReportAlerts(localStorage.getItem('prefs_report_alerts') === 'true');
  };

  // Load initial notification prefs
  useEffect(() => {
    handleCancel();
    // eslint-disable-next-line
  }, []);

  const tabs = [
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'profile', label: 'Account Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin Controls', icon: Shield, isDanger: true });
  }

  return (
    <div className="max-w-4xl mx-auto p-5 sm:p-6 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {t('settings') || 'Settings'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your account preferences and application settings.
            </p>
          </div>
        </div>
        
        {saveSuccess && (
          <div className="hidden sm:flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Preferences saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation/Tabs (Left) */}
        <div className="md:col-span-1 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDanger = tab.isDanger;
            
            let baseClasses = "w-full flex items-center gap-3 px-4 py-2.5 font-medium rounded-lg transition-colors text-left ";
            
            if (isActive) {
              baseClasses += "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400";
            } else if (isDanger) {
              baseClasses += "mt-4 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border-t border-slate-200 dark:border-slate-700 pt-4 rounded-t-none";
            } else {
              baseClasses += "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-card hover:text-neutral-900 dark:hover:text-white";
            }

            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={baseClasses}
              >
                <tab.icon className="w-4 h-4 shrink-0" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content (Right) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full min-h-[400px]">
            
            {/* Dynamic Content */}
            <div className="flex-1">
              {activeTab === 'language' && (
                <>
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      Language & Region
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        System Language
                      </label>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Choose the primary language for the MineIntel AI interface.
                      </p>
                      <select 
                        value={localLang} 
                        onChange={(e) => setLocalLang(e.target.value)}
                        className="w-full max-w-sm px-4 py-2.5 bg-white dark:bg-dark-bg border border-slate-300 dark:border-slate-600 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow cursor-pointer"
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                      </select>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Timezone & Regional Format
                      </label>
                      <select 
                        disabled
                        className="w-full max-w-sm px-4 py-2.5 bg-slate-50 dark:bg-dark-bg/50 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg cursor-not-allowed"
                      >
                        <option>Asia/Kolkata (IST)</option>
                      </select>
                      <p className="text-xs text-slate-400 mt-2">
                        Managed centrally by the organization administrator.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'profile' && (
                <>
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      Account Profile
                    </h2>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold uppercase ring-4 ring-white dark:ring-dark-card shadow-sm">
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">{user?.username}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1 border border-slate-200 dark:border-slate-700">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-lg text-neutral-900 dark:text-white font-medium text-sm">
                          {user?.username}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-lg text-neutral-900 dark:text-white font-medium text-sm truncate">
                          {user?.email || 'Not provided'}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Organization</label>
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-lg text-neutral-900 dark:text-white font-medium text-sm">
                          CMPDI / Coal India Limited
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 pt-2">Profile updates must be requested through your IT administrator.</p>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      Notifications
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">Email Notifications</h4>
                        <p className="text-xs text-slate-500 mt-1">Receive daily digests and critical alerts via email.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">In-App Alerts</h4>
                        <p className="text-xs text-slate-500 mt-1">Show toast notifications for completed extraction tasks.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">Report Mentions</h4>
                        <p className="text-xs text-slate-500 mt-1">Notify me when a report requires my review.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={reportAlerts} onChange={(e) => setReportAlerts(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                  </div>
                </>
              )}

              {activeTab === 'appearance' && (
                <>
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-blue-500" />
                      Appearance
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Color Theme
                    </label>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Select how you want the application to look. Dark mode is recommended for prolonged usage.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                      <button 
                        onClick={() => setLocalTheme('light')}
                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${localTheme === 'light' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                      >
                        <div className="w-full h-12 bg-slate-100 rounded border border-slate-200 mb-3 flex items-center justify-center">
                           <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">Light Mode</span>
                      </button>
                      
                      <button 
                        onClick={() => setLocalTheme('dark')}
                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${localTheme === 'dark' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                      >
                        <div className="w-full h-12 bg-slate-900 rounded border border-slate-800 mb-3 flex items-center justify-center">
                           <div className="w-16 h-2 bg-slate-700 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">Dark Mode</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'admin' && isAdmin && (
                <>
                  <div className="px-6 py-5 border-b border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <h2 className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      Admin Controls
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-lg">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Privileged Access</h4>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        You are authenticated as an administrator. Quick links to governance tools:
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link to="/admin/users" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          Manage Users <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link to="/admin/system-health" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          System Health <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Action Footer */}
            {activeTab !== 'admin' && activeTab !== 'profile' && (
              <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-dark-bg flex items-center justify-end gap-3 mt-auto">
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Apply Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
