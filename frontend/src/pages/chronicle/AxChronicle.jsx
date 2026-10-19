import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { chronicle as chronicleApi } from '../../api/endpoints.js';
import { saveBlob } from '../../api/client.js';
import { useApiQuery } from '../../api/hooks.js';
import './AxChronicle.css';

const money = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const FORMAT_LABEL = { easy: 'Easy Auction', express: 'Express Auction', buy_now: 'Buy-Now', tender: 'Tender' };
const OFFER_COLOR = { accepted: 'var(--color-success)' };

// GET /chronicles/:id (or /chronicle/verify/:token) → the document this screen renders.
export function toChronicleView({ chronicle: c, reportData: r }) {
  const p = r.participation || {};
  const t = r.transaction || {};
  return {
    reference: c.reference_number,
    certifiedAt: `${(c.created_at || '').slice(0, 16).replace('T', ' ')} UTC`,
    version: String(c.version),
    sessionRef: r.saleEvent.ern,
    format: FORMAT_LABEL[r.saleEvent.saleFormat] || r.saleEvent.saleFormat,
    finalPrice: money(r.result.finalPrice),
    improvementPct: r.improvement && r.improvement.improvementPercent != null ? `${r.improvement.improvementPercent.toFixed(2)}%` : '—',
    participants: p.distinctParticipants ?? 0,
    category: [r.listing.category, r.listing.subcategory].filter(Boolean).join(' › '),
    condition: r.listing.physicalCondition || '—',
    quantity: r.listing.quantity ? `${r.listing.quantity} ${r.listing.quantityBasis || ''}`.trim() : '—',
    yardLocation: r.listing.yardLocationAddress || '—',
    reserveValue: money(r.saleEvent.reserveValue),
    feePayer: t.feePayer === 'seller_pays' ? 'Market Maker' : 'Trader',
    successFee: money(t.successFeeAmount),
    tds: `${t.tdsRatePercent ?? 10}% — ${money(t.tdsAmount)}`,
    bidsCount: p.bidCount ?? 0,
    offersCount: p.offerCount ?? 0,
    verifyToken: c.verification_token,
    verifyUrl: `${window.location.origin}/chronicle-verify?token=${c.verification_token}`,
    timeline: (r.timeline || []).map((e) => ({ when: (e.occurredAt || '').slice(0, 19).replace('T', ' '), event: e.eventType })),
    offers: (p.offerProgression || []).map((o) => ({
      amount: money(o.amount), status: o.status, statusColor: OFFER_COLOR[o.status] || 'var(--color-text-faint)',
      submittedAt: (o.createdAt || '').slice(0, 19).replace('T', ' '),
    })),
  };
}

const DEMO = {
  reference: 'CHR-20260731-42C7734F', certifiedAt: '2026-07-31 19:20 UTC', version: '1',
  sessionRef: 'TEST-CHRONICLE-001', format: 'Buy-Now', finalPrice: '₹96,000.00', improvementPct: '20.00%',
  participants: 2, category: 'Machinery', condition: 'Used', quantity: '1 unit', yardLocation: 'Chronicle Test Yard',
  reserveValue: '₹80,000.00', feePayer: 'Trader', successFee: '₹1,920.00', tds: '10% — ₹9,600.00',
  bidsCount: 0, offersCount: 2, verifyUrl: 'https://verify.adwitix.com/chronicle/0fa163df672606dfb871acc1a0d0f3ba0344cc75ced6fd53',
  timeline: [
    { when: '2026-07-31 19:20:15', event: 'offer.accepted' },
    { when: '2026-07-31 19:20:15', event: 'emd.released' },
    { when: '2026-07-31 19:20:15', event: 'settlement.seller_noc_confirmed' },
    { when: '2026-07-31 19:20:15', event: 'settlement.buyer_noc_confirmed' },
    { when: '2026-07-31 19:20:15', event: 'settlement.tds_deducted' },
    { when: '2026-07-31 19:20:15', event: 'invoice.generated' },
  ],
  offers: [
    { amount: '₹90,000.00', status: 'rejected', statusColor: 'var(--color-text-faint)', submittedAt: '2026-07-31 19:20:15' },
    { amount: '₹96,000.00', status: 'accepted', statusColor: 'var(--color-success)', submittedAt: '2026-07-31 19:20:15' },
  ],
};

function Row({ label, value, strong }) {
  return <tr><td>{label}</td><td className={strong ? 'axc-td-strong' : ''}>{value}</td></tr>;
}

export default function AxChronicle() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [error, setError] = useState('');
  const { data, error: loadError } = useApiQuery(() => chronicleApi.view(id), [id], { skip: !id });
  const C = data && data.chronicle ? toChronicleView(data) : DEMO;

  const download = async () => {
    setError('');
    try {
      saveBlob(await chronicleApi.download(id), `${C.reference}.pdf`);
    } catch (err) {
      setError(err.message || 'Download failed.');
    }
  };

  if (id && loadError) {
    return <div className="axc-page"><div className="axc-doc"><p className="axc-p">{loadError.message || 'Chronicle not found.'}</p></div></div>;
  }

  return (
    <div className="axc-page">
      <div className="axc-doc">
        <div className="axc-doc__head">
          <div>
            <div className="legal-eyebrow">AdwitiX AX Chronicle</div>
            <h1 className="axc-title">Trading Session Chronicle</h1>
            <div className="axc-ref">Reference: {C.reference} · Certified {C.certifiedAt} · Version {C.version}</div>
            {id && data && <button type="button" onClick={download} className="axc-ref" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>Download certified PDF ↓</button>}
            {error && <div className="axc-ref" style={{ color: 'var(--color-danger)' }}>{error}</div>}
          </div>
          <div className="axc-qr">Scan to verify this certified record and access supporting evidence</div>
        </div>

        <h2 className="axc-h2">Opening Statement</h2>
        <p className="axc-p">This AX Certified Proceedings has been automatically generated by the ADWITIX Platform based on the information, activities, approvals and records captured during the lifecycle of the event. It presents a structured summary of the proceedings together with the associated commercial outcome, compliance status and supporting records. The report forms part of the official digital record maintained for this event.</p>

        <h2 className="axc-h2">Process &amp; Governance Statement</h2>
        <p className="axc-p">The event was conducted through a structured digital workflow using predefined business rules, role-based access controls and system-driven validations. Information contained in this report has been compiled from records captured during the course of the proceedings. Wherever applicable, complete audit logs, supporting documents and digital evidence are preserved within the ADWITIX Digital Repository and may be accessed by authorised users.</p>

        <h2 className="axc-h2">Summary</h2>
        <table className="axc-table"><tbody>
          <Row label="Trading Session Reference" value={C.sessionRef} strong />
          <Row label="Trading Format" value={C.format} />
          <Row label="Final Price" value={<span className="axc-gold">{C.finalPrice}</span>} />
          <Row label="Improvement vs. Reserve Value" value={<span className="axc-green">{C.improvementPct}</span>} />
          <tr className="axc-row-last"><td>Participants</td><td>{C.participants}</td></tr>
        </tbody></table>

        <h2 className="axc-h2">What Was Listed</h2>
        <table className="axc-table"><tbody>
          <Row label="Category" value={C.category} />
          <Row label="Condition" value={C.condition} />
          <Row label="Quantity" value={C.quantity} />
          <tr className="axc-row-last"><td>Yard Location</td><td>{C.yardLocation}</td></tr>
        </tbody></table>

        <h2 className="axc-h2">Chronological Timeline</h2>
        <div className="axc-timeline">
          <div className="axc-timeline__head"><div>When (UTC)</div><div>Event</div></div>
          {C.timeline.map((t, i) => <div key={i} className="axc-timeline__row"><div className="axc-mono">{t.when}</div><div>{t.event}</div></div>)}
        </div>

        <h2 className="axc-h2">Participation &amp; Bidding</h2>
        <table className="axc-table" style={{ marginBottom: 8 }}><tbody>
          <Row label="Participants" value={C.participants} />
          <Row label="Bids" value={C.bidsCount} />
          <Row label="Offers" value={C.offersCount} />
          <tr className="axc-row-last"><td>Identity Disclosure</td><td>Masked (Double-Blind)</td></tr>
        </tbody></table>
        <div className="axc-timeline">
          <div className="axc-offers__head"><div>Offer Amount</div><div>Status</div><div>Submitted At (UTC)</div></div>
          {C.offers.map((o, i) => (
            <div key={i} className="axc-offers__row">
              <div className="axc-cell-strong">{o.amount}</div>
              <div style={{ color: o.statusColor, fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</div>
              <div className="axc-mono">{o.submittedAt}</div>
            </div>
          ))}
        </div>

        <h2 className="axc-h2">Result &amp; Improvement</h2>
        <table className="axc-table"><tbody>
          <Row label="Reserve Value" value={C.reserveValue} />
          <tr className="axc-row-last"><td>Final Price</td><td className="axc-gold axc-td-strong">{C.finalPrice}</td></tr>
        </tbody></table>

        <h2 className="axc-h2">Transaction Summary</h2>
        <table className="axc-table"><tbody>
          <Row label="Fee Payer" value={C.feePayer} />
          <Row label="Success Fee" value={C.successFee} />
          <tr className="axc-row-last"><td>TDS</td><td>{C.tds}</td></tr>
        </tbody></table>

        <h2 className="axc-h2">Record Integrity Statement</h2>
        <p className="axc-p-faint">This report represents a factual summary of the recorded proceedings and does not alter, replace or supersede the underlying digital records. The complete chronology of events, supporting documents, media, approvals and transaction history continue to remain available within the authorised digital repository for verification, audit and future reference in accordance with applicable organisational policies and data retention requirements.</p>

        <h2 className="axc-h2">Closing Statement &amp; Disclaimer</h2>
        <p className="axc-p-faint">This report has been generated from information available within the ADWITIX Platform as on the date and time of certification. It is intended to facilitate operational review, management reporting and institutional record keeping. The report should be read together with the underlying digital records wherever detailed verification or evidentiary reference is required. Any subsequent activity or authorised update after the time of generation shall form part of a later version of the proceedings.</p>

        <div className="axc-footer">Verify this record: <Link to={C.verifyToken ? `/chronicle-verify?token=${C.verifyToken}` : '/chronicle-verify'}>{C.verifyUrl}</Link> · www.AdwitiX.com</div>
      </div>
    </div>
  );
}
