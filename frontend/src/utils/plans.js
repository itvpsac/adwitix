// D-138: the TSX plan attributes (subscription_plan), shared by the
// Custodian's Plans sheet and the public Pricing page. `type` drives both
// display and editing; a null limit means unlimited.
export const PLAN_GROUPS = [
  { title: 'Price & access', rows: [
    { key: 'monthly_price_inr', label: 'Price per month', type: 'inr' },
    { key: 'api_access', label: 'API access', type: 'api', help: 'BR-66 — what the TSX can do through its API keys.' },
    { key: 'seller_pays_allowed', label: 'Seller-Pays fee option', type: 'bool', help: 'BR-32 — Market Makers may pay the Success Fee instead of the buyer.' },
    { key: 'tsx_masters_included', label: 'TSX Masters included', type: 'int' },
    { key: 'staff_roles', label: 'Staff roles', type: 'text' },
    { key: 'sso', label: 'Single sign-on', type: 'bool' },
  ] },
  { title: 'Media & storage', rows: [
    { key: 'storage_gb', label: 'Included storage', type: 'gb', help: 'All Lot photos, videos and documents of the TSX, after compression. Extra storage bought for a TSX adds to it.' },
    { key: 'max_file_mb', label: 'Largest file', type: 'mb', help: 'Never above the platform caps: 8 MB a photo, 20 MB a PDF, 500 MB a video.' },
    { key: 'images_per_lot', label: 'Photos per Lot', type: 'limit', help: 'Every Lot still needs at least 5 photos (BR-11).' },
    { key: 'videos_per_lot', label: 'Videos per Lot', type: 'limit' },
    { key: 'documents_per_lot', label: 'Documents per Lot', type: 'limit' },
  ] },
  { title: 'Data & retention', rows: [
    { key: 'data_retention_years', label: 'Data retention', type: 'years' },
    { key: 'activity_history_years', label: 'Activity history', type: 'years' },
    { key: 'audit_retention_years', label: 'Audit log retention', type: 'years' },
    { key: 'draft_retention_days', label: 'Unsubmitted drafts kept', type: 'days' },
    { key: 'deleted_recovery_days', label: 'Deleted-data recovery', type: 'days' },
    { key: 'archive_access', label: 'Archive access', type: 'bool' },
    { key: 'purge_policy', label: 'Purge policy', type: 'text' },
  ] },
  { title: 'Backup & support', rows: [
    { key: 'backup_frequency', label: 'Backups', type: 'text' },
    { key: 'restore_requests', label: 'Restore requests', type: 'text' },
  ] },
];

export const API_LABELS = { none: 'None', read: 'Read only', read_push_lots: 'Read + push Lots', full: 'Full (Lots + Trading Sessions)' };

const num = (v) => Number(v).toLocaleString('en-IN');
export function formatPlanValue(type, v) {
  if (type === 'bool') return Number(v) ? 'Yes' : 'No';
  if (type === 'api') return API_LABELS[v] || v || '—';
  if (type === 'text') return v || '—';
  if (type === 'inr') return Number(v) ? `₹${num(v)}` : 'Free';
  if (type === 'int') return v == null ? '—' : num(v);
  if (v === null || v === undefined || v === '') return 'Unlimited';
  if (type === 'gb') return Number(v) >= 1024 && Number(v) % 1024 === 0 ? `${Number(v) / 1024} TB` : `${num(v)} GB`;
  if (type === 'mb') return `${num(v)} MB`;
  if (type === 'years') return `${num(v)} year${Number(v) === 1 ? '' : 's'}`;
  if (type === 'days') return `${num(v)} day${Number(v) === 1 ? '' : 's'}`;
  return num(v);
}

export function formatBytes(b) {
  if (b == null) return '—';
  const units = [['TB', 1024 ** 4], ['GB', 1024 ** 3], ['MB', 1024 ** 2], ['KB', 1024]];
  for (const [u, n] of units) if (b >= n) return `${(b / n).toFixed(1).replace(/\.0$/, '')} ${u}`;
  return `${b} B`;
}
