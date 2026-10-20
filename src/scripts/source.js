/* Where a visit came from, as one short word. An explicit tag in the link (?ref= or ?utm_source=) beats the
   referrer, because LinkedIn's app and many mail clients strip the referrer. Only a hostname is ever kept from
   a referrer, never its path or query. The result is lowercase [a-z0-9._-], at most 40 characters. */
const ALIASES = [
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'twitter'],
  [/(^|\.)(lnkd\.in|linkedin\.com)$/, 'linkedin'],
  [/(^|\.)linkedin\.android$/, 'linkedin'], // android-app://com.linkedin.android/
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)news\.ycombinator\.com$/, 'hackernews'],
];

export function cleanSource(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
}

export function resolveSource({ search = '', referrer = '', host = '' } = {}) {
  const params = new URLSearchParams(search);
  const tagged = cleanSource(params.get('utm_source') || params.get('ref'));
  if (tagged) return tagged;

  let hostname = '';
  try {
    hostname = new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return 'direct';
  }
  if (!hostname || hostname === host.replace(/^www\./, '')) return 'direct';
  for (const [pattern, name] of ALIASES) if (pattern.test(hostname)) return name;
  return cleanSource(hostname) || 'direct';
}
