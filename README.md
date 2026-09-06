# Cut Coach

A standalone PWA for daily nutrition totals, weight, waist, steps, workouts, meal planning, grocery checklists and weekly progress.

## Use

Open https://andreifcretu.github.io/cut-coach/ in iPhone Safari. Tap Share (or More then Share), Add to Home Screen, enable Open as Web App if shown, then Add. Install before you start logging. Visit Settings to edit targets.

Daily: morning weigh-in, log meals in Cal AI, manually copy the running totals here, update steps and workout, then mark final totals at bedtime. Saving replaces a day's totals, preventing duplicate imports. Review weekly averages on Progress. Sunday: review and prepare meals.

## Privacy and backups

All tracking data and compressed screenshots live in localStorage in the browser on that device. No analytics, accounts or external API calls. GitHub serves public application code, not your entries. Clearing browser/site data can erase entries. Export JSON regularly in Settings; restoration validates the backup and asks for confirmation before replacement. CSV export is also available.

## Capabilities and limits

- Offline app shell after one successful online load and service worker installation.
- Manual Cal AI totals and screenshot reference attachment. No OCR or Cal AI/HealthKit sync.
- Seven-day averages use actual dated observations. Trend comparison requires at least three weights in each week. No automatic calorie reductions or predicted deadlines.
- Meal nutrition is an estimate. Shopping quantities are approximate. Food storage guidance: https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts
- Rebuilt from the prior conversation's requirements because its original ZIP download was blocked by Chrome. This is not an extraction of that ZIP.

## Development

No build step or dependencies. Serve this directory with any static server. GitHub Pages deploys main at the repository root. Bump the cache version in sw.js whenever changing shell assets. An existing open client may need closing and reopening to activate an updated service worker.
