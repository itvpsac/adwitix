import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { nowStamp, pushLedger, loadJSON, saveJSON } from '../../utils/auditLedger.js';
import '../compliance/CustodianShared.css';
import './StatutoryExport.css';

const DATASETS = ['Users', 'Lots', 'Trading Sessions', 'Disputes', 'Payouts', 'Invoices'];
const SEED_HISTORY = [
  { at: '2026-07-15 10:00', dataset: 'Users', range: '2026-06-01 to 2026-06-30', format: 'XLSX' },
  { at: '2026-07-01 09:30', dataset: 'Trading Sessions', range: '2026-05-01 to 2026-05-31', format: 'CSV' },
];

export default function StatutoryExport() {
  const [showInfo, setShowInfo] = useState(false);
  const [dataset, setDataset] = useState('Users');
  const [format, setFormat] = useState('CSV');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [history, setHistory] = useState(loadJSON('adwitix_export_history', SEED_HISTORY));
  const [justGenerated, setJustGenerated] = useState(false);

  const rangeReady = dateFrom && dateTo;
  const generate = () => {
    if (!rangeReady) return;
    const range = `${dateFrom} to ${dateTo}`;
    const entry = { at: nowStamp(), dataset, range, format };
    const next = [entry, ...history];
    saveJSON('adwitix_export_history', next);
    pushLedger('Generated Statutory Export', dataset, `${range} · ${format}`);
    setHistory(next);
    setJustGenerated(true);
  };

  return (
    <div className="custodian-page">
      <DashboardHeader navItems={[{ label: 'Dashboard', to: '/custodian/dashboard' }, { label: 'Statutory Export', to: '/statutory-export', active: true }]} />
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
              <select value={dataset} onChange={(e) => setDataset(e.target.value)}>{DATASETS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
            </label>
            <label className="se-field"><span>Format</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)}><option value="CSV">CSV</option><option value="XLSX">XLSX</option></select>
            </label>
            <label className="se-field"><span>From</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
            <label className="se-field"><span>To</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
          </div>
          <button onClick={generate} disabled={!rangeReady} className="se-generate-btn" style={{ opacity: rangeReady ? 1 : 0.5 }}>Generate Export</button>
          {justGenerated && <span className="se-confirm">✓ Export queued — appears below</span>}
        </div>

        <h2 className="custodian-decided-title" style={{ margin: '0 0 12px' }}>Export History</h2>
        <div className="se-table">
          <div className="se-row se-row--head"><span>Generated</span><span>Dataset</span><span>Range</span><span>Format</span><span></span></div>
          {history.map((h, i) => (
            <div key={i} className="se-row">
              <span className="se-cell-time">{h.at}</span>
              <span className="se-cell-dataset">{h.dataset}</span>
              <span className="se-cell-range">{h.range}</span>
              <span className="se-cell-range">{h.format}</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="se-download">Download</a>
            </div>
          ))}
        </div>
        {history.length === 0 && <div className="custodian-empty" style={{ padding: '40px 20px' }}>No exports generated yet.</div>}
      </main>
    </div>
  );
}
