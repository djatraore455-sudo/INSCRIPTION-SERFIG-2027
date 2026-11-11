import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Enregistrer le Service Worker PWA avec détection automatique des mises à jour
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('Nouvelle version SERFIG 2027 détectée en ligne.');
      },
      onOfflineReady() {
        console.log('SERFIG 2027 prêt pour utilisation hors-ligne.');
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          // 1. Vérification périodique toutes les 15 minutes si connecté
          setInterval(() => {
            registration.update().catch(() => {});
          }, 15 * 60 * 1000);

          // 2. Vérification immédiate lorsque l'utilisateur reprend l'application sur son téléphone
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          });
        }
      }
    });
  } catch (err) {
    console.warn('PWA service worker registration skipped in development:', err);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
