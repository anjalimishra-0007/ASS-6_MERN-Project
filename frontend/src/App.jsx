import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import FeeStructureListPage from './pages/FeeStructureListPage.jsx';
import FeeStructureCreatePage from './pages/FeeStructureCreatePage.jsx';
import FeeStructureEditPage from './pages/FeeStructureEditPage.jsx';
import RecordPaymentPage from './pages/RecordPaymentPage.jsx';
import StudentListPage from './pages/StudentListPage.jsx';
import StudentFeesLedgerPage from './pages/StudentFeesLedgerPage.jsx';
import MyFeesPage from './pages/MyFeesPage.jsx';
import ReceiptDetailPage from './pages/ReceiptDetailPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  // Keep the logged-in user in App.jsx with useState (initialised from localStorage)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <div className="app-container">
      {/* Navbar with role-specific links */}
      <Navbar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Routes>
          {/* Default Root Redirect */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'admin' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/my-fees" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Authentication Routes */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/my-fees'} replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/my-fees'} replace />
              ) : (
                <RegisterPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/fees"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <FeeStructureListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/fees/new"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <FeeStructureCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/fees/:id/edit"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <FeeStructureEditPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/payments/new"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <RecordPaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <StudentListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students/:id/fees"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <StudentFeesLedgerPage />
              </ProtectedRoute>
            }
          />

          {/* Student Protected Route */}
          <Route
            path="/my-fees"
            element={
              <ProtectedRoute user={user} allowedRoles={['student']}>
                <MyFeesPage user={user} />
              </ProtectedRoute>
            }
          />

          {/* Receipt Route (Accessible by Admin and Student) */}
          <Route
            path="/receipts/:receiptNo"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin', 'student']}>
                <ReceiptDetailPage user={user} />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
