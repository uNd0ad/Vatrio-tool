# Selector maintenance runbook

Use this runbook when a site returns zero listings, triggers a selector warning,
or produces a parse-failure HTML snapshot.

## Contain the failure

1. Identify the affected site in crawler logs and the zero-result alert.
2. Disable only that source with `CRAWLER_ENABLED_SITES` while investigating.
   Keep the other supported site names in the comma-separated value.
3. Check whether the saved page is a CAPTCHA, region lock, consent page, or a
   genuine search-results layout before changing selectors.

Never weaken anti-bot, region-lock, or robots.txt handling to make a selector
test pass.

## Capture and reproduce

1. Locate the HTML snapshot written by `saveParseFailure`. Its log entry
   includes the exact file path and search URL.
2. Remove personal data, session tokens, and inline tracking payloads before
   turning captured HTML into a repository fixture.
3. Replace the affected file in `src/fixtures/`, or add a focused alternate
   layout/category fixture when the old and new layouts both remain active.
4. Reproduce against local HTML. Live pages are useful for diagnosis but are
   not stable test inputs.

## Update selectors

Shared ordered card selectors live in `src/sites/selectors.ts`. Prefer stable
attributes in this order:

1. documented `data-*` identifiers;
2. semantic elements and stable URL patterns;
3. descriptive, non-generated class fragments;
4. a broad element such as `article` only as a final fallback.

Keep existing valid fallbacks when adding a new layout. Extraction selectors
belong in the affected `src/sites/<site>.ts` parser. Do not add a broad shared
selector that can match navigation, advertisements, or unrelated cards.

## Verify

From `crawler/`, run:

```sh
npm test
npm run build
```

The fixture snapshot, layout-variant, category, and site parser tests must all
pass. Confirm the parser extracts a non-empty title and URL, and correctly
handles price, location, transaction type, seller type, and sponsored cards.
Then run a dry crawl for the affected source in a permitted environment and
inspect counts before re-enabling it.

## Roll out and monitor

1. Re-enable the source in `CRAWLER_ENABLED_SITES`.
2. Watch the first crawl for selector warnings, zero-result alerts, parse
   failures, circuit-breaker events, and unusual count changes.
3. Preserve the sanitized regression fixture so the layout remains covered.
4. Record the portal, old/new selector, observed layout, and verification in
   the commit message or pull request.
