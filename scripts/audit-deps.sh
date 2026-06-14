#!/usr/bin/env bash
# audit-deps.sh — fail the build if any blocklisted analytics/telemetry
# packages appear in package.json or package-lock.json.

set -euo pipefail

BLOCKLIST=(
  "@sentry/browser"
  "@sentry/react"
  "mixpanel-browser"
  "posthog-js"
  "@amplitude/analytics-browser"
  "@segment/analytics-next"
  "react-ga"
  "react-ga4"
  "@google-analytics/data"
  "fullstory-browser"
  "@fullstory/browser"
  "logrocket"
  "hotjar"
)

VIOLATIONS=()

for pkg in "${BLOCKLIST[@]}"; do
  # Search both package.json and package-lock.json (if it exists).
  # Use grep -F for literal string matching (no regex interpretation of @, /).
  files_to_check=("package.json")
  if [[ -f "package-lock.json" ]]; then
    files_to_check+=("package-lock.json")
  fi

  for file in "${files_to_check[@]}"; do
    if grep -qF "\"${pkg}\"" "$file" 2>/dev/null; then
      VIOLATIONS+=("${pkg} (found in ${file})")
    fi
  done
done

if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
  echo ""
  echo "ERROR: Blocklisted analytics/telemetry package(s) detected:"
  for v in "${VIOLATIONS[@]}"; do
    echo "  - ${v}"
  done
  echo ""
  echo "Remove these packages before merging. See PR-03 for the full blocklist."
  exit 1
fi

echo "Dependency audit passed — no blocklisted packages found."
exit 0
