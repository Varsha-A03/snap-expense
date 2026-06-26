import { formatCurrency } from '../lib/transactionUtils';
import '../styles/source-breakdown.css';

export default function SourceBreakdown({ data }) {
  if (!data.length) {
    return (
      <p className="source-breakdown-empty">
        Add sources when saving transactions to see per-source balances here.
      </p>
    );
  }

  return (
    <div className="source-breakdown-grid">
      {data.map((row) => (
        <article key={row.id ?? '__unassigned__'} className="source-breakdown-card">
          <h3 className="source-breakdown-name">{row.name}</h3>
          <dl className="source-breakdown-stats">
            <div>
              <dt>Money in</dt>
              <dd className="source-stat-in">{formatCurrency(row.moneyIn)}</dd>
            </div>
            <div>
              <dt>Money out</dt>
              <dd className="source-stat-out">{formatCurrency(row.moneyOut)}</dd>
            </div>
            <div>
              <dt>Remaining</dt>
              <dd
                className={
                  row.balance >= 0 ? 'source-stat-balance-pos' : 'source-stat-balance-neg'
                }
              >
                {formatCurrency(row.balance)}
              </dd>
            </div>
          </dl>
          <p className="source-breakdown-count">
            {row.count} transaction{row.count !== 1 ? 's' : ''}
          </p>
        </article>
      ))}
    </div>
  );
}
