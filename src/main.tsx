import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Applica il tema prima del primo render (predefinito: scuro)
try {
  const saved = localStorage.getItem('forge-theme');
  document.documentElement.classList.toggle('dark', saved ? saved === 'dark' : true);
} catch {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
