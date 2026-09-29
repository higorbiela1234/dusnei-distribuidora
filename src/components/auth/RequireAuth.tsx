import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';

export function RequireAuth() {
  const { session, profile, loading, configured, error, signOut } = useAuth();
  const location = useLocation();

  if (!configured) return <SetupRequired />;
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#101917] text-sm text-slate-300">Verificando sessão segura…</div>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (error || !profile) return <div className="grid min-h-screen place-items-center bg-[#101917] p-5 text-slate-100"><section className="max-w-lg rounded-xl border border-amber-400/20 bg-slate-900 p-6"><h1 className="text-lg font-semibold">Perfil sem provisionamento</h1><p className="mt-2 text-sm leading-relaxed text-slate-400">A sessão existe, mas não foi possível ler seu perfil de acesso. Confirme a migração e a criação do perfil no Supabase. O acesso não será concedido até essa validação.</p>{error && <p className="mt-3 text-xs text-amber-200">{error}</p>}<button onClick={() => void signOut()} className="mt-5 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Encerrar sessão</button></section></div>;
  if (!profile.active) return <div className="grid min-h-screen place-items-center bg-[#101917] p-5 text-slate-100"><section className="rounded-xl border border-rose-400/20 bg-slate-900 p-6"><h1 className="text-lg font-semibold">Acesso desativado</h1><p className="mt-2 text-sm text-slate-400">Solicite a liberação do seu perfil a um administrador.</p><button onClick={() => void signOut()} className="mt-5 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Encerrar sessão</button></section></div>;
  return <Outlet />;
}

function SetupRequired() {
  return <div className="grid min-h-screen place-items-center bg-[#101917] p-5 text-slate-100"><section className="max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6"><h1 className="text-xl font-semibold">Configure a conexão segura</h1><p className="mt-2 text-sm leading-relaxed text-slate-400">Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no ambiente local e aplique as migrações do Supabase. Nenhuma chave de servidor deve ser colocada no navegador.</p></section></div>;
}