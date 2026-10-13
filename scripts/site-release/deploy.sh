#!/usr/bin/env bash
# Existing Cloudflare Pages upload, with exhaustive discovery and production readback.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p site-release-report
python3 scripts/site-release/discover.py --output site-release-report/discovery.json
export SITE_DISCOVERY="$PWD/site-release-report/discovery.json"
bash tests/test_site_release.sh
npm run build
npm run build:protein
npm run verify:shared-header
npm run verify:shared-footer
npm run verify:dark-cards
npm run verify:palette-copies
npx wrangler pages deploy dist --project-name=kangdaejong-com --branch=main
npx wrangler pages deploy dist-protein --project-name=protein-kangdaejong --branch=main
# Upload success is not completion. Nonzero readback keeps the release incomplete.
node scripts/site-release/live.mjs --output site-release-report/production
