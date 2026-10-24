import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './LotDetail.css';
import LotsOnHoldBanner from '../../components/LotsOnHoldBanner.jsx';
import AppHeader from '../../components/AppHeader.jsx';
import { listings, admin } from '../../api/endpoints.js';
import { unwrap, mediaUrl } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import { readAuth, isCustodian } from '../../utils/auth.js';

// Data: GET /api/v1/app/listings/:id (ListingController::show) →
// { listing, saleEvent, tenant, media, sellerStarRating, ... }.
// Media file_path values are turned into URLs by mediaUrl() (api/client.js).
const FORMAT_META = {
  easy: { label: 'EASY', ctaLabel: 'Place Bid', note: 'Open ascending bid. Highest bid wins at close.' },
  express: { label: 'EXPRESS', ctaLabel: 'Submit Sealed Bid', note: 'Starts once 3 Traders pledge; closes within the hour.' },
  tender: { label: 'TENDER', ctaLabel: 'Submit Tender Offer', note: 'Private, invite-only sealed bidding.' },
  buy_now: { label: 'BUY-NOW', ctaLabel: 'Make an Offer', note: 'Traders make offers; the seller chooses who to sell to.' },
};
const LISTING_STATUS = {
  inventory: 'Inventory', pending_approval: 'Pending Approval', upcoming: 'Upcoming', active: 'Active',
  sold: 'Sold', cycle_ended_unsold: 'Ended Unsold', suspended: 'Suspended',
};
const SALE_STATUS = {
  pending_approval: 'Pending Approval', grace_period: 'Grace Period', active: 'Live',
  closed_sold: 'Closed — Sold', cancelled: 'Cancelled', cycle_ended_unsold: 'Ended Unsold',
};
const CONDITION = { non_functional: 'Non-functional' };

const humanize = (s) => (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
const formatDate = (d) => (d ? new Date(String(d).replace(' ', 'T')).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

function timeLine(se) {
  if (!se) return '';
  const now = Date.now();
  const start = se.scheduled_start_at && new Date(String(se.scheduled_start_at).replace(' ', 'T')).getTime();
  const end = se.scheduled_end_at && new Date(String(se.scheduled_end_at).replace(' ', 'T')).getTime();
  if (se.actual_closed_at) return `Closed ${formatDate(se.actual_closed_at)}`;
  if (start && start > now) return `Starts ${formatDate(se.scheduled_start_at)}`;
  if (end && end > now) return `Ends ${formatDate(se.scheduled_end_at)}`;
  if (end) return `Ended ${formatDate(se.scheduled_end_at)}`;
  return SALE_STATUS[se.status] || humanize(se.status);
}

export default function LotDetail() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeMedia, setActiveMedia] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [newFiles, setNewFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  // The Custodian sees who the seller is (D-133); buyers don't.
  const custodian = isCustodian(readAuth());
  const [custodianSeller, setCustodianSeller] = useState(null);
  useEffect(() => {
    if (!custodian || !id) return;
    admin.lotDossier(id).then((r) => setCustodianSeller((unwrap(r) || {}).seller || null)).catch(() => {});
  }, [custodian, id]);

  useEffect(() => {
    if (!reloadKey) { setData(null); setActiveMedia(0); }
    setError('');
    if (!id) return;
    let cancelled = false;
    listings.show(id)
      .then((res) => { if (!cancelled) setData(unwrap(res)); })
      .catch((err) => { if (!cancelled) setError(err.status === 404 ? 'This lot was not found. It may have been removed.' : (err.message || 'Could not load this lot.')); });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  // Seller adds photos/videos/documents to an existing lot (same endpoint
  // Create Lot uses).
  const uploadNewFiles = async () => {
    if (!newFiles.length) return;
    setUploading(true); setUploadMsg('');
    try {
      const formData = new FormData();
      newFiles.forEach((f) => formData.append(
        f.type.startsWith('video/') ? 'videos[]' : f.type === 'application/pdf' ? 'documents[]' : 'photos[]', f, f.name,
      ));
      const result = unwrap(await listings.uploadMedia(id, formData)) || {};
      const failed = result.failed || [];
      setUploadMsg(failed.length
        ? `${result.message} ${failed.map((f) => `${f.original_filename}: ${f.error}`).join('; ')}`
        : (result.message || 'Uploaded.'));
      setNewFiles([]);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setUploadMsg(err.description || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const header = <AppHeader variant="light" contextNav={[{ label: 'Marketplace', to: '/marketplace' }, { label: 'Lot Detail', to: id ? `/lot-detail?id=${id}` : '/lot-detail', active: true }]} />;
  const message = (text) => (
    <div className="ldp-page">{header}<main className="ldp-main"><p className="ldp-desc">{text}</p><Link to="/marketplace">← Back to Marketplace</Link></main></div>
  );

  if (!id) return message('No lot selected. Open a lot from the Marketplace or the Lot Directory.');
  if (error) return message(error);
  if (!data || !data.listing) return message('Loading lot…');

  const { listing: lot, saleEvent: se, tenant } = data;
  const media = data.media || [];
  const photos = media.filter((m) => m.media_type === 'photo');
  const videos = media.filter((m) => m.media_type === 'video');
  const documents = media.filter((m) => m.media_type === 'document');
  const hero = photos[activeMedia] || photos[0];
  const meta = se ? FORMAT_META[se.sale_format] : null;
  // Status can stay 'active' until the backend scheduler closes it, so also check the end time.
  const endsAt = se && se.scheduled_end_at ? new Date(String(se.scheduled_end_at).replace(' ', 'T')).getTime() : null;
  const isLive = !!se && se.status === 'active' && !se.actual_closed_at && (!endsAt || endsAt > Date.now());
  // BR-15: the Super Admin may never bid/offer/pledge; sellers can't bid on their own lot.
  const blockedReason = isCustodian(readAuth()) ? 'Super Admin accounts cannot bid, offer or pledge (BR-15).'
    : data.isOwner ? 'This is your lot — you cannot bid on it.' : '';

  // Reserve Value is confidential (seller's floor) — never shown here.
  const price = se
    ? (se.sale_format === 'buy_now'
      ? { label: 'Expected Value', value: se.expected_value }
      : { label: Number(se.current_price) > 0 ? 'Current Bid' : 'Starting Price', value: Number(se.current_price) > 0 ? se.current_price : se.expected_value })
    : null;
  const location = [lot.city, lot.state].filter(Boolean).join(', ');
  const defects = se && [
    ['Known damage', se.defect_disclosure_known_damage],
    ['Missing components', se.defect_disclosure_missing_components],
    ['Non-functional aspects', se.defect_disclosure_nonfunctional_aspects],
  ].filter(([, v]) => v);

  return (
    <div className="ldp-page">
      {header}

      <main className="ldp-main">
        <div className="ldp-crumb">
          {lot.category}{lot.subcategory ? ` › ${lot.subcategory}` : ''}{lot.micro_category ? ` › ${lot.micro_category}` : ''}
          {tenant && ` · ${tenant.name}`} · <span className="ldp-mono">{se?.ern || lot.id}</span>
        </div>
        {lot.status === 'on_hold' && (data.isOwner
          ? <LotsOnHoldBanner listingId={lot.id} />
          : <p role="status" style={{ margin: '0 0 16px', padding: '12px 16px', borderRadius: 12, background: '#FFF8F5', border: '1px solid #F0C9BE', font: '600 14px/1.5 var(--font-sans)' }}>
              This Lot is on hold while the Custodian&apos;s objection{data.objection?.reason_label ? ` (${data.objection.reason_label.toLowerCase()})` : ''} is put right. It can&apos;t be bid on until then.
            </p>)}

        <div className="ldp-layout">
          <div>
            <div className="ldp-hero-photo" style={{ overflow: 'hidden' }}>
              {hero && <img src={mediaUrl(hero.file_path)} alt={lot.title || 'Lot photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            </div>
            {photos.length > 1 && (
              <div className="ldp-thumbs">
                {photos.map((m, i) => (
                  <button key={m.id} type="button" className="ldp-thumb" onClick={() => setActiveMedia(i)}
                    style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', outline: i === activeMedia ? '2px solid var(--color-accent)' : 'none' }}>
                    <img src={mediaUrl(m.file_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
            {photos.length === 0 && !data.missingMediaCount && <p className="ldp-bid-note">No photos uploaded yet.</p>}
            {data.missingMediaCount > 0 && !data.isOwner && (
              <p className="ldp-add-media-warn">
                {data.missingMediaCount} uploaded file{data.missingMediaCount === 1 ? ' is' : 's are'} missing from the server; the seller needs to add {data.missingMediaCount === 1 ? 'it' : 'them'} again.
              </p>
            )}
            {data.isOwner && (data.missingMediaCount > 0 || data.canAddMedia) && (
              <div className="ldp-add-media">
                {data.missingMediaCount > 0 && (
                  <p className="ldp-add-media-warn">
                    {data.missingMediaCount} file{data.missingMediaCount === 1 ? '' : 's'} of this lot {data.missingMediaCount === 1 ? 'is' : 'are'} missing from the server and hidden here.
                    {data.canAddMedia ? ' Add the photos again below.' : ''}
                  </p>
                )}
                {data.canAddMedia ? (
                  <div className="ldp-add-media-row">
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,application/pdf"
                      onChange={(e) => { setNewFiles(Array.from(e.target.files || [])); setUploadMsg(''); }} disabled={uploading} />
                    <button type="button" className="ldp-cta" onClick={uploadNewFiles} disabled={uploading || !newFiles.length}>
                      {uploading ? 'Uploading…' : `Add ${newFiles.length || ''} file${newFiles.length === 1 ? '' : 's'}`}
                    </button>
                  </div>
                ) : (
                  <p className="ldp-bid-note">Photos can be added while the lot is in Inventory or Pending Approval.</p>
                )}
                {uploadMsg && <p className="ldp-bid-note">{uploadMsg}</p>}
              </div>
            )}

            <h1 className="ldp-title">{lot.title || lot.make_model || `${lot.category} lot`}</h1>
            <div className="ldp-tags">
              <span className="ldp-tag">{CONDITION[lot.physical_condition] || humanize(lot.physical_condition)}</span>
              <span className="ldp-tag">{LISTING_STATUS[lot.status] || humanize(lot.status)}</span>
              {lot.quantity && <span className="ldp-tag">Qty {Number(lot.quantity)}{lot.quantity_basis ? ` ${lot.quantity_basis}` : ''}</span>}
              {location && <span className="ldp-tag">{location}</span>}
            </div>

            <h2 className="ldp-h2">Description</h2>
            <p className="ldp-desc">{lot.description || 'No description provided.'}</p>

            {defects && defects.length > 0 && (
              <>
                <h2 className="ldp-h2">Defect Disclosure</h2>
                {defects.map(([k, v]) => <p key={k} className="ldp-desc"><strong>{k}:</strong> {v}</p>)}
              </>
            )}

            {videos.length > 0 && (
              <>
                <h2 className="ldp-h2">Video</h2>
                {videos.map((v) => <video key={v.id} src={mediaUrl(v.file_path)} controls style={{ width: '100%', maxWidth: 640, borderRadius: 10, marginBottom: 12 }} />)}
              </>
            )}

            {documents.length > 0 && (
              <>
                <h2 className="ldp-h2">Documents</h2>
                {documents.map((d) => (
                  <p key={d.id} className="ldp-desc"><a href={mediaUrl(d.file_path)} target="_blank" rel="noreferrer">📄 {d.original_filename || 'Document'}</a></p>
                ))}
              </>
            )}

            <h2 className="ldp-h2">Market Maker</h2>
            <div className="ldp-mm">
              <div className="ldp-mm__avatar">MM</div>
              <div>
                <div className="ldp-mm__name">{custodian && custodianSeller ? `${custodianSeller.full_name || 'Unnamed'} · ${custodianSeller.mobile_number}` : 'Identity not disclosed'}</div>
                <div className="ldp-mm__meta">
                  {data.sellerStarRating != null ? `MM★ ${Number(data.sellerStarRating).toFixed(1)}` : 'No rating yet'}
                  {tenant && ` · Selling on ${tenant.name}`}
                </div>
                {custodian && <Link to={`/custodian/lot?id=${id}`} style={{ font: '600 12.5px var(--font-sans)' }}>Open the full Custodian file — sessions, bids, deposits, audit →</Link>}
              </div>
            </div>
          </div>

          <div className="ldp-bid-box">
            {se && meta ? (
              <>
                <span className="ldp-format-badge">{meta.label}</span>
                <div className="ldp-price-label">{price.label}</div>
                <div className="ldp-price-value">{Number(price.value) > 0 ? formatCurrency(price.value) : '—'}</div>
                <div className="ldp-timeleft">{timeLine(se)}</div>
                <p className="ldp-bid-note">{meta.note}</p>

                {isLive && blockedReason ? (
                  <p className="ldp-bid-note">{blockedReason}</p>
                ) : isLive ? (
                  se.sale_format === 'buy_now' ? (
                    <Link to={`/bidding-room?id=${lot.id}&format=${se.sale_format}`} className="ldp-cta">{meta.ctaLabel}</Link>
                  ) : (
                    <>
                      <p className="ldp-emd-note">Bidding requires <Link to={`/emd-consent?saleEvent=${se.id}&lot=${lot.id}&format=${se.sale_format}`}>EMD consent</Link></p>
                      <Link to={`/bidding-room?id=${lot.id}&format=${se.sale_format}`} className="ldp-cta">{meta.ctaLabel}</Link>
                    </>
                  )
                ) : (
                  <p className="ldp-bid-note">{se.status === 'active' ? 'Bidding has ended.' : `Status: ${SALE_STATUS[se.status] || humanize(se.status)} — bidding is not open.`}</p>
                )}
              </>
            ) : (
              <>
                <div className="ldp-price-label">Not yet scheduled</div>
                <p className="ldp-bid-note">This lot has no Trading Session yet. It will open for bids once a sale is scheduled and approved.</p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
