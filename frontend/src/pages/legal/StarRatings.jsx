import { Link } from 'react-router-dom';
import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import { me } from '../../api/endpoints.js';
import { useApiQuery } from '../../api/hooks.js';
import './StarRatings.css';

// GET /my-star-ratings → { party }; the buyer/seller columns pair up by suffix.
function standing(party, side) {
  const rating = side === 'buyer' ? party.star_rating : party.seller_star_rating;
  return {
    rating: rating != null ? Number(rating).toFixed(1) : '—',
    shadowBanned: !!party[`shadow_banned_at_${side}`],
    shadowBannedAt: (party[`shadow_banned_at_${side}`] || '').slice(0, 10),
    crawlBackActive: !!Number(party[`crawl_back_active_${side}`] || 0),
    crawlBackCompleted: party[`crawl_back_clean_completed_${side}`] ?? 0,
    crawlBackRequired: party[`crawl_back_clean_required_${side}`] ?? 0,
  };
}

function RatingCard({ label, data }) {
  return (
    <div className="sr-card">
      <p className="sr-card__label">{label}</p>
      <p className="sr-card__value">★ {data.rating}</p>
      {data.shadowBanned ? (
        <>
          <p className="sr-card__banned">Shadow-banned since {data.shadowBannedAt}</p>
          {data.crawlBackActive && <p className="sr-card__crawlback">Crawl-Back in progress: {data.crawlBackCompleted} / {data.crawlBackRequired} clean transactions completed</p>}
        </>
      ) : (
        <p className="sr-card__good">In good standing</p>
      )}
    </div>
  );
}

export default function StarRatings() {
  const { data } = useApiQuery(() => me.starRatings(), []);
  const party = (data && data.party) || {};
  const buyer = standing(party, 'buyer');
  const seller = standing(party, 'seller');
  return (
    <div className="sr-page">
      <PublicMiniHeader backTo="/profile" backLabel="Back to Profile" />
      <main className="sr-main">
        <h1 className="sr-title">Star Ratings</h1>
        <p className="sr-desc">Your reputation as a Trader and as a Market Maker are tracked separately, even if you do both.</p>
        <div className="sr-cards">
          <RatingCard label="Trader Rating" data={buyer} />
          <RatingCard label="Market Maker Rating" data={seller} />
        </div>
        <p className="sr-history"><Link to="/rating-history">View full rating history →</Link></p>
      </main>
      <footer className="sr-footer"><p>Downgrades are human-reviewed under BR-36 — see the <Link to="/dispute-resolution-process">Dispute Resolution Process</Link>.</p></footer>
    </div>
  );
}
