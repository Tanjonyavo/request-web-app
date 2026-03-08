/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useState } from 'react';
import { authApi, clearAuthTokens, getAccessToken, requestApi, setAuthTokens } from '../services/api';

export const AppContext = createContext();

const normalizeDate = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');

const mapRequest = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  type: item.type,
  status: item.status,
  createdAt: normalizeDate(item.created_at),
  updatedAt: normalizeDate(item.updated_at),
  authorId: item.author?.id,
  authorEmail: item.author?.email,
  comments: (item.comments || []).map((comment) => ({
    id: comment.id,
    author: comment.author?.email || 'unknown',
    content: comment.content,
    date: normalizeDate(comment.created_at)
  })),
  history: (item.history || []).map((entry) => ({
    id: entry.id,
    fromStatus: entry.from_status,
    status: entry.to_status,
    author: entry.author?.email || 'unknown',
    date: normalizeDate(entry.created_at)
  }))
});

const parseApiError = (error, fallback = 'Erreur serveur') => {
  const detail = error?.response?.data;
  if (!detail) return fallback;

  if (typeof detail === 'string') return detail;
  if (detail.detail) return detail.detail;

  const flattened = Object.values(detail)
    .flat()
    .map((entry) => String(entry));

  return flattened.length ? flattened.join(' | ') : fallback;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const logout = useCallback(() => {
    clearAuthTokens();
    setCurrentUser(null);
    setRequests([]);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!currentUser) {
      setRequests([]);
      return;
    }

    setRequestsLoading(true);
    try {
      const response = await requestApi.list();
      setRequests((response.data || []).map(mapRequest));
    } catch (error) {
      if (error?.response?.status === 401) logout();
      throw new Error(parseApiError(error, 'Impossible de charger les demandes'));
    } finally {
      setRequestsLoading(false);
    }
  }, [currentUser, logout]);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAccessToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const me = await authApi.me();
        setCurrentUser(me.data);
      } catch {
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, [logout]);

  useEffect(() => {
    if (!currentUser) return;

    loadRequests().catch(() => {
      // Display handled by page-level UI if needed.
    });
  }, [currentUser, loadRequests]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      setAuthTokens({ access: response.data.access, refresh: response.data.refresh });
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      throw new Error(parseApiError(error, 'Email ou mot de passe invalide'));
    }
  };

  const registerUser = async (fullName, email, password) => {
    try {
      await authApi.register({ full_name: fullName, email, password });
    } catch (error) {
      throw new Error(parseApiError(error, 'Inscription impossible'));
    }
  };

  const validateRequest = (data) => {
    const errors = [];

    if (!data.title?.trim()) errors.push('Le titre est requis');
    else if (data.title.trim().length < 5) errors.push('Le titre doit contenir au moins 5 caracteres');
    else if (data.title.trim().length > 100) errors.push('Le titre ne doit pas depasser 100 caracteres');

    if (!data.description?.trim()) errors.push('La description est requise');
    else if (data.description.trim().length < 10) errors.push('La description doit contenir au moins 10 caracteres');

    if (!data.type) errors.push('Le type de demande est requis');
    else if (!['INFRASTRUCTURE', 'SOFTWARE', 'HARDWARE', 'OTHER'].includes(data.type)) {
      errors.push('Type de demande invalide');
    }

    return { isValid: errors.length === 0, errors };
  };

  const createRequest = async (newRequest) => {
    const validation = validateRequest(newRequest);
    if (!validation.isValid) throw new Error(validation.errors.join(' | '));

    try {
      const response = await requestApi.create(newRequest);
      const mapped = mapRequest(response.data);
      setRequests((prev) => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      throw new Error(parseApiError(error, 'Creation de la demande impossible'));
    }
  };

  const updateRequest = async (id, updates) => {
    const validation = validateRequest(updates);
    if (!validation.isValid) throw new Error(validation.errors.join(' | '));

    try {
      const response = await requestApi.update(id, updates);
      const mapped = mapRequest(response.data);
      setRequests((prev) => prev.map((request) => (request.id === id ? mapped : request)));
      return mapped;
    } catch (error) {
      throw new Error(parseApiError(error, 'Modification impossible'));
    }
  };

  const updateRequestStatus = async (id, newStatus, comment = '') => {
    try {
      const response = await requestApi.changeStatus(id, { status: newStatus, comment });
      const mapped = mapRequest(response.data);
      setRequests((prev) => prev.map((request) => (request.id === id ? mapped : request)));
      return mapped;
    } catch (error) {
      throw new Error(parseApiError(error, 'Changement de statut impossible'));
    }
  };

  const addManagerComment = async (id, content) => {
    try {
      await requestApi.addComment(id, { content });
      const refreshed = await requestApi.retrieve(id);
      const mapped = mapRequest(refreshed.data);
      setRequests((prev) => prev.map((request) => (request.id === id ? mapped : request)));
      return mapped;
    } catch (error) {
      throw new Error(parseApiError(error, 'Ajout du commentaire impossible'));
    }
  };

  const getRequest = (id) => requests.find((request) => request.id === id);
  const getUserRequests = () => requests;
  const getAllRequests = () => requests;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        requestsLoading,
        requests,
        login,
        logout,
        registerUser,
        createRequest,
        updateRequest,
        updateRequestStatus,
        addManagerComment,
        getRequest,
        getUserRequests,
        getAllRequests,
        validateRequest,
        reloadRequests: loadRequests
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
