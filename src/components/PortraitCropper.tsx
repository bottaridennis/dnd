import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Crosshair, Maximize, Minimize, Minus, Plus, X } from 'lucide-react';

/**
 * Editor dell'inquadratura del ritratto: la foto si sposta trascinandola (dito o mouse) e si ingrandisce
 * con la rotella, il pizzico o il cursore. Può essere rimpicciolita fino a vederla intera: gli spazi
 * rimasti vuoti si riempiono con una versione sfumata della foto stessa.
 * Il risultato è un'immagine quadrata, mostrata identica in tutti i riquadri dell'app.
 */

const OUTPUT = 480; // lato dell'immagine salvata (px)
const QUALITY = 0.82;

/** Legge un file immagine e lo riduce (lato massimo 1600 px) per lavorare in fretta anche con foto pesanti. */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File non leggibile'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato immagine non supportato'));
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        if (scale === 1) { resolve(reader.result as string); return; }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Sfondo sfumato ottenuto rimpicciolendo e poi ingrandendo la foto (funziona anche dove il filtro blur del canvas non c'è). */
function drawBlurredCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) {
  const small = document.createElement('canvas');
  small.width = small.height = 20;
  const sctx = small.getContext('2d')!;
  const cover = Math.max(20 / img.width, 20 / img.height);
  sctx.drawImage(img, (20 - img.width * cover) / 2, (20 - img.height * cover) / 2, img.width * cover, img.height * cover);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, -size * 0.1, -size * 0.1, size * 1.2, size * 1.2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, size, size);
}

interface View { scale: number; x: number; y: number }

export default function PortraitCropper({ src, onCancel, onConfirm }: { src: string; onCancel: () => void; onConfirm: (dataUrl: string) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState(300);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [backdrop, setBackdrop] = useState<string>('');
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist?: number; scale: number; x: number; y: number; px: number; py: number } | null>(null);

  // Dimensione del riquadro adatta allo schermo
  useEffect(() => {
    const fit = () => setFrame(Math.max(220, Math.min(360, window.innerWidth - 64, window.innerHeight - 300)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Le immagini da URL esterni si possono ritagliare solo se il sito lo consente (CORS)
  useEffect(() => {
    const image = new Image();
    if (!src.startsWith('data:')) image.crossOrigin = 'anonymous';
    image.onload = () => {
      setImg(image);
      const c = document.createElement('canvas');
      c.width = c.height = 120;
      const ctx = c.getContext('2d');
      if (ctx) {
        try { drawBlurredCover(ctx, image, 120); setBackdrop(c.toDataURL('image/jpeg', 0.7)); }
        catch { setError('Questa immagine viene da un sito che non permette di modificarla: scaricala e caricala dal dispositivo.'); }
      }
    };
    image.onerror = () => setError('Immagine non caricabile: prova a caricarla dal dispositivo.');
    image.src = src;
  }, [src]);

  const minScale = img ? frame / Math.max(img.width, img.height) : 1; // foto intera
  const coverScale = img ? frame / Math.min(img.width, img.height) : 1; // riquadro pieno
  const maxScale = coverScale * 4;

  // All'apertura la foto è intera: niente viene tagliato finché non lo decidi tu
  useEffect(() => { if (img) setView({ scale: minScale, x: 0, y: 0 }); }, [img, frame]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Tiene la foto dentro il riquadro: se è più grande lo copre, se è più piccola non ne esce. */
  const clamp = useCallback((v: View): View => {
    if (!img) return v;
    const scale = Math.min(maxScale, Math.max(minScale, v.scale));
    const bx = Math.abs(img.width * scale - frame) / 2;
    const by = Math.abs(img.height * scale - frame) / 2;
    return { scale, x: Math.max(-bx, Math.min(bx, v.x)), y: Math.max(-by, Math.min(by, v.y)) };
  }, [img, frame, minScale, maxScale]);

  const zoomTo = (scale: number) => setView(v => clamp({ ...v, scale }));

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = {
      scale: view.scale, x: view.x, y: view.y,
      px: pts.reduce((a, p) => a + p.x, 0) / pts.length, py: pts.reduce((a, p) => a + p.y, 0) / pts.length,
      dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const g = gesture.current;
    const scale = pts.length === 2 && g.dist ? g.scale * (Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / g.dist) : g.scale;
    setView(clamp({ scale, x: g.x + (cx - g.px), y: g.y + (cy - g.py) }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    // Con un dito rimasto si continua a trascinare da lì
    const pts = [...pointers.current.values()];
    gesture.current = pts.length ? { scale: view.scale, x: view.x, y: view.y, px: pts[0].x, py: pts[0].y } : null;
  };
  const onWheel = (e: React.WheelEvent) => { zoomTo(view.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); };

  const nudge = (dx: number, dy: number) => setView(v => clamp({ ...v, x: v.x + dx, y: v.y + dy }));
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5;
    if (e.key === 'ArrowLeft') nudge(-step, 0);
    else if (e.key === 'ArrowRight') nudge(step, 0);
    else if (e.key === 'ArrowUp') nudge(0, -step);
    else if (e.key === 'ArrowDown') nudge(0, step);
    else if (e.key === '+' || e.key === '=') zoomTo(view.scale * 1.1);
    else if (e.key === '-') zoomTo(view.scale / 1.1);
    else return;
    e.preventDefault();
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCancel]);

  const confirm = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const k = OUTPUT / frame;
    drawBlurredCover(ctx, img, OUTPUT);
    const w = img.width * view.scale;
    const h = img.height * view.scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (frame / 2 + view.x - w / 2) * k, (frame / 2 + view.y - h / 2) * k, w * k, h * k);
    try { onConfirm(canvas.toDataURL('image/jpeg', QUALITY)); }
    catch { setError('Questa immagine viene da un sito che non permette di modificarla: scaricala e caricala dal dispositivo.'); }
  };

  const w = img ? img.width * view.scale : 0;
  const h = img ? img.height * view.scale : 0;
  const zoomPct = img ? Math.round(((view.scale - minScale) / (maxScale - minScale)) * 100) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="crop-title" onClick={onCancel}>
      <div className="surface-card border-t-4 !border-t-accent w-full max-w-md p-5 space-y-4 text-text-primary" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="crop-title" className="text-xl uppercase">Centra il ritratto</h3>
            <p className="text-xs text-text-muted">Trascina la foto per spostarla, usa due dita, la rotella o il cursore per ingrandirla.</p>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary" aria-label="Annulla"><X className="w-5 h-5" /></button>
        </div>

        {error ? <p className="text-sm text-danger border border-danger/40 bg-danger/10 px-3 py-2">{error}</p> : (
          <>
            <div
              className="relative mx-auto overflow-hidden border-2 border-accent bg-black select-none touch-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ width: frame, height: frame, backgroundImage: backdrop ? `url(${backdrop})` : undefined, backgroundSize: 'cover' }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}
              onKeyDown={onKey} tabIndex={0} aria-label="Inquadratura: trascina per spostare, frecce per spostare, più e meno per ingrandire"
            >
              {img && (
                <img src={img.src} alt="" draggable={false} className="absolute max-w-none pointer-events-none"
                  style={{ width: w, height: h, left: frame / 2 + view.x - w / 2, top: frame / 2 + view.y - h / 2 }} />
              )}
              {/* Guide dei terzi per aiutare a centrare il volto */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }, (_, i) => <div key={i} className="border border-white/10" />)}
              </div>
              {!img && <div className="absolute inset-0 grid place-items-center text-xs text-white/60 uppercase tracking-widest">Caricamento…</div>}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => zoomTo(view.scale / 1.15)} className="secondary-action !px-2.5" aria-label="Rimpicciolisci"><Minus className="w-4 h-4" /></button>
              <input type="range" min={0} max={100} value={zoomPct} onChange={e => zoomTo(minScale + (Number(e.target.value) / 100) * (maxScale - minScale))} className="flex-1 accent-[var(--color-accent)]" aria-label="Ingrandimento" />
              <button onClick={() => zoomTo(view.scale * 1.15)} className="secondary-action !px-2.5" aria-label="Ingrandisci"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setView({ scale: minScale, x: 0, y: 0 })} className="secondary-action !px-2 flex items-center justify-center gap-1.5 text-xs" title="Mostra tutta la foto"><Minimize className="w-4 h-4" /> Intera</button>
              <button onClick={() => setView(clamp({ scale: coverScale, x: 0, y: 0 }))} className="secondary-action !px-2 flex items-center justify-center gap-1.5 text-xs" title="Riempi il riquadro"><Maximize className="w-4 h-4" /> Riempi</button>
              <button onClick={() => setView(v => ({ ...v, x: 0, y: 0 }))} className="secondary-action !px-2 flex items-center justify-center gap-1.5 text-xs" title="Riporta al centro"><Crosshair className="w-4 h-4" /> Centra</button>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCancel} className="secondary-action">Annulla</button>
          <button onClick={confirm} disabled={!img || Boolean(error)} className="primary-action px-5 py-2.5 flex items-center gap-2 disabled:opacity-40"><Check className="w-4 h-4" /> Usa questa inquadratura</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
