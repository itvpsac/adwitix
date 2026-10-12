import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuth } from '../../api/endpoints.js';
import { establishSession } from '../../utils/auth.js';
import GoogleAuthenticatorModal from './GoogleAuthenticatorModal.jsx';
import './CustodianLogin.css';

// Custodian login redesign: mobile + mPIN is the DEFAULT, standalone
// login method; Google Authenticator (TOTP) is an equal alternative,
// offered only once enabled for that mobile number. loginMethods()
// tells the page which tab(s) to show; loginMpin()/loginTotp() are each
// a complete, independent login — neither is a "second factor" for the
// other. A failed-mPIN lockout returns {status: 'otp_required'} with a
// pending_ticket already good for the same verify→complete steps as
// the dedicated Forgot mPIN flow, so it's handled inline here.
export default function CustodianLogin() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [methodsBusy, setMethodsBusy] = useState(false);
  const [totpAvailable, setTotpAvailable] = useState(false);
  const [tab, setTab] = useState('mpin');

  const [mpin, setMpin] = useState('');
  const [mpinError, setMpinError] = useState('');
  const [mpinBusy, setMpinBusy] = useState(false);

  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpBusy, setTotpBusy] = useState(false);

  // Inline forced-reset (triggered by loginMpin's otp_required)
  const [resetOtp, setResetOtp] = useState('');
  const [resetEmailOtp, setResetEmailOtp] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetDevOtp, setResetDevOtp] = useState('');
  const [resetEmailOnFile, setResetEmailOnFile] = useState('');
  const [resetTicket, setResetTicket] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [newMpinConfirm, setNewMpinConfirm] = useState('');

  const [showGaModal, setShowGaModal] = useState(false);
  const [gaJustEnabled, setGaJustEnabled] = useState(false);

  const continueFromMobile = async () => {
    if (mobile.length !== 10) { setMobileError('Enter a valid 10-digit mobile number.'); return; }
    setMethodsBusy(true); setMobileError('');
    try {
      const res = await adminAuth.loginMethods({ mobile_number: `+91${mobile}` });
      const hasTotp = !!(res && (res.totp === true || res.totpEnabled === true || (Array.isArray(res.methods) && res.methods.includes('totp'))));
      setTotpAvailable(hasTotp);
      setTab('mpin');
      setStage('methods');
    } catch (err) {
      // Backend unreachable/unexpected — still let them try mPIN.
      setTotpAvailable(false);
      setTab('mpin');
      setStage('methods');
    } finally { setMethodsBusy(false); }
  };

  const submitMpin = async () => {
    if (mpin.length !== 4) { setMpinError('Enter your 4-digit mPIN.'); return; }
    setMpinBusy(true); setMpinError('');
    try {
      const res = await adminAuth.loginMpin({ mobile_number: `+91${mobile}`, mpin });
      
      // The API returns { status, message, data: { status, access_token, ... } }
      const loginData = res.data || res;
      
      if (loginData.access_token) {
        establishSession(loginData);
        navigate('/custodian/dashboard');
      } else if (loginData.status === 'otp_required') {
        setResetTicket(loginData.pending_ticket || '');
        setResetDevOtp(loginData.dev_otp ? String(loginData.dev_otp) : '');
        setResetEmailOnFile(loginData.email || '');
        setStage('forced_reset_verify');
      } else {
        setMpinError('Unexpected response from the server.');
      }
    } catch (err) {
      setMpinError(err.message || 'Incorrect mPIN.');
    } finally { setMpinBusy(false); }
  };

  const submitTotpLogin = async () => {
    if (totpCode.length !== 6) { setTotpError('Enter the current 6-digit code from your app.'); return; }
    setTotpBusy(true); setTotpError('');
    try {
      const res = await adminAuth.loginTotp({ mobile_number: `+91${mobile}`, totp_code: totpCode });
      if (res && res.access_token) { establishSession(res); navigate('/custodian/dashboard'); }
      else { setTotpError('Could not verify that code.'); }
    } catch (err) {
      setTotpError(err.message || 'Invalid authenticator code.');
    } finally { setTotpBusy(false); }
  };

  const verifyForcedReset = async () => {
    if (resetOtp.length !== 6) { setResetError('Enter the 6-digit code sent to your mobile.'); return; }
    setResetBusy(true); setResetError('');
    try {
      const res = await adminAuth.mpinForgotVerify({ pending_ticket: resetTicket, otp: resetOtp, email_otp: resetEmailOtp || undefined });
      setResetTicket((res && res.pending_ticket) || resetTicket);
      setStage('forced_reset_new_mpin');
    } catch (err) {
      setResetError(err.message || 'Incorrect or expired code.');
    } finally { setResetBusy(false); }
  };

  const completeForcedReset = async () => {
    if (newMpin.length !== 4) { setResetError('mPIN must be 4 digits.'); return; }
    if (newMpin !== newMpinConfirm) { setResetError('mPINs do not match.'); return; }
    setResetBusy(true); setResetError('');
    try {
      const res = await adminAuth.mpinForgotComplete({ pending_ticket: resetTicket, mpin: newMpin });
      establishSession(res);
      navigate('/custodian/dashboard');
    } catch (err) {
      setResetError(err.message || 'Could not set your new mPIN.');
    } finally { setResetBusy(false); }
  };

  const onGaEnabled = () => { setShowGaModal(false); setGaJustEnabled(true); };

  return (
    <div className="cul-page">
      <main className="cul-main">
        <div className="cul-brand">
          <img src="/adwitix-icon.svg" alt="" className="cul-brand__icon" />
          <span className="cul-brand__wordmark">Adwiti<span className="cul-brand__wordmark-accent">X</span> Custodian</span>
        </div>

        {stage === 'mobile' && (
          <>
            <h1 className="cul-title">Custodian Sign In</h1>
            <p className="cul-desc">This is a separate credential from the ordinary login every other patron uses.</p>
            {gaJustEnabled && <p className="cul-success">Google Authenticator is enabled on your account. Sign in below.</p>}

            <label className="cul-label">Mobile Number</label>
            <div className="cul-mobile-row">
              <span className="cul-mobile-prefix">+91</span>
              <input type="text" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={mobile}
                onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }} className="cul-mobile-input" />
            </div>
            {mobileError && <p className="cul-error">{mobileError}</p>}
            <button onClick={continueFromMobile} disabled={methodsBusy} className={`cul-btn ${!methodsBusy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{methodsBusy ? 'Checking…' : 'Continue'}</button>
            <button type="button" onClick={() => setShowGaModal(true)} className="cul-link" style={{ marginTop: 18 }}>Enable Google Authenticator</button>
          </>
        )}

        {stage === 'methods' && (
          <>
            <h1 className="cul-title">Sign In</h1>
            <p className="cul-desc">+91 {mobile} — <button type="button" onClick={() => setStage('mobile')} className="cul-link-inline">not you?</button></p>

            {totpAvailable && (
              <div className="cul-tabs">
                <button onClick={() => setTab('mpin')} className={`cul-tab ${tab === 'mpin' ? 'cul-tab--active' : ''}`}>mPIN</button>
                <button onClick={() => setTab('totp')} className={`cul-tab ${tab === 'totp' ? 'cul-tab--active' : ''}`}>Authenticator App</button>
              </div>
            )}

            {tab === 'mpin' && (
              <>
                <label className="cul-label">mPIN</label>
                <input type="password" inputMode="numeric" maxLength={4} placeholder="····" value={mpin}
                  onChange={(e) => { setMpin(e.target.value.replace(/\D/g, '').slice(0, 4)); setMpinError(''); }} className="cul-input" style={{ letterSpacing: 6, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 18 }} />
                {mpinError && <p className="cul-error">{mpinError}</p>}
                <button onClick={submitMpin} disabled={mpinBusy} className={`cul-btn ${!mpinBusy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{mpinBusy ? 'Signing in…' : 'Log In'}</button>
                <Link to="/custodian/forgot-mpin" className="cul-link" style={{ marginTop: 14 }}>Forgot mPIN?</Link>
              </>
            )}

            {tab === 'totp' && (
              <>
                <label className="cul-label">Authenticator Code</label>
                <input placeholder="000000" value={totpCode} maxLength={6}
                  onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError(''); }} className="cul-input cul-input--totp" />
                {totpError && <p className="cul-error">{totpError}</p>}
                <button onClick={submitTotpLogin} disabled={totpBusy} className={`cul-btn ${!totpBusy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{totpBusy ? 'Verifying…' : 'Log In'}</button>
              </>
            )}
          </>
        )}

        {stage === 'forced_reset_verify' && (
          <>
            <h1 className="cul-title">Verify It's You</h1>
            <p className="cul-desc">Too many incorrect mPIN attempts. Enter the code sent to <strong style={{ color: '#fff' }}>+91 {mobile}</strong>{resetEmailOnFile ? <> and your registered email <strong style={{ color: '#fff' }}>{resetEmailOnFile}</strong></> : ''} to reset it.</p>
            {resetDevOtp && <p className="cul-desc" style={{ color: 'var(--color-accent)' }}>Dev mode — your mobile code is <strong>{resetDevOtp}</strong></p>}

            <label className="cul-label">Mobile OTP</label>
            <input placeholder="000000" value={resetOtp} maxLength={6}
              onChange={(e) => { setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setResetError(''); }} className="cul-input cul-input--totp" />
            {resetEmailOnFile && (
              <>
                <label className="cul-label">Email OTP</label>
                <input placeholder="000000" value={resetEmailOtp} maxLength={6}
                  onChange={(e) => { setResetEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setResetError(''); }} className="cul-input cul-input--totp" />
              </>
            )}
            {resetError && <p className="cul-error">{resetError}</p>}
            <button onClick={verifyForcedReset} disabled={resetBusy} className={`cul-btn ${!resetBusy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{resetBusy ? 'Verifying…' : 'Verify'}</button>
          </>
        )}

        {stage === 'forced_reset_new_mpin' && (
          <>
            <h1 className="cul-title">Set a New mPIN</h1>
            <p className="cul-desc">Choose a new 4-digit mPIN for your Custodian account.</p>
            <label className="cul-label">New mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={newMpin}
              onChange={(e) => { setNewMpin(e.target.value.replace(/\D/g, '').slice(0, 4)); setResetError(''); }} className="cul-input cul-input--totp" />
            <label className="cul-label">Confirm mPIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={newMpinConfirm}
              onChange={(e) => { setNewMpinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setResetError(''); }} className="cul-input cul-input--totp" />
            {resetError && <p className="cul-error">{resetError}</p>}
            <button onClick={completeForcedReset} disabled={resetBusy} className={`cul-btn ${!resetBusy ? 'cul-btn--active' : 'cul-btn--disabled'}`}>{resetBusy ? 'Saving…' : 'Reset mPIN & Log In'}</button>
          </>
        )}
      </main>

      {showGaModal && <GoogleAuthenticatorModal onClose={() => setShowGaModal(false)} onEnabled={onGaEnabled} />}
    </div>
  );
}
