type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

const tones: Record<BadgeTone, string> = {
  primary: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/40',
  success: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40',
  warning: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
  danger: 'bg-rose-500/15 text-rose-200 border-rose-500/40',
  neutral: 'bg-slate-700/70 text-slate-200 border-slate-600',
};

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}
