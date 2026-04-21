import { useMemo } from 'react';
import { InventoryItem } from '../contexts/CharacterContext';

/**
 * PARTE 1: LOGICA DI CALCOLO (useInventoryMath.ts)
 * Calcola capacità, peso monete, peso totale, ingombro e sintonia.
 */
export function useInventoryMath(
  inventory: InventoryItem[] = [], 
  currency: Record<string, number> = {}, 
  strength: number = 10
) {
  return useMemo(() => {
    // 1. Capacità di Trasporto: Forza * 7.5 kg (Equivalente metrico di 15 lbs)
    const carryingCapacity = strength * 7.5;

    // 2. Peso delle Monete: 50 monete = 0.45 kg (Equivalente di 1 lb). Arrotonda per difetto.
    const totalCoins = Object.values(currency).reduce((acc, val) => acc + (Number(val) || 0), 0);
    const coinWeight = Math.floor(totalCoins / 50) * 0.45;

    // 3. Peso Totale: Somma pesi oggetti + peso monete
    const itemsWeight = inventory.reduce((acc, item) => acc + (Number(item.weight || 0) * Number(item.quantity || 1)), 0);
    const totalWeight = itemsWeight + coinWeight;
    const isEncumbered = totalWeight > carryingCapacity;

    // 4. Sintonia (Attunement): Massimo 3 oggetti
    const attunementCount = inventory.filter(item => item.isAttuned).length;
    const maxAttunement = 3;

    return {
      carryingCapacity,
      coinWeight,
      totalWeight: Number(totalWeight.toFixed(2)),
      itemsWeight: Number(itemsWeight.toFixed(2)),
      isEncumbered,
      attunementCount,
      maxAttunement,
      weightPercentage: Math.min(100, (totalWeight / (carryingCapacity || 1)) * 100)
    };
  }, [inventory, currency, strength]);
}
