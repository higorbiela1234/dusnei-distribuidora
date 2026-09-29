import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth';

export function LoginPage() {
  const { signIn, session, configured } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!configured) return <div className="grid min-h-screen place-items-center bg-[#101917] p-5 text-slate-100"><section className="max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6"><h1 className="text-xl font-semibold">Dusnei Distribuidora</h1><p className="mt-3 text-sm leading-relaxed text-slate-400">A conexão com o Supabase ainda não está configurada. Adicione a URL e a chave pública do projeto no arquivo <code>.env.local</code> após aplicar as instruções do README.</p></section></div>;
  if (session) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email, password);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível autenticar.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="grid min-h-screen bg-[#101917] text-slate-100 lg:grid-cols-[1.1fr_0.9fr]">
    <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#14201d] p-12 lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(135deg, transparent 45%, rgba(110,231,183,.14) 45.2%, transparent 45.5%), linear-gradient(35deg, transparent 72%, rgba(245,197,124,.12) 72.2%, transparent 72.5%)' }} /><div className="relative flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300 text-emerald-950"><ShieldCheck className="h-5 w-5" /></span><span className="text-sm font-semibold">Dusnei Distribuidora</span></div><div className="relative max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Pessoas & gestão</p><h1 className="mt-4 font-[Manrope] text-4xl font-semibold leading-tight">Acesso seguro ao ambiente de RH</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">Use suas credenciais corporativas para acessar informações e processos autorizados ao seu perfil.</p></div><p className="relative text-xs text-slate-500">Developed by Higor Biela Fernandes</p></section>
    <section className="flex items-center justify-center px-5 py-12"><form onSubmit={submit} className="w-full max-w-sm space-y-5"><div className="lg:hidden"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300 text-emerald-950"><ShieldCheck className="h-5 w-5" /></span><h1 className="mt-5 text-xl font-semibold">Dusnei Distribuidora</h1></div><div><h2 className="text-2xl font-semibold">Entrar</h2><p className="mt-1 text-sm text-slate-400">Acesso restrito a usuários autorizados.</p></div><label className="block text-sm text-slate-300">E-mail<input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white focus:border-emerald-400 focus:outline-none" /></label><label className="block text-sm text-slate-300">Senha<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white focus:border-emerald-400 focus:outline-none" /></label>{error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}<button disabled={submitting} className="w-full rounded-lg bg-emerald-300 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-200 disabled:opacity-60">{submitting ? 'Autenticando…' : 'Entrar com segurança'}</button><p className="text-xs leading-relaxed text-slate-500">Contas são provisionadas pelo administrador do projeto. Não há cadastro público.</p></form></section>
  </main>;
}