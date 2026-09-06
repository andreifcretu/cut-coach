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

## Training plan

- Monday: Upper A, about 60 minutes.
- Tuesday: Lower A, about 60 minutes.
- Wednesday: easy run/walk, 20–30 minutes.
- Thursday: Upper B, about 60 minutes.
- Friday: Lower B, about 60 minutes.
- Saturday: easy run/walk, 20–30 minutes.
- Sunday: recovery.

Each strength session includes warm-up, sets/reps/rest cues, two-frame photo-loop demonstrations with pause controls, individual load/rep records, and a completion checklist. Beginning/returning lifters start with fewer sets. No fabricated working loads are calculated from age or body mass. Profile fields are optional and stored locally. Actual working load is selected through an effort-based practice set. This is a general adult exercise template, not an individually assessed medical prescription.

## Media and sources

Meal photos were generated for the four onion-free meals and are illustrative, not nutrition measurements. Exercise photo references are from https://github.com/yuhonas/free-exercise-db (public domain / Unlicense; see EXERCISE-LICENSE.md). Their start/end photo loops are not full-motion technique videos. Written cues were authored for this app; the source dataset instructions are not used as coaching prescriptions.

General activity and running sources:
- https://www.cdc.gov/physical-activity-basics/guidelines/adults.html
- https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/

All images are bundled locally and cached for offline access. No third-party image requests are needed during use.
