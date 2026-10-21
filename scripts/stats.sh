#!/usr/bin/env bash
# Prints the last N days (default 30) of anonymous site events from the Analytics Engine dataset.
# The account ID and an API token (scope "Account Analytics: Read") are read from CF_ACCOUNT_ID / CF_API_TOKEN,
# else from the macOS keychain items below. Store them once with (the -w with no value prompts for it):
#   security add-generic-password -s saimanoj-site-cf-account-id -a "$USER" -w
#   security add-generic-password -s saimanoj-site-cf-analytics -a "$USER" -w
set -euo pipefail
keychain() { security find-generic-password -s "$1" -w 2>/dev/null || true; }
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-$(keychain saimanoj-site-cf-account-id)}"
CF_API_TOKEN="${CF_API_TOKEN:-$(keychain saimanoj-site-cf-analytics)}"
: "${CF_ACCOUNT_ID:?no account ID: set CF_ACCOUNT_ID or add the keychain item (see the comment at the top)}"
: "${CF_API_TOKEN:?no token: set CF_API_TOKEN or add the keychain item (see the comment at the top)}"
days="${1:-30}"
[[ "$days" =~ ^[0-9]+$ ]] || { echo "days must be a number" >&2; exit 1; }

# The SQL API rejects FORMAT TabSeparatedWithNames, so $2 is the header line and the rows come back as TabSeparated.
query() {
  printf '%s\n' "$2"
  curl -fsS "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" --data "$1 FORMAT TabSeparated"
}

echo "== Where visitors landed from (last ${days} days) =="
query "SELECT blob3 AS source, SUM(_sample_interval) AS visits FROM saimanoj_site_events WHERE blob1 = 'visit' AND timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY source ORDER BY visits DESC" $'source\tvisits'
echo
echo "== Events =="
query "SELECT blob1 AS event, blob2 AS label, SUM(_sample_interval) AS count FROM saimanoj_site_events WHERE timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY event, label ORDER BY event, count DESC" $'event\tlabel\tcount'
echo
echo "== Who clicked LinkedIn or GitHub, by source =="
query "SELECT blob3 AS source, blob2 AS link, SUM(_sample_interval) AS clicks FROM saimanoj_site_events WHERE blob1 = 'link' AND timestamp > NOW() - INTERVAL '${days}' DAY GROUP BY source, link ORDER BY clicks DESC" $'source\tlink\tclicks'
