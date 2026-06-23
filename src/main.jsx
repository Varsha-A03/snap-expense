import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { setPendingShare } from './lib/sharedImage';
import './index.css';
import App from './App.jsx';

registerSW({ immediate: true });

if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    if (!launchParams.files?.length) return;

    const file = await launchParams.files[0].getFile();
    setPendingShare(file);
    window.location.assign('/upload?shared=1');
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
