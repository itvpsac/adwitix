import { Navigate } from 'react-router-dom';
import { useAuth, isCustodian } from './utils/auth';
import LandingPage from './pages/landing/LandingPage.jsx';

// "/" is the public landing page, except for a signed-in Custodian, whose
// landing page is the Custodian Dashboard.
export default function HomeRoute() {
  const { user } = useAuth();
  return isCustodian(user) ? <Navigate to="/custodian/dashboard" replace /> : <LandingPage />;
}
