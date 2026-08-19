import { useAuth } from '../contexts/AuthContext';
import { ArrowUpRight, BookOpen, Cloud, Feather, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const NOTES = [{ label:'Schede vive', Icon:BookOpen },{ label:'Sincronizzazione', Icon:Cloud },{ label:'Regole 2024', Icon:ShieldCheck }];

export default function Login() {
  const { loginWithGoogle } = useAuth();
  return (
    <main className="login-stage min-h-screen p-5 md:p-9 flex items-center">
      <motion.section initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} className="relative z-10 w-full max-w-7xl mx-auto min-h-[82vh] grid lg:grid-cols-[1.35fr_.65fr] border border-border bg-card-bg">
        <div className="p-7 md:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="brand-mark"><Feather className="w-5 h-5"/></div><div><strong className="font-serif text-xl font-medium">Forge</strong><p className="eyebrow !text-[8px]">Hero archive</p></div></div>
            <span className="font-serif italic text-text-muted">Edizione MMXXIV</span>
          </div>
          <div className="py-16 md:py-24 max-w-3xl">
            <p className="eyebrow mb-6">Archivio personale per avventurieri</p>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[7.5rem] leading-[.82] tracking-[-.055em] text-text-primary">Ogni eroe<br/><em className="font-normal text-accent">merita memoria.</em></h1>
            <p className="mt-9 md:ml-[34%] max-w-md text-text-muted leading-relaxed">Un luogo ordinato per creare personaggi, custodire imprese e arrivare al tavolo pronti a giocare.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-x-8">{NOTES.map(({ label,Icon }) => <div className="feature-chip" key={label}><Icon className="w-4 h-4 text-accent"/><span>{label}</span></div>)}</div>
        </div>
        <aside className="p-7 md:p-12 flex flex-col justify-between min-h-[520px]">
          <div className="flex justify-end"><span className="folio-number">I</span></div>
          <div>
            <div className="editorial-rule mb-8"/><p className="eyebrow mb-3">Ingresso all’archivio</p><h2 className="font-serif text-4xl leading-tight">Riprendi il tuo viaggio.</h2>
            <p className="text-sm text-text-muted mt-4 mb-8 leading-relaxed">Accedi con Google per ritrovare personaggi, inventario e progressi su ogni dispositivo.</p>
            <button onClick={loginWithGoogle} className="primary-action w-full px-6 py-4 flex items-center justify-between group"><span>Entra con Google</span><ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/></button>
          </div>
        </aside>
      </motion.section>
    </main>
  );
}
