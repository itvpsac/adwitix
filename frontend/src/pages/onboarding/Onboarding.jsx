import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi } from '../../api/endpoints.js';
import { establishSession } from '../../utils/auth.js';
import './Onboarding.css';

// BR-02 mPIN registration: request OTP → verify OTP (returns a
// pending_ticket) → set mPIN via /auth/mpin/complete, which issues the
// access JWT. A 3-strike mPIN lockout (login → status 'otp_required')
// verifies via /auth/login/verify-reset-otp with its own pending_ticket
// (mobile OTP, plus email OTP when a recovery email is on file).
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [loginMobile, setLoginMobile] = useState('');
  const [loginMpin, setLoginMpin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [mpinError, setMpinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingTicket, setPendingTicket] = useState('');
  // Lockout reset: ticket from /auth/login, and whether an email OTP is also required.
  const [resetTicket, setResetTicket] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [resendNote, setResendNote] = useState('');
  const isReset = !!resetTicket;
  const dashboardFor = (user) => (user && user.matrixRole === 'tsx_master' ? '/tenant-admin/dashboard' : user && user.matrixRole === 'mkt_maker' ? '/seller/dashboard' : '/buyer/dashboard');

  const barActive = 'var(--color-accent)';
  const barIdle = '#E9EBF2';
  const step0Bar = barActive;
  const step1Bar = step === 'otp' || step === 'mpin' ? barActive : barIdle;
  const step2Bar = step === 'mpin' ? barActive : barIdle;

  const submitLogin = async () => {
    if (loginMobile.length !== 10) { setLoginError('Enter a valid 10-digit mobile number.'); return; }
    if (loginMpin.length !== 4) { setLoginError('Enter your 4-digit mPIN.'); return; }
    setLoginBusy(true); setLoginError('');
    try {
      const res = await authApi.loginWithMpin(`+91${loginMobile}`, loginMpin);
      
      // Support nested data structure
      const loginData = res.data || res;
      
      if (loginData && loginData.access_token) {
        const user = establishSession(loginData);
        navigate(dashboardFor(user));
      } else if (loginData && loginData.status === 'otp_required' && loginData.pending_ticket) {
        setMobile(loginMobile);
        setResetTicket(loginData.pending_ticket);
        setResetEmail(loginData.email || '');
        setEmailOtp('');
        setOtp(['', '', '', '', '', '']);
        setOtpError('Too many incorrect mPIN attempts. Verify with the code sent to your mobile' + (loginData.email ? ' and email' : '') + ', then set a new mPIN.');
        setStep('otp');
      } else {
        setLoginError('Incorrect mobile number or mPIN.');
      }
    } catch (err) {
      setLoginError(err.status ? (err.message || 'Incorrect mobile number or mPIN.') : 'Could not reach the server. Check your connection and try again.');
    } finally { setLoginBusy(false); }
  };

  const sendOtp = async () => {
    if (mobile.length !== 10) { setMobileError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true); setMobileError('');
    try {
      await authApi.registerRequestOtp(`+91${mobile}`);
      setResetTicket(''); setResetEmail('');
      setResendNote('');
      setStep('otp');
    } catch (err) {
      setMobileError(err.status ? err.message : 'Could not reach the server. Check your connection and try again.');
    } finally { setBusy(false); }
  };
  const resendOtp = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setOtpError(''); setResendNote('');
    try {
      await authApi.registerRequestOtp(`+91${mobile}`);
      setResendNote('A new code has been sent.');
    } catch (err) {
      setOtpError(err.status ? err.message : 'Could not reach the server. Try again.');
    } finally { setBusy(false); }
  };

  const backToMobile = (e) => {
    e.preventDefault();
    setOtp(['', '', '', '', '', '']); setOtpError(''); setEmailOtp('');
    if (isReset) { setResetTicket(''); setResetEmail(''); setStep('login'); } else { setStep('mobile'); }
  };
  const onOtpChange = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp]; next[i] = digit; setOtp(next); setOtpError('');
    if (digit && i < 5) document.getElementById('ob-otp-' + (i + 1))?.focus();
  };
  const onOtpKeyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById('ob-otp-' + (i - 1))?.focus(); };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Enter the complete 6-digit code.'); return; }
    if (isReset && resetEmail && emailOtp.length !== 6) { setOtpError('Enter the 6-digit code sent to your email.'); return; }
    setBusy(true); setOtpError('');
    try {
      const res = isReset
        ? await authApi.loginVerifyResetOtp(resetTicket, code, resetEmail ? emailOtp : undefined)
        : await authApi.registerVerifyOtp(`+91${mobile}`, code);
      
      // Support nested data structure
      const data = res.data || res;
      
      if (!data || !data.pending_ticket) { setOtpError('Verification did not return a session. Please start again.'); return; }
      setPendingTicket(data.pending_ticket);
      setStep('mpin');
    } catch (err) {
      setOtpError(err.status ? err.message : 'Could not reach the server. Try again.');
    } finally { setBusy(false); }
  };

  const setMpinFinal = async () => {
    if (mpin.length !== 4) { setMpinError('mPIN must be 4 digits.'); return; }
    if (mpin !== mpinConfirm) { setMpinError('mPINs do not match.'); return; }
    setMpinError('');

    if (!pendingTicket) { setMpinError('Your verification has expired. Please start again.'); return; }

    setBusy(true);
    try {
      const res = await authApi.completeMpin(pendingTicket, mpin);
      
      // Support nested data structure
      const loginData = res.data || res;
      
      if (!loginData || !loginData.access_token) { setMpinError('Could not sign you in. Please try again.'); return; }
      const user = establishSession(loginData);
      navigate(isReset ? dashboardFor(user) : '/kyc');
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
        {step !== 'login' && <div className="ob-progress"><div className="ob-progress__bar" style={{ background: step0Bar }} /><div className="ob-progress__bar" style={{ background: step1Bar }} /><div className="ob-progress__bar" style={{ background: step2Bar }} /></div>}

        {step === 'login' && (
          <>
            <h1 className="ob-h1">Log In to ADWITIX</h1>
            <p className="ob-p">Enter your mobile number and mPIN.</p>
            <label className="ob-label">Mobile Number</label>
            <div className="ob-mobile-row">
              <span className="ob-mobile-prefix">+91</span>
              <input type="text" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={loginMobile} onChange={(e) => { setLoginMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setLoginError(''); }} className="ob-mobile-input" />
            </div>
            <label className="ob-label">mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} placeholder="····" value={loginMpin} onChange={(e) => { setLoginMpin(e.target.value.replace(/\D/g, '').slice(0, 4)); setLoginError(''); }} className="ob-mpin-input" style={{ marginBottom: 6 }} />
            <a href="/forgot-mpin" className="ob-forgot-link">Forgot mPIN?</a>
            {loginError && <p className="ob-error">{loginError}</p>}
            <button onClick={submitLogin} disabled={loginBusy} className="ob-btn-dark">{loginBusy ? 'Signing in…' : 'Log In'}</button>
            <p className="ob-terms">New to ADWITIX? <a href="#" onClick={(e) => { e.preventDefault(); setStep('mobile'); }}>Create an account</a></p>
          </>
        )}

        {step === 'mobile' && (
          <>
            <h1 className="ob-h1">Welcome to ADWITIX</h1>
            <p className="ob-p">Enter your mobile number to log in or create an account. We'll send a one-time code to verify it's you.</p>
            <label className="ob-label">Mobile Number</label>
            <div className="ob-mobile-row">
              <span className="ob-mobile-prefix">+91</span>
              <input type="text" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={mobile} onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }} className="ob-mobile-input" />
            </div>
            {mobileError && <p className="ob-error">{mobileError}</p>}
            <button onClick={sendOtp} disabled={busy} className="ob-btn-dark">{busy ? 'Sending…' : 'Send OTP'}</button>
            <p className="ob-terms">By continuing you agree to ADWITIX's Terms of Use and consent to receive an OTP via SMS.</p>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="ob-h1">Verify your number</h1>
            <p className="ob-p">Enter the 6-digit code sent to <strong style={{ color: 'var(--color-text)' }}>+91 {mobile}</strong>. <a href="#" onClick={backToMobile} className="ob-change-link">Change number</a></p>
            <div className="ob-otp-row">
              {otp.map((val, i) => (
                <input key={i} id={`ob-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val} onChange={(e) => onOtpChange(i, e.target.value)} onKeyDown={(e) => onOtpKeyDown(i, e)} className="ob-otp-digit" />
              ))}
            </div>
            {isReset && resetEmail && (
              <>
                <label className="ob-label">Email code (sent to {resetEmail})</label>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={emailOtp} onChange={(e) => { setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }} className="ob-email-otp" />
              </>
            )}
            {otpError && <p className="ob-error" style={{ marginTop: 8 }}>{otpError}</p>}
            {!isReset && <p className="ob-resend">Didn't get a code? <a href="#" onClick={resendOtp}>Resend code</a>{resendNote && ` — ${resendNote}`}</p>}
            <button onClick={verifyOtp} disabled={busy} className="ob-btn-dark">{busy ? 'Verifying…' : 'Verify & Continue'}</button>
          </>
        )}

        {step === 'mpin' && (
          <>
            <h1 className="ob-h1">Set your mPIN</h1>
            <p className="ob-p">Choose a 4-digit mPIN. You'll use it to log in quickly next time.</p>
            <label className="ob-label">New mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={mpin} onChange={(e) => { setMpin(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="ob-mpin-input" />
            <label className="ob-label">Confirm mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={mpinConfirm} onChange={(e) => { setMpinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="ob-mpin-input" style={{ marginBottom: 8 }} />
            {mpinError && <p className="ob-error">{mpinError}</p>}
            <button onClick={setMpinFinal} disabled={busy} className="ob-btn-gold">{busy ? 'Saving…' : isReset ? 'Set mPIN & Log In' : 'Continue to KYC'}</button>
          </>
        )}
      </div>
    </div>
  );
}
