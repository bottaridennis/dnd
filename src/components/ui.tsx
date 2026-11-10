import React from 'react';
import { Check } from 'lucide-react';

/** Primitive UI condivise: mantengono lo stesso linguaggio visivo della scheda personaggio. */

type IconType = React.ComponentType<{ className?: string }>;

export const Section: React.FC<{
  title: React.ReactNode; icon?: IconType; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; id?: string;
}> = ({ title, icon: Icon, actions, children, className = '', bodyClassName = 'p-4', id }) => {
  return (
    <section className={`sheet-section ${className}`} aria-labelledby={id}>
      <div className="sheet-section-title">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span id={id} className="truncate">{title}</span>
        {actions && <div className="ml-auto flex items-center gap-2 normal-case tracking-normal font-sans font-normal">{actions}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export const OptionCard: React.FC<{
  selected?: boolean; onClick?: () => void; disabled?: boolean; title: React.ReactNode; subtitle?: React.ReactNode; meta?: React.ReactNode;
  children?: React.ReactNode; badge?: React.ReactNode; className?: string;
}> = ({ selected, onClick, disabled, title, subtitle, meta, children, badge, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative text-left w-full rounded-[var(--radius-lg)] border transition-all p-4 group
        ${selected ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_var(--color-accent)]' : 'border-border bg-card-bg hover:border-text-muted'}
        ${disabled ? 'opacity-45 cursor-not-allowed' : ''} ${className}`}
    >
      {selected && <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent text-white grid place-items-center"><Check className="w-3.5 h-3.5" /></span>}
      {badge && !selected && <span className="absolute top-3 right-3">{badge}</span>}
      <div className={`font-serif font-black uppercase text-lg leading-tight pr-8 ${selected ? 'text-accent' : ''}`}>{title}</div>
      {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
      {meta && <div className="flex flex-wrap gap-1.5 mt-3">{meta}</div>}
      {children && <div className="mt-3 text-sm text-text-muted">{children}</div>}
    </button>
  );
};

export const Tag: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'accent' | 'danger' | 'success'; title?: string }> = ({ children, tone = 'neutral', title }) => {
  const tones = {
    neutral: 'border-border text-text-muted bg-panel-bg',
    accent: 'border-accent/50 text-accent bg-accent/10',
    danger: 'border-danger/50 text-danger bg-danger/10',
    success: 'border-success/50 text-success bg-success/10',
  };
  return <span title={title} className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-wider font-serif ${tones[tone]}`}>{children}</span>;
};

export const ToggleChip: React.FC<{ selected: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, disabled, onClick, children }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`px-3 py-1.5 rounded-[var(--radius-sm)] border text-sm transition-colors flex items-center gap-1.5
        ${selected ? 'border-accent bg-accent/10 text-accent font-bold' : 'border-border bg-card-bg hover:border-text-muted'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {selected && <Check className="w-3.5 h-3.5" />}{children}
    </button>
  );
};

export const EmptyState: React.FC<{ icon?: IconType; title: string; children?: React.ReactNode }> = ({ icon: Icon, title, children }) => {
  return (
    <div className="text-center py-10 px-6 border border-dashed border-border rounded-[var(--radius-lg)]">
      {Icon && <Icon className="w-8 h-8 mx-auto text-text-muted mb-3" />}
      <div className="font-serif font-black uppercase">{title}</div>
      {children && <div className="text-sm text-text-muted mt-1">{children}</div>}
    </div>
  );
};

export const StepHeader: React.FC<{ eyebrow: string; title: string; description?: string; aside?: React.ReactNode }> = ({ eyebrow, title, description, aside }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h2 className="text-3xl md:text-4xl uppercase leading-none">{title}</h2>
        {description && <p className="text-text-muted mt-2 max-w-2xl">{description}</p>}
      </div>
      {aside}
    </div>
  );
};

export const Counter: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => {
  const done = value === max;
  const over = value > max;
  return (
    <span className={`inline-flex items-baseline gap-1 px-3 py-1 border rounded-[var(--radius-sm)] ${over ? 'border-danger text-danger' : done ? 'border-success text-success' : 'border-border text-text-muted'}`}>
      <strong className="font-display text-lg leading-none">{value}/{max}</strong>
      <span className="text-[10px] uppercase font-bold tracking-wider font-serif">{label}</span>
    </span>
  );
};
