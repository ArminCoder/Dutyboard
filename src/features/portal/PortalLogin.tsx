import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useCitizenActions, useOptionalCitizen } from '../../app/CitizenContext';
import { Button } from '../../components/Button';

export function PortalLogin() {
  const { login } = useCitizenActions();
  const citizen = useOptionalCitizen();
  const navigate = useNavigate();
  const [jmb, setJmb] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (citizen) return <Navigate to="/portal" replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(jmb, password);
    if (err) setError(err);
    else navigate('/portal');
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl text-ink-800">Prijava</h1>
        <p className="mt-1 text-sm text-ink-500">Pristupite svojim zahtjevima za dokumente.</p>
      </div>

      <form onSubmit={submit} className="border border-paper-200 bg-paper-0 p-6">
        <Field label="JMB">
          <input
            value={jmb}
            onChange={(e) => { setJmb(e.target.value); setError(null); }}
            inputMode="numeric"
            placeholder="13 cifara"
            className="w-full border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-navy-700"
          />
        </Field>
        <Field label="Lozinka">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className="w-full border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-navy-700"
          />
        </Field>

        {error ? <div className="mb-3 border border-signal-alarm/30 bg-signal-alarm-soft px-3 py-2 text-xs text-signal-alarm">{error}</div> : null}

        <Button type="submit" variant="primary" className="w-full" icon={<LogIn className="h-4 w-4" />}>
          Prijavi se
        </Button>

        <div className="mt-4 rounded-sm bg-paper-100 px-3 py-2 text-[11px] text-ink-500">
          Demo nalog — JMB <span className="font-mono">0101990171515</span>, lozinka <span className="font-mono">demo1234</span>.
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-ink-500">
        Nemate nalog?{' '}
        <Link to="/portal/registracija" className="font-medium text-navy-900 underline">Registrujte se</Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-500">{label}</span>
      {children}
    </label>
  );
}
