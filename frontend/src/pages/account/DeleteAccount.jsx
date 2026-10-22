import { useEffect, useState } from 'react';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { me, account } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import './DeleteAccount.css';

export default function DeleteAccount() {
  const [requested, setRequested] = useState(false);
  const [reason, setReason] = useState('');
  const [requestedAt, setRequestedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // A pending request shows up as party.deletion_requested_at.
  const load = () => me.account().then((res) => {
    const at = (unwrap(res).party || {}).deletion_requested_at;
    setRequested(!!at);
    setRequestedAt((at || '').slice(0, 10));
    setLoaded(true);
    setLoadError('');
  });
  const loadInitial = () => load().catch((err) => setLoadError(err.message || 'Could not load your account status.'));
  useEffect(() => { loadInitial(); }, []);

  const run = async (call) => {
    setBusy(true);
    setError('');
    try {
      await call();
      await load();
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="del-page">
      <LightDashboardHeader homeTo="/profile" />
      <main className="del-main">
        <h1 className="del-title">Delete Account</h1>
        {!loaded ? (
          loadError
            ? <><p className="del-sub" style={{ color: 'var(--color-danger)' }}>{loadError}</p><button onClick={loadInitial} className="del-cancel-btn">Retry</button></>
            : <p className="del-sub">Loading…</p>
        ) : !requested ? (
          <>
            <p className="del-sub">Requesting deletion gives you a 30-day grace period to change your mind. After 30 days, your account is archived and you can no longer log in.</p>
            <textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="del-textarea" />
            <button onClick={() => run(() => account.requestDelete({ reason: reason || undefined }))} disabled={busy} className="del-request-btn">{busy ? 'Requesting…' : 'Request Account Deletion'}</button>
          </>
        ) : (
          <>
            <div className="del-pending"><p>Deletion requested on {requestedAt} — your account will be archived 30 days from that date unless cancelled first.</p></div>
            <button onClick={() => run(async () => { await account.cancelDelete(); setReason(''); })} disabled={busy} className="del-cancel-btn">{busy ? 'Cancelling…' : 'Cancel Deletion Request'}</button>
          </>
        )}
        {error && <p className="del-sub" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </main>
    </div>
  );
}
