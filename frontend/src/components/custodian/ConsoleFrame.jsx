import { useAuth, isCustodian } from '../../utils/auth.js';
import CustodianShell from './CustodianShell.jsx';

// Frame for admin pages: the Custodian Console shell for a Custodian, the
// page's own header for everyone else (Disputes, Payout and Rating Reviews
// are also used by TSX Masters and parties).
export default function ConsoleFrame({ header, children }) {
  const { user } = useAuth();
  if (isCustodian(user)) return <CustodianShell>{children}</CustodianShell>;
  return <>{header}{children}</>;
}
