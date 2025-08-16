
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadSavedTheme, applyTheme } from './utils/themes';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

// Aplicar tema salvo ao carregar a aplicação
const savedTheme = loadSavedTheme();
applyTheme(savedTheme);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        devLog('SW registered: ', registration);
      })
      .catch((registrationError) => {
        devLog('SW registration failed: ', registrationError);
      });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // In development, unregister any existing service workers to avoid conflicts
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(const registration of registrations) {
      registration.unregister();
    }
  });
}
