import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, getUserRequests, requestsLoading } = useContext(AppContext);

  if (!currentUser) {
    return <div style={{ padding: 20 }}>Non authentifie. <Link to="/login">Se connecter</Link></div>;
  }

  if (currentUser.role === 'manager') {
    return (
      <Layout>
        <div className="dashboard">
          <div className="dashboard-header">
            <h2>Vous etes connecte comme gestionnaire</h2>
            <Link to="/manager">
              <Button variant="primary">Aller au tableau gestionnaire</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const requests = getUserRequests();

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Mes demandes</h2>
          <Link to="/create-request">
            <Button variant="success">Nouvelle demande</Button>
          </Link>
        </div>

        {requestsLoading ? (
          <div className="empty-state">Chargement des demandes...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            Aucune demande pour le moment. <Link to="/create-request">Creer la premiere</Link>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map((request) => (
              <Card key={request.id} title={request.title}>
                <div className="request-item">
                  <div className="request-meta">
                    <span className={`badge badge-${request.type.toLowerCase()}`}>{request.type}</span>
                    <span className={`status status-${request.status.toLowerCase()}`}>{request.status}</span>
                  </div>
                  <p className="request-description">{request.description}</p>
                  <div className="request-dates">
                    <span>Creee: {request.createdAt}</span>
                    <span>MAJ: {request.updatedAt}</span>
                  </div>
                  <Link className="btn-link" to={`/request/${request.id}`}>
                    <Button variant="primary" size="md">Voir le detail</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
