import { useCallback, useEffect, useState } from 'react';

// GET-with-lifecycle for API calls. `fn` must be a stable reference or
// wrapped in useCallback — deps controls refetching.
//
//   const { data, loading, error, reload } = useApiQuery(() => me.buyerDashboard(), []);
//
// `fallback` keeps a screen's designed placeholder data visible when the
// backend isn't reachable, so screens degrade instead of going blank.
export function useApiQuery(fn, deps = [], { fallback = null, skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (skip) { setLoading(false); return undefined; }
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(fn)
      .then((res) => { if (alive) { setData(res); setLoading(false); } })
      .catch((err) => { if (alive) { setError(err); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, skip]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: data ?? fallback, raw: data, loading, error, reload, isFallback: !data && !!fallback };
}

// Fire-and-report for POST actions: tracks pending/error per action.
export function useApiAction(fn) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (...args) => {
    setPending(true);
    setError(null);
    try {
      return await fn(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);

  return { run, pending, error, clearError: () => setError(null) };
}
