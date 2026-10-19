import type { CourtSummons } from '../types';
import { addDays, DEMO_TODAY } from './dates';
import { TENANT } from '../../app/places';

/** SPEC linija 79: sudski poziv za Softića za "24.08. u 09:00, K-441/26". */
export function generateSoftićCourt(): CourtSummons[] {
  return [
    {
      id: 'court-0001',
      officerId: 'off-0001',
      court: `Općinski sud u ${TENANT.cityLocative}`,
      caseNumber: 'K-441/26',
      scheduledAt: `${addDays(DEMO_TODAY, 0)}T09:00`,
      status: 'nepotvrdjen',
    },
  ];
}
