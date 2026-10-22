// Field-by-field comparison of two versions of a document (D-137): every
// leaf is flattened to a readable path and plain text, then compared.
const strip = (v) => String(v ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function flatten(node, path, out) {
  if (Array.isArray(node)) {
    node.forEach((x, i) => {
      const name = x && typeof x === 'object' ? (x.title || x.label || x.term || x.q || x.code || '') : '';
      flatten(x, `${path} › ${i + 1}${name ? ` ${strip(name).slice(0, 40)}` : ''}`, out);
    });
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => flatten(v, path ? `${path} › ${k}` : k, out));
  } else {
    out[path] = strip(node);
  }
  return out;
}

// [{ path, before, after, change: 'changed'|'added'|'removed' }]
export function diffContent(before, after) {
  const a = flatten(before || {}, '', {});
  const b = flatten(after || {}, '', {});
  const rows = [];
  new Set([...Object.keys(a), ...Object.keys(b)]).forEach((path) => {
    if (a[path] === b[path]) return;
    rows.push({ path, before: a[path] ?? '', after: b[path] ?? '', change: !(path in a) ? 'added' : !(path in b) ? 'removed' : 'changed' });
  });
  return rows;
}
