import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { GateScreen } from '../features/gate/GateScreen';
import { RolePickerScreen } from '../features/rolePicker/RolePickerScreen';
import { OfficerShell } from '../features/officer/OfficerShell';
import { P01Smjena } from '../features/officer/P01Smjena';
import { P02Zahtjevi } from '../features/officer/P02Zahtjevi';
import { P04Plata } from '../features/officer/P04Plata';
import { P05Zaduzenja } from '../features/officer/P05Zaduzenja';
import { ShiftCommanderShell } from '../features/shiftCommander/ShiftCommanderShell';
import { K01Raspored } from '../features/shiftCommander/K01Raspored';
import { K02Aktivna } from '../features/shiftCommander/K02Aktivna';
import { K03Odobrenja } from '../features/shiftCommander/K03Odobrenja';
import { ChiefShell } from '../components/ChiefShell';
import { MinisterShell } from '../features/minister/MinisterShell';
import { KomesarShell } from '../features/commissioner/KomesarShell';
import { DispatchShell } from '../features/dispatch/DispatchShell';
import { N01Komandna } from '../features/chief/N01Komandna';
import { N04Oprema } from '../features/chief/N04Oprema';
import { N05Uloge } from '../features/chief/N05Uloge';
import { X01Pisarnica, X02Tajnost, X03Admin } from '../features/mockups/XScreens';
import { useOptionalSession } from './RoleContext';
import type { AccessRole } from '../data/types';

// Code-splitting: Recharts i Leaflet heavy chunks se učitavaju lazy.
const P03Statistika = lazy(() => import('../features/officer/P03Statistika').then((m) => ({ default: m.P03Statistika })));
const K03Prekovremeni = lazy(() => import('../features/shiftCommander/K03Prekovremeni').then((m) => ({ default: m.K03Prekovremeni })));
const N02Analitika = lazy(() => import('../features/chief/N02Analitika').then((m) => ({ default: m.N02Analitika })));
const N03Kadar = lazy(() => import('../features/chief/N03Kadar').then((m) => ({ default: m.N03Kadar })));
const C01Operativni = lazy(() => import('../features/commissioner/C01Operativni').then((m) => ({ default: m.C01Operativni })));
const C02Uskladjenost = lazy(() => import('../features/commissioner/C02Uskladjenost').then((m) => ({ default: m.C02Uskladjenost })));
const M01Strateska = lazy(() => import('../features/minister/M01Strateska').then((m) => ({ default: m.M01Strateska })));
const M02Simulacija = lazy(() => import('../features/minister/M02Simulacija').then((m) => ({ default: m.M02Simulacija })));
const D01Mapa = lazy(() => import('../features/dispatch/D01Mapa').then((m) => ({ default: m.D01Mapa })));

type Gate = 'checking' | 'open';

function LazyFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">
      Učitavanje…
    </div>
  );
}

export function AppRoutes() {
  const [gate, setGate] = useState<Gate>('checking');

  if (gate === 'checking') {
    return <GateScreen onAuthenticated={() => setGate('open')} />;
  }

  return (
    <Suspense fallback={<LazyFallback />}>
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
          path="/sef-smjene"
          element={
            <RequireRole roles={['sefSmjene']}>
              <ShiftCommanderShell />
            </RequireRole>
          }
        >
          <Route index element={<K01Raspored />} />
          <Route path="aktivna" element={<K02Aktivna />} />
          <Route path="odobrenja" element={<K03Odobrenja />} />
          <Route path="prekovremeni" element={<K03Prekovremeni />} />
        </Route>

        <Route
          path="/dezurni"
          element={
            <RequireRole roles={['dezurni']}>
              <DispatchShell />
            </RequireRole>
          }
        >
          <Route index element={<D01Mapa />} />
        </Route>

        <Route
          path="/nacelnik"
          element={
            <RequireRole roles={['nacelnik']}>
              <ChiefShell basePath="/nacelnik" roleTitle="Načelnik PU" />
            </RequireRole>
          }
        >
          <Route index element={<N01Komandna />} />
          <Route path="analitika" element={<N02Analitika />} />
          <Route path="kadar" element={<N03Kadar />} />
          <Route path="oprema" element={<N04Oprema />} />
          <Route path="uloge" element={<N05Uloge />} />
        </Route>

        <Route
          path="/komesar"
          element={
            <RequireRole roles={['komesar']}>
              <KomesarShell />
            </RequireRole>
          }
        >
          <Route index element={<C01Operativni />} />
          <Route path="radno-vrijeme" element={<C02Uskladjenost />} />
        </Route>

        <Route
          path="/ministar"
          element={
            <RequireRole roles={['ministar']}>
              <MinisterShell />
            </RequireRole>
          }
        >
          <Route index element={<M01Strateska />} />
          <Route path="simulacija" element={<M02Simulacija />} />
        </Route>

        <Route
          path="/mockup/pisarnica"
          element={
            <AuthedOnly>
              <X01Pisarnica />
            </AuthedOnly>
          }
        />
        <Route
          path="/mockup/tajnost"
          element={
            <AuthedOnly>
              <X02Tajnost />
            </AuthedOnly>
          }
        />
        <Route
          path="/mockup/admin"
          element={
            <AuthedOnly>
              <X03Admin />
            </AuthedOnly>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function RequireRole({ roles, children }: { roles: AccessRole[]; children: React.ReactNode }) {
  const session = useOptionalSession();
  const loc = useLocation();
  if (!session) return <Navigate to="/" replace state={{ from: loc }} />;
  if (!roles.includes(session.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthedOnly({ children }: { children: React.ReactNode }) {
  const session = useOptionalSession();
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}
