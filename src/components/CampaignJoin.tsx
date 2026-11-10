import React, { useEffect, useState } from 'react';
import { Crown, LogOut, Swords } from 'lucide-react';
import { useCharacter } from '../contexts/CharacterContext';
import { campaignService, normalizeCode, type Campaign } from '../services/campaignService';

/** Riquadro sulla scheda: collega il personaggio a una campagna e mostra il turno di combattimento. */
export default function CampaignJoin() {
  const { currentCharacter, dispatch } = useCharacter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const campaignId = currentCharacter?.campaignId;
  useEffect(() => {
    if (!campaignId) { setCampaign(null); return; }
    return campaignService.subscribeCampaign(campaignId, setCampaign);
  }, [campaignId]);

  if (!currentCharacter) return null;

  const join = async () => {
    const normalized = normalizeCode(code);
    if (normalized.length < 4) { setMessage('Inserisci il codice ricevuto dal Master.'); return; }
    setBusy(true);
    setMessage(null);
    try {
      const joined = await campaignService.joinCampaign(currentCharacter.id, normalized);
      dispatch({ type: 'UPDATE_CHARACTER', payload: { campaignId: joined.id, campaignDmId: joined.dmId, campaignName: joined.name } });
      setCode('');
    } catch (e) {
      setMessage(e instanceof Error && !e.message.startsWith('{') ? e.message : 'Codice non valido o campagna non raggiungibile.');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!window.confirm('Scollegare il personaggio dalla campagna? Il Master non vedrà più la scheda.')) return;
    await campaignService.leaveCampaign(currentCharacter.id);
    dispatch({ type: 'UPDATE_CHARACTER', payload: { campaignId: undefined, campaignDmId: undefined, campaignName: undefined } });
  };

  const initiative = campaign?.initiative;
  const current = initiative?.active ? initiative.entries[initiative.turn] : undefined;
  const myTurn = current?.characterId === currentCharacter.id;

  return (
    <section className="sheet-section">
      <div className="sheet-section-title"><Crown className="w-3.5 h-3.5" /> Campagna</div>
      <div className="p-4 space-y-3 text-sm">
        {campaignId ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold uppercase">{campaign?.name || currentCharacter.campaignName}</div>
                <div className="text-xs text-text-muted">Codice {campaignId} · il Master vede questa scheda</div>
              </div>
              <button onClick={leave} className="p-1.5 text-text-muted hover:text-danger" aria-label="Esci dalla campagna" title="Esci dalla campagna"><LogOut className="w-4 h-4" /></button>
            </div>
            {initiative?.active && (
              <div className={`border px-3 py-2 ${myTurn ? 'border-accent bg-accent/10' : 'border-border'}`}>
                <div className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1"><Swords className="w-3 h-3" /> Combattimento · round {initiative.round}</div>
                <div className="font-bold">{myTurn ? 'È il tuo turno!' : `Turno di ${current?.name ?? '—'}`}</div>
                <ol className="mt-1 text-xs text-text-muted">
                  {initiative.entries.map((e, i) => (
                    <li key={e.id} className={i === initiative.turn ? 'text-accent font-bold' : ''}>{e.initiative ?? '—'} · {e.name}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-text-muted">Inserisci il codice d’invito del Master per condividere la scheda in sola lettura.</p>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && join()} placeholder="CODICE" maxLength={8} className="flex-1 min-w-0 bg-panel-bg border border-border px-3 py-2 font-display font-bold tracking-[.2em] uppercase" aria-label="Codice campagna" />
              <button onClick={join} disabled={busy} className="primary-action px-3 disabled:opacity-50">Unisciti</button>
            </div>
            {message && <p className="text-xs text-danger">{message}</p>}
          </>
        )}
      </div>
    </section>
  );
}
