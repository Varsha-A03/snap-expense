import {
  formatCurrency,
  formatDate,
  getSourceName,
  DIRECTIONS,
} from '../lib/transactionUtils';
import '../styles/transaction-list.css';

export default function TransactionList({ transactions, compact = false }) {
  if (!transactions.length) {
    return (
      <p className="transaction-list-empty">
        No transactions to show.
      </p>
    );
  }

  return (
    <ul className={`transaction-list${compact ? ' compact' : ''}`}>
      {transactions.map((t) => {
        const isCredit = t.direction === 'credit';
        const directionMeta = DIRECTIONS[t.direction] ?? DIRECTIONS.debit;

        return (
          <li key={t.id} className="transaction-item">
            <div className="transaction-item-main">
              <div className="transaction-item-title">
                <span className="transaction-merchant">{t.merchant}</span>
                <span className="transaction-source">{getSourceName(t)}</span>
              </div>
              <span
                className={`transaction-amount${isCredit ? ' transaction-amount-credit' : ' transaction-amount-debit'}`}
              >
                {isCredit ? '+' : '−'}
                {formatCurrency(t.amount)}
              </span>
            </div>
            <div className="transaction-item-meta">
              <div className="transaction-badges">
                <span
                  className={`transaction-direction transaction-direction-${t.direction ?? 'debit'}`}
                >
                  {directionMeta.shortLabel}
                </span>
                {t.direction !== 'credit' && (
                  <span className="transaction-category">{t.category}</span>
                )}
              </div>
              <span className="transaction-date">{formatDate(t.transaction_date)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
