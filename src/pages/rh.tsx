import React from 'react';
import Head from 'next/head';
import { AdmissaoModule } from '@/components/rh/AdmissaoModule';
import { AtestadosModule } from '@/components/rh/AtestadosModule';

export default function RHManagementPage() {
  return (
    <>
      <Head>
        <title>Gestão de RH - Dusnei Distribuidora</title>
      </Head>
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Recursos Humanos e DP
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Dusnei Distribuidora — Painel Administrativo de Colaboradores
            </p>
          </div>

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            <AdmissaoModule />
          </section>

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            <AtestadosModule />
          </section>
        </div>
      </main>
    </>
  );
}