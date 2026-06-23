import { MdInstallMobile, MdInfoOutline } from 'react-icons/md';
import { isChromeOnAndroid, isStandaloneDisplay } from '../lib/pwaInstall';
import '../styles/pwa-install.css';

export default function PwaInstallGuide() {
  if (isStandaloneDisplay()) {
    return null;
  }

  const onAndroidChrome = isChromeOnAndroid();

  return (
    <div className="pwa-install-guide" role="note">
      <MdInstallMobile size={20} />
      <div>
        <p className="pwa-install-title">Install for Share from PhonePe / GPay</p>
        <p className="pwa-install-text">
          {onAndroidChrome
            ? 'Use Chrome menu → Install app (not just a home screen shortcut). Share target only works with a full Chrome install.'
            : 'Open this site in Chrome on Android, then use Install app. Samsung Internet and shortcuts do not support share targets.'}
        </p>
        <ul className="pwa-install-checklist">
          <li>Long-press the icon → you should see <strong>Uninstall</strong> (not only Remove)</li>
          <li>SnapExpense should appear in Settings → Apps</li>
          <li>After manifest updates: uninstall, then reinstall from Chrome</li>
        </ul>
      </div>
      <MdInfoOutline size={18} className="pwa-install-icon-muted" aria-hidden="true" />
    </div>
  );
}
