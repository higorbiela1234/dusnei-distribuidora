import React, { useState } from 'react';

// Definição da interface para os registos de admissão
interface AdmissaoRecord {
  id: string;
  colaboradorNome: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  status: string;
}

export function AdmissaoModule() {
  // Estado inicial vazio para garantir que nenhum dado de teste seja exibido
  const [registros, setRegistros] = useState<AdmissaoRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState('');

  // Lista vazia para funcionários (pronta para ser preenchida via API/Supabase)
  const funcionariosDisponiveis: { id: string; nome: string; cargo: string }[] = [];

  const handleSalvarAdmissao = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para salvar a admissão no backend/Supabase
    setIsModalOpen(false);
    setSelectedFuncionario('');
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão De Pessoas e DP — Admissões</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Novo Registo
        </button>
      </div>

      {/* Tabela de Registos */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm">
              <th className="p-4">Funcionário</th>
              <th className="p-4">Departamento</th>
              <th className="p-4">Cargo</th>
              <th className="p-4">Data</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  Nenhum registo de admissão encontrado.
                </td>
              </tr>
            ) : (
              registros.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="p-4">{reg.colaboradorNome}</td>
                  <td className="p-4">{reg.departamento}</td>
                  <td className="p-4">{reg.cargo}</td>
                  <td className="p-4">{reg.dataAdmissao}</td>
                  <td className="p-4">{reg.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Novo Registo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-lg p-6 rounded-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">Novo Registo - ADMISSÕES</h2>

            <form onSubmit={handleSalvarAdmissao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  FUNCIONÁRIO / COLABORADOR
                </label>
                <select
                  value={selectedFuncionario}
                  onChange={(e) => setSelectedFuncionario(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Selecione um funcionário...</option>
                  {funcionariosDisponiveis.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} — {f.cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}