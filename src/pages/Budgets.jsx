import { useState } from 'react';
import { MdDelete, MdSave, MdWarningAmber } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import LoadingScreen from '../components/LoadingScreen';
import { upsertBudget, deleteBudget, getBudgetProgress } from '../lib/budgets';
import {
  CATEGORIES,
  formatCurrency,
  getCurrentMonthTransactions,
} from '../lib/transactionUtils';
import '../styles/budgets.css';

function monthLabel() {
  return new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function Budgets() {
  const { user } = useAuth();
  const { budgets, loading, error, reload } = useBudgets();
  const { transactions, loading: txLoading } = useTransactions();
  const [drafts, setDrafts] = useState({});
  const [savingCategory, setSavingCategory] = useState(null);
  const [formError, setFormError] = useState('');

  if (loading || txLoading) {
    return <LoadingScreen message="Loading budgets..." />;
  }

  const monthTransactions = getCurrentMonthTransactions(transactions);
  const progressByCategory = Object.fromEntries(
    getBudgetProgress(budgets, monthTransactions).map((p) => [p.category, p]),
  );
  const budgetByCategory = Object.fromEntries(
    budgets.map((b) => [b.category, b]),
  );

  function draftValue(category) {
    if (drafts[category] !== undefined) return drafts[category];
    const existing = budgetByCategory[category];
    return existing ? String(Number(existing.amount)) : '';
  }

  async function handleSave(category) {
    const value = draftValue(category);
    setFormError('');
    setSavingCategory(category);
    try {
      await upsertBudget({ userId: user.id, category, amount: value });
      setDrafts((prev) => ({ ...prev, [category]: undefined }));
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not save budget.');
    } finally {
      setSavingCategory(null);
    }
  }

  async function handleRemove(category) {
    const existing = budgetByCategory[category];
    if (!existing) return;

    setFormError('');
    setSavingCategory(category);
    try {
      await deleteBudget(existing.id);
      setDrafts((prev) => ({ ...prev, [category]: undefined }));
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not remove budget.');
    } finally {
      setSavingCategory(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Budgets</h1>
        <p>
          Set monthly spending limits per category. Progress resets each month —
          currently showing {monthLabel()}.
        </p>
      </header>

      <div className="budgets-card">
        {(error || formError) && (
          <p className="budgets-error" role="alert">
            {error || formError}
          </p>
        )}

        <ul className="budgets-list">
          {CATEGORIES.map((category) => {
            const existing = budgetByCategory[category];
            const progress = progressByCategory[category];
            const saving = savingCategory === category;
            const value = draftValue(category);
            const dirty =
              drafts[category] !== undefined &&
              drafts[category] !== (existing ? String(Number(existing.amount)) : '');

            return (
              <li key={category} className="budgets-item">
                <div className="budgets-item-row">
                  <span className="budgets-category">{category}</span>
                  <div className="budgets-controls">
                    <div className="budgets-input-wrapper">
                      <span className="budgets-input-prefix">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="budgets-input"
                        placeholder="No limit"
                        value={value}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [category]: e.target.value,
                          }))
                        }
                        disabled={saving}
                        aria-label={`Monthly budget for ${category}`}
                      />
                    </div>
                    {(dirty || (!existing && value)) && (
                      <button
                        type="button"
                        className="budgets-save-btn"
                        onClick={() => handleSave(category)}
                        disabled={saving || !value}
                      >
                        <MdSave size={16} />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    )}
                    {existing && (
                      <button
                        type="button"
                        className="budgets-remove-btn"
                        onClick={() => handleRemove(category)}
                        disabled={saving}
                        title={`Remove ${category} budget`}
                      >
                        <MdDelete size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {progress && (
                  <div className="budgets-progress">
                    <div
                      className="budgets-progress-track"
                      role="progressbar"
                      aria-valuenow={Math.round(progress.percent)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`budgets-progress-fill${
                          progress.over
                            ? ' over'
                            : progress.near
                              ? ' near'
                              : ''
                        }`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="budgets-progress-meta">
                      <span>
                        {formatCurrency(progress.spent)} of{' '}
                        {formatCurrency(progress.amount)} spent
                      </span>
                      {progress.over ? (
                        <span className="budgets-status budgets-status-over">
                          <MdWarningAmber size={14} />
                          Over by {formatCurrency(progress.spent - progress.amount)}
                        </span>
                      ) : progress.near ? (
                        <span className="budgets-status budgets-status-near">
                          <MdWarningAmber size={14} />
                          {formatCurrency(progress.remaining)} left
                        </span>
                      ) : (
                        <span className="budgets-status budgets-status-ok">
                          {formatCurrency(progress.remaining)} left
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
