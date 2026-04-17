import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import './CreateRequest.css';

export default function CreateRequest() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('OTHER');
  const [errors, setErrors] = useState([]);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest, currentUser } = useContext(AppContext);
  const navigate = useNavigate();

  if (!currentUser) {
    return <div style={{ padding: 20 }}>Non authentifie. <Link to="/login">Se connecter</Link></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setServerError('');
    setIsSubmitting(true);

    try {
      await createRequest({ title, description, type });
      navigate('/dashboard');
    } catch (error) {
      const errorMessages = error.message.split(' | ');
      setServerError('Erreur de validation');
      setErrors(errorMessages);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="create-request">
        <h2>Creer une nouvelle demande</h2>
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
                  placeholder="Titre de votre demande (5-100 caracteres)"
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
                  placeholder="Decrivez votre demande en detail (minimum 10 caracteres)..."
                  rows={6}
                  className={errors.some((err) => err.includes('description')) ? 'input-error' : ''}
                />
                <small style={{ color: '#666', marginTop: 4 }}>{description.length} caracteres</small>
              </div>
              <div className="form-actions">
                <Button type="submit" variant="success" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Creation...' : 'Creer la demande'}
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
