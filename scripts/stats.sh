#!/usr/bin/env bash
# Prints the last N days (default 30) of anonymous site events from the Analytics Engine dataset.
# Needs CF_ACCOUNT_ID and CF_API_TOKEN (a token with "Account Analytics: Read") in the environment.
set -euo pipefail
: "${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}" "${CF_API_TOKEN:?set CF_API_TOKEN}"
days="${1:-30}"
[[ "$days" =~ ^[0-9]+$ ]] || { echo "days must be a number" >&2; exit 1; }

query() {
  curl -fsS "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" --data "$1 FORMAT TabSeparatedWithNames"
}

echo "== Where visitors landed from (last ${days} days) =="
query "SELECT blob3 AS source, SUM(_sample_interval) AS visits FROM saimanoj_site_events WHERE blob1 = 'visit' AND timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY source ORDER BY visits DESC"
echo
echo "== Events =="
query "SELECT blob1 AS event, blob2 AS label, SUM(_sample_interval) AS count FROM saimanoj_site_events WHERE timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY event, label ORDER BY event, count DESC"
echo
echo "== Who clicked LinkedIn or GitHub, by source =="
query "SELECT blob3 AS source, blob2 AS link, SUM(_sample_interval) AS clicks FROM saimanoj_site_events WHERE blob1 = 'link' AND timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY source, link ORDER BY clicks DESC"
