import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAuth } from '../../api/endpoints.js';
import { useAuth } from '../../utils/auth.js';
import './CustodianCredentialSetup.css';

// TOTP enrollment (SuperAdminAuthApiController::setupTotp/confirmSetupTotp).
// Both routes are jwtAuth — enrolling 2FA requires an existing party
// session that already holds the super_admin DB role; it does not grant
// that role. setupTotp() returns a real secret/provisioningUri/QR (built
// server-side); confirmSetupTotp({code}) returns the real bcrypt-backed
// backup codes, shown exactly once.
export default function CustodianCredentialSetup() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [stage, setStage] = useState('start');
  const [setup, setSetup] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [saved, setSaved] = useState(false);

  const beginSetup = async () => {
    setBusy(true); setLoadError('');
    try {
      const res = await adminAuth.setupTotp();
      setSetup(res && res.setup);
      setStage('setup');
    } catch (err) {
      setLoadError(err.message || 'Could not start 2FA setup. Confirm your account already holds Custodian access.');
    } finally { setBusy(false); }
  };

  const confirmCode = async () => {
    if (code.length !== 6) { setCodeError('Enter the current 6-digit code from your app.'); return; }
    setBusy(true); setCodeError('');
    try {
      const res = await adminAuth.confirmSetupTotp({ code });
      setBackupCodes((res && res.backupCodes) || []);
      setStage('backup');
    } catch (err) {
      setCodeError(err.message || 'Invalid code — check your authenticator app and try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="ccs-page">
      <main className="ccs-main">
        <div className="ccs-logo">
          <img src="/adwitix-icon.svg" alt="" className="ccs-logo__icon" />
          <span className="ccs-logo__wordmark">Adwiti<span className="ccs-logo__wordmark-accent">X</span> Custodian</span>
        </div>

        {stage === 'start' && (
          <>
            <h1 className="ccs-h1">Set Up Custodian 2FA</h1>
            <p className="ccs-p">Custodian access requires a real second authentication factor (TOTP), separate from the ordinary mPIN login every other patron uses. You must already be signed in with an account that holds Custodian access to enroll.</p>
            {!isLoggedIn && (
              <p className="ccs-p" style={{ color: 'var(--color-accent)' }}>You're not signed in. <Link to="/custodian/login" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Sign in first</Link>, then come back here.</p>
            )}
            {loadError && <p className="ccs-error">{loadError}</p>}
            <button onClick={beginSetup} disabled={busy} className="ccs-confirm-btn" style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}>{busy ? 'Starting…' : 'Begin 2FA Setup'}</button>
          </>
        )}

        {stage === 'setup' && setup && (
          <>
            <h1 className="ccs-h1">Scan or Enter the Key</h1>
            <p className="ccs-p">Add this to Google Authenticator, Authy, or any TOTP app.</p>
            {setup.qrCodeDataUri && (
              <div className="ccs-qr-wrap"><img src={setup.qrCodeDataUri} alt="2FA setup QR code" className="ccs-qr-img" /></div>
            )}
            <div className="ccs-secret-card">
              <p className="ccs-secret-hint">Or enter this key manually:</p>
              <code className="ccs-secret-code">{setup.secret}</code>
            </div>
            <label className="ccs-label">6-digit code from your app</label>
            <input placeholder="000000" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }} maxLength={6} className="ccs-code-input" />
            {codeError && <p className="ccs-error">{codeError}</p>}
            <button onClick={confirmCode} disabled={code.length !== 6 || busy} className="ccs-confirm-btn" style={{ background: code.length === 6 ? 'var(--color-accent)' : '#3A3F55', color: code.length === 6 ? 'var(--color-text)' : 'var(--color-dark-text-muted)' }}>{busy ? 'Confirming…' : 'Confirm & Enable 2FA'}</button>
          </>
        )}

        {stage === 'backup' && (
          <>
            <h1 className="ccs-h1">Save Your Backup Codes</h1>
            <p className="ccs-p">Store these somewhere safe — each can be used once if you lose access to your authenticator app. They are shown only this one time.</p>
            <div className="ccs-backup-grid">
              {backupCodes.map((c) => <span key={c} className="ccs-backup-code">{c}</span>)}
            </div>
            <label className="ccs-saved-row">
              <input type="checkbox" checked={saved} onChange={() => setSaved(!saved)} className="ccs-saved-check" />
              <span>I've saved these codes somewhere secure.</span>
            </label>
            <button onClick={() => saved && navigate('/custodian/dashboard')} disabled={!saved} className="ccs-continue-btn" style={{ background: saved ? 'var(--color-accent)' : '#3A3F55', color: saved ? 'var(--color-text)' : 'var(--color-dark-text-muted)', border: 'none', cursor: saved ? 'pointer' : 'not-allowed' }}>Continue to Dashboard →</button>
          </>
        )}
      </main>
    </div>
  );
}
