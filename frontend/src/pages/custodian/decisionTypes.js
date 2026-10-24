// Decision Queue item types (GET /admin/decision-queue → items[].type):
// display label, one-line hint, and the existing page that handles it.
export const QUEUE_TYPES = {
  settlement: { label: 'Stalled settlements', hint: 'Payment not completed after the sale closed', page: '/alerts' },
  kyc: { label: 'KYC applications', hint: 'Identity documents to verify', page: '/kyc-queue' },
  dispute: { label: 'Disputes', hint: 'Appeals need your ruling', page: '/dispute-center' },
  aml: { label: 'AML flags', hint: 'Unusual payment or bidding patterns', page: '/aml-monitoring' },
  payout: { label: 'Payout releases', hint: 'High-value releases held for review', page: '/payout-reviews' },
  rating: { label: 'Rating changes', hint: 'Downgrades awaiting approval', page: '/rating-reviews' },
  waiver: { label: 'Media waivers', hint: 'Tenants asking to skip photo rules', page: '/media-waivers' },
  chargeback: { label: 'Chargebacks', hint: 'Card disputes against EMD forfeitures', page: '/chargeback-handling' },
  objection: { label: 'Lot fixes to review', hint: 'Sellers corrected a Lot you put on hold', page: '/custodian/lot' },
  lot: { label: 'Lots pending approval', hint: 'Approved by the tenant’s TSX Master', page: '/lot-directory' },
  seller: { label: 'Seller applications', hint: 'Approved by the tenant’s TSX Master', page: '/user-directory' },
};

// "3 days", "5 hours", "just now" from a MySQL datetime or ISO string.
export function ageLabel(since) {
  if (!since) return '—';
  const t = new Date(String(since).replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return '—';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `${days} days`;
}
