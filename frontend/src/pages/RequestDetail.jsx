import { useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import './RequestDetail.css';

export default function RequestDetail() {
  const { id } = useParams();
  const { getRequest, currentUser } = useContext(AppContext);
  const navigate = useNavigate();
  const request = getRequest(parseInt(id, 10));

  if (!currentUser) {
    return <div style={{ padding: 20 }}>Non authentifie. <a href="/login">Se connecter</a></div>;
  }

  if (!request) {
    return <Layout><div className="error-state">Demande introuvable</div></Layout>;
  }

  if (request.authorId !== currentUser.id && currentUser.role !== 'manager') {
    return <Layout><div className="error-state">Acces refuse</div></Layout>;
  }

  const backPath = currentUser.role === 'manager' ? '/manager' : '/dashboard';

  return (
    <Layout>
      <div className="request-detail">
        <button
          onClick={() => navigate(backPath)}
          style={{
            marginBottom: 20,
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            padding: 0
          }}
        >
          {'<- Retour'}
        </button>

        <Card title={request.title}>
          <div className="detail-header">
            <div>
              <span className={`badge badge-${request.type.toLowerCase()}`}>{request.type}</span>
              <span className={`status status-${request.status.toLowerCase()}`}>{request.status}</span>
            </div>
          </div>

          <div className="detail-info">
            <div className="info-row">
              <strong>Creee:</strong> {request.createdAt}
            </div>
            <div className="info-row">
              <strong>Modifiee:</strong> {request.updatedAt}
            </div>
            <div className="info-row">
              <strong>Auteur:</strong> {request.authorEmail}
            </div>
          </div>

          <div className="description-section">
            <h4>Description</h4>
            <p>{request.description}</p>
          </div>

          <div className="timeline">
            <h4>Historique</h4>
            <div className="history-list">
              {request.history.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-marker"></div>
                  <div className="history-content">
                    <span className="history-status">{entry.status}</span>
                    <small>{entry.date} - {entry.author}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {request.comments.length > 0 && (
            <div className="comments-section">
              <h4>Commentaires</h4>
              <div className="comments-list">
                {request.comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{comment.author}</strong>
                      <small>{comment.date}</small>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.status === 'SUBMITTED' && request.authorId === currentUser.id && (
            <div className="action-section">
              <Link to={`/request/${request.id}/edit`}>
                <Button variant="primary" size="md">Modifier</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
