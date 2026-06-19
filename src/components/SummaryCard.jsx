import '../styles/summary-card.css';

export default function SummaryCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="summary-card">
      <div className="summary-card-top">
        <span className="summary-card-title">{title}</span>
        {Icon && (
          <span className="summary-card-icon" aria-hidden="true">
            <Icon size={20} />
          </span>
        )}
      </div>
      <p className="summary-card-value">{value}</p>
      {subtitle && <p className="summary-card-subtitle">{subtitle}</p>}
    </div>
  );
}
