import type { PropsWithChildren, ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, action, className = '', children }: PropsWithChildren<CardProps>) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 ${className}`}>
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
