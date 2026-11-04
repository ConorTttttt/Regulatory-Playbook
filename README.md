# Regulatory Playbook

An offline-ready, mobile-friendly reference for **international chemical hazard classification** (GHS, CLP, WHMIS and local implementation rules).

## Open the guidebook

- **[Open the app](./index.html)** — download this file and open it in a desktop browser; the guidebook contents work offline.
- **[View the source guidebook file](./index.html)** — a self-contained HTML app with embedded classification reference data.
- On a phone, a website served over HTTPS is more reliable than opening a local HTML file.

## Chapters — Version 2.0

1. **Classification lists:** 18 jurisdictions, mandatory vs conditional/advisory status, official sources and direct list downloads where available.
2. **GHS editions:** jurisdiction-specific adoption, national standards, and transitions.
3. **Hazard applicability:** hazard classes/categories with adopted, not adopted, conditional, and not verified statuses; compare two jurisdictions.

Includes country search, filters, local notes, favourites, dark mode, and JSON note import/export.

## Run locally

Open `index.html` directly or serve the repository directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. Internet is required for external regulator links.

## Publish on GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, select **main**, then **/(root)** and Save. GitHub will give you the hosted URL. After publishing, open the site on a phone and use **Add to Home Screen** / **Install App** as offered by your browser.

The service worker caches the app shell after the first successful HTTPS visit. Government source websites are not cached.

## Reference data

- `data.json` — country classification-list reference data.
- `ghs_data.json` — GHS editions and hazard applicability reference data.
- `docs/chapter-01.md` — initial quick-reference chapter.

**Note:** The self-contained `index.html` embeds a snapshot of the JSON data. Editing the separate JSON files does **not** automatically update the running application. Until the application is refactored to fetch JSON at runtime, update the embedded `DATA` and `GHS_DATA` values in `index.html` together with the exported JSON files.

## Regulatory cautions

**Reviewed 4 November 2026.** Reference information is not a substitute for checking current legislation, binding classification entries, substance-specific scope, effective dates, ATPs, and transitional rules.

- A mandatory classification list may cover only some hazard classes.
- `Not adopted` is not the same as `not hazardous`; `not verified` is not an exclusion.
- GHS revision number alone does not establish which optional building blocks a jurisdiction has implemented.
- Some downloadable lists are non-binding compilations; consult legal sources before making regulatory decisions.

## Privacy

No account, analytics service or backend is required. Favourites and personal notes are stored in the local browser. Export notes to preserve them before clearing browser storage or switching devices.

## Deployment note

GitHub Pages and installation are optional; this repository does not automatically enable Pages for you.
