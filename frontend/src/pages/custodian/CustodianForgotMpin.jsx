import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuth } from '../../api/endpoints.js';
import { establishSession } from '../../utils/auth.js';
import './CustodianLogin.css';

// Dedicated Forgot mPIN entry point (mpinForgotRequest → verify →
// complete) — same three-step shape as loginMpin's own otp_required
// lockout branch, requested fresh instead of reusing a login-issued
// ticket. Mobile OTP always required; email OTP is requested too only
// if the account has a recovery email on file (server tells us via the
// `email` field on the request response).
export default function CustodianForgotMpin() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [emailOnFile, setEmailOnFile] = useState('');
  const [pendingTicket, setPendingTicket] = useState('');

  const [otp, setOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [mpinError, setMpinError] = useState('');

  const requestReset = async () => {
    if (mobile.length !== 10) { setMobileError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true); setMobileError('');
    try {
      const res = await adminAuth.mpinForgotRequest({ mobile_number: `+91${mobile}` });
      setPendingTicket((res && res.pending_ticket) || '');
      setDevOtp(res && res.dev_otp ? String(res.dev_otp) : '');
      setEmailOnFile((res && res.email) || '');
      setStage('verify');
    } catch (err) {
      setMobileError(err.message || 'Could not start a reset for that number.');
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setVerifyError('Enter the 6-digit code sent to your mobile.'); return; }
    setBusy(true); setVerifyError('');
    try {
      const res = await adminAuth.mpinForgotVerify({ pending_ticket: pendingTicket, otp, email_otp: emailOtp || undefined });
      setPendingTicket((res && res.pending_ticket) || pendingTicket);
      setStage('reset');
    } catch (err) {
      setVerifyError(err.message || 'Incorrect or expired code.');
    } finally { setBusy(false); }
  };

  const resetMpin = async () => {
    if (mpin.length !== 4) { setMpinError('mPIN must be 4 digits.'); return; }
    if (mpin !== mpinConfirm) { setMpinError('mPINs do not match.'); return; }
    setBusy(true); setMpinError('');
    try {
      const res = await adminAuth.mpinForgotComplete({ pending_ticket: pendingTicket, mpin });
      establishSession(res);
      setStage('done');
    } catch (err) {
      setMpinError(err.message || 'Could not set your new mPIN.');
    } finally { setBusy(false); }
  };

  return (
    <div className="cul-page">
      <main className="cul-main">
        <div className="cul-brand">
          <img src="/adwitix-icon.svg" alt="" className="cul-brand__icon" />
          <span className="cul-brand__wordmark">Adwiti<span className="cul-brand__wordmark-accent">X</span> Custodian</span>
        </div>

        {stage === 'mobile' && (
          <>
            <h1 className="cul-title">Forgot Your mPIN?</h1>
            <p className="cul-desc">Enter your registered mobile number. We'll send a one-time code to verify it's you.</p>
            <label className="cul-label">Mobile Number</label>
            <div className="cul-mobile-row">
              <span className="cul-mobile-prefix">+91</span>
              <input type="text" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={mobile}
                onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }} className="cul-mobile-input" />
            </div>
            {mobileError && <p className="cul-error">{mobileError}</p>}
            <button onClick={requestReset} disabled={busy} className={`cul-btn ${!busy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{busy ? 'Sending…' : 'Send Code'}</button>
            <Link to="/custodian/login" className="cul-link" style={{ marginTop: 14 }}>Back to Sign In</Link>
          </>
        )}

        {stage === 'verify' && (
          <>
            <h1 className="cul-title">Enter the Code</h1>
            <p className="cul-desc">Enter the 6-digit code sent to <strong style={{ color: '#fff' }}>+91 {mobile}</strong>{emailOnFile ? <> and your registered email <strong style={{ color: '#fff' }}>{emailOnFile}</strong></> : ''}.</p>
            {devOtp && <p className="cul-desc" style={{ color: 'var(--color-accent)' }}>Dev mode — your mobile code is <strong>{devOtp}</strong></p>}

            <label className="cul-label">Mobile OTP</label>
            <input placeholder="000000" value={otp} maxLength={6}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }} className="cul-input cul-input--totp" />
            {emailOnFile && (
              <>
                <label className="cul-label">Email OTP</label>
                <input placeholder="000000" value={emailOtp} maxLength={6}
                  onChange={(e) => { setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }} className="cul-input cul-input--totp" />
              </>
            )}
            {verifyError && <p className="cul-error cul-error--tight">{verifyError}</p>}
            <button onClick={verifyOtp} disabled={busy} className={`cul-btn cul-btn--spaced ${!busy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{busy ? 'Verifying…' : 'Verify Code'}</button>
          </>
        )}

        {stage === 'reset' && (
          <>
            <h1 className="cul-title">Set a New mPIN</h1>
            <p className="cul-desc">Choose a new 4-digit mPIN for your Custodian account.</p>
            <label className="cul-label">New mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={mpin}
              onChange={(e) => { setMpin(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="cul-input cul-input--totp" />
            <label className="cul-label">Confirm mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={mpinConfirm}
              onChange={(e) => { setMpinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="cul-input cul-input--totp" />
            {mpinError && <p className="cul-error">{mpinError}</p>}
            <button onClick={resetMpin} disabled={busy} className={`cul-btn ${!busy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{busy ? 'Saving…' : 'Reset mPIN'}</button>
          </>
        )}

        {stage === 'done' && (
          <>
            <h1 className="cul-title">mPIN Reset</h1>
            <p className="cul-desc">Your mPIN has been updated and you're signed in.</p>
            <button onClick={() => navigate('/custodian/dashboard')} className="cul-btn cul-btn--active">Continue to Dashboard →</button>
          </>
        )}
      </main>
    </div>
  );
}
