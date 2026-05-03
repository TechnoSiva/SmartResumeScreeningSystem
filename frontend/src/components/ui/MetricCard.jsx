import './MetricCard.css';

export default function MetricCard({ icon, label, value, subtitle, color = 'primary', delay = 0 }) {
  return (
    <div className={`metric-card metric-card--${color}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="metric-card__icon">{icon}</div>
      <div className="metric-card__content">
        <span className="metric-card__label">{label}</span>
        <span className="metric-card__value">{value}</span>
        {subtitle && <span className="metric-card__subtitle">{subtitle}</span>}
      </div>
      <div className="metric-card__glow" />
    </div>
  );
}
