import { useEffect, useState } from 'react';
import './Kyc.css';
import AppHeader from '../../components/AppHeader.jsx';
import { kyc } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';

// Keys are KycService document types; `required` mirrors its REQUIRED_DOCUMENTS.
const DOCS_INDIVIDUAL = [
  { key: 'pan_card', name: 'PAN Card', hint: 'Used for registry verification', required: true },
  { key: 'aadhaar_card', name: 'Aadhaar Card', hint: 'Number is tokenized, never stored in plain text', required: true },
  { key: 'cancelled_cheque', name: 'Bank Proof', hint: 'Cancelled cheque or passbook first page (optional)', required: false },
];
const DOCS_ORG = [
  { key: 'gst_certificate', name: 'GSTIN Certificate', hint: 'GST registration certificate', required: true },
  { key: 'certificate_of_incorporation', name: 'Incorporation Certificate', hint: 'Certificate of Incorporation / Partnership Deed', required: true },
  { key: 'pan_card', name: 'Company PAN', hint: 'PAN card issued to the entity', required: true },
  { key: 'cancelled_cheque', name: 'Cancelled Cheque', hint: 'From the company bank account', required: true },
  { key: 'board_resolution', name: 'Authorized Signatory Resolution', hint: 'Board resolution or power of attorney (optional)', required: false },
];
const STEP_ORDER = ['entity', 'questionnaire', 'banking', 'address', 'docs', 'review', 'submitted'];
const STEP_LABELS = ['Entity Type', 'Questionnaire', 'Banking', 'Address', 'Documents', 'Review'];
const ADDABLE = ['Billing', 'Correspondence', 'Site/Yard'];
const ADDRESS_TYPE = { Registered: 'registered', Billing: 'billing', Correspondence: 'correspondence', 'Site/Yard': 'site_yard' };
const ADDRESS_KIND = Object.fromEntries(Object.entries(ADDRESS_TYPE).map(([k, v]) => [v, k]));
const QUESTIONS = {
  individual: [
    { key: 'full_name', label: 'Full Name (as on PAN)' },
    { key: 'pan', label: 'PAN', mono: true, upper: true, placeholder: 'ABCDE1234F' },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { key: 'occupation', label: 'Occupation' },
    { key: 'aadhaar', label: 'Aadhaar Number (optional)', mono: true, placeholder: '12 digits — stored masked' },
  ],
  organization: [
    { key: 'org_cin', label: 'CIN', mono: true, upper: true },
    { key: 'org_gstin', label: 'GSTIN', mono: true, upper: true },
    { key: 'org_pan', label: 'Company PAN', mono: true, upper: true },
    { key: 'org_company_type', label: 'Company Type', placeholder: 'e.g. Private Limited' },
    { key: 'org_industry', label: 'Industry' },
    { key: 'org_msme_registration', label: 'MSME Registration (optional)' },
    { key: 'org_udyam_number', label: 'Udyam Number (optional)' },
    { key: 'org_annual_turnover', label: 'Annual Turnover ₹ (optional)', type: 'number' },
    { key: 'org_employee_count', label: 'Employee Count (optional)', type: 'number' },
  ],
};
const BANK_FIELDS = [
  { key: 'account_holder_name', label: 'Account Holder Name' },
  { key: 'bank_name', label: 'Bank Name' },
  { key: 'account_number', label: 'Account Number', mono: true },
  { key: 'ifsc', label: 'IFSC', mono: true, upper: true },
  { key: 'branch_name', label: 'Branch (optional)' },
  { key: 'upi_id', label: 'UPI ID (optional)' },
];
const emptyAddress = (kind, required = false) => ({ kind, required, line1: '', line2: '', city: '', district: '', state: '', pin: '' });

function Fields({ fields, values, onChange }) {
  return (
    <div className="kyc-grid2" style={{ marginBottom: 20 }}>
      {fields.map((f) => (
        <input key={f.key} type={f.type || 'text'} placeholder={f.placeholder || f.label} title={f.label} value={values[f.key] || ''}
          onChange={(e) => onChange(f.key, f.upper ? e.target.value.toUpperCase() : e.target.value)}
          className={`kyc-input${f.mono ? ' kyc-input--mono' : ''}`} />
      ))}
    </div>
  );
}

export default function Kyc() {
  const [step, setStep] = useState('entity');
  const [entityType, setEntityType] = useState('individual');
  const [answers, setAnswers] = useState({});
  const [banking, setBanking] = useState({});
  const [docs, setDocs] = useState({});
  const [docsError, setDocsError] = useState('');
  const [addresses, setAddresses] = useState([emptyAddress('Registered', true)]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [stepError, setStepError] = useState('');
  const [busy, setBusy] = useState(false);

  // GET /kyc → { party, documents, addressesByType } — resume a partial dossier.
  useEffect(() => {
    kyc.form().then((res) => {
      const { party = {}, documents = [], addressesByType = {} } = unwrap(res);
      if (party.entity_type === 'individual' || party.entity_type === 'organization') setEntityType(party.entity_type);
      const pick = (keys) => Object.fromEntries(keys.filter((k) => party[k] != null).map((k) => [k, String(party[k])]));
      setAnswers(pick([...QUESTIONS.individual, ...QUESTIONS.organization].map((q) => q.key).filter((k) => k !== 'aadhaar')));
      setBanking({
        account_holder_name: party.payout_bank_account_holder_name || '', bank_name: party.payout_bank_name || '',
        account_number: party.payout_bank_account_number || '', ifsc: party.payout_bank_ifsc || '',
        branch_name: party.payout_bank_branch_name || '', upi_id: party.payout_bank_upi_id || '',
      });
      setDocs(Object.fromEntries(documents.map((d) => [d.document_type, d.original_filename])));
      const saved = Object.values(addressesByType).map((a) => ({
        kind: ADDRESS_KIND[a.address_type], required: a.address_type === 'registered',
        line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', district: a.district || '', state: a.state || '', pin: a.pin_code || '',
      }));
      if (saved.length) setAddresses(saved.some((a) => a.required) ? saved : [emptyAddress('Registered', true), ...saved]);
      if (party.kyc_status === 'submitted') setStep('submitted');
    }).catch(() => { /* offline — start blank */ });
  }, []);

  const requiredDocsList = entityType === 'organization' ? DOCS_ORG : DOCS_INDIVIDUAL;
  const stepIndex = STEP_ORDER.indexOf(step);
  const isSubmitted = step === 'submitted';
  const approverLabel = entityType === 'organization' ? 'your TSX Master (Market Maker/Seller verification)' : 'your Custodian (Buyer/Trader verification)';
  const canJump = (i) => i < stepIndex && !isSubmitted && step !== 'review';

  // Runs a save call, then advances; surfaces the backend's validation message.
  const saveThen = async (call, next) => {
    setBusy(true);
    setStepError('');
    try {
      await call();
      setStep(next);
    } catch (err) {
      setStepError(err.message || 'Could not save this step.');
    } finally {
      setBusy(false);
    }
  };
  const saveQuestionnaire = () => saveThen(() => kyc.saveQuestionnaire({ entity_type: entityType, ...answers }), 'banking');
  const saveBanking = () => saveThen(() => kyc.saveBanking(banking), 'address');
  const saveAddresses = () => saveThen(async () => {
    for (const a of addresses) {
      if (!a.required && !a.line1) continue;
      await kyc.saveAddress({
        address_type: ADDRESS_TYPE[a.kind], line1: a.line1, line2: a.line2 || undefined,
        city: a.city, district: a.district, state: a.state, pin_code: a.pin,
      });
    }
  }, 'docs');

  const setAddrField = (i, field, value) => {
    const next = [...addresses];
    next[i] = { ...next[i], [field]: field === 'pin' ? value.replace(/\D/g, '').slice(0, 6) : value };
    setAddresses(next);
  };
  const addKind = (k) => setAddresses([...addresses, emptyAddress(k)]);
  // Uploads straight to the encrypted vault (POST /kyc/documents, multipart).
  const uploadDoc = async (key, file) => {
    if (!file) return;
    setDocsError('');
    const form = new FormData();
    form.append('document', file);
    form.append('document_type', key);
    setDocs((cur) => ({ ...cur, [key]: `${file.name} — uploading…` }));
    try {
      await kyc.uploadDocument(form);
      setDocs((cur) => ({ ...cur, [key]: file.name }));
    } catch (err) {
      setDocs((cur) => { const next = { ...cur }; delete next[key]; return next; });
      setDocsError(err.message || 'Upload failed.');
    }
  };
  const removeDoc = (key) => { const next = { ...docs }; delete next[key]; setDocs(next); };
  const nextFromDocs = () => {
    if (!requiredDocsList.filter((d) => d.required).every((d) => docs[d.key])) { setDocsError('Please upload all required documents to continue.'); return; }
    setStep('review');
  };
  const submitKyc = () => {
    if (!consentChecked) { setConsentError('Please accept the Terms of Use to submit your KYC.'); return; }
    kyc.submit().then(() => setStep('submitted')).catch((err) => setConsentError(err.message || 'Submission failed. Please try again.'));
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
            <button onClick={() => setStep('questionnaire')} className="kyc-btn-dark kyc-btn-full">Continue</button>
          </>
        )}

        {step === 'questionnaire' && (
          <>
            <h1 className="kyc-h1">KYC Questionnaire</h1>
            <p className="kyc-p">BR-17's {entityType === 'organization' ? 'organization' : 'individual'} questionnaire — fields marked optional may be left blank.</p>
            <Fields fields={QUESTIONS[entityType]} values={answers} onChange={(k, v) => setAnswers({ ...answers, [k]: v })} />
            {stepError && <p className="kyc-error">{stepError}</p>}
            <div className="kyc-btn-row">
              <button onClick={() => setStep('entity')} className="kyc-btn-outline">Back</button>
              <button onClick={saveQuestionnaire} disabled={busy} className="kyc-btn-dark">{busy ? 'Saving…' : 'Continue'}</button>
            </div>
          </>
        )}

        {step === 'banking' && (
          <>
            <h1 className="kyc-h1">Banking Details</h1>
            <p className="kyc-p">The account used for refunds and settlement payouts. Stored encrypted.</p>
            <Fields fields={BANK_FIELDS} values={banking} onChange={(k, v) => setBanking({ ...banking, [k]: v })} />
            {stepError && <p className="kyc-error">{stepError}</p>}
            <div className="kyc-btn-row">
              <button onClick={() => setStep('questionnaire')} className="kyc-btn-outline">Back</button>
              <button onClick={saveBanking} disabled={busy} className="kyc-btn-dark">{busy ? 'Saving…' : 'Continue'}</button>
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
                        <p className="kyc-doc-card__name">{d.name}{d.required ? '' : ' (optional)'}</p>
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
              <button onClick={() => setStep('address')} className="kyc-btn-outline">Back</button>
              <button onClick={nextFromDocs} className="kyc-btn-dark">Continue to Review</button>
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
                    <input placeholder="District" value={a.district} onChange={(e) => setAddrField(i, 'district', e.target.value)} className="kyc-input" />
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
              <button onClick={() => setStep('banking')} className="kyc-btn-outline">Back</button>
              <button onClick={saveAddresses} disabled={busy} className="kyc-btn-dark">{busy ? 'Saving…' : 'Continue'}</button>
            </div>
            {stepError && <p className="kyc-error">{stepError}</p>}
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
                    <p className="kyc-review-addr-line">{[a.line1, a.line2, a.city, a.district, a.state].filter(Boolean).join(', ')} {a.pin}</p>
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
              <button onClick={() => setStep('docs')} className="kyc-btn-outline">Back</button>
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
