import '../styles/components/emptyState.css';

const EmptyState = ({ logo, title, description, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        {logo && <div className="empty-state-logo">{logo}</div>}
        {title && <h2 className="empty-state-title">{title}</h2>}
        {description && <p className="empty-state-description">{description}</p>}
        {action && <div className="empty-state-action">{action}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
