import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/teacher/Dashboard';
import CreateExam from './pages/teacher/CreateExam';
import UploadCopies from './pages/teacher/UploadCopies';
import CorrectionResults from './pages/teacher/CorrectionResults';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './store/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'teacher' ? '/dashboard' : '/my-results'} replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'teacher' ? '/dashboard' : '/my-results'} replace />} />
        
        {/* Teacher Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="teacher">
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/exams/new" element={
          <ProtectedRoute requiredRole="teacher">
            <Layout><CreateExam /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/copies/upload" element={
          <ProtectedRoute requiredRole="teacher">
            <Layout><UploadCopies /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/copies/:id/results" element={
          <ProtectedRoute requiredRole="teacher">
            <Layout><CorrectionResults /></Layout>
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/my-results" element={
          <ProtectedRoute requiredRole="student">
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        } />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to={user ? (user.role === 'teacher' ? '/dashboard' : '/my-results') : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
