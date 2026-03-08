import './Card.css';

export default function Card({ children, title }) {
  return (
    <div className="card">
      {title && <div className="card-header"><h3>{title}</h3></div>}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
