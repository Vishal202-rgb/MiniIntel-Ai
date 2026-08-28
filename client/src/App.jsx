import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
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

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  // We'll reuse Dashboard for both since it will fetch based on user role from backend
  // But later we can split it if needed. For now it just goes to Dashboard.
  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardRouter />} />
                <Route path="command-center" element={<CommandCenter />} />
                <Route path="extraction" element={<ExtractionReview />} />
                <Route path="validation" element={<ValidationDashboard />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="reports" element={<ReportGenerator />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="topics" element={<TopicsExplorer />} />
                <Route path="audit" element={<AuditTrail />} />
                
                {/* Admin Specific Screens can be added here if needed */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                  <Route path="admin/users" element={<AdminUsers />} />
                  <Route path="admin/system-health" element={<SystemHealth />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
