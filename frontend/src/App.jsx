import { lazy, Suspense, useContext } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AppContext, AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateRequest = lazy(() => import('./pages/CreateRequest'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));
const EditRequest = lazy(() => import('./pages/EditRequest'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

function AppRoutes() {
  const { currentUser } = useContext(AppContext);
  const defaultRoute = currentUser?.role === 'manager' ? '/manager' : '/dashboard';

  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Chargement...</div>}>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to={defaultRoute} /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to={defaultRoute} /> : <Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create-request" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
        <Route path="/request/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
        <Route path="/request/:id/edit" element={<ProtectedRoute><EditRequest /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={currentUser ? defaultRoute : '/login'} />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;