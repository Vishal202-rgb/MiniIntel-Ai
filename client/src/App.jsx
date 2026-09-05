import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
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

import { LanguageProvider } from './context/LanguageContext';

const DashboardRouter = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (userInfo.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return <Navigate to="/user-dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-neutral-50 dark:bg-[#111111] transition-colors duration-200">
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardRouter />} />
                <Route path="user-dashboard" element={<Dashboard />} />
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
                
                {/* Admin Specific Screens can be added here if needed */}
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
