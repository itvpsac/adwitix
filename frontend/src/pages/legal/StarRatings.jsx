import { Link } from 'react-router-dom';
import PublicMiniHeader from '../../components/PublicMiniHeader.jsx';
import './StarRatings.css';

const buyer = { rating: '3.0', shadowBanned: false };
const seller = { rating: '2.5', shadowBanned: true, shadowBannedAt: '2026-06-18', crawlBackActive: true, crawlBackCompleted: 3, crawlBackRequired: 8 };

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
