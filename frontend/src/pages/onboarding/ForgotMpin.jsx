import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { establishSession } from '../../utils/auth.js';
import '../onboarding/Onboarding.css';
import './ForgotMpin.css';

// Reset flow for returning users who've forgotten their mPIN.
// Mobile OTP, plus an email OTP only when the account has a recovery
// email on file (the response then includes `email`), verified via
// /auth/forgot-password/verify, then a new mPIN
// is set via /auth/mpin/complete (same endpoint registration uses).
export default function ForgotMpin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [otp, setOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [mpinError, setMpinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingTicket, setPendingTicket] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [notice, setNotice] = useState('');

  const requestReset = async () => {
    if (mobile.length !== 10) { setMobileError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true); setMobileError('');
    try {
      const data = unwrap(await authApi.forgotPassword(`+91${mobile}`));
      // The backend answers generically (no ticket) for unknown numbers.
      setPendingTicket(data.pending_ticket || '');
      setResetEmail(data.email || '');
      setNotice(data.message || '');
      setStep('verify');
    } catch (err) {
      setMobileError(err.status ? (err.message || 'Could not send reset codes.') : 'Could not reach the server. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  const verifyCodes = async () => {
    if (otp.length !== 6) { setVerifyError('Enter the 6-digit code sent to your mobile.'); return; }
    if (resetEmail && emailOtp.length !== 6) { setVerifyError('Enter the 6-digit code sent to your registered email.'); return; }
    if (!pendingTicket) { setVerifyError('Those codes did not match an account. Check the number and start again.'); return; }
    setBusy(true); setVerifyError('');
    try {
      const res = await authApi.forgotPasswordVerify(pendingTicket, otp, resetEmail ? emailOtp : undefined);
      const next = unwrap(res).pending_ticket;
      if (!next) { setVerifyError('Verification did not complete. Please start again.'); return; }
      setPendingTicket(next);
      setStep('reset');
    } catch (err) {
      setVerifyError(err.status ? (err.message || 'Those codes did not match.') : 'Could not reach the server. Try again.');
    } finally { setBusy(false); }
  };

  const resetMpin = async () => {
    if (mpin.length !== 4) { setMpinError('mPIN must be 4 digits.'); return; }
    if (mpin !== mpinConfirm) { setMpinError('mPINs do not match.'); return; }
    setMpinError('');

    if (!pendingTicket) { setMpinError('Your verification has expired. Please start again.'); return; }
    setBusy(true);
    try {
      const res = await authApi.completeMpin(pendingTicket, mpin);
      const data = unwrap(res);
      if (!data.access_token) { setMpinError('Could not sign you in. Please log in with your new mPIN.'); return; }
      establishSession(data);
      navigate('/profile');
    } catch (err) {
      setMpinError(err.status ? err.message : 'Could not reach the server. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="ob-shell">
      <div className="ob-card">
        <a href="/" className="ob-logo">
          <img src="/adwitix-icon.svg" alt="" className="ob-logo__icon" />
          <span className="ob-logo__wordmark">Adwiti<span className="ob-logo__wordmark-accent">X</span></span>
        </a>

        {step === 'mobile' && (
          <>
            <h1 className="ob-h1">Forgot your mPIN?</h1>
            <p className="ob-p">Enter your registered mobile number. We'll verify it's you with a code to your mobile and your registered email.</p>
            <label className="ob-label">Mobile Number</label>
            <div className="ob-mobile-row">
              <span className="ob-mobile-prefix">+91</span>
              <input type="text" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={mobile} onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }} className="ob-mobile-input" />
            </div>
            {mobileError && <p className="ob-error">{mobileError}</p>}
            <button onClick={requestReset} disabled={busy} className="ob-btn-dark">{busy ? 'Sending…' : 'Send Reset Codes'}</button>
            <p className="ob-terms"><a href="/onboarding">Back to Log In</a></p>
          </>
        )}

        {step === 'verify' && (
          <>
            <h1 className="ob-h1">Verify it's you</h1>
            <p className="ob-p">Enter the 6-digit code sent to <strong style={{ color: 'var(--color-text)' }}>+91 {mobile}</strong>{resetEmail ? <> and the code sent to <strong style={{ color: 'var(--color-text)' }}>{resetEmail}</strong></> : ''}.</p>
            {notice && <p className="ob-p">{notice}</p>}
            <label className="ob-label">Mobile OTP</label>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }} className="fm-code-input" />
            {resetEmail && <>
              <label className="ob-label">Email OTP</label>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={emailOtp} onChange={(e) => { setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }} className="fm-code-input" style={{ marginBottom: 8 }} />
            </>}
            {verifyError && <p className="ob-error">{verifyError}</p>}
            <button onClick={verifyCodes} disabled={busy} className="ob-btn-dark">{busy ? 'Verifying…' : 'Verify Codes'}</button>
          </>
        )}

        {step === 'reset' && (
          <>
            <h1 className="ob-h1">Set a new mPIN</h1>
            <p className="ob-p">Choose a new 4-digit mPIN for your account.</p>
            <label className="ob-label">New mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={mpin} onChange={(e) => { setMpin(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="ob-mpin-input" />
            <label className="ob-label">Confirm mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={mpinConfirm} onChange={(e) => { setMpinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="ob-mpin-input" style={{ marginBottom: 8 }} />
            {mpinError && <p className="ob-error">{mpinError}</p>}
            <button onClick={resetMpin} disabled={busy} className="ob-btn-gold">{busy ? 'Saving…' : 'Reset mPIN & Log In'}</button>
          </>
        )}
      </div>
    </div>
  );
}
