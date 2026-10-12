import { useState } from 'react';
import './Kyc.css';
import AppHeader from '../../components/AppHeader.jsx';
import { kyc } from '../../api/endpoints.js';

const DOCS_INDIVIDUAL = [
  { key: 'pan', name: 'PAN Card', hint: 'Used for registry verification' },
  { key: 'aadhaar', name: 'Aadhaar Card', hint: 'Number is tokenized, never stored in plain text' },
  { key: 'bank', name: 'Bank Proof', hint: 'Cancelled cheque or passbook first page' },
];
const DOCS_ORG = [
  { key: 'gstin', name: 'GSTIN Certificate', hint: 'GST registration certificate' },
  { key: 'incorp', name: 'Incorporation Certificate', hint: 'Certificate of Incorporation / Partnership Deed' },
  { key: 'pan', name: 'Company PAN', hint: 'PAN card issued to the entity' },
  { key: 'signatory', name: 'Authorized Signatory ID', hint: 'PAN + Aadhaar of the signatory' },
];
const STEP_ORDER = ['entity', 'questionnaire', 'banking', 'address', 'docs', 'review', 'submitted'];
const STEP_LABELS = ['Entity Type', 'Questionnaire', 'Banking', 'Address', 'Documents', 'Review'];
const ADDABLE = ['Billing', 'Correspondence', 'Site/Yard'];

export default function Kyc() {
  const [step, setStep] = useState('entity');
  const [entityType, setEntityType] = useState('individual');
  const [docs, setDocs] = useState({});
  const [docsError, setDocsError] = useState('');
  const [addresses, setAddresses] = useState([{ kind: 'Registered', required: true, line1: '', line2: '', city: '', state: '', pin: '' }]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState('');

  const requiredDocsList = entityType === 'organization' ? DOCS_ORG : DOCS_INDIVIDUAL;
  const stepIndex = STEP_ORDER.indexOf(step);
  const isSubmitted = step === 'submitted';
  const approverLabel = entityType === 'organization' ? 'your TSX Master (Market Maker/Seller verification)' : 'your Custodian (Buyer/Trader verification)';
  const canJump = (i) => i < stepIndex && !isSubmitted && step !== 'review';

  const setAddrField = (i, field, value) => {
    const next = [...addresses];
    next[i] = { ...next[i], [field]: field === 'pin' ? value.replace(/\D/g, '').slice(0, 6) : value };
    setAddresses(next);
  };
  const addKind = (k) => setAddresses([...addresses, { kind: k, required: false, line1: '', line2: '', city: '', state: '', pin: '' }]);
  const uploadDoc = (key, file) => { if (file) setDocs({ ...docs, [key]: file.name }); setDocsError(''); };
  const removeDoc = (key) => { const next = { ...docs }; delete next[key]; setDocs(next); };
  const nextFromDocs = () => {
    if (!requiredDocsList.every((d) => docs[d.key])) { setDocsError('Please upload all required documents to continue.'); return; }
    setStep('address');
  };
  const submitKyc = () => {
    if (!consentChecked) { setConsentError('Please accept the Terms of Use to submit your KYC.'); return; }
    kyc.submit().then(() => setStep('submitted')).catch(() => setConsentError('Submission failed. Please try again.'));
  };

  return (
    <div className="kyc-page">
      <AppHeader variant="light" contextLabel="Identity Verification" backTo="/profile" backLabel="Profile" />

      <main className="kyc-main">
        <div className="kyc-steps">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="kyc-step">
              <button onClick={() => canJump(i) && setStep(STEP_ORDER[i])} className="kyc-step__btn" style={{ cursor: canJump(i) ? 'pointer' : 'default', pointerEvents: canJump(i) ? 'auto' : 'none' }}>
                <div className="kyc-step__circle" style={{ background: isSubmitted ? '#E9EBF2' : i <= stepIndex ? 'var(--color-accent)' : '#E9EBF2', color: isSubmitted ? 'var(--color-text-faint)' : i <= stepIndex ? '#fff' : 'var(--color-text-faint)' }}>{i < stepIndex ? '✓' : i + 1}</div>
                <span className="kyc-step__label" style={{ color: isSubmitted ? 'var(--color-text-faint)' : i <= stepIndex ? 'var(--color-accent)' : 'var(--color-text-faint)' }}>{label}</span>
              </button>
              {i < STEP_LABELS.length - 1 && <div className="kyc-step__line" />}
            </div>
          ))}
        </div>

        {step === 'entity' && (
          <>
            <h1 className="kyc-h1">Who are you registering as?</h1>
            <p className="kyc-p">This determines your KYC questionnaire and the documents you'll need.</p>
            <div className="kyc-grid2 kyc-entity-grid">
              <button onClick={() => setEntityType('individual')} className="kyc-entity-card" style={{ borderColor: entityType === 'individual' ? 'var(--color-accent)' : 'var(--color-border)' }}>
                <p className="kyc-entity-card__title">Individual</p>
                <p className="kyc-entity-card__body">PAN, Aadhaar, and a personal bank account.</p>
              </button>
              <button onClick={() => setEntityType('organization')} className="kyc-entity-card" style={{ borderColor: entityType === 'organization' ? 'var(--color-accent)' : 'var(--color-border)' }}>
                <p className="kyc-entity-card__title">Organization</p>
                <p className="kyc-entity-card__body">GSTIN, incorporation certificate, and authorized signatory details.</p>
              </button>
            </div>
            <button onClick={() => setStep('docs')} className="kyc-btn-dark kyc-btn-full">Continue</button>
          </>
        )}

        {step === 'questionnaire' && (
          <>
            <h1 className="kyc-h1">KYC Questionnaire</h1>
            <p className="kyc-p">Please answer the following questions to proceed.</p>
            <div style={{ padding: '40px', border: '1px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center', color: 'var(--color-text-faint)', marginBottom: '20px' }}>
              Questionnaire form will be implemented here.
            </div>
            <div className="kyc-btn-row">
              <button onClick={() => setStep('entity')} className="kyc-btn-outline">Back</button>
              <button onClick={() => setStep('banking')} className="kyc-btn-dark">Continue</button>
            </div>
          </>
        )}

        {step === 'banking' && (
          <>
            <h1 className="kyc-h1">Banking Details</h1>
            <p className="kyc-p">Please provide your banking information.</p>
            <div style={{ padding: '40px', border: '1px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center', color: 'var(--color-text-faint)', marginBottom: '20px' }}>
              Banking form will be implemented here.
            </div>
            <div className="kyc-btn-row">
              <button onClick={() => setStep('questionnaire')} className="kyc-btn-outline">Back</button>
              <button onClick={() => setStep('address')} className="kyc-btn-dark">Continue</button>
            </div>
          </>
        )}

        {step === 'docs' && (
          <>
            <h1 className="kyc-h1">Upload your documents</h1>
            <p className="kyc-p">Documents are encrypted end-to-end; Aadhaar numbers are tokenized and never stored in plain text.</p>
            <div className="kyc-docs-list">
              {requiredDocsList.map((d) => {
                const fileName = docs[d.key];
                const uploaded = !!fileName;
                return (
                  <div key={d.key} className="kyc-doc-card">
                    <div className="kyc-doc-card__head" style={{ marginBottom: uploaded ? 12 : 0 }}>
                      <div>
                        <p className="kyc-doc-card__name">{d.name}</p>
                        <p className="kyc-doc-card__hint">{d.hint}</p>
                      </div>
                      <label className="kyc-upload-btn" style={{ borderColor: uploaded ? 'var(--color-success)' : 'var(--color-border)', background: uploaded ? 'var(--color-success-bg)' : '#fff', color: uploaded ? 'var(--color-success)' : 'var(--color-text)' }}>
                        {uploaded ? 'Replace' : 'Upload'}
                        <input type="file" accept="image/*,.pdf" onChange={(e) => uploadDoc(d.key, e.target.files && e.target.files[0])} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {fileName && (
                      <div className="kyc-file-row">
                        <span>📄</span>
                        <span className="kyc-file-name">{fileName}</span>
                        <button onClick={() => removeDoc(d.key)} className="kyc-file-remove">×</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="kyc-btn-row">
              <button onClick={() => setStep('entity')} className="kyc-btn-outline">Back</button>
              <button onClick={nextFromDocs} className="kyc-btn-dark">Continue</button>
            </div>
            {docsError && <p className="kyc-error">{docsError}</p>}
          </>
        )}

        {step === 'address' && (
          <>
            <h1 className="kyc-h1">Your address portfolio</h1>
            <p className="kyc-p">Registered is mandatory. Add Billing, Correspondence, or Site/Yard if they differ.</p>
            <div className="kyc-addr-list">
              {addresses.map((a, i) => (
                <div key={a.kind} className="kyc-addr-card">
                  <div className="kyc-addr-card__head">
                    <span className="kyc-addr-kind">{a.kind}</span>
                    {a.required && <span className="kyc-addr-required">Required</span>}
                  </div>
                  <div className="kyc-grid2" style={{ marginBottom: 10 }}>
                    <input placeholder="Address Line 1" value={a.line1} onChange={(e) => setAddrField(i, 'line1', e.target.value)} className="kyc-input" />
                    <input placeholder="Address Line 2 (optional)" value={a.line2} onChange={(e) => setAddrField(i, 'line2', e.target.value)} className="kyc-input" />
                  </div>
                  <div className="kyc-grid3">
                    <input placeholder="City" value={a.city} onChange={(e) => setAddrField(i, 'city', e.target.value)} className="kyc-input" />
                    <input placeholder="State" value={a.state} onChange={(e) => setAddrField(i, 'state', e.target.value)} className="kyc-input" />
                    <input placeholder="PIN Code" inputMode="numeric" maxLength={6} value={a.pin} onChange={(e) => setAddrField(i, 'pin', e.target.value)} className="kyc-input kyc-input--mono" />
                  </div>
                </div>
              ))}
            </div>
            <div className="kyc-addable">
              {ADDABLE.filter((k) => !addresses.some((a) => a.kind === k)).map((k) => (
                <button key={k} onClick={() => addKind(k)} className="kyc-add-btn">+ Add {k}</button>
              ))}
            </div>
            <div className="kyc-btn-row">
              <button onClick={() => setStep('docs')} className="kyc-btn-outline">Back</button>
              <button onClick={() => setStep('review')} className="kyc-btn-dark">Continue to Review</button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <h1 className="kyc-h1">Review before you submit</h1>
            <p className="kyc-p">Check everything below. Once submitted, this dossier locks — no changes until {approverLabel} verifies it.</p>

            <div className="kyc-review-card">
              <div className="kyc-review-card__head"><span className="kyc-review-label">Entity Type</span><button onClick={() => setStep('entity')} className="kyc-edit-link">Edit</button></div>
              <p className="kyc-review-value">{entityType === 'organization' ? 'Organization' : 'Individual'}</p>
            </div>

            <div className="kyc-review-card">
              <div className="kyc-review-card__head"><span className="kyc-review-label">Documents</span><button onClick={() => setStep('docs')} className="kyc-edit-link">Edit</button></div>
              <div className="kyc-review-doc-list">
                {requiredDocsList.map((d) => (
                  <div key={d.key} className="kyc-review-doc-row"><span className="kyc-review-doc-name">{d.name}</span><span className="kyc-review-doc-file">{docs[d.key] || '—'}</span></div>
                ))}
              </div>
            </div>

            <div className="kyc-review-card">
              <div className="kyc-review-card__head"><span className="kyc-review-label">Address Portfolio</span><button onClick={() => setStep('address')} className="kyc-edit-link">Edit</button></div>
              <div className="kyc-review-addr-list">
                {addresses.map((a) => (
                  <div key={a.kind}>
                    <p className="kyc-review-addr-kind">{a.kind}</p>
                    <p className="kyc-review-addr-line">{a.line1}{a.line2}, {a.city}, {a.state} {a.pin}</p>
                  </div>
                ))}
              </div>
            </div>

            <label className="kyc-consent-row">
              <input type="checkbox" checked={consentChecked} onChange={() => { setConsentChecked(!consentChecked); setConsentError(''); }} className="kyc-consent-check" />
              <span>I confirm the information above is accurate and I consent to ADWITIX's Terms of Use and Privacy Policy, and to verification of these details by {approverLabel}.</span>
            </label>
            {consentError && <p className="kyc-error">{consentError}</p>}

            <div className="kyc-btn-row" style={{ marginTop: 22 }}>
              <button onClick={() => setStep('address')} className="kyc-btn-outline">Back</button>
              <button onClick={submitKyc} className="kyc-btn-gold">Submit for Review</button>
            </div>
          </>
        )}

        {step === 'submitted' && (
          <div className="kyc-done">
            <div className="kyc-done__icon">✓</div>
            <h1 className="kyc-done__title">Submitted for review</h1>
            <p className="kyc-done__body">Your compliance dossier is locked and with {approverLabel}. You'll be notified once your KYC status moves to Verified — usually within 1–2 business days.</p>
          </div>
        )}
      </main>
    </div>
  );
}
