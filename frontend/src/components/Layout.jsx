import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import './Layout.css';

export default function Layout({ children }) {
  const { currentUser, logout } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return children;

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <h1 className="logo">UQO-Requests</h1>
          <div className="user-info">
            <span>{currentUser.email}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
