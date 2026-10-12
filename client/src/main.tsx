import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Provide configured API URL to global scope for tracker.js
if (typeof window !== 'undefined') {
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    (window as unknown as { __PULSE_API_URL__?: string }).__PULSE_API_URL__ = envApiUrl;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

