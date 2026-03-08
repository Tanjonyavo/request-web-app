import { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import './EditRequest.css';

export default function EditRequest() {
  const { id } = useParams();
  const { getRequest, currentUser, updateRequest, validateRequest } = useContext(AppContext);
  const navigate = useNavigate();
  const request = getRequest(parseInt(id, 10));

  const [title, setTitle] = useState(request?.title || '');
  const [description, setDescription] = useState(request?.description || '');
  const [type, setType] = useState(request?.type || 'OTHER');
  const [errors, setErrors] = useState([]);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return <div style={{ padding: 20 }}>Non authentifie. <a href="/login">Se connecter</a></div>;
  }

  if (!request) {
    return <Layout><div className="error-state">Demande introuvable</div></Layout>;
  }

  if (request.authorId !== currentUser.id) {
    return <Layout><div className="error-state">Acces refuse</div></Layout>;
  }

  if (request.status !== 'SUBMITTED') {
    return (
      <Layout>
        <div style={{ padding: 20, background: '#f8d7da', borderRadius: 8, color: '#721c24' }}>
          Cette demande ne peut pas etre modifiee car son statut est {request.status}.
          <br /><a href="/dashboard">Retour au tableau de bord</a>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setServerError('');

    const validation = validateRequest({ title, description, type });
    if (!validation.isValid) {
      setServerError('Erreur de validation');
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRequest(request.id, { title, description, type });
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.message);
      setErrors(error.message.split(' | '));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="edit-request">
        <h2>Modifier la demande</h2>
        <div className="form-container">
          <Card>
            {serverError && (
              <div
                style={{
                  background: '#f8d7da',
                  color: '#721c24',
                  padding: '12px',
                  borderRadius: 6,
                  marginBottom: 20,
                  border: '1px solid #f5c6cb'
                }}
              >
                <strong>{serverError}</strong>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {errors.map((err, i) => (
                    <li key={i} style={{ fontSize: 14 }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-group">
                <label htmlFor="title">Titre *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de votre demande"
                  maxLength={100}
                  className={errors.some((err) => err.includes('titre')) ? 'input-error' : ''}
                />
                <small style={{ color: '#666', marginTop: 4 }}>{title.length}/100</small>
              </div>
              <div className="form-group">
                <label htmlFor="type">Type de demande *</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={errors.some((err) => err.includes('type')) ? 'input-error' : ''}
                >
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="HARDWARE">Hardware</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Decrivez votre demande en detail..."
                  className={errors.some((err) => err.includes('description')) ? 'input-error' : ''}
                  rows={6}
                />
                <small style={{ color: '#666', marginTop: 4 }}>{description.length} caracteres</small>
              </div>
              <div className="form-actions">
                <Button type="submit" variant="success" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
                <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/dashboard')}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
