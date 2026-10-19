import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Marketplace.css';
import AppHeader from '../../components/AppHeader.jsx';
import { discovery } from '../../api/endpoints.js';
import { unwrap, getToken } from '../../api/client.js';

const FORMATS = ['all', 'BUY-NOW', 'EASY', 'EXPRESS', 'TENDER'];
const FORMAT_PARAM = { 'BUY-NOW': 'buy_now', EASY: 'easy', EXPRESS: 'express', TENDER: 'tender' };
const FORMAT_LABEL = { buy_now: 'BUY-NOW', easy: 'EASY', express: 'EXPRESS', tender: 'TENDER' };
const PER_PAGE = 12;

// UI filter state → GET /api/v1/app/browse query params.
function toQuery(f) {
  return {
    q: f.query, location: f.location, price_min: f.priceMin, price_max: f.priceMax,
    min_rating: f.minRating, condition: f.condition, posted: f.posted,
    format: FORMAT_PARAM[f.format] || '', category: f.category === 'all' ? '' : f.category,
    sort: f.sort,
  };
}

// Seeds filters from the URL so saved searches and search history can
// re-run here; accepts both the snake_case keys saved searches store and
// the camelCase keys search history records.
function fromParams(params) {
  const get = (...keys) => keys.map((k) => params.get(k)).find((v) => v) || '';
  const format = get('format');
  return {
    query: get('q'), location: get('location'), priceMin: get('price_min', 'priceMin'), priceMax: get('price_max', 'priceMax'),
    minRating: get('min_rating', 'minRating'), condition: get('condition'), posted: get('posted'),
    format: FORMAT_LABEL[format] || 'all', category: get('category') || 'all', sort: get('sort') || 'recent', page: 1,
  };
}

export default function Marketplace() {
  const [params] = useSearchParams();
  const [lots, setLots] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [saveError, setSaveError] = useState('');
  const [f, setF] = useState(() => fromParams(params));
  const [searchSaved, setSearchSaved] = useState(false);
  const set = (patch) => setF({ ...f, ...patch, page: patch.page ?? 1 });

  useEffect(() => {
    discovery.browse({ ...toQuery(f), page: f.page, per_page: PER_PAGE }).then((res) => {
      const d = unwrap(res);
      setLots((d.listings || []).map((l) => ({
        id: l.listing_id,
        format: FORMAT_LABEL[l.sale_format] || l.sale_format,
        matches: !!l.clvMatch,
        condition: l.physical_condition || '—',
        category: [l.category, l.subcategory].filter(Boolean).join(' › '),
        price: l.display_price != null ? Number(l.display_price) : null,
        sellerRating: l.seller_star_rating != null ? Number(l.seller_star_rating) : null,
      })));
      setCategories(['all', ...(d.allCategories || [])]);
      setTotal(d.total || 0);
      setTotalPages(Math.max(1, d.totalPages || 1));
    }).catch(console.error);
  }, [f]);

  const page = Math.min(f.page, totalPages);
  const visible = lots;

  const saveSearch = async () => {
    setSaveError('');
    if (!getToken()) { setSaveError('Log in to save searches.'); return; }
    const filters = toQuery(f);
    const label = [f.category !== 'all' && f.category, f.format !== 'all' && f.format, f.query].filter(Boolean).join(' · ') || 'All listings';
    try {
      await discovery.saveSearch({ label, ...filters });
      setSearchSaved(true);
    } catch (err) {
      setSaveError(err.message || 'Could not save this search.');
    }
  };

  return (
    <div className="mk-page">
      <AppHeader variant="light" contextNav={[{ label: "Marketplace", to: "/marketplace", active: true }, { label: "Saved Searches", to: "/saved-searches" }]} />

      <main className="mk-main">
        <div className="mk-title-row">
          <h1>Browse All Listings</h1>
          <span className="mk-count">{total} active Listings</span>
        </div>
        <p className="mk-sub">Adjust filters below, then <button onClick={saveSearch} className="mk-link-btn">save this search</button> to re-run it later.</p>
        {searchSaved && <p className="mk-saved">Search saved — find it under Saved Searches.</p>}
        {saveError && <p className="mk-saved" style={{ color: 'var(--color-danger)' }}>{saveError}</p>}

        <div className="mk-layout">
          <aside className="mk-filters">
            <input className="mk-input" placeholder="Search category…" value={f.query} onChange={(e) => set({ query: e.target.value })} />
            <div>
              <div className="mk-label">Location</div>
              <input className="mk-input mk-input--sm" placeholder="City or region" value={f.location} onChange={(e) => set({ location: e.target.value })} />
            </div>
            <div>
              <div className="mk-label">Price (₹)</div>
              <div className="mk-row">
                <input type="number" className="mk-input mk-input--sm" placeholder="Min" value={f.priceMin} onChange={(e) => set({ priceMin: e.target.value })} />
                <input type="number" className="mk-input mk-input--sm" placeholder="Max" value={f.priceMax} onChange={(e) => set({ priceMax: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="mk-label">Min. Seller Rating</div>
              <select className="mk-select" value={f.minRating} onChange={(e) => set({ minRating: e.target.value })}>
                <option value="">Any</option><option value="3">3★+</option><option value="4">4★+</option><option value="5">5★+</option>
              </select>
            </div>
            <div>
              <div className="mk-label">Condition</div>
              <select className="mk-select" value={f.condition} onChange={(e) => set({ condition: e.target.value })}>
                <option value="">Any condition</option><option value="New">New</option><option value="Used">Used</option><option value="Refurbished">Refurbished</option><option value="For Parts">For Parts</option>
              </select>
            </div>
            <div>
              <div className="mk-label">Posted</div>
              <select className="mk-select" value={f.posted} onChange={(e) => set({ posted: e.target.value })}>
                <option value="">Any time</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
              </select>
            </div>
            <div>
              <div className="mk-label">Format</div>
              <div className="mk-btn-col">
                {FORMATS.map((v) => (
                  <button key={v} onClick={() => set({ format: v })} className={`mk-filter-btn${f.format === v ? ' mk-filter-btn--active' : ''}`}>{v === 'all' ? 'All Formats' : v}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="mk-label">Category</div>
              <div className="mk-chip-row">
                {categories.map((v) => (
                  <button key={v} onClick={() => set({ category: v })} className={`mk-chip${f.category === v ? ' mk-chip--active' : ''}`}>{v === 'all' ? 'All' : v}</button>
                ))}
              </div>
            </div>
            <button className="mk-clear" onClick={() => setF({ query: '', location: '', priceMin: '', priceMax: '', minRating: '', condition: '', posted: '', format: 'all', category: 'all', sort: f.sort, page: 1 })}>Clear All Filters</button>
          </aside>

          <div>
            <div className="mk-sort-row">
              <select className="mk-select" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}>
                <option value="recent">Recent first</option><option value="ending_soon">Ending soon</option>
                <option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="rating">Seller rating</option>
              </select>
            </div>

            <div className="mk-grid">
              {visible.map((lot) => (
                <Link key={lot.id} to={`/lot-detail?id=${lot.id}`} className="mk-card">
                  <div className="mk-card__photo">
                    <span className="mk-card__format">{lot.format}</span>
                    {lot.matches && <span className="mk-card__match">✓ Matches your preferences</span>}
                  </div>
                  <div className="mk-card__body">
                    <div className="mk-card__meta">{lot.format} · {lot.condition}</div>
                    <div className="mk-card__title">{lot.category}</div>
                    <div className="mk-card__row"><span className="mk-card__price">₹{lot.price?.toLocaleString('en-IN') || '—'}</span><span className="mk-card__rating">Seller {lot.sellerRating?.toFixed(1) || '—'}★</span></div>
                  </div>
                </Link>
              ))}
            </div>
            {lots.length === 0 && <div className="mk-empty">No Listings match this filter.</div>}
            {totalPages > 1 && (
              <div className="mk-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => set({ page: n })} className="mk-page-btn" style={{ fontWeight: n === page ? 800 : 400, color: n === page ? 'var(--color-accent)' : 'var(--color-text-faint)' }}>{n}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
