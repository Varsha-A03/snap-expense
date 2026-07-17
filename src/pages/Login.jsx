import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MdReceipt,
  MdEmail,
  MdArrowBack,
  MdShare,
  MdMarkEmailRead,
} from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
// import PwaInstallGuide from '../components/PwaInstallGuide';
import '../styles/login.css';

export default function Login() {
  const { sendOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const pendingShare = searchParams.get('shared') === '1';
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  async function handleSendLink(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendOtp(email.trim());
      setStep('sent');
    } catch (err) {
      setError(err.message || 'Failed to send sign-in email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setResent(false);
    setLoading(true);

    try {
      await sendOtp(email.trim());
      setResent(true);
    } catch (err) {
      setError(err.message || 'Failed to resend sign-in email.');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep('email');
    setError('');
    setResent(false);
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
          {/* <PwaInstallGuide /> */}

          <div className="login-card-header">
            <h2>{step === 'email' ? 'Welcome back' : 'Check your email'}</h2>
            <p>
              {step === 'email'
                ? 'Sign in with a secure link sent to your email.'
                : 'Open the sign-in link we just emailed you to continue.'}
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

          {step === 'email' ? (
            <form className="login-form" onSubmit={handleSendLink}>
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
                {loading ? 'Sending link...' : 'Send sign-in link'}
              </button>
            </form>
          ) : (
            <div className="login-sent">
              <div className="login-sent-icon" aria-hidden="true">
                <MdMarkEmailRead size={32} />
              </div>
              <p className="login-sent-text">
                We sent a sign-in link to <strong>{email}</strong>. Open it on
                this device and you&apos;ll be signed in automatically — you can
                keep this tab open.
              </p>

              {resent && (
                <div className="alert alert-success" role="status">
                  Sent again — check your inbox (and spam).
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResend}
                disabled={loading}
              >
                {loading ? 'Resending...' : 'Resend link'}
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
            </div>
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
