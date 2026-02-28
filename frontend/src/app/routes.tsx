import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';

// Pages
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LeadsExplorerPage from '../pages/Leads/LeadsExplorerPage';
import LeadDetailPage from '../pages/Leads/LeadDetailPage';
import ConversationsPage from '../pages/Conversations/ConversationsPage';
import LiveInboxPage from '../pages/LiveInbox/LiveInboxPage';
import LeadInsightsPage from '../pages/LeadInsights/LeadInsightsPage';
import TasksFollowupsPage from '../pages/Tasks/TasksFollowupsPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import ExportsPage from '../pages/Exports/ExportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        
        {/* Leads */}
        <Route path="leads" element={<LeadsExplorerPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        
        {/* Conversations */}
        <Route path="conversations" element={<ConversationsPage />} />
        
        {/* Workflow */}
        <Route path="live-inbox" element={<LiveInboxPage />} />
        <Route path="lead-insights" element={<LeadInsightsPage />} />
        <Route path="tasks" element={<TasksFollowupsPage />} />
        
        {/* Ops */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
