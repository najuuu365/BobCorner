import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TodayPage } from './pages/TodayPage';
import { CollegePage } from './pages/CollegePage';
import { FocusPage } from './pages/FocusPage';
import { GamesPage } from './pages/GamesPage';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { GardenPage } from './pages/GardenPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { QuranPage } from './pages/QuranPage';
import { AuthPage } from './pages/AuthPage';

const ProtectedRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-haven-50 dark:bg-slate-950 flex items-center justify-center font-serif text-slate-500">
        Loading your personal sanctuary...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="college" element={<CollegePage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="reader/:bookId" element={<ReaderPage />} />
        <Route path="garden" element={<GardenPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="quran" element={<QuranPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ProtectedRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
