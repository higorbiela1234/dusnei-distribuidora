import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}