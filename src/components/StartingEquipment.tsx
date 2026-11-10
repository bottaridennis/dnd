import React, { useEffect, useState } from 'react';
import { useCharacter, InventoryItem } from '../contexts/CharacterContext';
import { classesData, backgroundsData } from '../data/rules2024';
import { Sword, Briefcase, Coins } from 'lucide-react';
import { Section, OptionCard, Tag, StepHeader } from './ui';
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

  const totalGold = (charClass?.startingEquipment?.options.find(o => o.id === classChoice)?.gold || 0) + (charBg?.startingEquipment?.options.find(o => o.id === bgChoice)?.gold || 0);

  const renderOptions = (options: { id: string; name: string; items?: string[]; gold: number }[] | undefined, choice: string, setChoice: (id: string) => void) => (
    <div className="space-y-2">
      {(options || []).map(opt => (
        <OptionCard
          key={opt.id}
          selected={choice === opt.id}
          onClick={() => setChoice(opt.id)}
          title={`Opzione ${opt.id} · ${opt.name}`}
          subtitle={opt.items ? undefined : 'Compra tu l’equipaggiamento'}
          meta={<>
            {(opt.items || []).map(item => <Tag key={item}>{item}</Tag>)}
            {opt.gold > 0 && <Tag tone="accent">{opt.gold} mo</Tag>}
          </>}
          className="!p-3"
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Capitolo 6"
        title="Equipaggiamento iniziale"
        description="Prendi il pacchetto proposto oppure le monete per comprare ciò che vuoi. Armi e armature del pacchetto vengono equipaggiate automaticamente."
        aside={<span className="inline-flex items-center gap-2 px-3 py-1.5 border border-accent text-accent"><Coins className="w-4 h-4" /><strong className="font-display text-xl">{totalGold}</strong><span className="text-[10px] uppercase font-bold font-serif">monete d’oro</span></span>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={`Classe · ${charClass?.name || '—'}`} icon={Sword}>{renderOptions(charClass?.startingEquipment?.options, classChoice, setClassChoice)}</Section>
        <Section title={`Background · ${charBg?.name || '—'}`} icon={Briefcase}>{renderOptions(charBg?.startingEquipment?.options, bgChoice, setBgChoice)}</Section>
      </div>
    </div>
  );
}
