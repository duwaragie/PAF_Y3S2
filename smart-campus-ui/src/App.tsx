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
import CompleteProfilePage from './features/profile/pages/CompleteProfilePage';
import UsersPage from './features/admin/pages/UsersPage';
import RegisterUserPage from './features/admin/pages/RegisterUserPage';
import FacilitiesPage from './features/admin/pages/FacilitiesPage';
import AssetsAdminPage from './features/admin/pages/AssetsAdminPage';
import AmenitiesAdminPage from './features/admin/pages/AmenitiesAdminPage';
import IncidentsPage from './features/admin/pages/IncidentsPage';
import NotificationsPage from './features/admin/pages/NotificationsPage';
import LandingPage from './features/landing/pages/LandingPage';
import AboutPage from './features/landing/pages/AboutPage';
import ContactPage from './features/landing/pages/ContactPage';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import FacilitiesCataloguePage from './features/public/pages/FacilitiesCataloguePage';
import CourseOfferingsAdminPage from './features/academics/pages/CourseOfferingsAdminPage';
import LecturerCoursesPage from './features/academics/pages/LecturerCoursesPage';
import BrowseCoursesPage from './features/academics/pages/BrowseCoursesPage';
import MyEnrollmentsPage from './features/academics/pages/MyEnrollmentsPage';
import TranscriptPage from './features/academics/pages/TranscriptPage';
import UserNotificationsPage from './features/academics/pages/NotificationsPage';
import { BookingPage, AdminBookingPage } from './features/booking';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.profileComplete === false) return <Navigate to="/complete-profile" replace />;
  return children;
}

function AuthenticatedRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function RoleRoute({ children, roles }: { children: React.ReactElement; roles: string[] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.profileComplete === false) return <Navigate to="/complete-profile" replace />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Public marketing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Public auth routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/oauth2/redirect" element={<OAuthRedirectHandler />} />

      {/* Profile completion gate (authenticated but profile incomplete) */}
      <Route path="/complete-profile" element={<AuthenticatedRoute><CompleteProfilePage /></AuthenticatedRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/facilities" element={<ProtectedRoute><FacilitiesCataloguePage /></ProtectedRoute>} />

      {/* Academics — student */}
      <Route path="/courses" element={<RoleRoute roles={['STUDENT']}><BrowseCoursesPage /></RoleRoute>} />
      <Route path="/enrollments" element={<RoleRoute roles={['STUDENT']}><MyEnrollmentsPage /></RoleRoute>} />
      <Route path="/transcript" element={<RoleRoute roles={['STUDENT']}><TranscriptPage /></RoleRoute>} />

      {/* Academics — lecturer */}
      <Route path="/lecturer/courses" element={<RoleRoute roles={['LECTURER', 'ADMIN']}><LecturerCoursesPage /></RoleRoute>} />

      {/* Academics — admin */}
      <Route path="/admin/course-offerings" element={<RoleRoute roles={['ADMIN']}><CourseOfferingsAdminPage /></RoleRoute>} />

      {/* Notifications (all authenticated users) */}
      <Route path="/notifications" element={<ProtectedRoute><UserNotificationsPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/users" element={<RoleRoute roles={['ADMIN']}><UsersPage /></RoleRoute>} />
      <Route path="/admin/register-user" element={<RoleRoute roles={['ADMIN']}><RegisterUserPage /></RoleRoute>} />
      <Route path="/admin/facilities" element={<RoleRoute roles={['ADMIN']}><FacilitiesPage /></RoleRoute>} />
      <Route path="/admin/assets" element={<RoleRoute roles={['ADMIN']}><AssetsAdminPage /></RoleRoute>} />
      <Route path="/admin/amenities" element={<RoleRoute roles={['ADMIN']}><AmenitiesAdminPage /></RoleRoute>} />
      <Route path="/admin/bookings" element={<RoleRoute roles={['ADMIN']}><AdminBookingPage /></RoleRoute>} />
      <Route path="/admin/incidents" element={<RoleRoute roles={['ADMIN']}><IncidentsPage /></RoleRoute>} />
      <Route path="/admin/notifications" element={<RoleRoute roles={['ADMIN']}><NotificationsPage /></RoleRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export { RoleRoute };
export default App;
