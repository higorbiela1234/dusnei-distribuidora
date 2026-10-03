"use client"

// import React, { useState } from "react"
import { CheckCircle2, Circle } from "lucide-react"

interface ChecklistItem {
  id: string
  titulo: string
  concluido: boolean
}

interface ProcessoAdmissao {
  id: string
  candidato: string
  cargo: string
  etapas: ChecklistItem[]
}

export function AdmissaoModule() {
  const [processos, setProcessos] = useState<ProcessoAdmissao[]>([
    {
      id: "1",
      candidato: "Lucas Almeida",
      cargo: "Faturista Noturno",
      etapas: [
        { id: "e1", titulo: "Documentos Pessoais Entregues", concluido: true },
        { id: "e2", titulo: "Exame Admissional (ASO) Realizado", concluido: true },
        { id: "e3", titulo: "Integração de Segurança Realizada", concluido: false },
        { id: "e4", titulo: "Entrega de EPIs / Uniforme", concluido: false },
      ]
    }
  ])

  const toggleEtapa = (processoId: string, etapaId: string) => {
    setProcessos(processos.map((proc: any) => {
      if (proc.id === processoId) {
        const novasEtapas = proc.etapas.map((etp: any) => 
          etp.id === etapaId ? { ...etp, concluido: !etp.concluido } : etp
        )
        return { ...proc, etapas: novasEtapas }
      }
      return proc
    }))
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Checklist de Admissão</h1>
        <p className="text-sm text-slate-500">Acompanhamento das etapas de integração e documentação de novos contratados.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {processos.map((proc: any) => {
          const concluidas = proc.etapas.filter((e: any) => e.concluido).length
          const total = proc.etapas.length
          const progresso = Math.round((concluidas / total) * 100)

          return (
            <div key={proc.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{proc.candidato}</h3>
                  <p className="text-sm text-blue-600 font-medium">Cargo: {proc.cargo}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500">{progresso}% Concluído</span>
                  <div className="w-24 bg-slate-200 h-2 rounded-full mt-1 overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {proc.etapas.map((etapa: any) => (
                  <div
                    key={etapa.id}
                    onClick={() => toggleEtapa(proc.id, etapa.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      etapa.concluido 
                        ? 'bg-green-50/50 border-green-200 text-green-900' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {etapa.concluido ? (
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                    ) : (
                      <Circle className="text-slate-300 flex-shrink-0" size={20} />
                    )}
                    <span className={`text-sm font-medium ${etapa.concluido ? 'line-through text-slate-500' : ''}`}>
                      {etapa.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}