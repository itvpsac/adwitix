import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './PayoutBank.css';

export default function PayoutBank() {
  const [mode, setMode] = useState('view');
  const [newHolder, setNewHolder] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [editError, setEditError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [pendingChange, setPendingChange] = useState(false);
  const [pendingLast4, setPendingLast4] = useState('');
  const pendingActivatesAt = 'Aug 4, 2026, 6:12 PM';

  const proceedToOtp = () => {
    if (!newHolder || newAccount.length < 6 || !newIfsc || !newBankName) { setEditError('Please fill in all fields before continuing.'); return; }
    setEditError('');
    setMode('otp');
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
  const verifyOtp = () => {
    if (otp.join('').length !== 6) { setOtpError('Enter the complete 6-digit code.'); return; }
    setMode('done'); setPendingChange(true); setPendingLast4(newAccount.slice(-4));
  };

  return (
    <div className="pb-page">
      <LightDashboardHeader ctas={[{ label: 'Back to Profile', to: '/profile' }]} />
      <main className="pb-main">
        <h1 className="pb-title">Payout Bank</h1>
        <p className="pb-sub">The account used for refunds and settlement payouts. Changing it requires OTP re-verification and a 24-hour cooling-off period before it becomes active.</p>

        {mode === 'view' && (
          <>
            <div className="pb-active-card">
              <p className="pb-active-label">Active Account</p>
              <p className="pb-active-number">···· ···· 4821</p>
              <p className="pb-active-bank">HDFC Bank · HDFC0001234</p>
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
                <div><label className="pb-label">Account Holder Name</label><input value={newHolder} onChange={(e) => setNewHolder(e.target.value)} className="pb-input" /></div>
                <div><label className="pb-label">Account Number</label><input value={newAccount} onChange={(e) => setNewAccount(e.target.value.replace(/\D/g, ''))} className="pb-input pb-input--mono" /></div>
              </div>
              <div className="pb-grid2">
                <div><label className="pb-label">IFSC Code</label><input value={newIfsc} onChange={(e) => setNewIfsc(e.target.value.toUpperCase())} className="pb-input pb-input--mono" style={{ textTransform: 'uppercase' }} /></div>
                <div><label className="pb-label">Bank Name</label><input value={newBankName} onChange={(e) => setNewBankName(e.target.value)} className="pb-input" /></div>
              </div>
            </div>
            {editError && <p className="pb-error">{editError}</p>}
            <div className="pb-btn-row">
              <button onClick={cancelEdit} className="pb-btn-outline">Cancel</button>
              <button onClick={proceedToOtp} className="pb-btn-dark">Continue to Verify</button>
            </div>
          </>
        )}

        {mode === 'otp' && (
          <>
            <div className="pb-form-card">
              <p className="pb-otp-intro">To confirm this change is really you, enter the 6-digit code sent to <strong style={{ color: 'var(--color-text)' }}>+91 98765 43210</strong>.</p>
              <div className="pb-otp-row">
                {otp.map((val, i) => (
                  <input key={i} id={`pb-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val} onChange={(e) => onOtpChange(i, e.target.value)} onKeyDown={(e) => onOtpKeyDown(i, e)} className="pb-otp-digit" />
                ))}
              </div>
              {otpError && <p className="pb-error">{otpError}</p>}
            </div>
            <div className="pb-btn-row">
              <button onClick={cancelEdit} className="pb-btn-outline">Cancel</button>
              <button onClick={verifyOtp} className="pb-btn-gold">Verify &amp; Submit Change</button>
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
