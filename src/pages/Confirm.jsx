import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MdCheckCircle,
  MdErrorOutline,
  MdArrowBack,
  MdSave,
} from 'react-icons/md';
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

  // Image passed from Upload page via router state
  const previewUrl = state?.previewUrl ?? null;
  const fileName = state?.fileName ?? '';

  // Form fields — will be pre-filled by AI in a future phase
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!merchant.trim()) return 'Please enter a merchant name.';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return 'Please enter a valid amount greater than 0.';
    if (!date) return 'Please select a date.';
    return null;
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    // Database save will be wired here in the next phase (Day 4)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setSuccess(true);

    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1200);
  }

  return (
    <div className="confirm-page">
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        <header className="page-header">
          <h1>Confirm Transaction</h1>
          <p>Review and edit the details before saving.</p>
        </header>

        <div className="confirm-layout">
          {/* ── Screenshot thumbnail ── */}
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

          {/* ── Form ── */}
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
              {/* Merchant */}
              <div className="field">
                <label className="field-label" htmlFor="merchant">
                  Merchant
                </label>
                <input
                  id="merchant"
                  type="text"
                  className="field-input"
                  placeholder="e.g. Zomato, Swiggy, Amazon"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              {/* Amount */}
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

              {/* Date */}
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

              {/* Category */}
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

              <div className="confirm-divider" />

              {/* Actions */}
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
