import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '40px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ 
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Access Denied
          </h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            marginBottom: '24px'
          }}>
            Please sign in to access this page.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 