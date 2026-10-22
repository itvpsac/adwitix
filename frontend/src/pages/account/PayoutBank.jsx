import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import { me, account } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import './PayoutBank.css';

export default function PayoutBank() {
  const [mode, setMode] = useState('view');
  const [newAccount, setNewAccount] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [editError, setEditError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [party, setParty] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [ticket, setTicket] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => me.account().then((res) => { setParty(unwrap(res).party || {}); setLoaded(true); setLoadError(''); });
  const loadInitial = () => load().catch((err) => setLoadError(err.message || 'Could not load your payout account.'));
  useEffect(() => { loadInitial(); }, []);

  const last4 = (v) => (v ? String(v).slice(-4) : '');
  const pendingChange = !!party.payout_bank_pending_account_number;
  const pendingLast4 = last4(party.payout_bank_pending_account_number);
  const pendingActivatesAt = party.payout_bank_pending_activates_at
    ? new Date(party.payout_bank_pending_activates_at.replace(' ', 'T')).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'in 24 hours';

  // PayoutBankController accepts only account_number and ifsc.
  const proceedToOtp = async () => {
    if (newAccount.length < 6 || !newIfsc) { setEditError('Enter the account number and IFSC before continuing.'); return; }
    setEditError('');
    setBusy(true);
    try {
      const res = unwrap(await account.requestPayoutBankChange({ account_number: newAccount, ifsc: newIfsc }));
      setTicket(res.pending_ticket);
      setDevOtp(res.dev_otp || '');
      setMode('otp');
    } catch (err) {
      setEditError(err.message || 'Could not start the change.');
    } finally {
      setBusy(false);
    }
  };
  const cancelEdit = () => { setMode('view'); setOtp(['', '', '', '', '', '']); setOtpError(''); };
  const onOtpChange = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp]; next[i] = digit; setOtp(next); setOtpError('');
    if (digit && i < 5) document.getElementById('pb-otp-' + (i + 1))?.focus();
  };
  const onOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById('pb-otp-' + (i - 1))?.focus();
  };
  const verifyOtp = async () => {
    if (otp.join('').length !== 6) { setOtpError('Enter the complete 6-digit code.'); return; }
    setBusy(true);
    try {
      await account.confirmPayoutBankChange({ pending_ticket: ticket, otp: otp.join('') });
      await load().catch(() => {});
      setMode('done');
    } catch (err) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-page">
      <LightDashboardHeader ctas={[{ label: 'Back to Profile', to: '/profile' }]} />
      <main className="pb-main">
        <h1 className="pb-title">Payout Bank</h1>
        <p className="pb-sub">The account used for refunds and settlement payouts. Changing it requires OTP re-verification and a 24-hour cooling-off period before it becomes active.</p>

        {mode === 'view' && !loaded && (
          loadError
            ? <><p className="pb-error">{loadError}</p><button onClick={loadInitial} className="pb-btn-outline">Retry</button></>
            : <p className="pb-sub">Loading your payout account…</p>
        )}
        {mode === 'view' && loaded && (
          <>
            <div className="pb-active-card">
              <p className="pb-active-label">Active Account</p>
              <p className="pb-active-number">{party.payout_bank_account_number ? `···· ···· ${last4(party.payout_bank_account_number)}` : 'No account on file'}</p>
              <p className="pb-active-bank">{[party.payout_bank_name, party.payout_bank_ifsc].filter(Boolean).join(' · ')}</p>
            </div>
            {pendingChange && (
              <div className="pb-pending-card">
                <p className="pb-pending-title">Change pending — activates {pendingActivatesAt}</p>
                <p className="pb-pending-body">New account ending {pendingLast4} is in its 24-hour cooling-off window.</p>
              </div>
            )}
            <button onClick={() => setMode('edit')} className="pb-change-btn">Change Payout Account</button>
          </>
        )}

        {mode === 'edit' && (
          <>
            <div className="pb-form-card">
              <div className="pb-grid2">
                <div><label className="pb-label">Account Number</label><input value={newAccount} onChange={(e) => setNewAccount(e.target.value.replace(/\D/g, ''))} className="pb-input pb-input--mono" /></div>
                <div><label className="pb-label">IFSC Code</label><input value={newIfsc} onChange={(e) => setNewIfsc(e.target.value.toUpperCase())} className="pb-input pb-input--mono" style={{ textTransform: 'uppercase' }} /></div>
              </div>
            </div>
            {editError && <p className="pb-error">{editError}</p>}
            <div className="pb-btn-row">
              <button onClick={cancelEdit} className="pb-btn-outline">Cancel</button>
              <button onClick={proceedToOtp} disabled={busy} className="pb-btn-dark">{busy ? 'Sending OTP…' : 'Continue to Verify'}</button>
            </div>
          </>
        )}

        {mode === 'otp' && (
          <>
            <div className="pb-form-card">
              <p className="pb-otp-intro">To confirm this change is really you, enter the 6-digit code sent to <strong style={{ color: 'var(--color-text)' }}>{party.mobile_number || 'your registered mobile'}</strong>.</p>
              {devOtp && <p className="pb-otp-intro"><strong>Dev mode</strong> (SMS provider not yet connected): your OTP is <strong>{devOtp}</strong></p>}
              <div className="pb-otp-row">
                {otp.map((val, i) => (
                  <input key={i} id={`pb-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val} onChange={(e) => onOtpChange(i, e.target.value)} onKeyDown={(e) => onOtpKeyDown(i, e)} className="pb-otp-digit" />
                ))}
              </div>
              {otpError && <p className="pb-error">{otpError}</p>}
            </div>
            <div className="pb-btn-row">
              <button onClick={cancelEdit} className="pb-btn-outline">Cancel</button>
              <button onClick={verifyOtp} disabled={busy} className="pb-btn-gold">{busy ? 'Verifying…' : <>Verify &amp; Submit Change</>}</button>
            </div>
          </>
        )}

        {mode === 'done' && (
          <div className="pb-done">
            <div className="pb-done__icon">✓</div>
            <h2 className="pb-done__title">Change verified</h2>
            <p className="pb-done__body">Your new account is in its mandatory 24-hour cooling-off period. It activates {pendingActivatesAt}; until then, payouts continue to your current account.</p>
            <Link to="/profile" className="pb-done__cta">Back to Profile</Link>
          </div>
        )}
      </main>
    </div>
  );
}
