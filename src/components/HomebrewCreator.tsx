import React, { useState } from 'react';
import { Wand2, Sword, Trophy, Save, Hammer, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { homebrewService, HomebrewType } from '../services/homebrewService';
import { useHomebrew } from '../hooks/useHomebrew';
import { DAMAGE_TYPES, weaponMasteryData } from '../constants/weaponMastery';
import { CLASS_LABELS, SCHOOL_LABELS } from '../lib/spellEligibility';
import { Section, Tag, ToggleChip, EmptyState } from './ui';

const PROPERTIES = ['Finesse', 'Light', 'Heavy', 'Reach', 'Two-Handed', 'Thrown', 'Versatile', 'Ammunition', 'Loading'];
const PROPERTY_LABELS: Record<string, string> = { Finesse: 'Accurata', Light: 'Leggera', Heavy: 'Pesante', Reach: 'Portata', 'Two-Handed': 'A due mani', Thrown: 'Da lancio', Versatile: 'Versatile', Ammunition: 'Munizioni', Loading: 'Ricarica' };
const FEAT_CATEGORIES = ['Talento d’Origine', 'Talento Generale (Prerequisito: livello 4+)', 'Talento Stile di Combattimento (Prerequisito: capacità Stile di Combattimento)', 'Talento Benedizione Epica (Prerequisito: livello 19+)'];

const TYPES: { id: HomebrewType; label: string; Icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
  { id: 'spell', label: 'Incantesimo', Icon: Wand2, hint: 'Compare nella libreria degli incantesimi delle classi indicate.' },
  { id: 'weapon', label: 'Arma', Icon: Sword, hint: 'Compare nel catalogo dell’inventario.' },
  { id: 'feat', label: 'Talento', Icon: Trophy, hint: 'Compare nell’elenco dei talenti con il prerequisito scelto.' },
];

const EMPTY = { name: '', level: 0, school: 'evocation', time: '1 azione', range: '', duration: 'Istantanea', components: 'V, S', concentration: false, ritual: false, classes: [] as string[], description: '', category: 'Semplice', damage: '1d6', damageType: 'Tagliente', properties: [] as string[], mastery: 'Sap', weight: 1, featCategory: FEAT_CATEGORIES[1] };

const inputClass = 'w-full bg-panel-bg border border-border rounded-[var(--radius-sm)] px-3 py-2 outline-none focus:border-accent';
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="block text-[11px] uppercase font-black tracking-wider text-text-muted font-serif mb-1">{children}</span>;

export default function HomebrewCreator() {
  const { user } = useAuth();
  const homebrew = useHomebrew();
  const [type, setType] = useState<HomebrewType>('spell');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleIn = (key: 'classes' | 'properties', value: string) => setForm(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value] }));

  const buildData = () => type === 'spell' ? {
    name: form.name.trim(), displayName: form.name.trim(), level: Number(form.level), school: form.school, castingTime: form.time, range: form.range,
    duration: form.duration, components: form.components, concentration: form.concentration, ritual: form.ritual, classes: form.classes, description: form.description,
  } : type === 'weapon' ? {
    name: form.name.trim(), category: form.category, damage: form.damage, damageType: form.damageType, properties: form.properties, mastery: form.mastery, weight: Number(form.weight) || 0, description: form.description,
  } : { name: form.name.trim(), prerequisite: form.featCategory, description: form.description, repeatable: false };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setSaving(true);
    try {
      await homebrewService.saveHomebrewItem(user.uid, type, buildData());
      setMessage(`“${form.name.trim()}” salvato.`);
      setForm(EMPTY);
      await homebrew.refresh();
    } catch (err) {
      console.error(err);
      setMessage('Salvataggio non riuscito.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (itemType: HomebrewType, id: string, name: string) => {
    if (!user || !window.confirm(`Eliminare “${name}”?`)) return;
    await homebrewService.deleteHomebrewItem(user.uid, itemType, id);
    await homebrew.refresh();
  };

  const preview = buildData() as any;
  const lists: { type: HomebrewType; label: string; items: any[] }[] = [
    { type: 'spell', label: 'Incantesimi', items: homebrew.custom.spells },
    { type: 'weapon', label: 'Armi', items: homebrew.custom.weapons },
    { type: 'feat', label: 'Talenti', items: homebrew.custom.feats },
  ];

  return (
    <div>
      <section className="hero-band">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-12">
          <p className="eyebrow mb-3">Laboratorio del Master</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[.9] flex items-center gap-4"><Hammer className="w-12 h-12 text-[#ef3340]" /> Homebrew</h1>
          <p className="mt-4 text-white/70 max-w-2xl">Crea incantesimi, armi e talenti personalizzati: li ritrovi nelle schede dei tuoi personaggi insieme ai contenuti del manuale.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-8 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo di contenuto">
            {TYPES.map(({ id, label, Icon }) => (
              <button key={id} type="button" role="radio" aria-checked={type === id} onClick={() => setType(id)}
                className={`flex items-center justify-center gap-2 py-3 border rounded-[var(--radius-sm)] font-black uppercase font-serif text-sm ${type === id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card-bg text-text-muted hover:border-text-muted'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <Section title={`Nuovo ${TYPES.find(t => t.id === type)?.label.toLowerCase()}`} bodyClassName="p-4 space-y-4">
            <p className="text-sm text-text-muted">{TYPES.find(t => t.id === type)?.hint}</p>
            <label className="block"><Label>Nome *</Label><input value={form.name} onChange={e => set('name', e.target.value)} className={`${inputClass} text-lg font-bold`} placeholder="Nome del contenuto" required /></label>

            {type === 'spell' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label><Label>Livello</Label><select value={form.level} onChange={e => set('level', Number(e.target.value))} className={inputClass}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'Trucchetto' : `${i}°`}</option>)}</select></label>
                  <label><Label>Scuola</Label><select value={form.school} onChange={e => set('school', e.target.value)} className={inputClass}>{Object.entries(SCHOOL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                  <label><Label>Tempo di lancio</Label><input value={form.time} onChange={e => set('time', e.target.value)} className={inputClass} /></label>
                  <label><Label>Gittata</Label><input value={form.range} onChange={e => set('range', e.target.value)} className={inputClass} placeholder="18 metri" /></label>
                  <label><Label>Durata</Label><input value={form.duration} onChange={e => set('duration', e.target.value)} className={inputClass} /></label>
                  <label><Label>Componenti</Label><input value={form.components} onChange={e => set('components', e.target.value)} className={inputClass} /></label>
                  <div className="col-span-2 flex items-end gap-2">
                    <ToggleChip selected={form.concentration} onClick={() => set('concentration', !form.concentration)}>Concentrazione</ToggleChip>
                    <ToggleChip selected={form.ritual} onClick={() => set('ritual', !form.ritual)}>Rituale</ToggleChip>
                  </div>
                </div>
                <div><Label>Liste di classe (vuoto = disponibile a tutti)</Label>
                  <div className="flex flex-wrap gap-1.5">{Object.entries(CLASS_LABELS).map(([id, label]) => <ToggleChip key={id} selected={form.classes.includes(id)} onClick={() => toggleIn('classes', id)}>{label}</ToggleChip>)}</div>
                </div>
              </>
            )}

            {type === 'weapon' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <label><Label>Categoria</Label><select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}><option>Semplice</option><option>Marziale</option></select></label>
                  <label><Label>Danni</Label><input value={form.damage} onChange={e => set('damage', e.target.value)} className={inputClass} placeholder="1d8" /></label>
                  <label><Label>Tipo</Label><select value={form.damageType} onChange={e => set('damageType', e.target.value)} className={inputClass}>{DAMAGE_TYPES.map(d => <option key={d}>{d}</option>)}</select></label>
                  <label><Label>Maestria</Label><select value={form.mastery} onChange={e => set('mastery', e.target.value)} className={inputClass}>{Object.keys(weaponMasteryData).map(m => <option key={m}>{m}</option>)}</select></label>
                  <label><Label>Peso (kg)</Label><input type="number" min={0} step={0.5} value={form.weight} onChange={e => set('weight', Number(e.target.value))} className={inputClass} /></label>
                </div>
                <div><Label>Proprietà</Label>
                  <div className="flex flex-wrap gap-1.5">{PROPERTIES.map(p => <ToggleChip key={p} selected={form.properties.includes(p)} onClick={() => toggleIn('properties', p)}>{PROPERTY_LABELS[p]}</ToggleChip>)}</div>
                </div>
              </>
            )}

            {type === 'feat' && (
              <label className="block"><Label>Categoria e prerequisito</Label>
                <select value={form.featCategory} onChange={e => set('featCategory', e.target.value)} className={inputClass}>{FEAT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </label>
            )}

            <label className="block"><Label>Descrizione</Label><textarea rows={6} value={form.description} onChange={e => set('description', e.target.value)} className={`${inputClass} resize-y`} placeholder="Effetti, regole e testo di colore…" /></label>

            <div className="flex items-center justify-between gap-3">
              {message ? <span className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {message}</span> : <span />}
              <button type="submit" disabled={saving || !form.name.trim()} className="primary-action px-6 py-3 flex items-center gap-2 disabled:opacity-40"><Save className="w-4 h-4" /> {saving ? 'Salvataggio…' : 'Salva'}</button>
            </div>
          </Section>

          <Section title="Anteprima" icon={Eye}>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-2xl uppercase text-accent">{preview.name || 'Senza nome'}</h3>
              <p className="text-sm italic flavor text-text-muted">
                {type === 'spell' && `${preview.level === 0 ? 'Trucchetto' : `${preview.level}° livello`} di ${SCHOOL_LABELS[preview.school]?.toLowerCase()}${preview.ritual ? ' (rituale)' : ''}`}
                {type === 'weapon' && `Arma ${preview.category.toLowerCase()}`}
                {type === 'feat' && preview.prerequisite}
              </p>
              {type === 'spell' && (
                <div className="grid grid-cols-2 gap-x-4 text-sm mt-2">
                  <p><strong>Tempo di lancio:</strong> {preview.castingTime}</p>
                  <p><strong>Gittata:</strong> {preview.range || '—'}</p>
                  <p><strong>Componenti:</strong> {preview.components}</p>
                  <p><strong>Durata:</strong> {preview.concentration ? 'Concentrazione, ' : ''}{preview.duration}</p>
                </div>
              )}
              {type === 'weapon' && <p className="text-sm mt-2"><strong>Danni:</strong> {preview.damage} {preview.damageType} · <strong>Maestria:</strong> {preview.mastery} · <strong>Proprietà:</strong> {preview.properties.map((p: string) => PROPERTY_LABELS[p]).join(', ') || '—'}</p>}
              <p className="text-sm mt-3 whitespace-pre-line">{preview.description || <span className="text-text-muted">La descrizione apparirà qui.</span>}</p>
            </div>
          </Section>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {lists.map(({ type: t, label, items }) => (
            <Section key={t} title={`${label} (${items.length})`}>
              {items.length === 0 ? <EmptyState title="Nessun contenuto" /> : (
                <ul className="divide-y divide-border -my-2">
                  {items.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <div className="font-bold truncate">{item.name}</div>
                        <div className="flex gap-1 mt-0.5">
                          {t === 'spell' && <Tag>{item.level === 0 ? 'Trucchetto' : `${item.level}°`}</Tag>}
                          {t === 'weapon' && <Tag>{item.damage} {item.damageType}</Tag>}
                          {t === 'feat' && item.prerequisite && <Tag>{String(item.prerequisite).split(' (')[0]}</Tag>}
                        </div>
                      </div>
                      <button onClick={() => remove(t, item.id, item.name)} className="p-1.5 text-text-muted hover:text-danger" aria-label={`Elimina ${item.name}`}><Trash2 className="w-4 h-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          ))}
        </aside>
      </div>
    </div>
  );
}
