import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block text-sm text-slate-300">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</span>}
      <input
        className={`w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}
