import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext, AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import EditRequest from './pages/EditRequest';
import ManagerDashboard from './pages/ManagerDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { currentUser } = useContext(AppContext);
  const defaultRoute = currentUser?.role === 'manager' ? '/manager' : '/dashboard';

  return (
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
