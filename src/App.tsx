import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Metrics from './components/Metrics';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import MediaReel from './components/MediaReel';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/metrics" replace /> : <Login />} 
        />
        <Route 
          path="/metrics" 
          element={
            <ProtectedRoute>
              <Metrics />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/reel/:mediaId"
          element={
            <ProtectedRoute>
              <MediaReel />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/metrics" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <div >
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
