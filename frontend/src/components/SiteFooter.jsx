import { Link } from 'react-router-dom';
import './SiteFooter.css';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span className="site-footer__brand">
          <img src="/adwitix-icon.svg" alt="" className="site-footer__icon" />
          © AdwitiX — Building trust into every asset transaction
        </span>
        <div className="site-footer__links">
          <Link to="/trust-and-support">Trust &amp; Support</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/custodian/login">Custodian Sign In</Link>
        </div>
      </div>
    </footer>
  );
}
