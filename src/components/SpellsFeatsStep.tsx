
import React, { useState, useMemo } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { Search, Sparkles, BookOpen, Star } from 'lucide-react';
import { RAW_SPELLS } from '../data/spells';
import { FEATURES } from '../data/features';
import { INVOCATIONS } from '../data/invocations';

export default function SpellsFeatsStep() {
  const { currentCharacter, dispatch } = useCharacter();
  const [tab, setTab] = useState<'incantesimi' | 'talenti' | 'invocazioni'>('incantesimi');
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    let base = [];
    if (tab === 'incantesimi') base = RAW_SPELLS;
    if (tab === 'talenti') base = FEATURES;
    if (tab === 'invocazioni') base = INVOCATIONS;

    return base.filter((item: any) => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      (item.displayName && item.displayName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [tab, search]);

  const toggleSelection = (item: any) => {
    const listName = tab === 'incantesimi' ? 'spells' : (tab === 'talenti' ? 'feats' : 'invocations');
    // For simplicity, we just store the name
    const currentList = (currentCharacter as any)[listName] || [];
    const isSelected = currentList.includes(item.name);
    
    let newList;
    if (isSelected) {
      newList = currentList.filter((n: string) => n !== item.name);
    } else {
      newList = [...currentList, item.name];
    }
    
    dispatch({ type: 'UPDATE_CHARACTER', payload: { [listName]: newList } });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between border-b border-border pb-6">
        <div className="flex p-0.5 bg-panel-bg rounded border border-border w-full sm:w-auto">
           <button onClick={() => setTab('incantesimi')} className={`px-5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'incantesimi' ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>Incantesimi</button>
           <button onClick={() => setTab('talenti')} className={`px-5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'talenti' ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>Talenti</button>
           <button onClick={() => setTab('invocazioni')} className={`px-5 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'invocazioni' ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>Invocazioni</button>
        </div>
        <div className="relative w-full sm:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
           <input 
             type="text" 
             placeholder="Cerca per nome..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-panel-bg border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent/40 transition-colors"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.length > 0 ? (
          filteredData.map((item: any, idx: number) => {
            const listName = tab === 'incantesimi' ? 'spells' : (tab === 'talenti' ? 'feats' : 'invocations');
            const isSelected = ((currentCharacter as any)[listName] || []).includes(item.name);

            return (
              <button
                key={item.name + idx}
                onClick={() => toggleSelection(item)}
                className={`group relative p-6 rounded-lg border text-left transition-all duration-300 ${
                  isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border bg-card-bg hover:border-text-muted'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h4 className={`font-serif font-bold text-lg ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{item.displayName || item.name}</h4>
                      {item.level !== undefined && (
                        <span className="text-[10px] uppercase font-mono font-black text-text-muted tracking-tighter">
                          {item.level === 0 ? 'Trucchetto' : `Livello ${item.level}`} • {item.school}
                        </span>
                      )}
                      {item.prerequisite && <div className="text-[10px] text-accent/60 italic mt-1 font-medium">{item.prerequisite}</div>}
                   </div>
                   {isSelected ? (
                     <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-bg">
                        <Star className="w-3 h-3 fill-current" />
                     </div>
                   ) : (
                     <Sparkles className="w-5 h-5 text-text-muted/30 group-hover:text-accent/50 transition-colors" />
                   )}
                </div>
                <div 
                  className="text-xs text-text-muted line-clamp-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </button>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-border rounded-xl">
             <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
             <p className="text-sm font-medium text-text-muted">Nessun potere trovato nella libreria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
