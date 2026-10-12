import { Routes, Route } from 'react-router-dom';
import { routes } from './routes.jsx';

export default function App() {
  return (
    <Routes>
      {routes.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}
    </Routes>
  );
}
