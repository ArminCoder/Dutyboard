import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { GateScreen } from '../features/gate/GateScreen';
import { RolePickerScreen } from '../features/rolePicker/RolePickerScreen';
import { RoleHomePlaceholder } from '../features/RoleHomePlaceholder';
import { OfficerShell } from '../features/officer/OfficerShell';
import { P01Smjena } from '../features/officer/P01Smjena';
import { P02Zahtjevi } from '../features/officer/P02Zahtjevi';
import { P03Statistika } from '../features/officer/P03Statistika';
import { P04Plata } from '../features/officer/P04Plata';
import { P05Zaduzenja } from '../features/officer/P05Zaduzenja';
import { useOptionalSession } from './RoleContext';
import type { AccessRole } from '../data/types';

type Gate = 'checking' | 'open';

export function AppRoutes() {
  const [gate, setGate] = useState<Gate>('checking');

  if (gate === 'checking') {
    return <GateScreen onAuthenticated={() => setGate('open')} />;
  }

  return (
    <Routes>
      <Route path="/" element={<RolePickerScreen />} />

      <Route
        path="/policajac"
        element={
          <RequireRole roles={['policajac']}>
            <OfficerShell />
          </RequireRole>
        }
      >
        <Route index element={<P01Smjena />} />
        <Route path="zahtjevi" element={<P02Zahtjevi />} />
        <Route path="statistika" element={<P03Statistika />} />
        <Route path="plata" element={<P04Plata />} />
        <Route path="zaduzenja" element={<P05Zaduzenja />} />
      </Route>
      <Route
        path="/sef-smjene/*"
        element={
          <RequireRole roles={['sefSmjene']}>
            <RoleHomePlaceholder title="Šef smjene" />
          </RequireRole>
        }
      />
      <Route
        path="/dezurni/*"
        element={
          <RequireRole roles={['dezurni']}>
            <RoleHomePlaceholder title="Operativni centar" />
          </RequireRole>
        }
      />
      <Route
        path="/nacelnik/*"
        element={
          <RequireRole roles={['nacelnik']}>
            <RoleHomePlaceholder title="Komandna tabla PU" />
          </RequireRole>
        }
      />
      <Route
        path="/komesar/*"
        element={
          <RequireRole roles={['komesar']}>
            <RoleHomePlaceholder title="Komandna tabla Uprave policije" />
          </RequireRole>
        }
      />
      <Route
        path="/ministar/*"
        element={
          <RequireRole roles={['ministar']}>
            <RoleHomePlaceholder title="Strateška tabla" />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RequireRole({ roles, children }: { roles: AccessRole[]; children: React.ReactNode }) {
  const session = useOptionalSession();
  const loc = useLocation();
  if (!session) return <Navigate to="/" replace state={{ from: loc }} />;
  if (!roles.includes(session.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
