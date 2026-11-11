import React from 'react';
import { Camera, Type, Palette, AlignLeft, Gem, User, BookUser } from 'lucide-react';
import { useCharacter } from '../contexts/CharacterContext';
import LanguageToolPicker from './LanguageToolPicker';
import { Section, StepHeader } from './ui';

const ALIGNMENTS = [
  'Legale Buono', 'Neutrale Buono', 'Caotico Buono',
  'Legale Neutrale', 'Neutrale', 'Caotico Neutrale',
  'Legale Malvagio', 'Neutrale Malvagio', 'Caotico Malvagio',
];

const inputClass = 'w-full bg-panel-bg border border-border rounded-[var(--radius-sm)] px-3 py-2.5 outline-none focus:border-accent transition-colors';

function Field({ label, icon: Icon, children, hint }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-muted font-serif"><Icon className="w-3.5 h-3.5" /> {label}</span>
      {children}
      {hint && <span className="block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export default function DetailsStep() {
  const { currentCharacter, dispatch } = useCharacter();
  if (!currentCharacter) return null;

  const set = (field: string, value: string) => dispatch({ type: 'UPDATE_CHARACTER', payload: { [field]: value } });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 400 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        set('portraitUrl', canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <StepHeader eyebrow="Capitolo 4" title="Dettagli" description="Dai un volto e una voce al tuo eroe, poi scegli lingue e strumenti." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Section guide="identity" title="Identità" icon={BookUser} bodyClassName="p-4 space-y-4">
          <Field label="Nome del personaggio *" icon={Type}>
            <input value={currentCharacter.name || ''} onChange={e => set('name', e.target.value)} placeholder="Es. Valerius Fiammacupa" className={`${inputClass} text-lg font-bold`} />
          </Field>
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-muted font-serif mb-1.5">Allineamento</span>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Allineamento">
              {ALIGNMENTS.map(a => (
                <button key={a} type="button" role="radio" aria-checked={currentCharacter.alignment === a} onClick={() => set('alignment', currentCharacter.alignment === a ? '' : a)}
                  className={`px-2 py-2 text-xs border rounded-[var(--radius-sm)] transition-colors ${currentCharacter.alignment === a ? 'border-accent bg-accent/10 text-accent font-bold' : 'border-border bg-panel-bg hover:border-text-muted'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Aspetto" icon={Palette}>
              <textarea rows={4} value={currentCharacter.appearance || ''} onChange={e => set('appearance', e.target.value)} placeholder="Occhi, capelli, cicatrici, abiti…" className={`${inputClass} resize-y`} />
            </Field>
            <Field label="Personalità e storia" icon={AlignLeft}>
              <textarea rows={4} value={currentCharacter.description || ''} onChange={e => set('description', e.target.value)} placeholder="Ideali, legami, difetti, cosa lo spinge all’avventura…" className={`${inputClass} resize-y`} />
            </Field>
          </div>
          <Field label="Ninnolo" icon={Gem}>
            <input value={currentCharacter.trinket || ''} onChange={e => set('trinket', e.target.value)} placeholder="Un piccolo oggetto misterioso" className={inputClass} />
          </Field>
        </Section>

        <Section title="Ritratto" icon={Camera} bodyClassName="p-4 space-y-3">
          <div className="aspect-square bg-panel-bg border border-border grid place-items-center overflow-hidden">
            {currentCharacter.portraitUrl
              ? <img src={currentCharacter.portraitUrl} alt="Ritratto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <User className="w-16 h-16 text-text-muted" />}
          </div>
          <label className="secondary-action w-full flex items-center justify-center gap-2 cursor-pointer">
            <Camera className="w-4 h-4" /> Carica immagine
            <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
          <input value={currentCharacter.portraitUrl?.startsWith('data:') ? '' : currentCharacter.portraitUrl || ''} onChange={e => set('portraitUrl', e.target.value)} placeholder="…oppure incolla un URL" className={`${inputClass} text-xs`} aria-label="URL del ritratto" />
          <p className="text-xs text-text-muted">L’immagine viene ridimensionata a 400 px e salvata con la scheda.</p>
        </Section>
      </div>

      <LanguageToolPicker />
    </div>
  );
}
