import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdReceipt, MdEmail, MdArrowBack, MdShare } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import '../styles/login.css';

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const pendingShare = searchParams.get('shared') === '1';
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSendOtp(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendOtp(email.trim());
      setStep('otp');
      setMessage(`We sent a 6-digit code to ${email.trim()}`);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email.trim(), otp.trim());
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep('email');
    setOtp('');
    setError('');
    setMessage('');
  }

  return (
    <div className="login-page">
      <div className="login-background" aria-hidden="true" />

      <div className="login-container">
        <section className="login-hero">
          <div className="login-hero-icon">
            <MdReceipt size={32} />
          </div>
          <h1>SnapExpense</h1>
          <p className="login-hero-tagline">
            Track UPI expenses in seconds. Snap a screenshot, confirm, and save.
          </p>
          <ul className="login-features">
            <li>Upload payment screenshots instantly</li>
            <li>Auto-extract amount and merchant</li>
            <li>View spending insights on your dashboard</li>
          </ul>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <h2>{step === 'email' ? 'Welcome back' : 'Verify your email'}</h2>
            <p>
              {step === 'email'
                ? 'Sign in with a one-time code sent to your email.'
                : 'Enter the 6-digit code we sent you.'}
            </p>
          </div>

          {pendingShare && (
            <div className="alert alert-info" role="status">
              <MdShare size={18} />
              Sign in to add your shared payment screenshot.
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success" role="status">
              {message}
            </div>
          )}

          {step === 'email' ? (
            <form className="login-form" onSubmit={handleSendOtp}>
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <div className="input-wrapper">
                <MdEmail className="input-icon" size={20} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleVerifyOtp}>
              <label className="form-label" htmlFor="otp">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify and continue'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBack}
                disabled={loading}
              >
                <MdArrowBack size={18} />
                Use a different email
              </button>
            </form>
          )}

          <p className="login-footer">
            By continuing, you agree to use SnapExpense for personal expense
            tracking.
          </p>
        </section>
      </div>
    </div>
  );
}
