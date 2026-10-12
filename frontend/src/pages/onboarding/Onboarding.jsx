import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi } from '../../api/endpoints.js';
import { establishSession, loginUser } from '../../utils/auth.js';
import './Onboarding.css';

// BR-02 mPIN registration: request OTP → verify OTP (returns a
// pending_ticket) → set mPIN via /auth/mpin/complete, which issues the
// access JWT. If the backend is unreachable the flow still completes
// locally so the design stays walkable offline.
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
  const [devOtp, setDevOtp] = useState('');
  const [pendingTicket, setPendingTicket] = useState('');
  const [offline, setOffline] = useState(false);

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
        
        const dashboard = user.matrixRole === 'tsx_master' 
          ? '/tenant-admin/dashboard'
          : (user.matrixRole === 'mkt_maker'
            ? '/seller/dashboard'
            : '/buyer/dashboard');
        navigate(dashboard);
      } else if (loginData && loginData.status === 'otp_required') {
        setMobile(loginMobile);
        setStep('otp');
      } else {
        setLoginError('Incorrect mobile number or mPIN.');
      }
    } catch (err) {
      if (err.status) { setLoginError(err.message || 'Incorrect mobile number or mPIN.'); }
      else { 
        loginUser({ name: `+91 ${loginMobile}`, mobile: `+91 ${loginMobile}`, kycStatus: 'verified' });
        // Default to buyer for demo/offline
        navigate('/buyer/dashboard'); 
      }
    } finally { setLoginBusy(false); }
  };

  const sendOtp = async () => {
    if (mobile.length !== 10) { setMobileError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true); setMobileError('');
    try {
      await authApi.registerRequestOtp(`+91${mobile}`);
      setStep('otp');
    } catch (err) {
      if (err.status) { setMobileError(err.message); } else { setOffline(true); setStep('otp'); }
    } finally { setBusy(false); }
  };

  const backToMobile = (e) => { e.preventDefault(); setStep('mobile'); setOtp(['', '', '', '', '', '']); setOtpError(''); };
  const onOtpChange = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp]; next[i] = digit; setOtp(next); setOtpError('');
    if (digit && i < 5) document.getElementById('ob-otp-' + (i + 1))?.focus();
  };
  const onOtpKeyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById('ob-otp-' + (i - 1))?.focus(); };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Enter the complete 6-digit code.'); return; }
    if (offline) { setStep('mpin'); return; }
    setBusy(true); setOtpError('');
    try {
      const res = await authApi.registerVerifyOtp(`+91${mobile}`, code);
      
      // Support nested data structure
      const data = res.data || res;
      
      setPendingTicket((data && data.pending_ticket) || '');
      setStep('mpin');
    } catch (err) {
      if (err.status) { setOtpError(err.message); } else { setOffline(true); setStep('mpin'); }
    } finally { setBusy(false); }
  };

  const setMpinFinal = async () => {
    if (mpin.length !== 4) { setMpinError('mPIN must be 4 digits.'); return; }
    if (mpin !== mpinConfirm) { setMpinError('mPINs do not match.'); return; }
    setMpinError('');

    if (offline || !pendingTicket) {
      loginUser({ name: `+91 ${mobile}`, mobile: `+91 ${mobile}`, kycStatus: 'pending' });
      navigate('/kyc');
      return;
    }

    setBusy(true);
    try {
      const res = await authApi.completeMpin(pendingTicket, mpin);
      
      // Support nested data structure
      const loginData = res.data || res;
      
      establishSession(loginData);
      navigate('/kyc');
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
            {offline && <p className="ob-dev-otp">Backend not reachable — continuing in local preview mode.</p>}
            <div className="ob-otp-row">
              {otp.map((val, i) => (
                <input key={i} id={`ob-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val} onChange={(e) => onOtpChange(i, e.target.value)} onKeyDown={(e) => onOtpKeyDown(i, e)} className="ob-otp-digit" />
              ))}
            </div>
            {otpError && <p className="ob-error" style={{ marginTop: 8 }}>{otpError}</p>}
            <p className="ob-resend">Didn't get a code? Resend in 00:28</p>
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
            <button onClick={setMpinFinal} disabled={busy} className="ob-btn-gold">{busy ? 'Saving…' : 'Continue to KYC'}</button>
          </>
        )}
      </div>
    </div>
  );
}
