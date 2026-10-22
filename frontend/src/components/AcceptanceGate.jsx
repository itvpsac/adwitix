import { useState } from 'react';
import { useAuth, isCustodian, patchStoredUser } from '../utils/auth.js';
import { legalDocs } from '../api/endpoints.js';
import { unwrap } from '../api/client.js';

// BR-51(d), D-137: when the Custodian publishes a material change to the
// Terms of Usage or Privacy Policy, every user must accept the new version
// before using the platform further. Shown over every page after sign-in
// until accepted; the documents open in a new tab to be read first. The
// server enforces the same rule on bidding, offers, pledges and listing.
export default function AcceptanceGate() {
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = (user && !isCustodian(user) && user.pendingAcceptances) || [];
  if (!pending.length) return null;

  const accept = async () => {
    setBusy(true); setError('');
    try {
      const res = unwrap(await legalDocs.accept(pending.map((d) => d.slug))) || {};
      patchStoredUser({ pendingAcceptances: res.pending || [] });
      setAgreed(false);
    } catch (e) {
      setError(e.description || e.message || 'Could not record your acceptance. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,34,51,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ag-title" style={{ width: '100%', maxWidth: 480, boxSizing: 'border-box', background: '#fff', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 24px 60px rgba(30,34,51,.3)' }}>
        <h2 id="ag-title" style={{ margin: 0, font: '700 20px var(--font-display)' }}>We&apos;ve updated our terms</h2>
        <p style={{ margin: 0, font: '500 14px/1.5 var(--font-sans)', color: 'var(--color-text-muted)' }}>Please read and accept the updated {pending.length === 1 ? 'document' : 'documents'} to keep using AdwitiX.</p>
        <ul style={{ margin: 0, paddingLeft: 18, font: '600 14px/1.8 var(--font-sans)' }}>
          {pending.map((d) => <li key={d.slug}><a href={d.path} target="_blank" rel="noreferrer">{d.title}</a> <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>(version {d.version})</span></li>)}
        </ul>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', font: '500 14px/1.45 var(--font-sans)' }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
          I have read and accept the {pending.map((d) => d.title).join(' and ')}.
        </label>
        {error && <p role="alert" style={{ margin: 0, color: 'var(--color-danger)', font: '600 13px var(--font-sans)' }}>{error}</p>}
        <button type="button" disabled={!agreed || busy} onClick={accept} style={{ height: 46, borderRadius: 100, border: 'none', background: agreed ? 'var(--color-bg-dark)' : '#E9EBF2', color: agreed ? '#fff' : 'var(--color-text-faint)', font: '700 15px var(--font-sans)', cursor: agreed ? 'pointer' : 'default' }}>{busy ? 'Saving…' : 'Accept and continue'}</button>
      </div>
    </div>
  );
}
