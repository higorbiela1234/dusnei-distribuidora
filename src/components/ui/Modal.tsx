import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';

interface ModalProps extends PropsWithChildren {
  title: string;
  onClose: () => void;
  wide?: boolean;
}

export function Modal({ title, onClose, wide = false, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:rounded-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}