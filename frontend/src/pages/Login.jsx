import { useContext, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const registrationSuccess = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('registered') === '1';
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      navigate(user.role === 'manager' ? '/manager' : '/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>UQO-Requests</h1>
          <p>Systeme de gestion de demandes</p>
        </div>
        <Card title="Connexion">
          {registrationSuccess && (
            <div
              style={{
                background: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 16,
                fontSize: 14
              }}
            >
              Inscription reussie. Vous pouvez maintenant vous connecter.
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="exemple@uqo.ca"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
            </div>
            {error && <div style={{ color: '#dc3545', fontSize: 14, fontWeight: 500 }}>{error}</div>}
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          <p className="signup-link">
            Pas de compte? <Link to="/register">S'inscrire</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
