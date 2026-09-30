import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

const AVAILABLE_UNITS = [
  '01 - Dusnei / Maringá',
  '02 - Dusnei / Osvaldo Cruz',
  '03 - Dusnei / Cambé',
  '04 - Dusnei / Curitiba',
  '05 - Dusnei / Cascavel'
];

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('ADMINISTRATIVO');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    dashboard: true,
    funcionarios: false,
    rh: false,
    epi: false,
    diarias: false,
    crachas: false,
    relatorios: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.full_name || user.nome || '');
      setRole(user.role || 'ADMINISTRATIVO');
      setSelectedUnits(user.units || []);
      if (user.permissions) {
        setPermissions(prev => ({ ...prev, ...user.permissions }));
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleUnitToggle = (unit: string) => {
    setSelectedUnits(prev =>
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const handlePermissionToggle = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: displayName,
          role: role,
          units: selectedUnits,
          permissions: permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 text-slate-100 shadow-2xl my-8">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">Editar Utilizador: {user.email || displayName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold px-2 cursor-pointer">✕</button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Perfil de Acesso
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
              <option value="GERENTE">GERENTE</option>
              <option value="FINANCEIRO">FINANCEIRO</option>
              <option value="FATURAMENTO">FATURAMENTO</option>
              <option value="DP">DP</option>
              <option value="RH">RH</option>
              <option value="VISUALIZADOR">VISUALIZADOR</option>
              <option value="MASTER">MASTER</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Unidades Autorizadas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              {AVAILABLE_UNITS.map(unit => (
                <label key={unit} className="flex items-center space-x-2 text-sm cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedUnits.includes(unit)}
                    onChange={() => handleUnitToggle(unit)}
                    className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{unit}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Abas de Acesso e Ações
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.dashboard} onChange={() => handlePermissionToggle('dashboard')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Dashboard</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.funcionarios} onChange={() => handlePermissionToggle('funcionarios')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Funcionários</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.rh} onChange={() => handlePermissionToggle('rh')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>RH</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.epi} onChange={() => handlePermissionToggle('epi')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>EPI</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.diarias} onChange={() => handlePermissionToggle('diarias')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Diárias</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.crachas} onChange={() => handlePermissionToggle('crachas')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Crachás</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.relatorios} onChange={() => handlePermissionToggle('relatorios')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Relatórios</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.canCreate} onChange={() => handlePermissionToggle('canCreate')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Adicionar</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.canEdit} onChange={() => handlePermissionToggle('canEdit')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Editar</span>
              </label>
              <label className="flex items-center space-x-2 text-xs cursor-pointer text-slate-300">
                <input type="checkbox" checked={permissions.canDelete} onChange={() => handlePermissionToggle('canDelete')} className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Excluir</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'A atualizar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}