import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../lib/icons';

const HERO =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80';

export function Login() {
  const { configured, signIn, signUp, signInDemo } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (res.error) setError(res.error);
    else if ('needsConfirm' in res && res.needsConfirm)
      setInfo('Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.');
  };

  return (
    <div className="grid h-[100dvh] grid-cols-1 md:grid-cols-[minmax(0,440px)_1fr]">
      {/* Painel do formulário */}
      <div className="flex flex-col justify-center px-7 py-10 sm:px-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-1 font-serif text-[26px] font-semibold leading-tight">
            Central <span className="text-gold">Geral</span>
          </div>
          <div className="mb-8 text-[13px] text-ink-muted">
            Sua vida profissional, intelectual e pessoal — em um só lugar.
          </div>

          {!configured && (
            <div className="mb-5 rounded-sm border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-ink-muted">
              <span className="font-semibold text-warning">Modo demonstração.</span> O Supabase ainda não foi
              configurado, então o login por e-mail está desativado. Explore livremente — depois é só adicionar as
              chaves (veja o README) para ter conta e nuvem.
            </div>
          )}

          {configured && (
            <form onSubmit={submit} className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">E-mail</span>
                <input
                  className="inp"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Senha</span>
                <input
                  className="inp"
                  type="password"
                  required
                  autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              {error && <div className="text-[12.5px] text-danger">{error}</div>}
              {info && <div className="text-[12.5px] text-success">{info}</div>}

              <button className="btn btn-primary btn-block !py-3" disabled={loading}>
                {loading ? 'Um instante…' : mode === 'in' ? 'Entrar' : 'Criar conta'}
                {!loading && <Icon name="arrow" size={16} />}
              </button>

              <div className="pt-1 text-center text-[13px] text-ink-muted">
                {mode === 'in' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  type="button"
                  className="font-semibold text-accent"
                  onClick={() => {
                    setMode(mode === 'in' ? 'up' : 'in');
                    setError('');
                    setInfo('');
                  }}
                >
                  {mode === 'in' ? 'Criar agora' : 'Entrar'}
                </button>
              </div>
            </form>
          )}

          <div className={configured ? 'mt-5 border-t border-line pt-5' : ''}>
            <button className="btn btn-ghost btn-block !py-3" onClick={signInDemo}>
              <Icon name="sparkle" size={16} /> Explorar em modo demonstração
            </button>
          </div>
        </motion.div>
      </div>

      {/* Painel visual */}
      <div
        className="relative hidden overflow-hidden md:block"
        style={{ background: 'radial-gradient(120% 120% at 80% 10%, #1b2440 0%, #0b0d10 55%)' }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(11,13,16,.92) 0%, rgba(11,13,16,.55) 45%, rgba(11,13,16,.25) 100%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="absolute bottom-0 left-0 max-w-lg p-12"
        >
          <div className="eyebrow mb-3">O seu sistema operacional de vida</div>
          <p className="font-serif text-[26px] font-medium leading-snug text-ink">
            “Ordene o dia e o dia ordenará você. Cada área da vida, um módulo — reunidos num só painel.”
          </p>
          <div className="mt-6 flex gap-6 text-[13px] text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: '#6E8BFF' }} /> Profissional
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: '#C9A961' }} /> Intelectual
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: '#4ADE80' }} /> Pessoal
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
