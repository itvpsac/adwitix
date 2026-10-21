import { useState } from 'react';
import ConsoleFrame from '../../components/custodian/ConsoleFrame.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import { admin } from '../../api/endpoints.js';
import { saveBlob } from '../../api/client.js';
import '../compliance/CustodianShared.css';
import './StatutoryExport.css';

// Datasets the backend can export as CSV for a date range.
const DATASETS = {
  'Audit Ledger': { fetch: (range) => admin.auditLogExport(range), file: 'audit-log' },
  'Consent Audit': { fetch: (range) => admin.consentAuditExport(range), file: 'consent-audit' },
};

export default function StatutoryExport() {
  const [showInfo, setShowInfo] = useState(false);
  const [dataset, setDataset] = useState('Audit Ledger');
  const format = 'CSV';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [history, setHistory] = useState(loadJSON('adwitix_export_history', []).filter((h) => DATASETS[h.dataset]));
  const [justGenerated, setJustGenerated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const rangeInvalid = dateFrom && dateTo && dateFrom > dateTo;
  const rangeReady = dateFrom && dateTo && !rangeInvalid;
  const download = async (ds, from, to) => {
    const blob = await DATASETS[ds].fetch({ from, to });
    saveBlob(blob, `${DATASETS[ds].file}_${from}_${to}.csv`);
  };
  const generate = async () => {
    if (!rangeReady || busy) return;
    setBusy(true);
    setError('');
    setJustGenerated(false);
    try {
      await download(dataset, dateFrom, dateTo);
      const range = `${dateFrom} to ${dateTo}`;
      const entry = { at: nowStamp(), dataset, range, format, from: dateFrom, to: dateTo };
      const next = [entry, ...history];
      saveJSON('adwitix_export_history', next);
      pushLedger('Generated Statutory Export', dataset, `${range} · ${format}`);
      setHistory(next);
      setJustGenerated(true);
    } catch (err) {
      setError(err.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConsoleFrame header={<DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Statutory Export', to: '/statutory-export', active: true }]} />}>
    <div className="custodian-page">
      <main className="custodian-main" style={{ maxWidth: 820 }}>
        <div className="legal-eyebrow">Custodian</div>
        <div className="custodian-title-row">
          <h1 className="custodian-title">Statutory Export</h1>
          <button onClick={() => setShowInfo(!showInfo)} title="Why this screen exists" className="custodian-info-btn">i</button>
        </div>
        <p className="custodian-sub" style={{ maxWidth: 600 }}>Generate data extracts for regulatory or statutory filing. Every export is itself recorded to the Audit Ledger with dataset, range, and requester.</p>
        {showInfo && (
          <div className="custodian-info-box" style={{ maxWidth: 600 }}>
            <strong>Why this screen exists:</strong> Custodians may generate dataset extracts for regulatory or statutory filing on demand. Every export is itself logged to the Audit Ledger with dataset, date range, and requester.
            <button onClick={() => setShowInfo(false)} className="custodian-info-close">Close</button>
          </div>
        )}

        <div className="se-form">
          <div className="se-fields">
            <label className="se-field"><span>Dataset</span>
              <select value={dataset} onChange={(e) => setDataset(e.target.value)}>{Object.keys(DATASETS).map((d) => <option key={d} value={d}>{d}</option>)}</select>
            </label>
            <label className="se-field"><span>Format</span>
              <select value={format} disabled><option value="CSV">CSV</option></select>
            </label>
            <label className="se-field"><span>From</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
            <label className="se-field"><span>To</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
          </div>
          <button onClick={generate} disabled={!rangeReady || busy} className="se-generate-btn" style={{ opacity: rangeReady && !busy ? 1 : 0.5 }}>{busy ? 'Generating…' : 'Generate Export'}</button>
          {justGenerated && <span className="se-confirm">✓ Export downloaded — logged below</span>}
          {rangeInvalid && <span className="se-confirm" style={{ color: 'var(--color-danger)' }}>"From" must be on or before "To".</span>}
          {error && <span className="se-confirm" style={{ color: 'var(--color-danger)' }}>{error}</span>}
        </div>

        <h2 className="custodian-decided-title" style={{ margin: '0 0 12px' }}>Export History <span style={{ fontWeight: 400, fontSize: 13 }}>(this browser — the server-side record is in the Audit Ledger)</span></h2>
        <div className="se-table">
          <div className="se-row se-row--head"><span>Generated</span><span>Dataset</span><span>Range</span><span>Format</span><span></span></div>
          {history.map((h, i) => (
            <div key={i} className="se-row">
              <span className="se-cell-time">{h.at}</span>
              <span className="se-cell-dataset">{h.dataset}</span>
              <span className="se-cell-range">{h.range}</span>
              <span className="se-cell-range">{h.format}</span>
              <a href="#" onClick={(e) => { e.preventDefault(); if (h.from && h.to) download(h.dataset, h.from, h.to).catch((err) => setError(err.message || 'Export failed.')); }} className="se-download">Download</a>
            </div>
          ))}
        </div>
        {history.length === 0 && <div className="custodian-empty" style={{ padding: '40px 20px' }}>No exports generated from this browser yet.</div>}
      </main>
    </div>
    </ConsoleFrame>
  );
}
