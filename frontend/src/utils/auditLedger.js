export function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

export function pushLedger(action, target, detail, actorRole = 'Custodian', actorName = 'Custodian', actorMobile = '—') {
  try {
    const key = 'adwitix_audit_ledger';
    const cur = JSON.parse(localStorage.getItem(key) || '[]');
    cur.push({ at: nowStamp(), actorRole, actorName, actorMobile, action, target, detail });
    localStorage.setItem(key, JSON.stringify(cur));
  } catch (e) { /* noop */ }
}

export function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (e) { return fallback; }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
