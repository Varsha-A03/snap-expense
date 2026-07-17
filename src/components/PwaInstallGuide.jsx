import { useEffect, useState } from 'react';
import { MdInstallMobile, MdInfoOutline, MdCheckCircle } from 'react-icons/md';
import { isChromeOnAndroid, isStandaloneDisplay } from '../lib/pwaInstall';
import '../styles/pwa-install.css';

export default function PwaInstallGuide() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandaloneDisplay());
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      // Chrome fires this only when the app meets WebAPK installability
      // criteria. Capturing it lets us trigger a real install (not a shortcut).
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } finally {
      setInstalling(false);
    }
  }

  if (installed) {
    return (
      <div className="pwa-install-guide pwa-install-done" role="status">
        <MdCheckCircle size={20} />
        <p className="pwa-install-text">
          SnapExpense is installed. You can now share a screenshot from GPay,
          PhonePe, or your gallery straight into the app.
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
