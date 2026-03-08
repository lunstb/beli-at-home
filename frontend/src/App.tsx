import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/shared/Toast';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { NavBar } from './components/layout/NavBar';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { LoginPage } from './pages/LoginPage';
import { FeedPage } from './pages/FeedPage';
import { AddDishPage } from './pages/AddDishPage';
import { EditDishPage } from './pages/EditDishPage';
import { DishDetailPage } from './pages/DishDetailPage';
import { RankingPage } from './pages/RankingPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserPage } from './pages/UserPage';
import { FriendsPage } from './pages/FriendsPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/rank/');

  return (
    <div className="min-h-screen bg-[var(--color-warm-bg)]">
      {!hideChrome && <Header />}
      {children}
      {!hideChrome && <NavBar />}
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FeedPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dishes/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddDishPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dishes/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DishDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dishes/:id/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditDishPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rank/:dishId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RankingPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UserPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FriendsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookmarks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BookmarksPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
