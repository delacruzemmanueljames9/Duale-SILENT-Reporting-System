import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
if (configuredApiBase && /^https?:\/\//i.test(configuredApiBase)) {
  setBaseUrl(configuredApiBase);
}

function renderBootFailure(): void {
  const root = document.getElementById('root');
  if (!root || root.dataset.appMounted === 'true') return;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f2f0e7;color:#193641;font-family:Inter,system-ui,sans-serif">
      <section style="max-width:520px;text-align:center">
        <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#54766b">Duale SILENT</p>
        <h1 style="font-size:clamp(32px,6vw,56px);line-height:1.05;margin:16px 0">This page could not open.</h1>
        <p style="font-size:16px;line-height:1.6;color:#587071">Please refresh once. If the problem continues, use the report channel again later or call 911 for immediate danger.</p>
        <button onclick="location.reload()" style="margin-top:24px;border:0;border-radius:6px;padding:12px 18px;background:#bd654f;color:#fff8ef;font-weight:700;cursor:pointer">Refresh SILENT</button>
      </section>
    </main>
  `;
}

window.addEventListener('error', renderBootFailure);
window.addEventListener('unhandledrejection', renderBootFailure);

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<main style="padding:32px;font-family:system-ui">Duale SILENT could not start. Please refresh.</main>';
} else {
  root.dataset.appMounted = 'true';
  createRoot(root, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
  }).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}
