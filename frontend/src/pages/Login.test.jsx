import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppContext } from '../context/AppContext';
import Login from './Login';

function renderLogin(contextValue, initialEntry = '/login') {
  return render(
    <AppContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Page Dashboard</div>} />
          <Route path="/manager" element={<div>Page Manager</div>} />
          <Route path="/register" element={<div>Page Register</div>} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>
  );
}

describe('Login page', () => {
  it('affiche le message de succes apres inscription', async () => {
    renderLogin({ login: vi.fn().mockResolvedValue({ role: 'user' }) }, '/login?registered=1');

    expect(
      screen.getByText('Inscription reussie. Vous pouvez maintenant vous connecter.')
    ).toBeInTheDocument();
  });

  it('redirige vers le tableau utilisateur apres connexion reussie', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'user' });
    const user = userEvent.setup();
    renderLogin({ login });

    await user.type(screen.getByLabelText('Adresse email'), 'jean@uqo.ca');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('jean@uqo.ca', 'Password123!');
    });
    expect(await screen.findByText('Page Dashboard')).toBeInTheDocument();
  });

  it('redirige vers le tableau gestionnaire pour un manager', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'manager' });
    const user = userEvent.setup();
    renderLogin({ login });

    await user.type(screen.getByLabelText('Adresse email'), 'manager@uqo.ca');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('manager@uqo.ca', 'Password123!');
    });
    expect(await screen.findByText('Page Manager')).toBeInTheDocument();
  });

  it('affiche une erreur si la connexion echoue', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Email ou mot de passe invalide'));
    const user = userEvent.setup();
    renderLogin({ login });

    await user.type(screen.getByLabelText('Adresse email'), 'bad@uqo.ca');
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Email ou mot de passe invalide')).toBeInTheDocument();
  });
});
