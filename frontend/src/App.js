import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import Leaves from './pages/Leaves';
import LeaveBalance from './pages/LeaveBalance';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { getUserProfile } from './store/slices/authSlice';
import MyPayroll from './pages/MyPayroll';
import PerformancePage from './pages/PerformancePage';
import { AuthProvider } from './contexts/AuthContext';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

function App() {
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getUserProfile());
    }
  }, [dispatch, token, user]);

  const RootRedirect = () => {
    if (loading || (token && !user)) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <Spin indicator={antIcon} />
        </div>
      );
    }

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return user?.role === 'admin' ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Navigate to="/attendance" replace />
    );
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Root path redirect */}
            <Route index element={<RootRedirect />} />

            {/* Admin only routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Routes accessible by all authenticated users */}
            <Route
              path="projects"
              element={
                <ProtectedRoute roles={['admin', 'team_lead', 'employee']}>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance"
              element={
                <ProtectedRoute>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leaves"
              element={
                <ProtectedRoute>
                  <Leaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-balance"
              element={
                <ProtectedRoute>
                  <LeaveBalance />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <ProtectedRoute roles={['admin', 'team_lead', 'employee']}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute roles={['admin', 'team_lead', 'employee']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="unauthorized" element={<Unauthorized />} />
            <Route
              path="/my-payroll"
              element={
                <ProtectedRoute>
                  <MyPayroll />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 