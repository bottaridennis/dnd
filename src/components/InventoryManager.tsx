import React, { useState } from 'react';
import { 
  Backpack, 
  Coins, 
  Scale, 
  Star, 
  Trash2, 
  Plus, 
  ChevronDown, 
  Package, 
  Briefcase,
  Shield,
  Sword,
  Info,
  AlertCircle,
  Search,
  FolderPlus,
  X
} from 'lucide-react';
import { useCharacter, InventoryItem, ContainerData } from '../contexts/CharacterContext';
import { useInventoryMath } from '../hooks/useInventoryMath';
import { motion, AnimatePresence } from 'motion/react';
import { characterService } from '../services/characterService';
import { standardWeapons } from '../data/weaponsData';

/**
 * PARTE 3: COMPONENTE UI (InventoryManager.tsx)
 * Gestione avanzata dell'inventario con contenitori e automazione pesi.
 */
export default function InventoryManager() {
  const { currentCharacter, dispatch } = useCharacter();
  const { inventoryItems = [], containers = [], currency, abilityScores } = currentCharacter || {};
  const [activeContainerTab, setActiveContainerTab] = useState<string>('all');
  const [newItemName, setNewItemName] = useState('');
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [dbFilter, setDbFilter] = useState<'Tutte' | 'Semplice' | 'Marziale'>('Tutte');
  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');

  const math = useInventoryMath(inventoryItems, currency, abilityScores?.STR || 10);

  if (!currentCharacter) return null;

  const handleUpdate = async (updates: any) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    await characterService.updateCharacter(currentCharacter.id, updates);
  };

  const addCustomContainer = () => {
    if (!newContainerName.trim()) return;
    const newContainer: ContainerData = {
      id: crypto.randomUUID(),
      name: newContainerName,
      type: 'Other',
      maxWeight: 15 // Default
    };
    handleUpdate({ containers: [...containers, newContainer] });
    setNewContainerName('');
    setIsAddingContainer(false);
  };

  const deleteContainer = (containerId: string) => {
    // Sposta gli oggetti in "all" (senza container)
    const updatedItems = inventoryItems.map(item => 
      item.containerId === containerId ? { ...item, containerId: null } : item
    );
    const updatedContainers = containers.filter(c => c.id !== containerId);
    handleUpdate({ 
      inventoryItems: updatedItems,
      containers: updatedContainers
    });
    if (activeContainerTab === containerId) setActiveContainerTab('all');
  };

  const addItem = (containerId: string | null = null) => {
    if (!newItemName.trim()) return;
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: newItemName,
      weight: 0,
      quantity: 1,
      isAttuned: false,
      isMagical: false,
      isEquipped: false,
      containerId: containerId
    };
    handleUpdate({ inventoryItems: [...inventoryItems, newItem] });
    setNewItemName('');
  };

  const removeItem = (id: string) => {
    handleUpdate({ inventoryItems: inventoryItems.filter(i => i.id !== id) });
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    handleUpdate({
      inventoryItems: inventoryItems.map(i => i.id === id ? { ...i, ...updates } : i)
    });
  };

  const updateCurrency = (type: string, val: number) => {
    const newCurrency = { ...currency, [type]: Math.max(0, val) };
    handleUpdate({ currency: newCurrency });
  };

  const toggleAttunement = (item: InventoryItem) => {
    if (!item.isAttuned && math.attunementCount >= math.maxAttunement) return;
    updateItem(item.id, { isAttuned: !item.isAttuned });
  };

  // Helper per calcolare il peso attuale di un contenitore specifico
  const getContainerWeight = (containerId: string) => {
    return inventoryItems
      .filter(i => i.containerId === containerId)
      .reduce((acc, i) => acc + (i.weight * i.quantity), 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ProgressBar del Peso */}
      <div className="bg-panel-bg border border-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col">
             <div className="flex items-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">
               <Scale className="w-3 h-3 text-accent" />
               Peso Trasportato
             </div>
             <div className="flex items-baseline gap-1">
               <span className={`text-2xl font-serif font-black ${math.isEncumbered ? 'text-red-500' : 'text-text-primary'}`}>
                 {math.totalWeight}
               </span>
               <span className="text-text-muted text-xs font-bold">/ {math.carryingCapacity} kg</span>
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Sintonia</div>
             <div className={`text-lg font-serif font-black ${math.attunementCount >= math.maxAttunement ? 'text-accent' : 'text-text-primary'}`}>
               {math.attunementCount} <span className="text-text-muted text-xs">/ {math.maxAttunement}</span>
             </div>
          </div>
        </div>
        
        <div className="relative h-3 bg-bg rounded-full border border-border overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${math.weightPercentage}%` }}
            className={`h-full transition-all duration-500 ${math.isEncumbered ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]'}`}
          />
        </div>
        
        {math.isEncumbered && (
          <div className="mt-3 flex items-center gap-2 text-red-500 py-2 px-3 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold uppercase animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Ingombrato: La tua velocità è dimezzata
          </div>
        )}
      </div>

      {/* Sezione Ricchezza */}
      <div className="bg-panel-bg border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-5 h-5 text-accent" />
          <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Portamonete</h3>
          <div className="ml-auto text-[10px] font-black uppercase text-text-muted bg-bg px-2 py-1 rounded border border-border">
            Peso Monete: {math.coinWeight.toFixed(2)} kg
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'pp', label: 'Platino', color: 'text-blue-300' },
            { id: 'gp', label: 'Oro', color: 'text-yellow-500' },
            { id: 'ep', label: 'Elettro', color: 'text-blue-100' },
            { id: 'sp', label: 'Argento', color: 'text-gray-300' },
            { id: 'cp', label: 'Rame', color: 'text-orange-500' },
          ].map((coin) => (
             <div key={coin.id} className="bg-bg border border-border rounded-lg p-3 group hover:border-accent/40 transition-colors">
               <div className={`text-[10px] font-black uppercase ${coin.color} mb-2 tracking-widest`}>{coin.label}</div>
               <div className="flex items-center justify-between">
                  <input 
                    type="number" 
                    value={(currency as any)[coin.id] || 0}
                    onChange={(e) => updateCurrency(coin.id, parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-lg font-black text-text-primary focus:outline-none"
                  />
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Layout Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Contenitori (Responsive) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-[10px] font-black uppercase text-text-muted tracking-widest">Contenitori</div>
            <button 
              onClick={() => setIsAddingContainer(true)}
              className="p-1 text-accent hover:bg-accent/10 rounded-full transition-colors"
              title="Aggiungi Contenitore"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Form Aggiunta Rapida Contenitore */}
          <AnimatePresence>
            {isAddingContainer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-panel-bg border border-accent/30 rounded-lg p-3 space-y-3 mb-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-accent">Nuovo Contenitore</span>
                    <button onClick={() => setIsAddingContainer(false)}>
                      <X className="w-3 h-3 text-text-muted" />
                    </button>
                  </div>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Nome (es. Sacco, Baule...)"
                    value={newContainerName}
                    onChange={(e) => setNewContainerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomContainer()}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                  <button 
                    onClick={addCustomContainer}
                    className="w-full py-1.5 bg-accent text-bg rounded text-[9px] font-black uppercase tracking-widest"
                  >
                    Crea
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop/Mobile Switch layout per i Tab */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2 lg:gap-3 no-scrollbar scroll-smooth">
            <button 
              onClick={() => setActiveContainerTab('all')}
              className={`flex-shrink-0 lg:w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${activeContainerTab === 'all' ? 'bg-accent text-bg border-accent shadow-lg' : 'bg-panel-bg text-text-muted border-border hover:border-text-muted'}`}
            >
              <div className="flex items-center gap-3">
                 <Package className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase whitespace-nowrap lg:whitespace-normal">Tutti gli Oggetti</span>
              </div>
              <span className="hidden lg:block text-[10px] font-black">{inventoryItems.length}</span>
            </button>
            
            {containers.map((container) => {
              const currentWeight = getContainerWeight(container.id);
              const isFull = container.maxWeight && currentWeight >= container.maxWeight;
              
              return (
                <div key={container.id} className="flex-shrink-0 lg:w-full group relative">
                  <div 
                    onClick={() => setActiveContainerTab(container.id)}
                    className={`h-full lg:h-auto lg:w-full flex flex-col p-3 rounded-lg border transition-all text-left cursor-pointer ${activeContainerTab === container.id ? 'bg-accent text-bg border-accent shadow-lg' : 'bg-panel-bg text-text-muted border-border hover:border-text-muted'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        {container.type === 'Backpack' ? <Backpack className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase tracking-tight whitespace-nowrap lg:whitespace-normal">{container.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isFull && <AlertCircle className={`w-3 h-3 ${activeContainerTab === container.id ? 'text-red-900' : 'text-red-500'}`} />}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteContainer(container.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-500/20 transition-all ${activeContainerTab === container.id ? 'text-bg hover:bg-black/10' : 'text-red-400'}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {container.maxWeight && (
                      <div className="hidden lg:block w-full mt-2">
                        <div className="flex justify-between text-[8px] font-black uppercase mb-1">
                          <span>Peso Contenuto</span>
                          <span>{currentWeight.toFixed(1)} / {container.maxWeight} kg</span>
                        </div>
                        <div className={`h-1 rounded-full bg-black/10 overflow-hidden`}>
                          <div 
                            className={`h-full transition-all duration-300 ${activeContainerTab === container.id ? 'bg-white' : 'bg-accent'}`} 
                            style={{ width: `${Math.min(100, (currentWeight / container.maxWeight) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista Oggetti */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-panel-bg border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
               <div className="relative w-full sm:max-w-xs">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Nuovo oggetto..." 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(activeContainerTab === 'all' ? null : activeContainerTab)}
                    className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => addItem(activeContainerTab === 'all' ? null : activeContainerTab)}
                    className="px-4 py-2 bg-accent text-bg rounded text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all"
                  >
                    Aggiungi
                  </button>
                  <button 
                    onClick={() => setIsDatabaseOpen(!isDatabaseOpen)}
                    className="p-2 bg-panel-bg border border-border rounded text-text-muted hover:text-accent transition-all"
                    title="Database Armi"
                  >
                    <Search className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Database Browser Panel */}
            <AnimatePresence>
              {isDatabaseOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-black/10 border-b border-border"
                >
                  <div className="p-6 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Database Armi Standard</span>
                        <div className="flex gap-2">
                           {['Tutte', 'Semplice', 'Marziale'].map(f => (
                             <button
                               key={f}
                               onClick={() => setDbFilter(f as any)}
                               className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                 dbFilter === f ? 'bg-accent text-bg border-accent' : 'bg-transparent text-text-muted border-border'
                               }`}
                             >
                               {f}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {standardWeapons
                          .filter(w => dbFilter === 'Tutte' || w.category === dbFilter)
                          .map(weapon => (
                          <div key={weapon.id} className="flex justify-between items-center p-2 bg-card-bg border border-border rounded hover:border-accent/40 transition-all group">
                             <div>
                                <div className="text-[11px] font-bold text-text-primary uppercase">{weapon.name}</div>
                                <div className="text-[8px] text-text-muted uppercase font-mono">{weapon.damage} {weapon.damageType}</div>
                             </div>
                             <button
                               onClick={async () => {
                                 const targetContainer = activeContainerTab === 'all' ? null : activeContainerTab;
                                 await characterService.addStandardItemToInventory(currentCharacter!.id, weapon, targetContainer);
                                 setIsDatabaseOpen(false);
                               }}
                               className="p-1 px-2 bg-accent/10 text-accent rounded text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-bg transition-all"
                             >
                               +
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y divide-border/30">
               {inventoryItems
                .filter(i => activeContainerTab === 'all' || i.containerId === activeContainerTab)
                .length > 0 ? (
                  inventoryItems
                    .filter(i => activeContainerTab === 'all' || i.containerId === activeContainerTab)
                    .map((item) => (
                      <div key={item.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:bg-accent/5 transition-colors">
                        <div className="flex-1 flex items-center gap-3">
                           <button 
                             onClick={() => updateItem(item.id, { isEquipped: !item.isEquipped })}
                             className={`p-2 rounded-lg border transition-all ${item.isEquipped ? 'bg-primary text-white border-primary shadow-sm' : 'bg-bg text-text-muted border-border hover:border-primary/50'}`}
                             title={item.isEquipped ? 'Equipaggiato' : 'Equipaggia'}
                           >
                             <Sword className="w-4 h-4" />
                           </button>
                           <div className="flex flex-col min-w-0 flex-1">
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                className="bg-transparent border-none p-0 text-sm font-bold text-text-primary focus:outline-none focus:ring-0 w-full truncate"
                              />
                              <div className="flex flex-col gap-1.5 mt-1">
                                {item.damage && (
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[9px] font-black uppercase text-accent tracking-tighter">
                                      {item.damage} {item.damageType}
                                    </span>
                                    {item.mastery && (
                                      <span className="px-1.5 py-0.5 bg-bg border border-border rounded text-[9px] font-bold text-text-muted italic">
                                        {item.mastery}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black uppercase text-text-muted tracking-tighter">Peso:</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      value={item.weight}
                                      onChange={(e) => updateItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
                                      className="w-10 bg-transparent text-[10px] font-black text-accent text-center focus:outline-none"
                                    />
                                    <span className="text-[10px] text-text-muted">kg</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black uppercase text-text-muted tracking-tighter">Qtà:</span>
                                    <div className="flex items-center gap-1 bg-bg/50 px-1.5 py-0.5 rounded border border-border/50">
                                      <button onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="text-text-muted hover:text-accent"><MinusIcon className="w-2.5 h-2.5" /></button>
                                      <span className="text-[10px] font-black text-text-primary min-w-[12px] text-center">{item.quantity}</span>
                                      <button onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })} className="text-text-muted hover:text-accent"><PlusIcon className="w-2.5 h-2.5" /></button>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Briefcase className="w-2.5 h-2.5 text-text-muted" />
                                  <select 
                                    value={item.containerId || 'none'}
                                    onChange={(e) => updateItem(item.id, { containerId: e.target.value === 'none' ? null : e.target.value })}
                                    className="bg-transparent text-[10px] font-bold text-text-muted uppercase focus:outline-none cursor-pointer hover:text-accent transition-colors"
                                  >
                                    <option value="none" className="bg-panel-bg text-text-primary italic">Nessun Contenitore</option>
                                    {containers.map(c => (
                                      <option key={c.id} value={c.id} className="bg-panel-bg text-text-primary">
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                           {/* Toggle Oggetto Magico / Sintonia */}
                           <div className="flex items-center gap-2 pr-2 sm:pr-4 sm:border-r border-border/50">
                              <button 
                                onClick={() => updateItem(item.id, { isMagical: !item.isMagical, isAttuned: false })}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${item.isMagical ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'text-text-muted hover:text-text-primary'}`}
                              >
                                {item.isMagical && <Star className="w-2.5 h-2.5 fill-current" />}
                                Magico
                              </button>
                              
                              {item.isMagical && (
                                <button 
                                  disabled={!item.isAttuned && math.attunementCount >= math.maxAttunement}
                                  onClick={() => toggleAttunement(item)}
                                  className={`
                                    flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase transition-all
                                    ${item.isAttuned ? 'bg-blue-500 text-white shadow-sm' : 'bg-bg border border-border text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed'}
                                  `}
                                >
                                  {item.isAttuned ? "Sintonizzato" : "Sintonia"}
                                </button>
                              )}
                           </div>

                           <button 
                             onClick={() => removeItem(item.id)}
                             className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="px-5 py-20 text-center text-text-muted">
                    <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="font-serif italic text-sm">L'inventario è vuoto in questa sezione.</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}

function MinusIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /></svg>;
}
