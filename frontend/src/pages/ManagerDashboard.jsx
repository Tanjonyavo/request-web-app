import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
  const { currentUser, getAllRequests, updateRequestStatus, addManagerComment, requestsLoading } = useContext(AppContext);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequests = getAllRequests();

  if (!currentUser || currentUser.role !== 'manager') {
    return <div style={{ padding: 20 }}>Acces refuse. Connectez-vous en tant que gestionnaire.</div>;
  }

  const getStatusOptions = (currentStatus) => {
    const options = {
      SUBMITTED: ['IN_PROGRESS', 'CLOSED'],
      IN_PROGRESS: ['CLOSED'],
      CLOSED: []
    };
    return options[currentStatus] || [];
  };

  const handleSave = async (requestId) => {
    setError('');

    if (!newStatus && !comment.trim()) {
      setError('Veuillez choisir un statut ou saisir un commentaire.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (newStatus) {
        await updateRequestStatus(requestId, newStatus, comment);
      } else {
        await addManagerComment(requestId, comment);
      }

      setSelectedRequest(null);
      setNewStatus('');
      setComment('');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshSelection = (request) => {
    setSelectedRequest(request);
    setNewStatus('');
    setComment('');
    setError('');
  };

  return (
    <Layout>
      <div className="manager-dashboard">
        <h2>Tableau de bord gestionnaire</h2>

        {requestsLoading ? (
          <div className="empty-state">Chargement des demandes...</div>
        ) : selectedRequest ? (
          <Card title={selectedRequest.title}>
            <div className="manager-detail">
              <div className="detail-section">
                <h4>Informations</h4>
                <div className="info-grid">
                  <div><strong>Type:</strong> {selectedRequest.type}</div>
                  <div>
                    <strong>Statut actuel:</strong>{' '}
                    <span className={`status status-${selectedRequest.status.toLowerCase()}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div><strong>Auteur:</strong> {selectedRequest.authorEmail}</div>
                  <div><strong>Creee:</strong> {selectedRequest.createdAt}</div>
                </div>
                <p className="description">{selectedRequest.description}</p>
              </div>

              <div className="detail-section">
                <h4>Traitement</h4>
                {getStatusOptions(selectedRequest.status).length > 0 ? (
                  <div>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                    >
                      <option value="">-- Aucun changement de statut --</option>
                      {getStatusOptions(selectedRequest.status).map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label>Commentaire (optionnel)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        rows={4}
                        style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd', fontFamily: 'inherit' }}
                      />
                    </div>
                    {error && <div style={{ color: '#dc3545', marginBottom: 8 }}>{error}</div>}
                    <div className="action-buttons">
                      <Button
                        variant="success"
                        size="md"
                        onClick={() => handleSave(selectedRequest.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          setSelectedRequest(null);
                          setNewStatus('');
                          setComment('');
                          setError('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#666', marginBottom: 12 }}>Cette demande est fermee. Vous pouvez ajouter un commentaire.</p>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label>Commentaire</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        rows={4}
                        style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd', fontFamily: 'inherit' }}
                      />
                    </div>
                    {error && <div style={{ color: '#dc3545', marginBottom: 8 }}>{error}</div>}
                    <div className="action-buttons">
                      <Button
                        variant="success"
                        size="md"
                        onClick={() => handleSave(selectedRequest.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Enregistrement...' : 'Ajouter le commentaire'}
                      </Button>
                      <Button variant="secondary" size="md" onClick={() => setSelectedRequest(null)}>
                        Retour
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.comments.length > 0 && (
                <div className="detail-section">
                  <h4>Commentaires</h4>
                  <div className="comments-list">
                    {selectedRequest.comments.map((entry) => (
                      <div key={entry.id} className="comment-item">
                        <div className="comment-header">
                          <strong>{entry.author}</strong>
                          <small>{entry.date}</small>
                        </div>
                        <p>{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="requests-list">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Auteur</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Creee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allRequests.map((request) => (
                  <tr key={request.id} className="table-row">
                    <td>{request.title}</td>
                    <td>{request.authorEmail}</td>
                    <td><span className={`badge badge-${request.type.toLowerCase()}`}>{request.type}</span></td>
                    <td><span className={`status status-${request.status.toLowerCase()}`}>{request.status}</span></td>
                    <td>{request.createdAt}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => refreshSelection(request)}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        Traiter
                      </button>
                      <Link to={`/request/${request.id}`}>
                        <button
                          style={{
                            background: '#2d3748',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          Detail
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
