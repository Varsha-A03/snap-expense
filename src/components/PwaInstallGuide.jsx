import { useEffect, useRef, useState } from 'react';
import {
  MdInstallMobile,
  MdInfoOutline,
  MdCheckCircle,
  MdWarningAmber,
} from 'react-icons/md';
import { isChromeOnAndroid, isStandaloneDisplay } from '../lib/pwaInstall';
import '../styles/pwa-install.css';

/**
 * Checks whether a real WebAPK for this origin is installed.
 * Returns true / false, or null when the API is unavailable.
 */
async function checkRealAppInstalled() {
  if (isStandaloneDisplay()) return true;
  if ('getInstalledRelatedApps' in navigator) {
    try {
      const apps = await navigator.getInstalledRelatedApps();
      return apps.length > 0;
    } catch {
      return null;
    }
  }
  return null;
}

// install status: 'none' | 'prompt-accepted' | 'real' | 'shortcut-only' | 'unverified'
export default function PwaInstallGuide() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [status, setStatus] = useState(
    isStandaloneDisplay() ? 'real' : 'none',
  );
  const [installing, setInstalling] = useState(false);
  const pollTimer = useRef(null);

  useEffect(() => {
    checkRealAppInstalled().then((real) => {
      if (real === true) setStatus('real');
    });

    function handleBeforeInstallPrompt(event) {
      // Chrome fires this only when the app meets installability criteria.
      // Capturing it lets us trigger the official install flow.
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function handleAppInstalled() {
      // Fires for BOTH real WebAPK installs and shortcut fallbacks,
      // so verify before celebrating.
      setDeferredPrompt(null);
      setStatus('prompt-accepted');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (status !== 'prompt-accepted') return;

    // WebAPK minting takes a few seconds; poll before declaring the result.
    let attempts = 0;

    async function poll() {
      attempts += 1;
      const real = await checkRealAppInstalled();

      if (real === true) {
        setStatus('real');
        return;
      }
      if (real === null) {
        setStatus('unverified');
        return;
      }
      if (attempts >= 6) {
        setStatus('shortcut-only');
        return;
      }
      pollTimer.current = setTimeout(poll, 3000);
    }

    poll();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [status]);

  async function handleInstall() {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setStatus('prompt-accepted');
      }
    } finally {
      setInstalling(false);
    }
  }

  if (status === 'real') {
    return (
      <div className="pwa-install-guide pwa-install-done" role="status">
        <MdCheckCircle size={20} />
        <p className="pwa-install-text">
          SnapExpense is installed as an app. Share a screenshot from GPay,
          PhonePe, or your gallery straight into it.
        </p>
      </div>
    );
  }

  if (status === 'prompt-accepted') {
    return (
      <div className="pwa-install-guide" role="status">
        <MdInstallMobile size={20} />
        <p className="pwa-install-text">Installing… verifying the app install.</p>
      </div>
    );
  }

  if (status === 'shortcut-only') {
    return (
      <div className="pwa-install-guide" role="alert">
        <MdWarningAmber size={20} />
        <div className="pwa-install-body">
          <p className="pwa-install-title">
            Chrome added a shortcut, not the app
          </p>
          <p className="pwa-install-text">
            A shortcut won&apos;t appear in the share sheet. To fix it:
          </p>
          <ul className="pwa-install-checklist">
            <li>Remove the shortcut from your home screen</li>
            <li>
              Chrome → Settings → Site settings → find this site →{' '}
              <strong>Clear &amp; reset</strong>
            </li>
            <li>Update Chrome in the Play Store, then reopen this page</li>
            <li>
              Install again — a real install shows an app-install dialog, not
              the &quot;Add to Home screen?&quot; one
            </li>
            <li>
              Verify: long-press the icon → <strong>Uninstall</strong> should
              appear, and the app is listed in <code>chrome://webapks</code>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (status === 'unverified') {
    return (
      <div className="pwa-install-guide" role="status">
        <MdInfoOutline size={20} />
        <p className="pwa-install-text">
          Install finished. Verify it&apos;s a real app: long-press the icon —
          it should say <strong>Uninstall</strong> (not just Remove). Then
          SnapExpense will appear in the share sheet.
        </p>
      </div>
    );
  }

  const onAndroidChrome = isChromeOnAndroid();

  return (
    <div className="pwa-install-guide" role="note">
      <MdInstallMobile size={20} />
      <div className="pwa-install-body">
        <p className="pwa-install-title">Install to share screenshots</p>

        {deferredPrompt ? (
          <>
            <p className="pwa-install-text">
              Install SnapExpense as an app so it appears in the Android share
              sheet from GPay, PhonePe, and your gallery.
            </p>
            <button
              type="button"
              className="pwa-install-btn"
              onClick={handleInstall}
              disabled={installing}
            >
              <MdInstallMobile size={18} />
              {installing ? 'Installing…' : 'Install app'}
            </button>
          </>
        ) : (
          <>
            <p className="pwa-install-text">
              {onAndroidChrome
                ? 'Use the Chrome menu (⋮) → Install app. If you only see “Add to Home screen” and it creates a shortcut with a small Chrome badge, the app is not installable yet — reload this page once so the service worker activates, then try again.'
                : 'Open this site in Chrome on Android, then use the menu → Install app. Samsung Internet, Firefox, and plain home-screen shortcuts do not register as share targets.'}
            </p>
            <ul className="pwa-install-checklist">
              <li>
                A real install shows <strong>Uninstall</strong> on long-press
                (a shortcut only shows Remove)
              </li>
              <li>SnapExpense should appear in Settings → Apps</li>
              <li>Only a full install appears in the share sheet</li>
            </ul>
          </>
        )}
      </div>
      <MdInfoOutline size={18} className="pwa-install-icon-muted" aria-hidden="true" />
    </div>
  );
}
