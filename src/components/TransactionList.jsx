import { MdDelete, MdEdit } from 'react-icons/md';
import {
  formatCurrency,
  formatDate,
  getSourceName,
  DIRECTIONS,
} from '../lib/transactionUtils';
import '../styles/transaction-list.css';

export default function TransactionList({
  transactions,
  compact = false,
  onEdit,
  onDelete,
  deletingId = null,
}) {
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
        const isDeleting = deletingId === t.id;

        return (
          <li key={t.id} className="transaction-item">
            <div className="transaction-item-main">
              <div className="transaction-item-title">
                <span className="transaction-merchant">{t.merchant}</span>
                <span className="transaction-source">{getSourceName(t)}</span>
              </div>
              <div className="transaction-item-actions">
                <span
                  className={`transaction-amount${isCredit ? ' transaction-amount-credit' : ' transaction-amount-debit'}`}
                >
                  {isCredit ? '+' : '−'}
                  {formatCurrency(t.amount)}
                </span>
                {onEdit && (
                  <button
                    type="button"
                    className="transaction-edit-btn"
                    onClick={() => onEdit(t)}
                    disabled={isDeleting}
                    title="Edit transaction"
                    aria-label={`Edit ${t.merchant} transaction`}
                  >
                    <MdEdit size={18} />
                    <span className="transaction-action-label">Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="transaction-delete-btn"
                    onClick={() => onDelete(t)}
                    disabled={isDeleting}
                    title="Delete transaction"
                    aria-label={`Delete ${t.merchant} transaction`}
                  >
                    <MdDelete size={18} />
                    <span className="transaction-action-label">
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </span>
                  </button>
                )}
              </div>
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
