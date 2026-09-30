import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserModal } from '../components/UserModal';
import { EditUserModal } from '../components/EditUserModal';

export function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'empresas' | 'unidades' | 'departamentos' | 'cargos' | 'usuarios' | 'auditoria'>('empresas');

  const [users, setUsers] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [items, setItems] = useState<any[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);

  // Estado unificado para o Modal de Estrutura
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTabData = async (tableName: string) => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && data) setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const { data } = await supabase.from('empresas').select('*');
      if (data) setEmpresasList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsers();
    } else if (activeTab === 'unidades') {
      fetchTabData('unidades');
      fetchEmpresas();
    } else if (activeTab !== 'auditoria') {
      fetchTabData(activeTab);
    }
  }, [activeTab]);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem a certeza que pretende remover o acesso deste utilizador?')) {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (!error) fetchUsers();
      else alert('Erro ao excluir utilizador: ' + error.message);
    }
  };

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    if (activeTab === 'empresas') {
      setFormData({
        razao_social: item?.razao_social || '',
        nome_fantasia: item?.nome_fantasia || '',
        cnpj: item?.cnpj || '',
        cidade: item?.cidade || '',
        estado: item?.estado || '',
        status: item?.status || 'Ativo',
        observacoes: item?.observacoes || ''
      });
    } else if (activeTab === 'unidades') {
      setFormData({
        nome: item?.nome || '',
        empresa_id: item?.empresa_id || '',
        status: item?.status || 'Ativo',
        observacoes: item?.observacoes || ''
      });
      fetchEmpresas();
    } else if (activeTab === 'departamentos') {
      setFormData({
        nome: item?.nome || '',
        codigo: item?.codigo || '',
        status: item?.status || 'Ativo',
        observacoes: item?.observacoes || ''
      });
    } else if (activeTab === 'cargos') {
      setFormData({
        nome: item?.nome || '',
        codigo: item?.codigo || '',
        departamento: item?.departamento || '',
        status: item?.status || 'Ativo',
        observacoes: item?.observacoes || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = activeTab;
    if (editingItem) {
      const { error } = await supabase.from(table).update(formData).eq('id', editingItem.id);
      if (error) alert('Erro ao atualizar: ' + error.message);
      else {
        setIsModalOpen(false);
        fetchTabData(table);
      }
    } else {
      const { error } = await supabase.from(table).insert([formData]);
      if (error) alert('Erro ao criar: ' + error.message);
      else {
        setIsModalOpen(false);
        fetchTabData(table);
      }
    }
  };

  const handleToggleStatus = async (item: any) => {
    const novoStatus = item.status === 'Inativo' ? 'Ativo' : 'Inativo';
    const { error } = await supabase.from(activeTab).update({ status: novoStatus }).eq('id', item.id);
    if (!error) fetchTabData(activeTab);
    else alert('Erro ao alterar status: ' + error.message);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Tem a certeza que pretende eliminar este registo?')) {
      const { error } = await supabase.from(activeTab).delete().eq('id', id);
      if (!error) fetchTabData(activeTab);
      else alert('Erro ao excluir: ' + error.message);
    }
  };

  return (
    <div className="p-6 text-slate-100 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-slate-400 mt-1">
          Estrutura organizacional, perfis de acesso e trilha de auditoria da Dusnei Distribuidora.
        </p>
      </div>

      <div className="flex border-b border-slate-800 mb-6 gap-6 overflow-x-auto">
        {(['empresas', 'unidades', 'departamentos', 'cargos', 'usuarios', 'auditoria'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition border-b-2 capitalize whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'usuarios' ? 'Usuários' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' ? (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Gestão de Utilizadores e Permissões</h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30 cursor-pointer">+ Novo Utilizador</button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-900/50">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Perfil</th>
                  <th className="p-4">Unidades</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-900/40">
                    <td className="p-4 font-semibold text-white">{user.full_name || user.nome || 'Sem nome'}</td>
                    <td className="p-4 uppercase text-xs text-indigo-300 font-medium">{user.role || 'viewer'}</td>
                    <td className="p-4 text-slate-400 text-xs">{user.units ? user.units.length : 0} unidades</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }} className="px-3 py-1.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded-lg text-xs font-semibold transition cursor-pointer">Editar</button>
                      <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-semibold transition cursor-pointer">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'auditoria' ? (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold mb-2 text-white">Trilha de Auditoria</h2>
          <p className="text-sm text-slate-400">Registo de atividades do sistema.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white capitalize">Gestão de {activeTab}</h2>
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition cursor-pointer">
              + Adicionar {activeTab.slice(0, -1)}
            </button>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-900/50">
                  <th className="p-4">Identificação / Detalhes</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="p-4 font-semibold text-white">
                      {item.razao_social || item.nome || 'Registo'}
                      {item.nome_fantasia && <span className="block text-xs text-slate-400 font-normal">Fantasia: {item.nome_fantasia}</span>}
                      {item.cnpj && <span className="block text-xs text-slate-400 font-normal">CNPJ: {item.cnpj}</span>}
                      {item.codigo && <span className="block text-xs text-slate-400 font-normal">Código: {item.codigo}</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'Inativo' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {item.status || 'Ativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(item)} className="px-3 py-1.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded-lg text-xs font-semibold transition cursor-pointer">Editar</button>
                      <button onClick={() => handleToggleStatus(item)} className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-semibold transition cursor-pointer">{item.status === 'Inativo' ? 'Ativar' : 'Inativar'}</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs font-semibold transition cursor-pointer">Excluir</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">Nenhum registo encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dinâmico por Aba */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 capitalize">{editingItem ? `Editar ${activeTab.slice(0, -1)}` : `Novo ${activeTab.slice(0, -1)}`}</h3>
            <form onSubmit={handleSaveItem} className="space-y-4">
              
              {activeTab === 'empresas' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Razão Social</label>
                    <input type="text" required value={formData.razao_social || ''} onChange={e => setFormData({...formData, razao_social: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome Fantasia</label>
                    <input type="text" value={formData.nome_fantasia || ''} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">CNPJ</label>
                      <input type="text" value={formData.cnpj || ''} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Estado (UF)</label>
                      <input type="text" value={formData.estado || ''} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Cidade</label>
                    <input type="text" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </>
              )}

              {activeTab === 'unidades' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Unidade (ex: 01 - Dusnei / Maringá)</label>
                    <input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Empresa Vinculada</label>
                    <select value={formData.empresa_id || ''} onChange={e => setFormData({...formData, empresa_id: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                      <option value="">Selecione uma empresa...</option>
                      {empresasList.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.razao_social || emp.nome_fantasia}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'departamentos' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Departamento</label>
                    <input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Código</label>
                    <input type="text" value={formData.codigo || ''} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </>
              )}

              {activeTab === 'cargos' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Cargo</label>
                    <input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Código</label>
                      <input type="text" value={formData.codigo || ''} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Departamento</label>
                      <input type="text" value={formData.departamento || ''} onChange={e => setFormData({...formData, departamento: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Observações</label>
                <textarea value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" rows={2}></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-medium cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { fetchUsers(); setIsCreateModalOpen(false); }} />
      <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={() => { fetchUsers(); setIsEditModalOpen(false); }} user={selectedUser} />
    </div>
  );
}