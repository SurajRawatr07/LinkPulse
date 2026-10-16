import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { RedirectPage } from './pages/RedirectPage';
import { NotFoundPage } from './pages/NotFoundPage';

// User App Pages (only specified in Section 6)
import { DashboardPage } from './pages/DashboardPage';
import { LinksListPage } from './pages/LinksListPage';
import { CreateLinkPage } from './pages/CreateLinkPage';
import { LinkDetailsPage } from './pages/LinkDetailsPage';
import { BulkImportPage } from './pages/BulkImportPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { TagsPage } from './pages/TagsPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages (only specified in Section 6)
import { AdminLinksPage } from './pages/admin/AdminLinksPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBlocklistPage } from './pages/admin/AdminBlocklistPage';

export default function App() {
  const { init: initAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            <PublicLayout>
              <SignupPage />
            </PublicLayout>
          }
        />
        <Route path="/signup" element={<Navigate to="/register" replace />} />

        {/* Redirect Engine */}
        <Route path="/r/:code" element={<RedirectPage />} />

        {/* User App Routes */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route
          path="/app/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links"
          element={
            <AppLayout>
              <LinksListPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links/new"
          element={
            <AppLayout>
              <CreateLinkPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links/import"
          element={
            <AppLayout>
              <BulkImportPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/links/:id"
          element={
            <AppLayout>
              <LinkDetailsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/campaigns"
          element={
            <AppLayout>
              <CampaignsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/tags"
          element={
            <AppLayout>
              <TagsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/settings"
          element={
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/links" replace />} />
        <Route
          path="/admin/links"
          element={
            <AppLayout>
              <AdminLinksPage />
            </AppLayout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AppLayout>
              <AdminUsersPage />
            </AppLayout>
          }
        />
        <Route
          path="/admin/blocklist"
          element={
            <AppLayout>
              <AdminBlocklistPage />
            </AppLayout>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
