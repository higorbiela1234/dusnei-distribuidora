import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Pesquisar...' }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
