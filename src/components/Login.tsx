import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Crown, Dices, Hexagon, ScrollText, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const FEATURES = [
  { Icon: ScrollText, title: 'Schede complete', text: 'Creazione guidata con le regole 2024, calcoli automatici di CA, PF, tiri salvezza e incantesimi.' },
  { Icon: Dices, title: 'Pronte al tavolo', text: 'Tiri di dado integrati, slot, risorse di classe, Concentrazione e riposi in un clic.' },
  { Icon: Crown, title: 'Strumenti del Master', text: 'Campagne con codice d’invito, gruppo in tempo reale e tracker dell’iniziativa.' },
];

export default function Login() {
  const { loginWithGoogle } = useAuth();
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <section className="hero-band flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-16 grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-12">
              <span className="brand-mark"><Hexagon className="w-5 h-5" /></span>
              <span className="leading-none">
                <span className="block text-2xl brand-title">Forge</span>
                <span className="text-[10px] text-white/60 uppercase font-bold tracking-[0.2em]">Character Companion · 2024</span>
              </span>
            </div>
            <p className="eyebrow mb-4">Il tuo companion per la quinta edizione</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[.88] tracking-tight">
              Forgia il tuo<br /><span className="text-[#ef3340]">eroe.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">Crea personaggi secondo le regole 2024, portali al tavolo con tutto ciò che serve per giocare e lascia che il Master segua il gruppo in tempo reale.</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button onClick={loginWithGoogle} className="primary-action px-8 py-4 text-sm flex items-center gap-3 group">
                Entra con Google <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-xs text-white/60 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Gratuito · i dati restano nel tuo account</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }} className="hidden lg:block">
            <div className="relative bg-black/40 border border-white/10 backdrop-blur p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-bold tracking-widest text-white/60">Anteprima scheda</span>
                <Sparkles className="w-4 h-4 text-[#ef3340]" />
              </div>
              <div className="text-3xl font-black uppercase">Lyra Ventoargento</div>
              <div className="text-sm text-white/60">Elfo · Mago 5 · Sapiente</div>
              <div className="grid grid-cols-6 gap-2 mt-5">
                {[['FOR', '-1'], ['DES', '+2'], ['COS', '+1'], ['INT', '+4'], ['SAG', '+1'], ['CAR', '+0']].map(([k, v]) => (
                  <div key={k} className="bg-white/5 border border-white/10 border-t-2 border-t-[#ef3340] text-center py-2">
                    <div className="text-[10px] font-bold text-white/60">{k}</div>
                    <div className="text-xl font-black">{v}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                {[['CA', '15'], ['PF', '32'], ['CD', '15']].map(([k, v]) => (
                  <div key={k} className="bg-white/5 border border-white/10 py-3"><div className="text-2xl font-black">{v}</div><div className="text-[10px] uppercase tracking-widest text-white/60">{k}</div></div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="surface-card p-6">
              <Icon className="w-6 h-6 text-accent mb-4" />
              <h2 className="text-lg uppercase">{title}</h2>
              <p className="text-sm text-text-muted mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
