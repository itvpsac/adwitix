import { useState } from 'react';
import LightDashboardHeader from '../../components/LightDashboardHeader.jsx';
import './DeleteAccount.css';

export default function DeleteAccount() {
  const [requested, setRequested] = useState(false);
  const [reason, setReason] = useState('');
  const [requestedAt, setRequestedAt] = useState('');

  return (
    <div className="del-page">
      <LightDashboardHeader homeTo="/profile" />
      <main className="del-main">
        <h1 className="del-title">Delete Account</h1>
        {!requested ? (
          <>
            <p className="del-sub">Requesting deletion gives you a 30-day grace period to change your mind. After 30 days, your account is archived and you can no longer log in.</p>
            <textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="del-textarea" />
            <button onClick={() => { setRequested(true); setRequestedAt(new Date().toISOString().slice(0, 10)); }} className="del-request-btn">Request Account Deletion</button>
          </>
        ) : (
          <>
            <div className="del-pending"><p>Deletion requested on {requestedAt} — your account will be archived 30 days from that date unless cancelled first.</p></div>
            <button onClick={() => { setRequested(false); setReason(''); }} className="del-cancel-btn">Cancel Deletion Request</button>
          </>
        )}
      </main>
    </div>
  );
}
