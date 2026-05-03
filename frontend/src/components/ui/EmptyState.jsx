import './EmptyState.css';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="empty-state__title">{title || 'Nothing here yet'}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
