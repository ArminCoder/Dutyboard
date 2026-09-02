import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useCitizenActions } from '../../app/CitizenContext';
import { isValidJmb } from '../../app/citizenSession';
import { Button } from '../../components/Button';

export function PortalRegister() {
  const { register } = useCitizenActions();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [jmb, setJmb] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Unesite ime i prezime.');
    if (!isValidJmb(jmb)) return setError('JMB mora imati 13 cifara.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Unesite ispravnu e-mail adresu.');
    if (password.length < 6) return setError('Lozinka mora imati najmanje 6 znakova.');
    const err = register({ name: name.trim(), jmb: jmb.trim(), email: email.trim(), password });
    if (err) setError(err);
    else navigate('/portal');
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl text-ink-800">Registracija</h1>
        <p className="mt-1 text-sm text-ink-500">Kreirajte nalog za podnošenje zahtjeva.</p>
      </div>

      <form onSubmit={submit} className="border border-paper-200 bg-paper-0 p-6">
        <Field label="Ime i prezime">
          <input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className={inp} />
        </Field>
        <Field label="JMB">
          <input value={jmb} onChange={(e) => { setJmb(e.target.value); setError(null); }} inputMode="numeric" placeholder="13 cifara" className={inp} />
        </Field>
        <Field label="E-mail">
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} className={inp} />
        </Field>
        <Field label="Lozinka">
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} className={inp} />
        </Field>

        {error ? <div className="mb-3 border border-signal-alarm/30 bg-signal-alarm-soft px-3 py-2 text-xs text-signal-alarm">{error}</div> : null}

        <Button type="submit" variant="primary" className="w-full" icon={<UserPlus className="h-4 w-4" />}>
          Registruj se
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-500">
        Već imate nalog?{' '}
        <Link to="/portal/prijava" className="font-medium text-navy-900 underline">Prijavite se</Link>
      </p>
    </div>
  );
}

const inp = 'w-full border border-paper-300 bg-paper-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-navy-700';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-500">{label}</span>
      {children}
    </label>
  );
}
