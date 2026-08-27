import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
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

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="command-center" element={<CommandCenter />} />
            <Route path="extraction" element={<ExtractionReview />} />
            <Route path="validation" element={<ValidationDashboard />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="topics" element={<TopicsExplorer />} />
            <Route path="reports" element={<ReportGenerator />} />
            <Route path="audit" element={<AuditTrail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
