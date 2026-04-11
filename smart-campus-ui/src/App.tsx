import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import VerifyOtpPage from './features/auth/pages/VerifyOtpPage';
import OAuthRedirectHandler from './features/auth/pages/OAuthRedirectHandler';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import UsersPage from './features/admin/pages/UsersPage';
import RegisterUserPage from './features/admin/pages/RegisterUserPage';
import FacilitiesPage from './features/admin/pages/FacilitiesPage';
import BookingsPage from './features/admin/pages/BookingsPage';
import IncidentsPage from './features/admin/pages/IncidentsPage';
import NotificationsPage from './features/admin/pages/NotificationsPage';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function RoleRoute({ children, roles }: { children: React.ReactElement; roles: string[] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/oauth2/redirect" element={<OAuthRedirectHandler />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/users" element={<RoleRoute roles={['ADMIN']}><UsersPage /></RoleRoute>} />
      <Route path="/admin/register-user" element={<RoleRoute roles={['ADMIN']}><RegisterUserPage /></RoleRoute>} />
      <Route path="/admin/facilities" element={<RoleRoute roles={['ADMIN']}><FacilitiesPage /></RoleRoute>} />
      <Route path="/admin/bookings" element={<RoleRoute roles={['ADMIN']}><BookingsPage /></RoleRoute>} />
      <Route path="/admin/incidents" element={<RoleRoute roles={['ADMIN']}><IncidentsPage /></RoleRoute>} />
      <Route path="/admin/notifications" element={<RoleRoute roles={['ADMIN']}><NotificationsPage /></RoleRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { RoleRoute };
export default App;
