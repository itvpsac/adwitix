import { useState } from 'react';

// Both star ratings over time (BR-35): a step line per score, built from the
// applied rating events — each change holds until the next one. Trader
// (buyer) = series 1, Market Maker (seller) = series 2, from the validated
// dataviz palette. The 2.0★ line marks Crawl-Back (BR-38). Hover a point
// for the event; the full ledger below is the table view.
const SERIES = [
  { key: 'star_rating', name: 'Trader', color: '#2a78d6' },
  { key: 'seller_star_rating', name: 'Market Maker', color: '#eb6834' },
];
const W = 760, H = 240, L = 36, R = 110, T = 14, B = 28;

export default function RatingChart({ events, start, current }) {
  const [hover, setHover] = useState(null);
  const applied = (events || []).filter((e) => e.status === 'applied' && e.applied_at)
    .map((e) => ({ ...e, t: Date.parse(e.applied_at.replace(' ', 'T')) })).sort((a, b) => a.t - b.t);
  // Start at the account's creation, or the first event if older data predates it.
  const created = Date.parse(String(start || '').replace(' ', 'T'));
  const t0 = Math.min(Number.isNaN(created) ? Infinity : created, applied[0] ? applied[0].t : Infinity, Date.now() - 86400000);
  const t1 = Date.now();
  const x = (t) => L + ((t - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - v / 5) * (H - T - B);

  const lines = SERIES.map((s) => {
    const pts = [{ t: t0, v: 3, e: null }];
    applied.filter((e) => e.rating_role === s.key).forEach((e) => pts.push({ t: e.t, v: Number(e.new_value), e }));
    const last = current && current[s.key] != null ? Number(current[s.key]) : pts[pts.length - 1].v;
    let d = `M${x(pts[0].t)},${y(pts[0].v)}`;
    for (let i = 1; i < pts.length; i++) d += ` H${x(pts[i].t)} V${y(pts[i].v)}`;
    d += ` H${x(t1)}`;
    return { ...s, pts, d, last, end: pts[pts.length - 1].v };
  });
  // End labels sit at the line's end; pull apart any that would collide.
  const labelY = lines.map((s) => y(s.end));
  if (labelY.length === 2 && Math.abs(labelY[0] - labelY[1]) < 14) {
    const mid = (labelY[0] + labelY[1]) / 2;
    const up = labelY[0] <= labelY[1] ? 0 : 1;
    labelY[up] = mid - 8;
    labelY[1 - up] = mid + 8;
  }
  const fmt = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

  return (
    <figure className="rc" aria-label="Star ratings over time">
      <div className="rc-legend">
        {lines.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.name} <b>{s.last.toFixed(1)}★</b></span>)}
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={lines.map((s) => `${s.name} ${s.last.toFixed(1)} stars`).join(', ')}>
          {[1, 2, 3, 4, 5].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 2 ? '#b45a3c' : '#e6e4dd'} strokeDasharray={v === 2 ? '4 4' : undefined} strokeWidth="1" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b6a65">{v}★</text>
            </g>
          ))}
          <text x={W - R + 6} y={y(2) + 4} fontSize="10.5" fill="#6b6a65">Crawl-Back</text>
          <text x={L} y={H - 8} fontSize="11" fill="#6b6a65">{fmt(t0)}</text>
          <text x={W - R} y={H - 8} fontSize="11" fill="#6b6a65" textAnchor="end">Today</text>
          {lines.map((s) => (
            <g key={s.key}>
              <path d={s.d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
              <text x={W - R + 6} y={labelY[lines.indexOf(s)] + 4} fontSize="11.5" fontWeight="600" fill="#2b2b29">{s.name} {s.end.toFixed(1)}</text>
              {s.pts.filter((p) => p.e).map((p) => (
                <g key={p.e.id} onMouseEnter={() => setHover({ ...p, s })} onMouseLeave={() => setHover(null)} onFocus={() => setHover({ ...p, s })} onBlur={() => setHover(null)} tabIndex={0}>
                  <circle cx={x(p.t)} cy={y(p.v)} r="10" fill="transparent" />
                  <circle cx={x(p.t)} cy={y(p.v)} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />
                </g>
              ))}
            </g>
          ))}
        </svg>
        {hover && (
          <div className="rc-tip" style={{ left: `${(x(hover.t) / W) * 100}%`, top: `${(y(hover.v) / H) * 100}%` }}>
            <b>{hover.s.name}: {Number(hover.e.previous_value).toFixed(1)} → {Number(hover.e.new_value).toFixed(1)}★</b>
            <span>{hover.e.reason || hover.e.event_type}</span>
            <span>{fmt(hover.t)}</span>
          </div>
        )}
      </div>
      {applied.length === 0 && <figcaption className="cl-empty">No rating changes yet — both scores are at the 3.0★ start.</figcaption>}
    </figure>
  );
}
