import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MdCheckCircle,
  MdErrorOutline,
  MdArrowBack,
  MdSave,
  MdAdd,
  MdRemove,
} from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { saveTransaction } from '../lib/transactions';
import { DIRECTIONS } from '../lib/transactionUtils';
import SourceSelector from '../components/SourceSelector';
import '../styles/confirm.css';

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
];

function todayString() {
  return new Date().toISOString().split('T')[0];
}

export default function Confirm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();

  const previewUrl = state?.previewUrl ?? null;
  const fileName = state?.fileName ?? '';
  const file = state?.file ?? null;

  const extracted = state?.extracted ?? null;
  const [merchant, setMerchant] = useState(extracted?.merchant ?? '');
  const [amount, setAmount] = useState(
    extracted?.amount != null ? String(extracted.amount) : '',
  );
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState(extracted?.date ?? todayString());
  const [direction, setDirection] = useState('debit');
  const [sourceId, setSourceId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!merchant.trim()) return 'Please enter a merchant name.';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return 'Please enter a valid amount greater than 0.';
    if (!date) return 'Please select a date.';
    if (!sourceId) return 'Please select or add a money source.';
    return null;
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to save a transaction.');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await saveTransaction({
        file,
        userId: user.id,
        amount,
        merchant,
        category,
        transactionDate: date,
        direction,
        sourceId,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to save transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="confirm-page">
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        <header className="page-header">
          <h1>Confirm Transaction</h1>
          <p>Review and edit the details before saving.</p>
          {extracted && (
            <p className="confirm-ai-badge">Details auto-filled from your screenshot</p>
          )}
        </header>

        <div className="confirm-layout">
          <div className="confirm-image-panel">
            {previewUrl ? (
              <>
                <div className="confirm-image-wrapper">
                  <img
                    src={previewUrl}
                    alt="Payment screenshot"
                    className="confirm-image"
                  />
                </div>
                <p className="confirm-image-label">{fileName}</p>
              </>
            ) : (
              <div className="confirm-no-image">
                <p>No screenshot uploaded. Go back to Upload to add one.</p>
              </div>
            )}
          </div>

          <div className="confirm-form-card">
            <p className="confirm-form-title">Transaction Details</p>

            {error && (
              <div className="confirm-alert confirm-alert-error" role="alert">
                <MdErrorOutline size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="confirm-alert confirm-alert-success" role="status">
                <MdCheckCircle size={18} />
                Transaction saved! Redirecting to dashboard…
              </div>
            )}

            <form className="confirm-form" onSubmit={handleSave}>
              <div className="field">
                <span className="field-label">Transaction type</span>
                <p className="field-hint">
                  Credit = money added to your account. Debit = money removed.
                </p>
                <div className="direction-toggle" role="group" aria-label="Transaction type">
                  {Object.values(DIRECTIONS).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`direction-pill direction-${opt.value}${
                        direction === opt.value ? ' selected' : ''
                      }`}
                      onClick={() => setDirection(opt.value)}
                    >
                      {opt.value === 'credit' ? (
                        <MdAdd size={18} />
                      ) : (
                        <MdRemove size={18} />
                      )}
                      <span>
                        <strong>{opt.label}</strong>
                        <small>{opt.hint}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <SourceSelector
                value={sourceId}
                onChange={setSourceId}
                disabled={saving || success}
              />

              <div className="field">
                <label className="field-label" htmlFor="merchant">
                  {direction === 'credit' ? 'From / description' : 'Merchant'}
                </label>
                <input
                  id="merchant"
                  type="text"
                  className="field-input"
                  placeholder={
                    direction === 'credit'
                      ? 'e.g. Salary, Friend A, Refund'
                      : 'e.g. Zomato, Swiggy, Amazon'
                  }
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="amount">
                  Amount (₹)
                </label>
                <div className="field-input-prefix-wrapper">
                  <span className="field-prefix">₹</span>
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="field-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className="field-input"
                  value={date}
                  max={todayString()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {direction === 'debit' && (
                <div className="field">
                  <span className="field-label">Category</span>
                  <div className="category-pills" role="group" aria-label="Category">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-pill${category === cat ? ' selected' : ''}`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="confirm-divider" />

              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-confirm btn-confirm-cancel"
                  onClick={() => navigate('/upload')}
                  disabled={saving || success}
                >
                  <MdArrowBack size={18} />
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-confirm btn-confirm-save"
                  disabled={saving || success}
                >
                  {saving ? (
                    'Saving…'
                  ) : (
                    <>
                      <MdSave size={18} />
                      Save Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
