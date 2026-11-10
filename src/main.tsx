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

// iOS: dopo aver chiuso la tastiera o un menu a tendina la pagina può restare spostata verso l'alto,
// con la parte iniziale non più raggiungibile. Al termine dell'interazione si riallineano i contenitori
// (anche quelli con overflow nascosto, che il browser può aver fatto scorrere) e la finestra.
if (window.matchMedia?.('(pointer: coarse)').matches) {
  const realign = () => window.setTimeout(() => {
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return; // si sta ancora scrivendo
    document.querySelectorAll<HTMLElement>('.hero-band, .login-stage, #root, #root > div').forEach(el => { if (el.scrollTop) el.scrollTop = 0; });
    if (document.body.scrollTop) document.body.scrollTop = 0;
  }, 120);
  document.addEventListener('focusout', realign);
  document.addEventListener('change', e => { if ((e.target as HTMLElement)?.tagName === 'SELECT') realign(); });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
