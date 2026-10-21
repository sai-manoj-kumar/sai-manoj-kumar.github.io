#!/usr/bin/env bash
# Prints anonymous site events from the Analytics Engine dataset, one column per time window.
# Usage: scripts/stats.sh [days...]   (default: 1 7 30)
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

windows=("$@")
[ ${#windows[@]} -gt 0 ] || windows=(1 7 30)
widest=0
columns="" header=""
for d in "${windows[@]}"; do
  [[ "$d" =~ ^[0-9]+$ ]] || { echo "days must be numbers" >&2; exit 1; }
  columns+=", SUM(IF(timestamp > NOW() - INTERVAL '${d}' DAY, _sample_interval, 0)) AS d${d}"
  header+=$'\t'"${d}d"
  [ "$d" -gt "$widest" ] && widest=$d
done
last="d${windows[${#windows[@]}-1]}"

# The SQL API rejects FORMAT TabSeparatedWithNames, so $2 is the header line and the rows come back as
# TabSeparated. Each window adds one count column; $3 is the comma-separated GROUP BY list, also used as the header.
table() {
  local keys=$1 where=$2 group=$3 label=$4
  echo "== ${label} =="
  { printf '%s%s\n' "${group//, /$'\t'}" "$header"
    curl -fsS "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      --data "SELECT ${keys}${columns} FROM saimanoj_site_events WHERE ${where} AND timestamp > NOW() - INTERVAL '${widest}' DAY GROUP BY ${group} ORDER BY ${last} DESC FORMAT TabSeparated"
  } | column -t -s $'\t'
  echo
}

table "blob3 AS source" "blob1 = 'visit'" "source" "Visits by landing source"
table "blob1 AS event, blob2 AS label" "1 = 1" "event, label" "All events"
table "blob3 AS source, blob2 AS link" "blob1 = 'link'" "source, link" "Link clicks by source"
