import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes.jsx';
import AcceptanceGate from './components/AcceptanceGate.jsx';

// Pages load on demand (React.lazy in routes.jsx), so each visit downloads
// only the screen it opens; this shows while that screen's code arrives.
function PageLoading() {
  return <div role="status" aria-live="polite" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '500 14px var(--font-sans)', color: 'var(--color-text-muted)' }}>Loading…</div>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
      <AcceptanceGate />
    </Suspense>
  );
}
