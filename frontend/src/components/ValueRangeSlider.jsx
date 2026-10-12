import { formatValueRange, VALUE_BAND_LABELS, VALUE_MAX_INDEX } from '../data/classification.js';
import './ValueRangeSlider.css';

// Dual-handle range slider over discrete value bands (₹0 → ₹1Cr+),
// built from two overlapping native range inputs — keeps full keyboard
// and touch support without a custom drag implementation.
export default function ValueRangeSlider({ loIndex, hiIndex, onChange }) {
  const setLo = (v) => { const lo = Math.min(v, hiIndex); onChange(lo, hiIndex); };
  const setHi = (v) => { const hi = Math.max(v, loIndex); onChange(loIndex, hi); };

  const pct = (i) => (i / VALUE_MAX_INDEX) * 100;

  return (
    <div className="vrs-root">
      <div className="vrs-track-wrap">
        <div className="vrs-track" />
        <div className="vrs-track-fill" style={{ left: `${pct(loIndex)}%`, right: `${100 - pct(hiIndex)}%` }} />
        <input type="range" min={0} max={VALUE_MAX_INDEX} step={1} value={loIndex} onChange={(e) => setLo(Number(e.target.value))} className="vrs-input vrs-input--lo" />
        <input type="range" min={0} max={VALUE_MAX_INDEX} step={1} value={hiIndex} onChange={(e) => setHi(Number(e.target.value))} className="vrs-input vrs-input--hi" />
      </div>
      <div className="vrs-scale">
        {VALUE_BAND_LABELS.map((label, i) => (
          <span key={label} className={`vrs-scale__tick${i === loIndex || i === hiIndex ? ' vrs-scale__tick--active' : ''}`}>{label}</span>
        ))}
      </div>
      <div className="vrs-readout">{formatValueRange(loIndex, hiIndex)}</div>
    </div>
  );
}
