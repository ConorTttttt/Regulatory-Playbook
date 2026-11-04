# Regulatory Playbook

**Version 3.0 — a multi-page, mobile-friendly GHS/CLP classification reference.**

The guidebook now groups **18 jurisdictions under 16 classification regulatory frameworks**. For example, EU CLP covers the EU, EEA countries and Northern Ireland, but records regional adoption/transition differences explicitly. GB CLP remains a different regulation.

## Open locally from GitHub

```bash
git clone https://github.com/ConorTttttt/Regulatory-Playbook.git
cd Regulatory-Playbook
python3 -m http.server 8000
```

Then open **http://localhost:8000**. To update an existing clone: `git pull origin main`, then reload.

**A local web server is now required:** the pages load editable JSON reference data with `fetch`. Double-clicking the HTML file may be blocked by browser file-origin security.

## Pages

| Page | Link | Purpose |
|---|---|---|
| Home | [index.html](index.html) | Dashboard for navigation and coverage |
| Classification lists | [classification-lists.html](classification-lists.html) | Mandatory, conditional and advisory lists with official links |
| GHS editions | [ghs-editions.html](ghs-editions.html) | Adopted GHS revisions and national implementation differences |
| Compare classifications | [compare.html](compare.html) | Select multiple hazard classifications **and regulations**, compare matrix statuses, use Differences only |
| Regulation explorer | [regulations.html](regulations.html) | Directory of regulatory frameworks |
| Regulation details | [regulation.html?id=eu-clp](regulation.html?id=eu-clp) | Choose one regulation and see **all** adopted, not-adopted, conditional, regional-variation, and not-verified hazard classes |

The original all-in-one reference is preserved as `legacy-guidebook.html`.

## Reference model

- `data.json`: jurisdiction profiles, list status and official classification-list links.
- `ghs_data.json`: GHS editions, hazard classes, jurisdiction-level status matrix, substance-agnostic hazard notes and source links.
- `regulatory-schemes.json`: **regulation-to-jurisdiction mapping**, legal scope descriptions and grouping caveats.
- `site.js`: shared data loading, page rendering, multi-selection and source panels.
- `site.css`: shared responsive stylesheet.
- `service-worker.js`: app-shell caching for offline use after the first successful online visit.

**Do not combine jurisdictions solely because they use the same GHS revision.** Regulation groups are based on the relevant law. EU CLP is grouped across the EU, Northern Ireland and EEA; regional implementation may still vary.

### Aggregate status rules

For each regulatory group the app compares its constituent jurisdiction entries:

- **Adopted / Not adopted / Conditional / Not verified:** shown when *all* covered regions have the same recorded status.
- **Regional variation:** shown where any member jurisdiction's recorded status differs from another. Open the hazard details to inspect the underlying country statuses and official sources.
- **Differences only:** shows a confirmed difference only when at least two selected regulations have different *confirmed* statuses (adopted, not adopted, conditional). Unverified or regionally mixed status is not independently treated as a confirmed difference.

Status refers to **whether a hazard class/category is within a regulatory classification system**, not whether a particular substance or mixture carries that classification. The current hazard data includes grouped categories; a group's adoption status does not establish the status of each individual variant.

### Editing reference data

Unlike the earlier self-contained HTML app, the new pages read the JSON files directly. Changes to `regulatory-schemes.json`, `ghs_data.json`, and `data.json` are reflected after reloading (and cache refresh as needed). If you add a new jurisdiction, map it exactly once in the scheme JSON.

## Host / install on mobile

In GitHub **Settings → Pages**, deploy the `main` branch from `/(root)`. The resulting HTTPS site works in mobile browsers and can be added to the home screen. It caches application pages for offline browsing after initial load; regulatory websites linked from the application still require internet access.

## Regulatory integrity

**Reference data reviewed 4 November 2026.** Confirm current legislation, substance identity, harmonised entries, effective and transitional dates, hazard notes and sector scope before making classification or SDS decisions. A mandatory national classification list is different from an obligation to self-classify under GHS. `Not verified` is not an exclusion.

## Privacy

No login, remote data storage or analytics. Colour theme and compare selections are stored in the browser via localStorage.
