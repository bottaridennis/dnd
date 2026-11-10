import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Backpack, Coins, Scale, Star, Trash2, Plus, Minus, Package, Briefcase, Shield, Sword, Search, FolderPlus, X, Gem, BookOpen,
} from 'lucide-react';
import { useCharacter, InventoryItem, ContainerData } from '../contexts/CharacterContext';
import { useInventoryMath } from '../hooks/useInventoryMath';
import { characterService } from '../services/characterService';
import { standardWeapons, standardArmor, findArmor, findWeapon, processStartingItem } from '../data/weaponsData';
import { getFinalScores } from '../lib/characterRules';
import { Section, Tag, EmptyState } from './ui';
import { useHomebrew } from '../hooks/useHomebrew';

const COINS = [
  { id: 'pp', label: 'Platino', short: 'mp', color: '#c9d6e3' },
  { id: 'gp', label: 'Oro', short: 'mo', color: '#e0b14a' },
  { id: 'ep', label: 'Electrum', short: 'me', color: '#b7c2a3' },
  { id: 'sp', label: 'Argento', short: 'ma', color: '#b8b8c0' },
  { id: 'cp', label: 'Rame', short: 'mr', color: '#c47a4a' },
] as const;

type CatalogFilter = 'Tutto' | 'Semplice' | 'Marziale' | 'Armature';

/** Inventario: peso e sintonia, borsello, contenitori, oggetti e catalogo PHB 2024. */
export default function InventoryManager() {
  const { currentCharacter, dispatch } = useCharacter();
  const { inventoryItems = [], containers = [], currency } = currentCharacter || {};
  const [filter, setFilter] = useState<string>('all');
  const [newItemName, setNewItemName] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('Tutto');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [newContainerName, setNewContainerName] = useState('');
  const [addingContainer, setAddingContainer] = useState(false);
  const homebrewWeapons = useHomebrew().custom.weapons;

  // La capacità di trasporto usa il punteggio di Forza finale (con bonus di background e aumenti)
  const strength = currentCharacter ? getFinalScores(currentCharacter).STR : 10;
  const math = useInventoryMath(inventoryItems, currency, strength);

  const catalog = useMemo(() => {
    const needle = catalogSearch.trim().toLocaleLowerCase('it');
    const weapons = catalogFilter === 'Armature' ? [] : standardWeapons
      .filter(w => catalogFilter === 'Tutto' || w.category === catalogFilter)
      .map(w => ({ id: w.id, name: w.name, kind: 'weapon' as const, info: `${w.damage} ${w.damageType}`, extra: w.mastery, weight: w.weight, cost: w.cost }));
    const armor = catalogFilter === 'Tutto' || catalogFilter === 'Armature' ? standardArmor.map(a => ({
      id: a.id, name: a.name, kind: 'armor' as const,
      info: a.category === 'Scudo' ? 'CA +2' : `CA ${a.baseAc}${a.maxDex === null ? ' + Des' : a.maxDex > 0 ? ' + Des (max 2)' : ''}`,
      extra: a.category === 'Scudo' ? 'Scudo' : `${a.category}${a.strength ? ` · For ${a.strength}` : ''}`, weight: a.weight, cost: a.cost,
    })) : [];
    const custom = catalogFilter === 'Armature' ? [] : homebrewWeapons
      .filter((w: any) => catalogFilter === 'Tutto' || w.category === catalogFilter)
      .map((w: any) => ({ id: `hb-${w.id}`, name: w.name, kind: 'homebrew' as const, info: `${w.damage || '—'} ${w.damageType || ''}`, extra: `${w.mastery || '—'} · Homebrew`, weight: Number(w.weight) || 0, cost: '—', data: w }));
    return [...custom, ...weapons, ...armor].filter(e => !needle || e.name.toLocaleLowerCase('it').includes(needle));
  }, [catalogFilter, catalogSearch, homebrewWeapons]);

  if (!currentCharacter) return null;

  const save = async (updates: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    try { await characterService.updateCharacter(currentCharacter.id, updates); } catch (e) { console.error('Salvataggio inventario non riuscito:', e); }
  };

  const targetContainer = filter === 'all' || filter === 'equipped' ? null : filter;
  const addItem = () => {
    if (!newItemName.trim()) return;
    const item: InventoryItem = { ...processStartingItem(newItemName.trim(), targetContainer), isEquipped: false, containerId: targetContainer };
    save({ inventoryItems: [...inventoryItems, item] });
    setNewItemName('');
  };
  const addFromCatalog = (name: string, homebrew?: any) => {
    const base = { ...processStartingItem(name, targetContainer), isEquipped: false, containerId: targetContainer };
    const item = homebrew ? {
      ...base,
      weight: Number(homebrew.weight) || 0,
      damage: homebrew.damage,
      damageType: homebrew.damageType,
      properties: Array.isArray(homebrew.properties) ? homebrew.properties : String(homebrew.properties || '').split(',').map((p: string) => p.trim()).filter(Boolean),
      mastery: homebrew.mastery,
    } : base;
    save({ inventoryItems: [...inventoryItems, item] });
  };
  const updateItem = (id: string, updates: Partial<InventoryItem>) => save({ inventoryItems: inventoryItems.map(i => (i.id === id ? { ...i, ...updates } : i)) });
  const removeItem = (id: string) => save({ inventoryItems: inventoryItems.filter(i => i.id !== id) });

  // Si può indossare una sola armatura e imbracciare un solo scudo alla volta
  const toggleEquipped = (item: InventoryItem) => {
    const armor = findArmor(item.name);
    if (item.isEquipped || !armor) { updateItem(item.id, { isEquipped: !item.isEquipped }); return; }
    const isShield = armor.category === 'Scudo';
    save({
      inventoryItems: inventoryItems.map(i => {
        if (i.id === item.id) return { ...i, isEquipped: true };
        const other = findArmor(i.name);
        if (i.isEquipped && other && (other.category === 'Scudo') === isShield) return { ...i, isEquipped: false };
        return i;
      }),
    });
  };

  const toggleAttunement = (item: InventoryItem) => {
    if (!item.isAttuned && math.attunementCount >= math.maxAttunement) return;
    updateItem(item.id, { isAttuned: !item.isAttuned });
  };

  const addContainer = () => {
    if (!newContainerName.trim()) return;
    const container: ContainerData = { id: crypto.randomUUID(), name: newContainerName.trim(), type: 'Other', maxWeight: 15 };
    save({ containers: [...containers, container] });
    setNewContainerName('');
    setAddingContainer(false);
  };
  const deleteContainer = (id: string) => {
    save({ containers: containers.filter(c => c.id !== id), inventoryItems: inventoryItems.map(i => (i.containerId === id ? { ...i, containerId: null } : i)) });
    if (filter === id) setFilter('all');
  };
  const containerWeight = (id: string) => inventoryItems.filter(i => i.containerId === id).reduce((acc, i) => acc + (i.weight || 0) * (i.quantity || 1), 0);

  const visibleItems = inventoryItems.filter(i => filter === 'all' || (filter === 'equipped' ? i.isEquipped : i.containerId === filter));
  const weightPct = Math.min(100, math.weightPercentage);

  const itemIcon = (item: InventoryItem) => {
    if (findArmor(item.name)) return Shield;
    if (item.damage || findWeapon(item.name)) return Sword;
    if (item.isMagical) return Gem;
    if (/libro|pergamena/i.test(item.name)) return BookOpen;
    return Package;
  };

  return (
    <div className="space-y-6">
      {/* Riepilogo: peso, sintonia, borsello */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <div className="stat-chip p-4">
          <div className="flex items-center justify-between text-xs uppercase font-black tracking-wider font-serif text-text-muted">
            <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Peso trasportato</span>
            <span className={math.isEncumbered ? 'text-danger' : ''}>{math.totalWeight} / {math.carryingCapacity} kg</span>
          </div>
          <div className="h-2 bg-panel-bg mt-2 overflow-hidden"><div className={`h-full transition-all ${math.isEncumbered ? 'bg-danger' : weightPct > 75 ? 'bg-yellow-500' : 'bg-success'}`} style={{ width: `${weightPct}%` }} /></div>
          <div className="flex justify-between mt-1.5 text-[11px] text-text-muted">
            <span>Oggetti {math.itemsWeight} kg · Monete {math.coinWeight.toFixed(2)} kg</span>
            <span>Capacità = Forza {strength} × 7,5 kg</span>
          </div>
          {math.isEncumbered && <p className="text-xs text-danger mt-2">Oltre la capacità: puoi solo trascinare o sollevare fino al doppio, con Velocità massima 1,5 m.</p>}
        </div>
        <div className="stat-chip p-4 flex items-center gap-4">
          <Gem className="w-6 h-6 text-accent" />
          <div>
            <div className="text-xs uppercase font-black tracking-wider font-serif text-text-muted">Sintonia</div>
            <div className="flex gap-1.5 mt-1">{Array.from({ length: math.maxAttunement }).map((_, i) => <span key={i} className={`w-5 h-5 rotate-45 border-2 ${i < math.attunementCount ? 'bg-accent border-accent' : 'border-border'}`} />)}</div>
          </div>
        </div>
      </div>

      <Section title="Borsello" icon={Coins} bodyClassName="p-3">
        <div className="grid grid-cols-5 gap-2">
          {COINS.map(coin => (
            <label key={coin.id} className="text-center bg-panel-bg border border-border rounded-[var(--radius-sm)] py-2">
              <span className="flex items-center justify-center gap-1 text-[10px] uppercase font-black font-serif text-text-muted">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: coin.color }} /> {coin.short}
              </span>
              <input
                type="number" min={0}
                value={(currency as any)?.[coin.id] || 0}
                onChange={e => save({ currency: { ...currency, [coin.id]: Math.max(0, parseInt(e.target.value) || 0) } })}
                className="w-full bg-transparent text-center font-display font-black text-xl outline-none"
                aria-label={`Monete di ${coin.label}`}
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Oggetti" icon={Backpack} bodyClassName="" actions={
        <button onClick={() => setCatalogOpen(v => !v)} className={`secondary-action !py-1 !px-2.5 flex items-center gap-1.5 ${catalogOpen ? '!border-accent !text-accent' : ''}`}><Sword className="w-3.5 h-3.5" /> Catalogo</button>
      }>
        {/* Filtri per contenitore */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto no-scrollbar">
          {[{ id: 'all', name: `Tutti (${inventoryItems.length})` }, { id: 'equipped', name: 'Equipaggiati' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 text-xs font-bold uppercase font-serif whitespace-nowrap rounded-[var(--radius-sm)] ${filter === f.id ? 'bg-accent text-white' : 'text-text-muted hover:bg-panel-bg'}`}>{f.name}</button>
          ))}
          {containers.map(c => {
            const w = containerWeight(c.id);
            const full = c.maxWeight && w > c.maxWeight;
            return (
              <span key={c.id} className={`flex items-center rounded-[var(--radius-sm)] ${filter === c.id ? 'bg-accent text-white' : 'text-text-muted hover:bg-panel-bg'}`}>
                <button onClick={() => setFilter(c.id)} className="pl-3 pr-1 py-1.5 text-xs font-bold uppercase font-serif whitespace-nowrap flex items-center gap-1.5">
                  {c.type === 'Backpack' ? <Backpack className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />} {c.name}
                  <span className={`font-sans normal-case ${full ? 'text-danger font-bold' : 'opacity-70'}`}>{w.toFixed(1)}{c.maxWeight ? `/${c.maxWeight}` : ''} kg</span>
                </button>
                <button onClick={() => deleteContainer(c.id)} className="px-1.5 py-1.5 opacity-60 hover:opacity-100" aria-label={`Elimina contenitore ${c.name}`}><X className="w-3 h-3" /></button>
              </span>
            );
          })}
          {addingContainer ? (
            <span className="flex items-center gap-1">
              <input autoFocus value={newContainerName} onChange={e => setNewContainerName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addContainer(); if (e.key === 'Escape') setAddingContainer(false); }} placeholder="Nome contenitore" className="bg-panel-bg border border-border px-2 py-1 text-xs w-36" />
              <button onClick={addContainer} className="p-1 text-accent" aria-label="Crea contenitore"><Plus className="w-4 h-4" /></button>
            </span>
          ) : (
            <button onClick={() => setAddingContainer(true)} className="px-2 py-1.5 text-text-muted hover:text-accent flex items-center gap-1 text-xs whitespace-nowrap" title="Nuovo contenitore"><FolderPlus className="w-4 h-4" /> Contenitore</button>
          )}
        </div>

        {/* Catalogo */}
        <AnimatePresence>
          {catalogOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border bg-panel-bg">
              <div className="p-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="field-shell flex-1"><Search className="w-4 h-4 text-text-muted" /><input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Cerca armi e armature" className="w-full bg-transparent py-2 outline-none text-sm" /></label>
                  <div className="flex gap-1">
                    {(['Tutto', 'Semplice', 'Marziale', 'Armature'] as CatalogFilter[]).map(f => (
                      <button key={f} onClick={() => setCatalogFilter(f)} className={`px-2.5 py-1.5 text-[11px] font-bold uppercase font-serif border rounded-[var(--radius-sm)] ${catalogFilter === f ? 'bg-accent border-accent text-white' : 'border-border text-text-muted'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {catalog.map(entry => (
                    <button key={entry.id} onClick={() => addFromCatalog(entry.name, (entry as any).data)} className="flex items-center justify-between gap-2 text-left bg-card-bg border border-border hover:border-accent px-3 py-2 rounded-[var(--radius-sm)] group">
                      <span className="min-w-0">
                        <span className="block font-bold text-sm truncate">{entry.name}</span>
                        <span className="block text-[11px] text-text-muted truncate">{entry.info} · {entry.extra} · {entry.weight} kg · {entry.cost}</span>
                      </span>
                      <Plus className="w-4 h-4 text-text-muted group-hover:text-accent shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aggiunta rapida */}
        <div className="flex gap-2 p-3 border-b border-border">
          <input value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder={`Aggiungi un oggetto${targetContainer ? ` in ${containers.find(c => c.id === targetContainer)?.name}` : ''}… (es. Corda di canapa)`} className="flex-1 min-w-0 bg-panel-bg border border-border px-3 py-2 rounded-[var(--radius-sm)] outline-none focus:border-accent" aria-label="Nome nuovo oggetto" />
          <button onClick={addItem} disabled={!newItemName.trim()} className="primary-action px-4 disabled:opacity-40 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Aggiungi</button>
        </div>

        {/* Elenco oggetti */}
        {visibleItems.length === 0 ? (
          <div className="p-4"><EmptyState icon={Package} title="Nessun oggetto qui">Aggiungi oggetti con il campo qui sopra o dal catalogo.</EmptyState></div>
        ) : (
          <ul className="divide-y divide-border">
            {visibleItems.map(item => {
              const Icon = itemIcon(item);
              const armor = findArmor(item.name);
              const weapon = item.damage ? item : undefined;
              return (
                <li key={item.id} className={`flex gap-3 items-start px-3 py-3 ${item.isEquipped ? 'bg-accent/5' : ''}`}>
                  <button
                    onClick={() => toggleEquipped(item)}
                    aria-pressed={item.isEquipped}
                    title={item.isEquipped ? 'Equipaggiato (clic per togliere)' : 'Equipaggia'}
                    className={`w-9 h-9 shrink-0 grid place-items-center border rounded-[var(--radius-sm)] transition-colors ${item.isEquipped ? 'bg-accent border-accent text-white' : 'border-border text-text-muted hover:border-accent hover:text-accent'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <input value={item.name} onChange={e => updateItem(item.id, { name: e.target.value })} className="flex-1 min-w-0 bg-transparent font-bold outline-none focus:bg-panel-bg px-1 -mx-1" aria-label="Nome oggetto" />
                      <button onClick={() => updateItem(item.id, { isMagical: !item.isMagical, isAttuned: false, magicBonus: 0 })} aria-pressed={item.isMagical} title="Oggetto magico" className={`p-1.5 rounded-[var(--radius-sm)] ${item.isMagical ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}><Star className={`w-4 h-4 ${item.isMagical ? 'fill-current' : ''}`} /></button>
                      {item.isMagical && (item.damage || armor) && (
                        <select value={item.magicBonus || 0} onChange={e => updateItem(item.id, { magicBonus: Number(e.target.value) })} className="bg-panel-bg border border-border text-xs py-1" aria-label="Bonus magico">
                          {[0, 1, 2, 3].map(b => <option key={b} value={b}>+{b}</option>)}
                        </select>
                      )}
                      {item.isMagical && (
                        <button onClick={() => toggleAttunement(item)} disabled={!item.isAttuned && math.attunementCount >= math.maxAttunement} title={item.isAttuned ? 'In sintonia' : 'Sintonizza'} className={`px-1.5 py-1 text-[10px] font-black uppercase font-serif border rounded-[var(--radius-sm)] disabled:opacity-30 ${item.isAttuned ? 'bg-success border-success text-white' : 'border-border text-text-muted'}`}>Sintonia</button>
                      )}
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-text-muted hover:text-danger" aria-label={`Rimuovi ${item.name}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {weapon && <Tag>{weapon.damage} {weapon.damageType}</Tag>}
                      {weapon?.mastery && <Tag>{weapon.mastery}</Tag>}
                      {armor && <Tag>{armor.category === 'Scudo' ? 'CA +2' : `CA ${armor.baseAc} · ${armor.category}`}</Tag>}
                      {item.isEquipped && <Tag tone="accent">Equipaggiato</Tag>}
                      {item.isMagical && <Tag tone="accent">Magico{item.magicBonus ? ` +${item.magicBonus}` : ''}</Tag>}
                      {item.isAttuned && <Tag tone="success">In sintonia</Tag>}
                      <span className="flex-1" />
                      <span className="flex items-center border border-border rounded-[var(--radius-sm)]">
                        <button onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="p-1 text-text-muted hover:text-accent" aria-label="Diminuisci quantità"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-8 text-center text-sm font-bold" aria-label="Quantità">{item.quantity}</span>
                        <button onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })} className="p-1 text-text-muted hover:text-accent" aria-label="Aumenta quantità"><Plus className="w-3.5 h-3.5" /></button>
                      </span>
                      <label className="flex items-center gap-1 text-xs text-text-muted">
                        <input type="number" min={0} step={0.5} value={item.weight || 0} onChange={e => updateItem(item.id, { weight: parseFloat(e.target.value) || 0 })} className="w-14 bg-panel-bg border border-border text-center py-0.5 text-text-primary" aria-label="Peso in kg" /> kg
                      </label>
                      <select value={item.containerId || 'none'} onChange={e => updateItem(item.id, { containerId: e.target.value === 'none' ? null : e.target.value })} className="bg-panel-bg border border-border px-1.5 py-0.5 text-xs" aria-label="Contenitore">
                        <option value="none">Addosso</option>
                        {containers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
