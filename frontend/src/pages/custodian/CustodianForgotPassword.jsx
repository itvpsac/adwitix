import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuth } from '../../api/endpoints.js';
import './CustodianLogin.css';

// BR-04 Custodian password recovery — email-only, 3 steps against
// SuperAdminAuthApiController: forgotMpinRequest (dual-purposed as
// forgot-password) issues a pending_ticket + emails an OTP;
// forgotMpinVerify checks the OTP and returns a FRESH pending_ticket
// scoped to password setup; setNewPassword (forgot-password/complete)
// consumes that ticket to actually write the new password. Always
// responds with the same generic message whether or not the email is a
// real Custodian account, so the UI can't be used to enumerate accounts.
export default function CustodianForgotPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [pendingTicket, setPendingTicket] = useState('');
  const [offline, setOffline] = useState(false);

  const requestReset = async () => {
    if (email.length < 5) { setEmailError('Enter your Custodian account email.'); return; }
    setBusy(true); setEmailError('');
    try {
      const res = await adminAuth.forgotPassword({ email });
      setPendingTicket((res && res.pending_ticket) || '');
      setStage('verify');
    } catch (err) {
      setOffline(true); setStage('verify');
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code sent to your email.'); return; }
    if (offline) { setStage('reset'); return; }
    setBusy(true); setOtpError('');
    try {
      const res = await adminAuth.forgotPasswordVerify({ pending_ticket: pendingTicket, email_otp: otp });
      setPendingTicket((res && res.pending_ticket) || pendingTicket);
      setStage('reset');
    } catch (err) {
      setOtpError(err.status ? err.message : 'Could not reach the server. Try again.');
    } finally { setBusy(false); }
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    if (offline) { setStage('done'); return; }
    setBusy(true); setPasswordError('');
    try {
      await adminAuth.forgotPasswordComplete({ pending_ticket: pendingTicket, new_password: newPassword });
      setStage('done');
    } catch (err) {
      setPasswordError(err.status ? err.message : 'Could not reach the server. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="cul-page">
      <main className="cul-main">
        <div className="cul-brand">
          <img src="/adwitix-icon.svg" alt="" className="cul-brand__icon" />
          <span className="cul-brand__wordmark">Adwiti<span className="cul-brand__wordmark-accent">X</span> Custodian</span>
        </div>

        {stage === 'email' && (
          <>
            <h1 className="cul-title">Reset Custodian Password</h1>
            <p className="cul-desc">Enter your Custodian account email. If it belongs to a registered account, we'll send a verification code there.</p>
            <label className="cul-label">Email</label>
            <input type="email" placeholder="you@adwitix.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} className="cul-input" />
            {emailError && <p className="cul-error">{emailError}</p>}
            <button onClick={requestReset} disabled={busy}
              className={`cul-btn ${!busy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{busy ? 'Sending…' : 'Send Verification Code'}</button>
            <Link to="/custodian/login" className="cul-link" style={{ marginTop: 14 }}>Back to Sign In</Link>
          </>
        )}

        {stage === 'verify' && (
          <>
            <h1 className="cul-title">Check Your Email</h1>
            <p className="cul-desc">Enter the 6-digit code sent to <strong style={{ color: '#fff' }}>{email}</strong>.</p>
            {offline && <p className="cul-desc" style={{ color: 'var(--color-accent)' }}>Backend not reachable — continuing in local preview mode.</p>}

            <label className="cul-label">6-digit code</label>
            <input placeholder="000000" value={otp} maxLength={6}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
              className="cul-input cul-input--totp" />

            {otpError && <p className="cul-error cul-error--tight">{otpError}</p>}

            <button onClick={verifyOtp} disabled={busy}
              className={`cul-btn cul-btn--spaced ${!busy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{busy ? 'Verifying…' : 'Verify Code'}</button>
          </>
        )}

        {stage === 'reset' && (
          <>
            <h1 className="cul-title">Set a New Password</h1>
            <p className="cul-desc">Choose a new password for your Custodian account.</p>

            <label className="cul-label">New Password</label>
            <input type="password" placeholder="••••••••••" value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }} className="cul-input" />

            <label className="cul-label">Confirm New Password</label>
            <input type="password" placeholder="••••••••••" value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} className="cul-input cul-input--password" />

            {passwordError && <p className="cul-error">{passwordError}</p>}

            <button onClick={resetPassword} disabled={busy}
              className={`cul-btn ${!busy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{busy ? 'Saving…' : 'Reset Password'}</button>
          </>
        )}

        {stage === 'done' && (
          <>
            <h1 className="cul-title">Password Reset</h1>
            <p className="cul-desc">Your Custodian password has been updated. Sign in with your new password — 2FA is still required.</p>
            <button onClick={() => navigate('/custodian/login')} className="cul-btn cul-btn--active">Continue to Sign In →</button>
          </>
        )}
      </main>
    </div>
  );
}
