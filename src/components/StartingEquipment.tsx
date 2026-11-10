import React, { useEffect, useState } from 'react';
import { useCharacter, InventoryItem } from '../contexts/CharacterContext';
import { classesData, backgroundsData } from '../data/rules2024';
import { Check, Sword, Briefcase } from 'lucide-react';
import { processStartingItem } from '../data/weaponsData';

/**
 * PARTE 3: WIZARD EQUIPAGGIAMENTO (StartingEquipment.tsx)
 * Permette la scelta del pacchetto iniziale di classe e background.
 */
export default function StartingEquipment() {
  const { currentCharacter, dispatch } = useCharacter();
  const [classChoice, setClassChoice] = useState<string>('A');
  const [bgChoice, setBgChoice] = useState<string>('A');

  const charClass = classesData.find(c => c.id === currentCharacter?.classId);
  const charBg = backgroundsData.find(b => b.id === currentCharacter?.backgroundId);

  // La scelta viene applicata subito, così "Continua" porta sempre l'equipaggiamento selezionato
  useEffect(() => {
    applyStartingEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classChoice, bgChoice, charClass?.id, charBg?.id]);

  if (!currentCharacter) return null;

  function applyStartingEquipment() {
    const classOption = charClass?.startingEquipment?.options.find(o => o.id === classChoice);
    const bgOption = charBg?.startingEquipment?.options.find(o => o.id === bgChoice);

    const itemsToAdd: InventoryItem[] = [];
    let goldToAdd = 0;

    // Process Class Choice
    if (classOption) {
      if (classOption.items) {
        classOption.items.forEach(itemName => {
          itemsToAdd.push(processStartingItem(itemName));
        });
      }
      goldToAdd += classOption.gold || 0;
    }

    // Process Background Choice
    if (bgOption) {
      if (bgOption.items) {
        bgOption.items.forEach(itemName => {
          itemsToAdd.push(processStartingItem(itemName));
        });
      }
      goldToAdd += bgOption.gold || 0;
    }

    const newInventory = [...itemsToAdd];
    const newCurrency = { 
      cp: 0, sp: 0, ep: 0, pp: 0,
      gp: goldToAdd 
    };

    dispatch({ 
      type: 'UPDATE_CHARACTER', 
      payload: { 
        inventoryItems: newInventory,
        currency: newCurrency
      } 
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scelta Classe */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-2">
            <Sword className="w-5 h-5 text-accent" />
            <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Eredità di Classe</h3>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
            Scegli come iniziare la tua carriera come {charClass?.name}
          </p>
          
          <div className="space-y-3">
            {charClass?.startingEquipment?.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => setClassChoice(opt.id)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  classChoice === opt.id 
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/20' 
                    : 'border-border bg-card-bg hover:border-text-muted'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                   <span className={`text-sm font-black transition-colors ${classChoice === opt.id ? 'text-accent' : 'text-text-primary'}`}>{opt.name}</span>
                   {classChoice === opt.id && <Check className="w-4 h-4 text-accent" />}
                </div>
                <div className="text-[10px] text-text-muted leading-relaxed">
                   {opt.items ? opt.items.join(', ') : 'Solo Monete'} 
                   {opt.gold > 0 && <span className="text-accent font-black"> + {opt.gold} MO</span>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Scelta Background */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-2">
            <Briefcase className="w-5 h-5 text-accent" />
            <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Risorse di Origine</h3>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
            Il tuo passato come {charBg?.name} ti ha fornito questi strumenti
          </p>

          <div className="space-y-3">
            {charBg?.startingEquipment?.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => setBgChoice(opt.id)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  bgChoice === opt.id 
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/20' 
                    : 'border-border bg-card-bg hover:border-text-muted'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                   <span className={`text-sm font-black transition-colors ${bgChoice === opt.id ? 'text-accent' : 'text-text-primary'}`}>{opt.name}</span>
                   {bgChoice === opt.id && <Check className="w-4 h-4 text-accent" />}
                </div>
                <div className="text-[10px] text-text-muted leading-relaxed">
                   {opt.items ? opt.items.join(', ') : 'Solo Oro (Standard)'} 
                   {opt.gold > 0 && <span className="text-accent font-black"> + {opt.gold} MO</span>}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <p className="text-center text-[10px] text-text-muted uppercase tracking-widest">Armi e armature del pacchetto vengono equipaggiate automaticamente.</p>
    </div>
  );
}
