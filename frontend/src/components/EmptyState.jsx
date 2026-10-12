import './EmptyState.css';

export default function EmptyState({ message = 'No data available' }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">🔍</span>
      <p className="empty-state__msg">{message}</p>
    </div>
  );
}
