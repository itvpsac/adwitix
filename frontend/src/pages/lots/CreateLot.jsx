import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import './CreateLot.css';
import AppHeader from '../../components/AppHeader.jsx';
import { CATEGORY_MAP, SUBCATEGORY_MAP, MICROCATEGORY_MAP } from '../../constants.js';
import { CATEGORIES, SUBCATS_BY_CAT, MICROCATS_BY_SUBCAT } from '../../data/classification.js';
import { listings, me, plans as plansApi } from '../../api/endpoints.js';
import { unwrap } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import SearchableSelect from '../../components/SearchableSelect.jsx';

const FORMATS = [
  { id: 'buynow', label: 'Buy-Now', desc: 'Traders make offers; you choose who to sell to.' },
  { id: 'easy', label: 'Easy Auction', desc: 'Scheduled, with a real inspection window.' },
  { id: 'express', label: 'Express Auction', desc: 'Fast — starts once 3 Traders pledge, closes within the hour.' },
  { id: 'tender', label: 'Tender Auction', desc: 'Fully private, invite-only — you control participation.' },
];

// MediaService::MIN_PHOTOS on the backend.
const MIN_PHOTOS = 5;
// The TradeSphereX the Lot is listed on (GET /my-seller-tenants): Salvage
// Managers, open to every verified seller (D-131), first and by default,
// then any TSX whose TSX Master approved this seller (BR-09).
export default function CreateLot() {
  const [params] = useSearchParams();
  const [sellerTenants, setSellerTenants] = useState(null);
  const [salvageManagers, setSalvageManagers] = useState(null);
  const [tenantId, setTenantId] = useState(params.get('tenant') || '');
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    me.sellerTenants().then((r) => {
      const d = unwrap(r) || {};
      const list = d.tenants || [];
      setSellerTenants(list);
      setSalvageManagers(d.salvageManagers || null);
      setTenantId((cur) => (cur && list.some((t) => t.id === cur) ? cur : (list[0] && list[0].id) || ''));
    }).catch(() => setSellerTenants([]));
    plansApi.list().then((r) => setPlans((unwrap(r) || {}).plans || [])).catch(() => {});
  }, []);
  // D-138: the chosen TSX's plan sets how many photos a Lot may have (the
  // server enforces it on upload; this only tells the seller up front).
  const tierOf = (sellerTenants || []).find((t) => t.id === tenantId)?.subscription_tier;
  const lotPlan = plans.find((p) => p.plan_key === tierOf);
  const maxPhotos = lotPlan ? lotPlan.images_per_lot : undefined; // null = unlimited
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [newLotId, setNewLotId] = useState('');
  const [catId, setCatId] = useState('');
  const [subcatId, setSubcatId] = useState('');
  const [microcatId, setMicrocatId] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [condition, setCondition] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [defectDisclosure, setDefectDisclosure] = useState({ knownDamage: '', missingComponents: '', nonfunctional: '' });
  const [step1Error, setStep1Error] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  // Pincode lookup API
  useEffect(() => {
    if (pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0] && data[0].Status === 'Success') {
            const office = data[0].PostOffice[0];
            setCity(office.District);
            setState(office.State);
            setPincodeError('');
          } else {
            setCity('');
            setState('');
            setPincodeError('Invalid pincode. Please check and try again.');
          }
        })
        .catch(() => {
          setCity('');
          setState('');
          setPincodeError('Could not look up this pincode. Please try again.');
        });
    } else {
      setCity('');
      setState('');
      setPincodeError('');
    }
  }, [pincode]);
  const [documents, setDocuments] = useState([]);
  const mediaFileInputRef = useRef(null);
  const docFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const [mediaFiles, setMediaFiles] = useState([]);

  const handleDocUpload = (event) => {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;
    const newDocs = files.map(file => ({
      name: file.name,
      type: file.type,
      file
    }));
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handleBulkUpload = async (event) => {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (!files.length) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return await imageCompression(file, options);
          }
          return file;
        })
      );
      
      const newMedia = compressedFiles.map((file, i) => ({
        name: files[i].name,
        type: file.type || files[i].type,
        preview: URL.createObjectURL(file),
        file
      }));
      setMediaFiles(prev => [...prev, ...newMedia]);
      setStep2Error('');
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Error processing files. Please try again.');
    }
  };

  const removeMedia = (index) => {
    URL.revokeObjectURL(mediaFiles[index].preview);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [formatId, setFormatId] = useState(null);
  const [reserveValue, setReserveValue] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [inspectionWindow, setInspectionWindow] = useState('3d');
  const [step3Error, setStep3Error] = useState('');
  const [preCheckStatus, setPreCheckStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [createdLotId, setCreatedLotId] = useState('');
  // Files already sent to the backend for the created lot, so a retry
  // (e.g. after adding photos) uploads only the new ones.
  const uploadedFilesRef = useRef(new Set());
  const [step2Error, setStep2Error] = useState('');
  const photoCount = mediaFiles.filter((m) => m.type.startsWith('image/')).length;

  // BR-11: the backend refuses approval with fewer than MIN_PHOTOS photos.
  const goToStep3 = () => {
    if (photoCount < MIN_PHOTOS) {
      setStep2Error(`Add at least ${MIN_PHOTOS} photos before continuing (currently ${photoCount}).`);
      return;
    }
    setStep2Error('');
    setStep(3);
  };

  const goToStep2 = () => {
    if (!tenantId) { setStep1Error('Choose the TradeSphereX to list on — you need to be an approved seller there first.'); return; }
    if (!catId || !condition || !title.trim()) { setStep1Error('Fill in category, condition, and title before continuing.'); return; }
    if (!subcatId) { setStep1Error('Choose a subcategory before continuing.'); return; }
    if (pincode.length !== 6 || !city || !state) { setStep1Error('Enter a valid 6-digit pincode so State and City are filled in.'); return; }
    if (!fullAddress.trim()) { setStep1Error('Enter the full address before continuing.'); return; }
    setStep(2);
  };
  
  const submitLot = async () => {
    setLoading(true);
    setStep3Error('');
    try {
      const payload = {
        tenant_id: tenantId,
        title,
        description,
        category: CATEGORY_MAP.find(c => c.id === catId)?.apiValue || catId,
        subcategory: SUBCATEGORY_MAP.find(s => s.id === subcatId)?.label || subcatId,
        micro_category: MICROCATEGORY_MAP.find(m => m.id === microcatId)?.label || microcatId,
        physical_condition: condition,
        quantity: 1,
        make_model: title,
        pincode,
        city,
        state,
        full_address: fullAddress,
        media_tier: "certified_by_seller",
        // No inspector/shipping fields on this form: send none rather than
        // binding a made-up inspector or inventing a shipping charge.
        inspector_mobile: "",
        surveyor_mobile: "",
        custodian_mobile: "",
        related_group_label: "",
        shipping_enabled: "0",
        shipping_cost_type: null,
        shipping_fixed_cost: null,
        shipping_variable_rate_per_km: null,
        media_is_representative_under_waiver: "0"
      };
      
      let lotId = createdLotId;
      if (!lotId) {
        const res = await listings.create(payload);
        const data = (res && res.data) || res || {};
        lotId = (data.listing && data.listing.id) || data.id;
        if (!lotId) throw new Error('Lot was created but no lot id was returned.');
        setCreatedLotId(lotId);
      }

      const pendingMedia = mediaFiles.filter(m => !uploadedFilesRef.current.has(m.file));
      const pendingDocs = documents.filter(d => !uploadedFilesRef.current.has(d.file));
      if (pendingMedia.length || pendingDocs.length) {
        const formData = new FormData();
        pendingMedia.forEach(m => formData.append(m.type.startsWith('video/') ? 'videos[]' : 'photos[]', m.file, m.name));
        pendingDocs.forEach(d => formData.append('documents[]', d.file, d.name));

        const uploadRes = await listings.uploadMedia(lotId, formData);
        const failed = ((uploadRes && (uploadRes.data || uploadRes)) || {}).failed || [];
        const failedNames = new Set(failed.map(f => f.original_filename));
        [...pendingMedia, ...pendingDocs].forEach(f => { if (!failedNames.has(f.name)) uploadedFilesRef.current.add(f.file); });
        if (failed.length) {
          setStep3Error(`Lot saved, but ${failed.length} file(s) failed to upload: ${failed.map(f => `${f.original_filename} (${f.error})`).join('; ')}`);
          return;
        }
      }

      // A new lot starts in the seller's inventory; this moves it to
      // pending_approval so it reaches the TSX Master's Lot Approval queue.
      try {
        await listings.submitForApproval(lotId);
      } catch (err) {
        setStep3Error(`Lot saved to your inventory, but it could not be sent for approval: ${err.description || err.message}. Go back, fix this, and submit again — the saved lot will be reused.`);
        return;
      }
      setNewLotId(lotId);
      setSubmitted(true);
    } catch (err) {
      console.error("DEBUG: listings.create error:", err.payload || err);
      if (err.status === 403) {
        // Show the backend's own reason (KYC, not an approved seller on this tenant, etc.).
        setStep3Error(err.description || 'You are not authorized to create a lot. Please ensure your KYC is approved by your TSX Master.');
      } else if (err.status === 422) {
        setStep3Error(`Validation error: ${err.message || 'Check your input data.'}`);
      } else if (err.status === 413) {
        setStep3Error('Files are too large to upload. Please upload smaller files.');
      } else {
        setStep3Error(err.description || err.message || 'Failed to submit lot. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const selectedFormat = FORMATS.find((f) => f.id === formatId);

  return (
    <div className="cl-page">
      <AppHeader variant="light" contextNav={[{ label: "Create a Lot", to: "/create-lot", active: true }, { label: "Defect Disclosure", to: "/defect-disclosure" }]} />
      <main className="cl-main">
        <div className="legal-eyebrow">Market Maker</div>
        <h1 className="cl-title">Create Lot</h1>
        <p className="cl-sub">List an asset for sale. Every Lot goes through an AI Pre-Check before routing to your TSX Master for approval.</p>

        <div className="cl-steps">{[1,2,3].map((n) => <div key={n} className="cl-step-bar" style={{ background: n <= step ? 'var(--color-accent)' : 'var(--color-border)' }} />)}</div>

        {submitted ? (
          <div className="cl-submitted">
            <div className="cl-submitted__check">✓</div>
            <p className="cl-submitted__title">Lot {newLotId} submitted for review</p>
            <p className="cl-submitted__text">Routed to your TSX Master. You'll be notified once it's approved and live, or if changes are requested.</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <>
                <h2 className="cl-h2">1. What are you listing?</h2>

                <label className="cl-label">TradeSphereX</label>
                {sellerTenants === null ? <p className="cl-hint">Loading…</p>
                  : sellerTenants.length === 0 ? (
                    <p className="cl-hint" style={{ color: 'var(--color-danger)' }}>
                      You can't list on any TradeSphereX right now{salvageManagers ? ` — your selling on ${salvageManagers.name} has been suspended by its TSX Master` : ''}.{' '}
                      <Link to="/tenant-directory">See the TradeSphereX Directory</Link>.
                    </p>
                  ) : (
                    <select className="cl-input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} disabled={sellerTenants.length === 1}>
                      {sellerTenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                
                <label className="cl-label">Title</label>
                <input className="cl-input" placeholder="e.g. CNC Lathe Machine, 2018, Surplus" value={title} onChange={(e) => { setTitle(e.target.value); setStep1Error(''); }} />
                
                <h2 className="cl-h2">Sale Format</h2>
                <p className="cl-hint">For planning only — the format, Reserve Value and other session details below are not saved with the Lot. You set them when you request a Trading Session after your TSX Master approves the Lot.</p>
                <div className="cl-format-grid">
                  {FORMATS.map((f) => (
                    <button key={f.id} onClick={() => { setFormatId(f.id); setStep1Error(''); }} className="cl-format-opt" style={{ borderColor: formatId === f.id ? 'var(--color-accent)' : 'var(--color-border)' }}>
                      <p className="cl-format-opt__title">{f.label}</p><p className="cl-format-opt__desc">{f.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="cl-grid2">
                  <div>
                    <label className="cl-label">Reserve Value (RV) — confidential floor price</label>
                    <input className="cl-input" inputMode="numeric" placeholder="Enter reserve value in ₹ (e.g. 500000)" value={reserveValue} onChange={(e) => { setReserveValue(e.target.value.replace(/[^0-9]/g, '')); setStep1Error(''); }} />
                  </div>
                  {formatId === 'buynow' && (
                    <div><label className="cl-label">Expected Value (EV) — target/asking price</label><input className="cl-input" placeholder="₹" value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)} /></div>
                  )}
                  {formatId === 'easy' && (
                    <div>
                      <label className="cl-label">Inspection window</label>
                      <select className="cl-select" value={inspectionWindow} onChange={(e) => setInspectionWindow(e.target.value)}>
                        <option value="24h">24 hours</option><option value="48h">48 hours</option><option value="3d">3 days</option><option value="7d">7 days</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="cl-grid2">
                  <div>
                    <label className="cl-label">Category</label>
                    <SearchableSelect
                      options={CATEGORIES.map((c) => ({ id: c.id, code: c.code, label: c.label }))}
                      value={catId || null}
                      onChange={(id) => { setCatId(id || ''); setSubcatId(''); setMicrocatId(''); setStep1Error(''); }}
                      placeholder="Choose a category…"
                    />
                  </div>
                  <div>
                    <label className="cl-label">Subcategory</label>
                    <SearchableSelect
                      options={SUBCATS_BY_CAT[catId]?.map((s) => ({ id: s.id, code: s.code, label: s.label })) || []}
                      value={subcatId || null}
                      onChange={(id) => { setSubcatId(id || ''); setMicrocatId(''); }}
                      placeholder={catId ? 'Any subcategory…' : 'Choose a category first'}
                      disabled={!catId}
                    />
                  </div>
                  <div>
                    <label className="cl-label">Microcategory</label>
                    <SearchableSelect
                      options={MICROCATS_BY_SUBCAT[subcatId]?.map((m) => ({ id: m.id, code: m.code, label: m.label })) || []}
                      value={microcatId || null}
                      onChange={(id) => setMicrocatId(id || '')}
                      placeholder={subcatId ? 'Any microcategory…' : 'Choose a subcategory first'}
                      disabled={!subcatId}
                    />
                  </div>
                  <div>
                    <label className="cl-label">Condition</label>
                    <select className="cl-select" value={condition} onChange={(e) => { setCondition(e.target.value); setStep1Error(''); }}>
                      <option value="">Select condition</option>
                      <option value="working_minimal">Working, Minimal Wear</option><option value="working_moderate">Working, Moderate Wear</option>
                      <option value="needs_repair">Needs Repair</option><option value="non_functional">Non-Functional / For Parts</option>
                    </select>
                  </div>
                  <div>
                    <label className="cl-label">Pincode</label>
                    <input 
                      className="cl-input" 
                      type="text" 
                      value={pincode} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length <= 6) setPincode(val);
                      }} 
                      placeholder="6-digit pincode" 
                    />
                    {pincodeError && <p className="cl-error">{pincodeError}</p>}
                  </div>
                  <div>
                    <label className="cl-label">State</label>
                    <input className="cl-input" type="text" value={state} readOnly placeholder="Auto-filled from pincode" />
                  </div>
                  <div>
                    <label className="cl-label">City</label>
                    <input className="cl-input" type="text" value={city} readOnly placeholder="Auto-filled from pincode" />
                  </div>
                  <div>
                    <label className="cl-label">Full Address</label>
                    <input className="cl-input" type="text" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Enter full address details" />
                  </div>
                </div>

                
                {formatId === 'express' && (
                  <div className="cl-defect-fields" style={{ background: '#F8F1E7', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                    <h3 className="cl-h2">Defect Disclosure — Express Auction</h3>
                    {/* POST /sale-events/:id/defect-disclosure needs an Express sale event, which
                        can only be attached once the Lot is approved — none exists here. */}
                    <p className="cl-hint">Not saved with the Lot — you complete the disclosure on your Express Trading Session after the Lot is approved.</p>
                    <label className="cl-label">Known Damage</label>
                    <textarea className="cl-textarea" placeholder="e.g. Minor dent on rear panel, none if not applicable" rows={3} value={defectDisclosure.knownDamage} onChange={(e) => setDefectDisclosure({ ...defectDisclosure, knownDamage: e.target.value })} />
                    <label className="cl-label">Missing Components</label>
                    <textarea className="cl-textarea" placeholder="e.g. Missing original charger, none if not applicable" rows={3} value={defectDisclosure.missingComponents} onChange={(e) => setDefectDisclosure({ ...defectDisclosure, missingComponents: e.target.value })} />
                    <label className="cl-label">Non-Functional Aspects</label>
                    <textarea className="cl-textarea" placeholder="e.g. AC not working, none if not applicable" rows={3} value={defectDisclosure.nonfunctional} onChange={(e) => setDefectDisclosure({ ...defectDisclosure, nonfunctional: e.target.value })} />
                  </div>
                )}

                <label className="cl-label">Description — include any known defects (see <Link to="/defect-disclosure">Defect Disclosure</Link> requirements)</label>
                <textarea className="cl-textarea" placeholder="Describe the item accurately, including condition, age, and any known flaws." rows={4} value={description} onChange={(e) => { setDescription(e.target.value); setStep1Error(''); }} />
                
                {step1Error && <p className="cl-error">{step1Error}</p>}
                <button className="cl-btn-primary" onClick={goToStep2}>Continue</button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="cl-h2">2. Upload media</h2>
                <p className="cl-hint">At least {MIN_PHOTOS} real photos of the actual item, captured through the app — no stock images. Location/timestamp is captured automatically.</p>
                <div className="cl-row-between">
                  <p className="cl-strong">Photos ({photoCount}{maxPhotos ? `/${maxPhotos}` : ''})</p>
                  <button className="cl-outline-btn" onClick={() => mediaFileInputRef.current?.click()}>⇪ Bulk Upload</button>
                  <input type="file" multiple ref={mediaFileInputRef} onChange={handleBulkUpload} style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" />
                </div>
                <div className="cl-media">
                  {mediaFiles.map((m, i) => (
                    <div key={i} className="cl-photo-slot">
                      {m.type.startsWith('image/') ? (
                        <img src={m.preview} alt="preview" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px'}} />
                      ) : (
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                          <span style={{fontSize: '24px'}}>{m.type.startsWith('video/') ? '🎬' : '📄'}</span>
                          <span style={{padding: '5px', fontSize: '10px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{m.name}</span>
                        </div>
                      )}
                      <button onClick={() => removeMedia(i)} style={{position: 'absolute', top: 2, right: 2, cursor: 'pointer', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%'}}>×</button>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, MIN_PHOTOS - mediaFiles.length) }, (_, i) => (
                    <div key={mediaFiles.length + i} className="cl-photo-slot">Slot {mediaFiles.length + i + 1}</div>
                  ))}
                </div>
                <p className="cl-hint">
                  {maxPhotos ? `Up to ${maxPhotos} photos` : maxPhotos === null ? 'No limit on photos' : 'Photos'}
                  {lotPlan ? ` on the ${lotPlan.name} plan` : ''}{lotPlan?.videos_per_lot != null ? `, ${lotPlan.videos_per_lot} videos` : ''}
                  {lotPlan?.max_file_mb != null ? `, ${lotPlan.max_file_mb} MB a file` : ''}. Bulk Upload adds all the files you select.
                </p>

                <p className="cl-strong">Video (optional, up to 2 minutes)</p>
                <button type="button" className="cl-video-slot" onClick={() => videoFileInputRef.current?.click()}>
                  {mediaFiles.some(m => m.type.startsWith('video/')) ? '🎬 Video added — click to add another' : '+ Add video walkthrough'}
                </button>
                <input type="file" ref={videoFileInputRef} onChange={handleBulkUpload} style={{ display: 'none' }} accept="video/mp4,video/quicktime,video/webm" />

                <p className="cl-strong">Supporting documents (optional — invoice, registration, inspection report; PDF only)</p>
                <div className="cl-doc-list">
                  {documents.map((d, i) => (
                    <div key={i} className="cl-doc-row">
                      <span style={{fontSize: '24px'}}>📄</span>
                      <span>{d.name}</span>
                      <button onClick={() => setDocuments(documents.filter((_, idx) => idx !== i))}>Remove</button>
                    </div>
                  ))}
                  <button className="cl-add-doc" onClick={() => docFileInputRef.current?.click()}>+ Add Document</button>
                  <input type="file" multiple ref={docFileInputRef} onChange={handleDocUpload} style={{ display: 'none' }} accept="application/pdf,.pdf" />
                </div>

                <div className="cl-nav-row">
                  <button className="cl-link-btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="cl-btn-primary cl-btn-primary--right" onClick={goToStep3}>Continue to Review</button>
                </div>
                {step2Error && <p className="cl-error">{step2Error}</p>}
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="cl-h2">3. Review &amp; submit</h2>
                <div className="cl-review-card">
                  <div className="cl-review-row"><span>Title</span><span>{title}</span></div>
                  <div className="cl-review-row">
                    <span>Category</span>
                    <span>
                      {(() => {
                        const selectedCat = CATEGORIES.find((c) => c.id === catId || c.code === catId || c.label === catId);
                        return selectedCat ? `${selectedCat.code} — ${selectedCat.label}` : catId;
                      })()}
                    </span>
                  </div>
                  <div className="cl-review-row"><span>Format (not saved — set when requesting a Trading Session)</span><span>{selectedFormat ? selectedFormat.label : '—'}</span></div>
                  <div className="cl-review-row"><span>Reserve Value (not saved — set when requesting a Trading Session)</span><span>{reserveValue ? formatCurrency(reserveValue) : '—'}</span></div>
                </div>
                <div className="cl-notice">Submitting routes this Lot to your TSX Master for approval. It won't go live until approved.</div>
                <div className="cl-nav-row">
                  <button className="cl-link-btn" onClick={() => setStep(2)}>← Back</button>
                  <button className="cl-btn-gold cl-btn-primary--right" onClick={submitLot} disabled={loading}>{loading ? 'Submitting…' : 'Submit for Approval'}</button>
                </div>
                {step3Error && <p className="cl-error cl-error--top">{step3Error}</p>}
              </>
            )}
          </>
        )}
      </main>
      <footer className="cl-footer"><p>See our <Link to="/dos-and-donts">Dos &amp; Don'ts</Link> for listing best practices.</p></footer>
    </div>
  );
}
