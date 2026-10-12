import AppHeader from './AppHeader.jsx';
import { useAuth } from '../utils/auth.js';

// Kept for API compatibility — the public site renders the shared header.
// Auth state now comes from the shared auth store, not props.
export default function SiteHeader() {
  const { isLoggedIn } = useAuth();
  return <AppHeader variant="light" primaryCta={isLoggedIn ? { label: 'List an Asset', to: '/apply-to-sell' } : undefined} />;
}
