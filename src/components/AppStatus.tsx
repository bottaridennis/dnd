import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Share, SquarePlus, WifiOff, X } from 'lucide-react';
import { useInstallPrompt, useOnline } from '../lib/pwa';

/** Avviso quando si è offline: la scheda resta consultabile e le modifiche partono al ritorno della rete. */
export function OfflineBanner() {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} role="status"
          className="fixed z-[75] bottom-4 left-4 right-24 sm:right-auto max-w-sm bg-black/90 text-white border border-white/15 px-3 py-2 text-xs flex items-center gap-2 print:hidden">
          <WifiOff className="w-4 h-4 text-yellow-400 shrink-0" />
          <span><strong>Offline.</strong> Puoi consultare e modificare i personaggi già aperti: le modifiche verranno salvate al ritorno della rete.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Pulsante "Installa l'app": prompt del browser o istruzioni per iPhone/iPad. */
export function InstallButton({ className = '', onDone }: { className?: string; onDone?: () => void }) {
  const install = useInstallPrompt();
  const [showIos, setShowIos] = useState(false);
  if (install.installed || (!install.canPrompt && !install.needsManualIos)) return null;
  return (
    <>
      <button onClick={async () => { if (install.canPrompt) { await install.prompt(); onDone?.(); } else setShowIos(true); }} className={className}>
        <Download className="w-5 h-5" /> Installa l’app
      </button>
      <AnimatePresence>
        {showIos && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowIos(false)}>
            <motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} role="dialog" aria-modal="true" aria-labelledby="ios-title" className="surface-card border-t-4 !border-t-accent w-full max-w-sm p-5 space-y-4 text-text-primary" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <h3 id="ios-title" className="text-xl uppercase">Aggiungi alla Home</h3>
                <button onClick={() => setShowIos(false)} aria-label="Chiudi" className="text-text-muted"><X className="w-5 h-5" /></button>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-center gap-3"><span className="w-7 h-7 grid place-items-center bg-accent text-bg font-black shrink-0">1</span> Tocca <Share className="w-4 h-4 inline text-accent" /> <strong>Condividi</strong> nella barra di Safari.</li>
                <li className="flex items-center gap-3"><span className="w-7 h-7 grid place-items-center bg-accent text-bg font-black shrink-0">2</span> Scegli <SquarePlus className="w-4 h-4 inline text-accent" /> <strong>Aggiungi alla schermata Home</strong>.</li>
                <li className="flex items-center gap-3"><span className="w-7 h-7 grid place-items-center bg-accent text-bg font-black shrink-0">3</span> Apri Forge dall’icona: si avvia a schermo intero e funziona anche senza rete.</li>
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
