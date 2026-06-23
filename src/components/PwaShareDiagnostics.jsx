import { useEffect, useState } from 'react';
import { MdBugReport } from 'react-icons/md';
import { isStandaloneDisplay } from '../lib/pwaInstall';
import '../styles/pwa-install.css';

export default function PwaShareDiagnostics() {
  const [status, setStatus] = useState({
    loading: true,
    standalone: false,
    swReady: false,
    shareTarget: null,
    error: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function runChecks() {
      const standalone = isStandaloneDisplay();
      let swReady = false;
      let shareTarget = null;
      let error = '';

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          swReady = Boolean(registration?.active);
        }

        const response = await fetch('/manifest.webmanifest');
        const manifest = await response.json();
        shareTarget = manifest.share_target ?? null;
      } catch (err) {
        error = err.message || 'Could not read install status.';
      }

      if (!cancelled) {
        setStatus({
          loading: false,
          standalone,
          swReady,
          shareTarget,
          error,
        });
      }
    }

    runChecks();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status.loading) {
    return null;
  }

  const shareAction = status.shareTarget?.action ?? 'missing';

  return (
    <details className="pwa-diagnostics">
      <summary>
        <MdBugReport size={18} />
        Share target troubleshooting
      </summary>
      <ul>
        <li>
          Installed app mode:{' '}
          <strong>{status.standalone ? 'Yes' : 'No — install from Chrome'}</strong>
        </li>
        <li>
          Service worker active:{' '}
          <strong>{status.swReady ? 'Yes' : 'No'}</strong>
        </li>
        <li>
          Manifest share action: <code>{shareAction}</code>
        </li>
      </ul>
      {!status.standalone && (
        <p className="pwa-diagnostics-note">
          Open Chrome → Install app. Shortcuts never appear in the share sheet.
        </p>
      )}
      {status.standalone && (
        <p className="pwa-diagnostics-note">
          If missing on this phone but works on another device, open{' '}
          <code>chrome://webapks</code>, tap Update on SnapExpense, then
          uninstall and reinstall. Older Samsung models often keep a stale WebAPK.
        </p>
      )}
      {status.error && <p className="pwa-diagnostics-error">{status.error}</p>}
    </details>
  );
}
