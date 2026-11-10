/** Tiro di un dado con generatore crittografico (nessuna dipendenza, usabile ovunque). */
export function rollDie(sides: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] % sides) + 1;
}
