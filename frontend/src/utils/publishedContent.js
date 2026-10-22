import { useEffect, useState } from 'react';
import { legalDocs } from '../api/endpoints.js';
import { unwrap } from '../api/client.js';

// Published legal/help content (D-137). Each page ships its own built-in
// text, which is version 1; once the Custodian publishes a newer version,
// the page shows that instead. Until the request answers (or if it fails),
// the built-in text shows, so a page is never blank.
const cache = {};

export function usePublishedContent(slug, fallback) {
  const [doc, setDoc] = useState(cache[slug] || null);
  useEffect(() => {
    if (cache[slug]) return undefined;
    let live = true;
    legalDocs.get(slug)
      .then((r) => {
        const d = unwrap(r) || {};
        if (d.content) {
          cache[slug] = d;
          if (live) setDoc(d);
        }
      })
      .catch(() => {});
    return () => { live = false; };
  }, [slug]);
  if (!doc) return fallback;
  return { ...(fallback || {}), ...doc.content, version: doc.version, effectiveDate: doc.effective_date };
}
