import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Enregistrer le Service Worker PWA automatiquement
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
