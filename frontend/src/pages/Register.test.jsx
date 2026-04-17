import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Register from './Register';
import { AppContext } from '../context/AppContext';

function renderRegister(contextValue) {
  return render(
    <AppContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>Page Login</div>} />
          <Route path="/dashboard" element={<div>Page Dashboard</div>} />
          <Route path="/manager" element={<div>Page Manager</div>} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>
  );
}

describe('Register page', () => {
  it('affiche les erreurs de validation client si formulaire vide', async () => {
    const registerUser = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderRegister({
      currentUser: null,
      registerUser
    });

    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Le nom complet est requis')).toBeInTheDocument();
    expect(screen.getByText("L'email est requis")).toBeInTheDocument();
    expect(screen.getByText('Le mot de passe est requis')).toBeInTheDocument();
    expect(screen.getByText('Confirmation requise')).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('refuse un mot de passe trop court cote client', async () => {
    const registerUser = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderRegister({
      currentUser: null,
      registerUser
    });

    await user.type(screen.getByLabelText('Nom complet *'), 'Jean Dupont');
    await user.type(screen.getByLabelText('Adresse email *'), 'jean@uqo.ca');
    await user.type(screen.getByLabelText('Mot de passe *'), 'Abc123!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe *'), 'Abc123!');

    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Minimum 8 caracteres')).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('soumet le formulaire valide et redirige vers login', async () => {
    const registerUser = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderRegister({
      currentUser: null,
      registerUser
    });

    await user.type(screen.getByLabelText('Nom complet *'), 'Jean Dupont');
    await user.type(screen.getByLabelText('Adresse email *'), 'jean@uqo.ca');
    await user.type(screen.getByLabelText('Mot de passe *'), 'Password123!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe *'), 'Password123!');

    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith(
        'Jean Dupont',
        'jean@uqo.ca',
        'Password123!',
        'Password123!'
      );
    });

    expect(await screen.findByText('Page Login')).toBeInTheDocument();
  });
});
