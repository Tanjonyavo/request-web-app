import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { currentUser, authLoading } = useContext(AppContext);

  if (authLoading) {
    return <div style={{ padding: 24 }}>Chargement...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    const fallbackRoute = currentUser.role === 'manager' ? '/manager' : '/dashboard';
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}
