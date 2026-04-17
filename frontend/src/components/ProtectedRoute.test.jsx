import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { AppContext } from '../context/AppContext';

function renderWithContext(contextValue, initialPath = '/private', requiredRole = null) {
  return render(
    <AppContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute requiredRole={requiredRole}>
                <div>Contenu protege</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Page Login</div>} />
          <Route path="/dashboard" element={<div>Page Dashboard</div>} />
          <Route path="/manager" element={<div>Page Manager</div>} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('affiche un etat de chargement tant que authLoading est actif', () => {
    renderWithContext({ currentUser: null, authLoading: true });
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('redirige vers /login si utilisateur non authentifie', () => {
    renderWithContext({ currentUser: null, authLoading: false });
    expect(screen.getByText('Page Login')).toBeInTheDocument();
  });

  it('redirige vers /dashboard si role requis non respecte', () => {
    renderWithContext(
      {
        currentUser: { id: 1, role: 'user' },
        authLoading: false
      },
      '/private',
      'manager'
    );

    expect(screen.getByText('Page Dashboard')).toBeInTheDocument();
  });

  it('rend le contenu protege quand l utilisateur est autorise', () => {
    renderWithContext({ currentUser: { id: 2, role: 'manager' }, authLoading: false }, '/private', 'manager');
    expect(screen.getByText('Contenu protege')).toBeInTheDocument();
  });
});