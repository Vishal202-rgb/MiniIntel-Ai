import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import ExtractionReview from './pages/ExtractionReview';
import ValidationDashboard from './pages/ValidationDashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import AIAssistant from './pages/AIAssistant';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import TopicsExplorer from './pages/TopicsExplorer';
import ReportGenerator from './pages/ReportGenerator';
import AuditTrail from './pages/AuditTrail';
import AdminUsers from './pages/AdminUsers';
import SystemHealth from './pages/SystemHealth';
import IntelligenceDashboard from './pages/IntelligenceDashboard';
import AdminPendingReviews from './pages/AdminPendingReviews';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';

import { LanguageProvider } from './context/LanguageContext';

import Landing from './pages/Landing';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-200">
            <BrowserRouter>
              <Routes>
                {/* Public Landing & Auth Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/welcome" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                
                {/* Protected Application Workflows */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="user-dashboard" element={<Navigate to="/dashboard" replace />} />
                    <Route path="admin-dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="command-center" element={<CommandCenter />} />
                    <Route path="extraction" element={<ExtractionReview />} />
                    <Route path="validation" element={<ValidationDashboard />} />
                    <Route path="knowledge-base" element={<KnowledgeBase />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="reports" element={<ReportGenerator />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="intelligence" element={<IntelligenceDashboard />} />
                    <Route path="topics" element={<TopicsExplorer />} />
                    <Route path="audit" element={<AuditTrail />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="help" element={<HelpSupport />} />
                    
                    {/* Admin Specific Screens */}
                    <Route element={<ProtectedRoute adminOnly={true} />}>
                      <Route path="admin/users" element={<AdminUsers />} />
                      <Route path="admin/system-health" element={<SystemHealth />} />
                      <Route path="admin/pending-reviews" element={<AdminPendingReviews />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
