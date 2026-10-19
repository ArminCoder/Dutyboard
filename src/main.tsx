import { setTenant } from './app/tenant';
import './index.css';

// Tenant (organizacija iz pristupnog ključa) mora biti postavljen PRIJE nego što
// se učita ostatak aplikacije — nazivi, generator svijeta i karta ga čitaju pri
// učitavanju modula. Zato se aplikacija uvozi dinamički tek nakon sesije.
async function boot() {
  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = (await res.json()) as { authenticated?: boolean; label?: string; tenant?: Parameters<typeof setTenant>[1] };
    if (data.authenticated) setTenant(data.label ?? null, data.tenant);
  } catch {
    // bez servera — ostaje izmišljena demo organizacija
  }
  await import('./bootstrap');
}

void boot();
