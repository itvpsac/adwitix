import { useState } from 'react';
import { adminAuth } from '../../api/endpoints.js';
import './GoogleAuthenticatorModal.css';

// TOTP enrollment via the mobile-OTP entry point (setupTotpRequestOtp /
// verifyOtp / confirmSetupTotpByMobile) — no existing Custodian session
// required. Owning the registered mobile number is itself the proof;
// a narrowly-scoped pending_ticket carries the party from OTP
// verification through to confirmation.
export default function GoogleAuthenticatorModal({ onClose, onEnabled }) {
  const [stage, setStage] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [pendingTicket, setPendingTicket] = useState('');
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  const requestOtp = async () => {
    if (mobile.length !== 10) { setMobileError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true); setMobileError('');
    try {
      const res = await adminAuth.setupTotpRequestOtp({ mobile_number: `+91${mobile}` });
      setDevOtp(res && res.dev_otp ? String(res.dev_otp) : '');
      setStage('otp');
    } catch (err) {
      setMobileError(err.message || 'Could not send a code to that number.');
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code sent to your mobile.'); return; }
    setBusy(true); setOtpError('');
    try {
      const res = await adminAuth.setupTotpVerifyOtp({ mobile_number: `+91${mobile}`, otp });
      setPendingTicket((res && res.pending_ticket) || '');
      setSetup(res && res.setup);
      setStage('setup');
    } catch (err) {
      setOtpError(err.message || 'Incorrect or expired code.');
    } finally { setBusy(false); }
  };

  const confirmCode = async () => {
    if (code.length !== 6) { setCodeError('Enter the current 6-digit code from your app.'); return; }
    setBusy(true); setCodeError('');
    try {
      const res = await adminAuth.confirmSetupTotpByMobile({ pending_ticket: pendingTicket, code });
      setBackupCodes((res && res.backupCodes) || []);
      setStage('backup');
    } catch (err) {
      setCodeError(err.message || 'Invalid code — check your authenticator app and try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="gam-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gam-box">
        <button onClick={onClose} className="gam-close" aria-label="Close">×</button>

        {stage === 'mobile' && (
          <>
            <h2 className="gam-h2">Enable Google Authenticator</h2>
            <p className="gam-p">Enter your registered Custodian mobile number. We'll send a code to confirm it's you before setting up 2FA.</p>
            <label className="gam-label">Mobile Number</label>
            <div className="gam-mobile-row">
              <span className="gam-mobile-prefix">+91</span>
              <input type="text" inputMode="numeric" maxLength={10} placeholder="98765 43210" value={mobile}
                onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }} className="gam-mobile-input" />
            </div>
            {mobileError && <p className="gam-error">{mobileError}</p>}
            <button onClick={requestOtp} disabled={busy} className={`gam-btn ${!busy ? 'gam-btn--active' : 'gam-btn--disabled'}`}>{busy ? 'Sending…' : 'Send Code'}</button>
          </>
        )}

        {stage === 'otp' && (
          <>
            <h2 className="gam-h2">Verify Your Number</h2>
            <p className="gam-p">Enter the 6-digit code sent to <strong style={{ color: '#fff' }}>+91 {mobile}</strong>.</p>
            {devOtp && <p className="gam-p" style={{ color: 'var(--color-accent)' }}>Dev mode — your code is <strong>{devOtp}</strong></p>}
            <label className="gam-label">6-digit code</label>
            <input placeholder="000000" value={otp} maxLength={6}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }} className="gam-code-input" />
            {otpError && <p className="gam-error">{otpError}</p>}
            <button onClick={verifyOtp} disabled={busy} className={`gam-btn ${!busy ? 'gam-btn--active' : 'gam-btn--disabled'}`}>{busy ? 'Verifying…' : 'Verify'}</button>
          </>
        )}

        {stage === 'setup' && setup && (
          <>
            <h2 className="gam-h2">Scan This QR Code</h2>
            <p className="gam-p">Open Google Authenticator, Authy, or any TOTP app and scan — or enter the key manually.</p>
            {setup.qrCodeDataUri && (
              <div className="gam-qr-wrap"><img src={setup.qrCodeDataUri} alt="2FA setup QR code" className="gam-qr-img" /></div>
            )}
            <div className="gam-secret-card">
              <span className="gam-secret-hint">Manual key</span>
              <code className="gam-secret-code">{setup.secret}</code>
            </div>
            <label className="gam-label">6-digit code from your app</label>
            <input placeholder="000000" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }} maxLength={6} className="gam-code-input" />
            {codeError && <p className="gam-error">{codeError}</p>}
            <button onClick={confirmCode} disabled={code.length !== 6 || busy}
              className={`gam-btn ${code.length === 6 && !busy ? 'gam-btn--active' : 'gam-btn--disabled'}`}>{busy ? 'Confirming…' : 'Confirm & Enable'}</button>
          </>
        )}

        {stage === 'backup' && (
          <>
            <h2 className="gam-h2">Save Your Backup Codes</h2>
            <p className="gam-p">Each works once if you lose access to your authenticator app. Shown only this one time.</p>
            <div className="gam-backup-grid">
              {backupCodes.map((c) => <span key={c} className="gam-backup-code">{c}</span>)}
            </div>
            <button onClick={() => onEnabled && onEnabled()} className="gam-btn gam-btn--active">I've Saved These — Done</button>
          </>
        )}
      </div>
    </div>
  );
}
