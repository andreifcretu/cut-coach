# Cut Coach

A standalone PWA for daily nutrition totals, weight, waist, steps, workouts, meal planning, grocery checklists and weekly progress.

## Use

Open https://andreifcretu.github.io/cut-coach/ in iPhone Safari. Tap Share (or More then Share), Add to Home Screen, enable Open as Web App if shown, then Add. Install before you start logging. Open Goals to enter your body details, choose your goal and preview estimated targets. Apply them when ready; Settings also supports manual targets.

Daily: open Today or Log, choose Photo, Barcode or Add food, check the portion and nutrition, and save. Each food gets a time and updates daily calories, protein, carbs and fat. Log a morning weigh-in, use Train for your next session, and review Progress. Meals lets you log a planned dish or your saved whey label with one review step.

## Privacy and backups

All tracking records and optional reference screenshots live in localStorage in the browser on that device. No analytics or cloud diary account. Barcode lookup sends the barcode number to Open Food Facts. Photo analysis sends only the selected compressed photo and optional hint to your own Mac over private Tailscale HTTPS after you tap Analyze; the service processes it in memory and does not save it. GitHub serves public application code, not your entries. Clearing browser/site data can erase entries. Export JSON regularly in Settings; restoration validates the backup and asks for confirmation before replacement. CSV export is also available.

## Capabilities and limits

- Offline app shell after one successful online load and service worker installation.
- Timestamped food diary with barcode and photo review, repeat foods, editable portions, deletion with undo, and automatic macro totals. Optional other-food totals and reference screenshots remain available; exclude foods already in the diary to avoid double counting. No Cal AI/HealthKit sync.
- Seven-day averages use actual dated observations. Trend comparison requires at least three weights in each week. No automatic calorie reductions or predicted deadlines.
- Meal nutrition is an estimate. Shopping quantities are approximate. Food storage guidance: https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts
- Rebuilt from the prior conversation's requirements because its original ZIP download was blocked by Chrome. This is not an extraction of that ZIP.

## Development

No build step or dependencies. Serve this directory with any static server. GitHub Pages deploys main at the repository root. Bump the cache version in sw.js whenever changing shell assets. An existing open client may need closing and reopening to activate an updated service worker.

## Training plan

The calendar is a rolling sequence: Upper A → Lower A → easy run/walk → Upper B → Lower B → easy run/walk → recovery. Completing a session advances it; missed days do not. Recovery can extend this beyond seven days, so sessions are never crammed into a catch-up day.

In Train, save your recovery check-in, log each working set (load, reps/seconds, optional reps in reserve and Done), tap Save sets, then Finish session. Change the date to backfill or correct an earlier session. Before logging sets, you can select a different session if that is what you actually did. Progress and Train show session details and direct/supporting muscle sets over seven days.

Coaching uses conservative, explainable rules: leave an intervening calendar day for recently worked muscles, omit recent direct core work, reduce targets for moderate fatigue/soreness, pause for high soreness/pain/very low energy, and respect the lower of four or the user's weekly strength target. This is calendar-based guidance, not a precise 48-hour or biological recovery measurement. Recent lower-body work changes an aerobic recommendation to walking. Partial sets count for recovery even before the workout is finished.

Load advice compares the same exercise only. Two logs at the same load with all target sets at the upper rep target and at least two reps in reserve qualify for a small optional increase of at most 5%. Unknown effort, different exercises, fatigue and long gaps do not trigger increases. Actual weights are never silently changed. The new/returning introduction uses two sets for the first eight finished strength sessions.

Training is stored separately from nutrition check-ins; both are included in JSON backup/restore. Existing legacy logs are preserved without inferring uncertain sets or muscle identities. CSV exports daily check-ins only. No sensors, external workout sync, cloud service or autonomous model training are involved.

Reference: https://acsm.org/resistance-training-guidelines-update-2026/ . Specific scheduling/progression rules above are app heuristics, not a clinical prescription or claims that ACSM endorsed this implementation.

Each strength session includes warm-up, sets/reps/rest cues, two-frame photo-loop demonstrations with pause controls, individual load/rep records, and a completion checklist. Beginning/returning lifters start with fewer sets. No fabricated working loads are calculated from age or body mass. Profile fields are optional and stored locally. Actual working load is selected through an effort-based practice set. This is a general adult exercise template, not an individually assessed medical prescription.

## Media and sources

Meal photos were generated for selected onion-free meals and are illustrative, not nutrition measurements. Exercise photo references are from https://github.com/yuhonas/free-exercise-db (public domain / Unlicense; see EXERCISE-LICENSE.md). Their start/end photo loops are not full-motion technique videos. Written cues were authored for this app; the source dataset instructions are not used as coaching prescriptions.

General activity and running sources:
- https://www.cdc.gov/physical-activity-basics/guidelines/adults.html
- https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/

All images are bundled locally and cached for offline access. No third-party image requests are needed during use.

## Daily memory and coaching

Save check-in persists the date's calories, protein, carbs, fat and activity. Today shows the three-macro breakdown and above/remaining calorie feedback. Progress includes weekly macro averages, data-based feedback and paginated history for every saved date. Historical calorie/protein comparisons use the target captured with that day's nutrition entry. Older entries without a target snapshot remain available but are excluded from historical target comparisons. Optional carb/fat targets can be set in Settings. Goal changes are user-reviewed; feedback updates automatically but calorie targets never silently change.

Storage remains local to the device/browser; it is not cloud sync. Use Export backup for a separate copy. Clearing website data or losing the device can remove local entries.

## Midnight interface update

The interface now uses a black/navy palette with cyan actions, blue/lavender nutrition accents, a consolidated calorie-and-macro dashboard, and photo-led meal cards. Menu browsing is separate from prep and groceries. Secondary reports, settings and guidance remain available through disclosures.

Train shows one exercise at a time. Previous/Next and the movement chooser save edited sets before switching. Invalid sets prevent navigation so edits can be corrected. Reopening starts with the first exercise that has incomplete target sets. Recovery checks and session settings remain accessible above the player; Finish session explicitly advances the training sequence.

Design work was coordinated across a visual-system agent, workout-experience agent and local-model review agent, with integration and browser verification by the main agent. Three completed local Ollama review calls used downloaded qwen3.5:9b and qwen3.5:35b models. No model download or cloud-model call was used for those reviews. Model suggestions were reviewed against actual app behavior.

## Goals, weekly menus and whey

Goals stores age, height, current/starting/goal weight, training experience, equation selection, activity and goal preferences. Imperial and metric entry share canonical storage. Saving a profile does not change active nutrition targets. Preview and explicitly apply an estimate to update calories, protein, carbs and fat. Historical nutrition snapshots are retained. An optional seven-day mean uses at least three recent weigh-ins; it never silently applies new targets.

The calculator uses Mifflin–St Jeor, an activity multiplier and an adjustable goal offset. Protein options are 1.4–2.0 g/kg, fat about 30% of energy and carbohydrate the remainder. These are starting estimates for generally healthy adults, not individually measured needs. The app bounds its calculator to ages 19–78, BMI 18.5–40 and results of 1500–5000 kcal; these implementation limits are not personal safety thresholds. Missing inputs, implausible combinations and conflicting goal weights do not produce recommendations. It is not designed for pregnancy or breastfeeding.

Egg dishes use only scrambled eggs or omelettes, matching your preference. Meals offers 24 onion-free recipes across breakfast, lunch, dinner and snacks. Navigate days and weeks, swap dishes, and adjust portions from 0.5 to 3 in quarter steps. Macro estimates and the weekly grocery list follow those choices. Shopping checks persist per week and changed quantities become unchecked. Recipes use explicit ingredient quantities with generic macro estimates; they are flexible menus, not a promise to meet every target. Actual consumption is logged separately.

Enter the whey package's powder weight, calories, protein, carbs and fat in Goals. Meals then scales that exact label for your chosen serving fraction and shows the selected menu's protein gap. Scoops are not assumed to have a universal size. Whey is optional, separate from menus and never automatically logged. Other shake ingredients must be logged separately.

Profiles, whey labels, dated swaps, portions and shopping checks are included in JSON backup/restore. All remain on the current device/browser. A downloaded local qwen3.5:9b model reviewed the personalization UX; the calculator and planner use deterministic code, not runtime AI.

References:
- https://pubmed.ncbi.nlm.nih.gov/2305711/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
- https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner
- https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures

## Photo and barcode scanning

Photo scanning uses your Mac's already-downloaded qwen3.5:9b vision model through Ollama. Your Mac must be awake and logged in, with Ollama available, and Tailscale must be connected on your iPhone. In Log → Photo → Private photo connection, use Check connection. Allow local-network access if the phone asks. The helper starts at Mac login and is exposed only within your private Tailscale network. It is not a public photo API.

Choose a plate photo or a clear nutrition label. Tap Analyze on my Mac, then review the foods, portions and macros before Save food to diary. Results are estimates, particularly portions, oils and hidden ingredients. Unreadable label values remain blank and must be filled before saving. A scan is a draft, never an automatic claim of nutrition accuracy. Photos are not retained in the diary; only the reviewed entries are saved.

Barcode supports live camera, barcode photos and typed digits. Internet access is required for product lookup. Product data comes from Open Food Facts (https://world.openfoodfacts.org/), made available under ODbL; check the current package and serving basis. Unknown products can be entered manually. Barcode decoding uses bundled @zxing/browser 0.2.1 (MIT; vendor/ZXING-LICENSE.txt), including on browsers without BarcodeDetector.

Food records are included in JSON backups. Editing replaces the entry; moving an entry to another date updates both days. Daily other-food totals are kept separately and added once. Scanning and product lookup require their network connections, but saved history and manual logging work offline after the app is cached.
