import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// L'evento può arrivare prima che React sia montato: lo si conserva qui
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach(l => l());
  });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach(l => l()); });
}

export const isStandalone = () => typeof window !== 'undefined'
  && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export const isIos = () => typeof navigator !== 'undefined'
  && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** Installazione dell'app: prompt del browser dove disponibile, istruzioni manuali su iPhone/iPad. */
export function useInstallPrompt() {
  const [, force] = useState(0);
  useEffect(() => {
    const update = () => force(n => n + 1);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);
  const installed = isStandalone();
  return {
    installed,
    /** Il browser offre l'installazione con un clic */
    canPrompt: Boolean(deferred) && !installed,
    /** Su iOS l'installazione si fa da Condividi → Aggiungi alla schermata Home */
    needsManualIos: !installed && !deferred && isIos(),
    prompt: async () => {
      if (!deferred) return false;
      await deferred.prompt();
      const choice = await deferred.userChoice;
      deferred = null;
      force(n => n + 1);
      return choice.outcome === 'accepted';
    },
  };
}

export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
