import { useState } from 'react';
import {
  MdAdd,
  MdDelete,
  MdPause,
  MdPlayArrow,
  MdEventRepeat,
} from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useRecurring } from '../hooks/useRecurring';
import SourceSelector from '../components/SourceSelector';
import LoadingScreen from '../components/LoadingScreen';
import {
  FREQUENCIES,
  createRecurring,
  deleteRecurring,
  setRecurringActive,
} from '../lib/recurring';
import {
  CATEGORIES,
  DIRECTIONS,
  formatCurrency,
  formatDate,
} from '../lib/transactionUtils';
import '../styles/recurring.css';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_FORM = {
  merchant: '',
  amount: '',
  category: 'Other',
  direction: 'debit',
  sourceId: null,
  frequency: 'monthly',
  nextDueDate: todayString(),
};

export default function Recurring() {
  const { user } = useAuth();
  const { recurring, loading, error, reload } = useRecurring();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [formError, setFormError] = useState('');

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd(event) {
    event.preventDefault();
    setFormError('');

    if (!form.merchant.trim()) {
      setFormError('Enter a name (e.g. Rent, Netflix, Salary).');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Enter a valid amount greater than 0.');
      return;
    }
    if (!form.sourceId) {
      setFormError('Select or add a money source.');
      return;
    }
    if (!form.nextDueDate) {
      setFormError('Pick the next due date.');
      return;
    }

    setSaving(true);
    try {
      await createRecurring({
        userId: user.id,
        merchant: form.merchant,
        amount: form.amount,
        category: form.direction === 'debit' ? form.category : 'Other',
        direction: form.direction,
        sourceId: form.sourceId,
        frequency: form.frequency,
        nextDueDate: form.nextDueDate,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not create recurring transaction.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule) {
    setFormError('');
    setBusyId(rule.id);
    try {
      await setRecurringActive(rule.id, !rule.active);
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not update recurring transaction.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(rule) {
    if (
      !window.confirm(
        `Delete recurring "${rule.merchant}"? Already-added transactions are kept.`,
      )
    ) {
      return;
    }

    setFormError('');
    setBusyId(rule.id);
    try {
      await deleteRecurring(rule.id);
      await reload();
    } catch (err) {
      setFormError(err.message || 'Could not delete recurring transaction.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading recurring transactions..." />;
  }

  return (
    <>
      <header className="page-header">
        <h1>Recurring</h1>
        <p>
          Rent, subscriptions, salary, EMIs — due entries are added
          automatically when you open the app.
        </p>
      </header>

      <div className="recurring-card">
        {(error || formError) && (
          <p className="recurring-error" role="alert">
            {error || formError}
          </p>
        )}

        {!showForm ? (
          <button
            type="button"
            className="recurring-add-toggle"
            onClick={() => setShowForm(true)}
          >
            <MdAdd size={18} />
            Add recurring transaction
          </button>
        ) : (
          <form className="recurring-form" onSubmit={handleAdd}>
            <div className="recurring-form-grid">
              <div className="field">
                <label className="field-label" htmlFor="rec-merchant">
                  Name
                </label>
                <input
                  id="rec-merchant"
                  type="text"
                  className="field-input"
                  placeholder="e.g. Rent, Netflix, Salary"
                  value={form.merchant}
                  onChange={(e) => setField('merchant', e.target.value)}
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="rec-amount">
                  Amount (₹)
                </label>
                <input
                  id="rec-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="field-input"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="rec-direction">
                  Type
                </label>
                <select
                  id="rec-direction"
                  className="field-select"
                  value={form.direction}
                  onChange={(e) => setField('direction', e.target.value)}
                  disabled={saving}
                >
                  <option value="debit">{DIRECTIONS.debit.label}</option>
                  <option value="credit">{DIRECTIONS.credit.label}</option>
                </select>
              </div>

              {form.direction === 'debit' && (
                <div className="field">
                  <label className="field-label" htmlFor="rec-category">
                    Category
                  </label>
                  <select
                    id="rec-category"
                    className="field-select"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    disabled={saving}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="rec-frequency">
                  Repeats
                </label>
                <select
                  id="rec-frequency"
                  className="field-select"
                  value={form.frequency}
                  onChange={(e) => setField('frequency', e.target.value)}
                  disabled={saving}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="rec-due">
                  Next due date
                </label>
                <input
                  id="rec-due"
                  type="date"
                  className="field-input"
                  value={form.nextDueDate}
                  min={todayString()}
                  onChange={(e) => setField('nextDueDate', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <SourceSelector
              value={form.sourceId}
              onChange={(v) => setField('sourceId', v)}
              disabled={saving}
            />

            <div className="recurring-form-actions">
              <button
                type="button"
                className="recurring-cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                  setFormError('');
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="recurring-save-btn" disabled={saving}>
                {saving ? 'Adding…' : 'Add recurring'}
              </button>
            </div>
          </form>
        )}

        {recurring.length === 0 ? (
          <p className="page-card-placeholder">
            No recurring transactions yet. Add rent, subscriptions, salary, or
            EMIs above and they&apos;ll be tracked automatically.
          </p>
        ) : (
          <ul className="recurring-list">
            {recurring.map((rule) => {
              const busy = busyId === rule.id;
              const isCredit = rule.direction === 'credit';

              return (
                <li
                  key={rule.id}
                  className={`recurring-item${rule.active ? '' : ' paused'}`}
                >
                  <div className="recurring-item-icon">
                    <MdEventRepeat size={20} />
                  </div>
                  <div className="recurring-item-main">
                    <div className="recurring-item-title">
                      <span className="recurring-merchant">{rule.merchant}</span>
                      <span
                        className={`recurring-amount${isCredit ? ' credit' : ' debit'}`}
                      >
                        {isCredit ? '+' : '−'}
                        {formatCurrency(rule.amount)}
                      </span>
                    </div>
                    <div className="recurring-item-meta">
                      <span className="recurring-badge">
                        {FREQUENCIES.find((f) => f.value === rule.frequency)?.label ??
                          rule.frequency}
                      </span>
                      {!isCredit && (
                        <span className="recurring-badge">{rule.category}</span>
                      )}
                      {rule.sources?.name && (
                        <span className="recurring-badge">{rule.sources.name}</span>
                      )}
                      <span className="recurring-due">
                        {rule.active
                          ? `Next: ${formatDate(rule.next_due_date)}`
                          : 'Paused'}
                      </span>
                    </div>
                  </div>
                  <div className="recurring-item-actions">
                    <button
                      type="button"
                      className="recurring-icon-btn"
                      onClick={() => handleToggle(rule)}
                      disabled={busy}
                      title={rule.active ? 'Pause' : 'Resume'}
                    >
                      {rule.active ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
                    </button>
                    <button
                      type="button"
                      className="recurring-icon-btn danger"
                      onClick={() => handleDelete(rule)}
                      disabled={busy}
                      title="Delete"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
