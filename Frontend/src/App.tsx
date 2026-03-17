import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
// We will create these pages later:
import Login from './pages/Login/index';
import EmployeeDashboard from './pages/employee/Dashboard/index';
import AdminDashboard from './pages/admin/Dashboard/index';

const ProtectedRoute = ({ children, role }: { children: ReactNode, role?: string }) => {
  const { token, role: userRole } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => {
  const { role } = useAuth();

  return (
    <Router basename="/cli-leave-application-portal">
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Employee Routes */}
        <Route path="/employee/dashboard" element={
          <ProtectedRoute role="Employee"><EmployeeDashboard /></ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>
        } />

        {/* Redirect based on role */}
        <Route path="*" element={
          role === 'Admin' ? <Navigate to="/admin/dashboard" /> :
          role === 'Employee' ? <Navigate to="/employee/dashboard" /> :
          <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
};

export default App;
