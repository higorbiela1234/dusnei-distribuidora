"use client"

import React, { useState } from "react"
import { Plus } from "lucide-react"

interface Atestado {
  id: string
  colaboradorNome: string
  dataEmissao: string
  quantidadeDias: number
  cid: string
  medico: string
}

export function AtestadosModule() {
  const [atestados, setAtestados] = useState<Atestado[]>([
    {
      id: "1",
      colaboradorNome: "João da Silva",
      dataEmissao: "2026-09-28",
      quantidadeDias: 3,
      cid: "J02.9",
      medico: "Dr. Carlos Alberto (CRM 12345-PR)"
    }
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [novoAtestado, setNovoAtestado] = useState({
    colaboradorNome: "",
    dataEmissao: "",
    quantidadeDias: 1,
    cid: "",
    medico: ""
  })

  const calcularRetorno = (dataEmissao: string, dias: number) => {
    if (!dataEmissao) return "-"
    const data = new Date(dataEmissao)
    data.setDate(data.getDate() + dias)
    return data.toLocaleDateString("pt-BR")
  }

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault()
    setAtestados([
      ...atestados,
      { id: Date.now().toString(), ...novoAtestado }
    ])
    setModalOpen(false)
    setNovoAtestado({ colaboradorNome: "", dataEmissao: "", quantidadeDias: 1, cid: "", medico: "" })
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Atestados</h1>
          <p className="text-sm text-slate-500">Gerenciamento de afastamentos e licenças médicas da Dusnei Distribuidora.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
        >
          <Plus size={18} /> Novo Atestado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-sm font-semibold">
              <th className="p-4">Colaborador</th>
              <th className="p-4">Data Emissão</th>
              <th className="p-4">Dias</th>
              <th className="p-4">Retorno Previsto</th>
              <th className="p-4">CID / Médico</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {atestados.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-900">{item.colaboradorNome}</td>
                <td className="p-4">{new Date(item.dataEmissao).toLocaleDateString("pt-BR")}</td>
                <td className="p-4">
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                    {item.quantidadeDias} dia(s)
                  </span>
                </td>
                <td className="p-4 font-semibold text-slate-800">
                  {calcularRetorno(item.dataEmissao, item.quantidadeDias)}
                </td>
                <td className="p-4">
                  <div className="text-slate-900 font-medium">{item.cid || "N/I"}</div>
                  <div className="text-xs text-slate-500">{item.medico}</div>
                </td>
                <td className="p-4 text-center">
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-md transition">
                    Ver Anexo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Cadastrar Novo Atestado</h2>
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Colaborador</label>
                <input
                  type="text"
                  required
                  value={novoAtestado.colaboradorNome}
                  onChange={(e) => setNovoAtestado({ ...novoAtestado, colaboradorNome: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Maria Souza"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Emissão</label>
                  <input
                    type="date"
                    required
                    value={novoAtestado.dataEmissao}
                    onChange={(e) => setNovoAtestado({ ...novoAtestado, dataEmissao: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qtd. Dias</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={novoAtestado.quantidadeDias}
                    onChange={(e) => setNovoAtestado({ ...novoAtestado, quantidadeDias: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CID</label>
                  <input
                    type="text"
                    value={novoAtestado.cid}
                    onChange={(e) => setNovoAtestado({ ...novoAtestado, cid: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                    placeholder="Ex: Z00.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Médico / CRM</label>
                  <input
                    type="text"
                    required
                    value={novoAtestado.medico}
                    onChange={(e) => setNovoAtestado({ ...novoAtestado, medico: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                    placeholder="Dr. Nome (CRM)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
                >
                  Salvar Atestado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}