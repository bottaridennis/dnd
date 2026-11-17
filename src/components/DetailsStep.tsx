import React, { useState } from 'react';
import { Camera, Type, Palette, AlignLeft, Gem, User, BookUser, Move } from 'lucide-react';
import PortraitCropper, { readImageFile } from './PortraitCropper';
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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  if (!currentCharacter) return null;

  const set = (field: string, value: string) => dispatch({ type: 'UPDATE_CHARACTER', payload: { [field]: value } });

  const handleFile = (file: File) => {
    readImageFile(file).then(setCropSrc).catch(e => window.alert(e instanceof Error ? e.message : 'Immagine non valida'));
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
          <div className="flex gap-2">
            <label className="secondary-action flex-1 flex items-center justify-center gap-2 cursor-pointer">
              <Camera className="w-4 h-4" /> {currentCharacter.portraitUrl ? 'Cambia foto' : 'Carica foto'}
              <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            </label>
            {currentCharacter.portraitUrl && <button onClick={() => setCropSrc(currentCharacter.portraitUrl!)} className="secondary-action flex items-center gap-1.5" title="Sposta e ingrandisci la foto nel riquadro"><Move className="w-4 h-4" /> Centra</button>}
          </div>
          <input value={currentCharacter.portraitUrl?.startsWith('data:') ? '' : currentCharacter.portraitUrl || ''} onChange={e => set('portraitUrl', e.target.value)} placeholder="…oppure incolla un URL" className={`${inputClass} text-xs`} aria-label="URL del ritratto" />
          <p className="text-xs text-text-muted">Dopo il caricamento puoi spostare e ingrandire la foto per inquadrarla come preferisci: nulla viene tagliato senza che tu lo decida.</p>
          {cropSrc && <PortraitCropper src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={url => { set('portraitUrl', url); setCropSrc(null); }} />}
        </Section>
      </div>

      <LanguageToolPicker />
    </div>
  );
}
