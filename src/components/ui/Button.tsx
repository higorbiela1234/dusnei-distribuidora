import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: PropsWithChildren<ButtonProps>) {
  const base = 'inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 focus:ring-slate-500 border border-slate-700',
    ghost: 'bg-transparent text-slate-200 hover:bg-slate-800 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  };
  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
