#!/usr/bin/env node
// audit-deps.js — fail the build if any blocklisted analytics/telemetry
// packages appear in package.json or package-lock.json.

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const BLOCKLIST = [
  '@sentry/browser',
  '@sentry/react',
  'mixpanel-browser',
  'posthog-js',
  '@amplitude/analytics-browser',
  '@segment/analytics-next',
  'react-ga',
  'react-ga4',
  '@google-analytics/data',
  'fullstory-browser',
  '@fullstory/browser',
  'logrocket',
  'hotjar',
]

const filesToCheck = ['package.json', 'package-lock.json'].filter((f) =>
  existsSync(resolve(f)),
)

const violations = []

for (const pkg of BLOCKLIST) {
  for (const file of filesToCheck) {
    const content = readFileSync(resolve(file), 'utf8')
    if (content.includes(`"${pkg}"`)) {
      violations.push(`${pkg} (found in ${file})`)
    }
  }
}

if (violations.length > 0) {
  console.error('\nERROR: Blocklisted analytics/telemetry package(s) detected:')
  for (const v of violations) {
    console.error(`  - ${v}`)
  }
  console.error('\nRemove these packages before merging. See PR-03 for the full blocklist.')
  process.exit(1)
}

console.log('Dependency audit passed — no blocklisted packages found.')
