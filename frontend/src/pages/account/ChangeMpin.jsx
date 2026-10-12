import { useState } from 'react';
import { Link } from 'react-router-dom';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './ChangeMpin.css';

export default function ChangeMpin() {
  const [stage, setStage] = useState('request');
  const [otp, setOtp] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const devOtp = '482913';
  const valid = otp.length === 6 && newMpin.length === 4;

  return (
    <div className="cmp-page">
      <LightDashboardHeader homeTo="/profile" />
      <main className="cmp-main">
        {stage === 'request' && (
          <>
            <h1 className="cmp-title">Change mPIN</h1>
            <p className="cmp-sub">We'll send an OTP to your registered mobile to confirm this change.</p>
            <button onClick={() => setStage('confirm')} className="cmp-btn-dark">Send OTP</button>
          </>
        )}
        {stage === 'confirm' && (
          <>
            <h1 className="cmp-title">Confirm New mPIN</h1>
            <div className="cmp-devnote"><strong>Dev mode</strong> (SMS provider not yet connected): your OTP is <strong>{devOtp}</strong></div>
            <label className="cmp-label">6-digit OTP</label>
            <input placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} className="cmp-input cmp-input--otp" />
            <label className="cmp-label">New 4-digit mPIN</label>
            <input type="password" placeholder="····" value={newMpin} onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} className="cmp-input cmp-input--pin" />
            <button onClick={() => { if (valid) setStage('done'); }} disabled={!valid} className="cmp-btn-dark" style={{ background: valid ? 'var(--color-bg-dark)' : '#E9EBF2', color: valid ? '#fff' : 'var(--color-text-faint)' }}>Confirm</button>
          </>
        )}
        {stage === 'done' && (
          <div className="cmp-success">
            <div className="cmp-success__title">mPIN Updated</div>
            <p className="cmp-success__body">Use your new mPIN the next time you log in.</p>
            <Link to="/profile" className="cmp-success__cta">Back to Profile →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
