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
import { K02Aktivna } from '../features/shiftCommander/K02Aktivna';
import { K03Odobrenja } from '../features/precinctCommander/K03Odobrenja';
import { K01Raspored } from '../features/precinctCommander/K01Raspored';
import { K06MojaSmjena } from '../features/shiftCommander/K06MojaSmjena';
import { K07Bilten } from '../features/shiftCommander/K07Bilten';
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
const K03Prekovremeni = lazy(() => import('../features/precinctCommander/K03Prekovremeni').then((m) => ({ default: m.K03Prekovremeni })));
const N02Analitika = lazy(() => import('../features/chief/N02Analitika').then((m) => ({ default: m.N02Analitika })));
const N03Kadar = lazy(() => import('../features/chief/N03Kadar').then((m) => ({ default: m.N03Kadar })));
const C01Operativni = lazy(() => import('../features/commissioner/C01Operativni').then((m) => ({ default: m.C01Operativni })));
const C02Uskladjenost = lazy(() => import('../features/commissioner/C02Uskladjenost').then((m) => ({ default: m.C02Uskladjenost })));
const M01Strateska = lazy(() => import('../features/minister/M01Strateska').then((m) => ({ default: m.M01Strateska })));
const M02Simulacija = lazy(() => import('../features/minister/M02Simulacija').then((m) => ({ default: m.M02Simulacija })));
const M03Budzet = lazy(() => import('../features/minister/M03Budzet').then((m) => ({ default: m.M03Budzet })));
const KddBook = lazy(() => import('../features/kdd/KddBook').then((m) => ({ default: m.KddBook })));
const K05Mapa = lazy(() => import('../features/shiftCommander/K05Mapa').then((m) => ({ default: m.K05Mapa })));
const D02Bilten = lazy(() => import('../features/dispatch/D02Bilten').then((m) => ({ default: m.D02Bilten })));
const JutarnjiBilten = lazy(() => import('../features/dispatch/JutarnjiBilten').then((m) => ({ default: m.JutarnjiBilten })));
const C03Prekovremeni = lazy(() => import('../features/commissioner/C03Prekovremeni').then((m) => ({ default: m.C03Prekovremeni })));
const C04Spremnost = lazy(() => import('../features/commissioner/C04Spremnost').then((m) => ({ default: m.C04Spremnost })));
const C05Kadrovi = lazy(() => import('../features/commissioner/C05Kadrovi').then((m) => ({ default: m.C05Kadrovi })));
const P06Izvjestaji = lazy(() => import('../features/reports/P06Izvjestaji').then((m) => ({ default: m.P06Izvjestaji })));
const P07Akademija = lazy(() => import('../features/officer/P07Akademija').then((m) => ({ default: m.P07Akademija })));
const PC03Dokumenti = lazy(() => import('../features/precinctCommander/PC03Dokumenti').then((m) => ({ default: m.PC03Dokumenti })));
const PC00Tabla = lazy(() => import('../features/precinctCommander/PC00Tabla').then((m) => ({ default: m.PC00Tabla })));
const PC01Ljudstvo = lazy(() => import('../features/precinctCommander/PC01Ljudstvo').then((m) => ({ default: m.PC01Ljudstvo })));
const PC02Oprema = lazy(() => import('../features/precinctCommander/PC02Oprema').then((m) => ({ default: m.PC02Oprema })));
const M04Resursi = lazy(() => import('../features/minister/M04Resursi').then((m) => ({ default: m.M04Resursi })));
const AdminShell = lazy(() => import('../features/admin/AdminShell').then((m) => ({ default: m.AdminShell })));
const A01Organizacija = lazy(() => import('../features/admin/A01Organizacija').then((m) => ({ default: m.A01Organizacija })));
const D01Mapa = lazy(() => import('../features/dispatch/D01Mapa').then((m) => ({ default: m.D01Mapa })));
const PortalShell = lazy(() => import('../features/portal/PortalShell').then((m) => ({ default: m.PortalShell })));
const PortalHome = lazy(() => import('../features/portal/PortalHome').then((m) => ({ default: m.PortalHome })));
const PortalLogin = lazy(() => import('../features/portal/PortalLogin').then((m) => ({ default: m.PortalLogin })));
const PortalRegister = lazy(() => import('../features/portal/PortalRegister').then((m) => ({ default: m.PortalRegister })));
const PortalNovi = lazy(() => import('../features/portal/PortalNovi').then((m) => ({ default: m.PortalNovi })));
const AdministracijaShell = lazy(() => import('../features/administracija/AdministracijaShell').then((m) => ({ default: m.AdministracijaShell })));
const AdminZahtjevi = lazy(() => import('../features/administracija/AdminZahtjevi').then((m) => ({ default: m.AdminZahtjevi })));

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
  const loc = useLocation();

  // Portal za građane je javan — nalazi se IZVAN interne kapije (pristupni ključ),
  // pa mu se pristupa i bez internog ključa (koristi vlastitu CitizenProvider prijavu).
  if (loc.pathname.startsWith('/portal')) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route path="/portal" element={<PortalShell />}>
            <Route index element={<PortalHome />} />
            <Route path="prijava" element={<PortalLogin />} />
            <Route path="registracija" element={<PortalRegister />} />
            <Route path="novi" element={<PortalNovi />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

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
          <Route path="izvjestaji" element={<P06Izvjestaji />} />
          <Route path="akademija" element={<P07Akademija />} />
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
          <Route index element={<K06MojaSmjena />} />
          <Route path="aktivna" element={<K02Aktivna />} />
          <Route path="knjiga" element={<KddBook canWrite />} />
          <Route path="mapa" element={<K05Mapa />} />
          <Route path="bilten" element={<K07Bilten />} />
        </Route>

        <Route
          path="/komandir"
          element={
            <RequireRole roles={['komandir']}>
              <ChiefShell basePath="/komandir" roleTitle="Komandir PS" showN05={false} showCommandTools />
            </RequireRole>
          }
        >
          <Route index element={<PC00Tabla />} />
          <Route path="ljudstvo" element={<PC01Ljudstvo />} />
          <Route path="raspored" element={<K01Raspored />} />
          <Route path="odobrenja" element={<K03Odobrenja />} />
          <Route path="prekovremeni" element={<K03Prekovremeni />} />
          <Route path="oprema" element={<PC02Oprema />} />
          <Route path="dokumenti" element={<PC03Dokumenti />} />
          <Route path="knjiga" element={<KddBook />} />
          <Route path="analitika" element={<N02Analitika />} />
          <Route path="kadar" element={<N03Kadar />} />
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
          <Route path="bilteni" element={<D02Bilten />} />
          <Route path="brifing" element={<JutarnjiBilten dark />} />
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
          <Route path="knjiga" element={<KddBook />} />
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
          <Route path="brifing" element={<JutarnjiBilten />} />
          <Route path="prekovremeni" element={<C03Prekovremeni />} />
          <Route path="spremnost" element={<C04Spremnost />} />
          <Route path="kadrovi" element={<C05Kadrovi />} />
          <Route path="radno-vrijeme" element={<C02Uskladjenost />} />
          <Route path="knjiga" element={<KddBook />} />
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
          <Route path="budzet" element={<M03Budzet />} />
          <Route path="resursi" element={<M04Resursi />} />
        </Route>

        <Route
          path="/administracija"
          element={
            <RequireRole roles={['administracija']}>
              <AdministracijaShell />
            </RequireRole>
          }
        >
          <Route index element={<AdminZahtjevi />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireRole roles={['admin']}>
              <AdminShell />
            </RequireRole>
          }
        >
          <Route index element={<A01Organizacija />} />
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
