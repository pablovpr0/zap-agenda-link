
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { loadSavedTheme, applyTheme } from './utils/themes'

// Aplicar tema salvo ao carregar a aplicação
const savedTheme = loadSavedTheme();
applyTheme(savedTheme);

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
