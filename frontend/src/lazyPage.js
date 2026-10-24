import { lazy } from 'react';

// React.lazy for a route page. After a new deploy, a tab opened before it
// still asks for the old page files, which no longer exist; that import
// fails, so reload once to pick up the new build instead of a blank screen.
const KEY = 'adwitix_chunk_reload';

export default function lazyPage(load) {
  return lazy(() => load().then(
    (mod) => {
      try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
      return mod;
    },
    (err) => {
      let reloaded = false;
      try { reloaded = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ }
      if (!reloaded) {
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    },
  ));
}
