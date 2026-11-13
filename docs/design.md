# CollegeCompass – design notes

The longer write-up behind the [README](../README.md): how the app is put together, the API, and the trade-offs I made.

## Architecture

```
                        Browser
                           │
        ┌──────────────────┴───────────────────┐
        │                                      │
  Server Components                    Client Components
  (pages, metadata,                    (search, filters, tray,
   first render)                        predictor form)
        │                                      │
        │                              TanStack Query
        │                                      │
        │                              Route Handlers  /api/*
        │                              (validate → call → shape)
        │                                      │
        └──────────────┬───────────────────────┘
                       │
              Service layer  (src/lib/services)
              the only code that touches Prisma
                       │
                 Prisma 7 + adapter-pg
                       │
                 PostgreSQL (Neon)
```

- **Server Components** render the first view of every page. The profile page is rendered entirely on the server; for the listing, comparison and predictor, the server renders whatever the URL asks for. Pages are shareable, indexable and useful before any JavaScript loads.
- **Client Components** handle interaction: typing, filtering, paging, picking colleges to compare and submitting the predictor form.
- **TanStack Query** handles every interactive fetch. It's seeded with the server's result, so the first render is never fetched twice.
- **Route Handlers** are thin: parse the input with Zod, call a service, return a consistent envelope.
- **The service layer** holds all database access. Pages and route handlers both call it, so each query has one implementation.

Server pages call the service directly instead of fetching their own API over HTTP. That would add a network hop and need an absolute URL in every environment.

## Data model

Money is stored as integer rupees. Ranks are positions on an exam's overall merit list.

```
College ─┬─< Course ──< Cutoff
         ├─< PlacementRecord
         └─< Review
```

| Model               | Key fields                                                                                                                                                  | Notes                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **College**         | `slug` (unique), `name`, `shortName`, `city`, `state`, `ownership`, `establishedYear?`, `accreditation?`, `overview`, `annualFees`, `rating`, `reviewCount` | `annualFees` and `rating` are denormalised so listing filters and sorts use indexed columns. Indexes on `state`, `annualFees`, `rating`. |
| **Course**          | `collegeId`, `name`, `degree`, `durationYears`, `annualFees`, `seats?`                                                                                      | One row per branch or specialisation.                                                                                                    |
| **Cutoff**          | `courseId`, `exam`, `category`, `year`, `round`, `closingRank`                                                                                              | Unique on `(courseId, exam, category, year, round)`; indexed on `(exam, category, year, closingRank)` for the predictor.                 |
| **PlacementRecord** | `collegeId`, `year`, `averagePackage`, `medianPackage`, `highestPackage`, `placementRate`, `recruiterCount`                                                 | Unique on `(collegeId, year)`; three years per college.                                                                                  |
| **Review**          | `collegeId`, `rating`, `title`, `body`, `authorLabel`, `createdAt`                                                                                          | `authorLabel` is a programme and batch ("B.Tech CSE, class of 2025"), never an invented name.                                            |

Cutoffs belong to a course rather than a college, because real cutoffs are set per branch. That lets the predictor say "CSE closed at 4,210" instead of giving one vague number per college. Placements are stored as yearly rows, which is how placement data is reported and what the profile page's three-year table needs.

Enums: `Ownership`, `Degree`, `Exam` (JEE Main, MHT CET, KCET, WBJEE), `Category` (General, EWS, OBC, SC, ST).

## API

Every response uses the same envelope:

```ts
{ data: T }                                                  // single resource
{ data: T[], pagination: { page, limit, total, totalPages } } // list
{ error: { code, message, fieldErrors? } }                    // failure
```

`code` is one of `VALIDATION_ERROR`, `NOT_FOUND`, `PAYLOAD_TOO_LARGE` or `INTERNAL_ERROR`. Unexpected errors are logged on the server and returned with a generic message, so stack traces and database details never reach the client.

### `GET /api/colleges`

| Parameter            | Type                                            | Notes                                                                    |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `search`             | string ≤ 100                                    | Matches name, short name, city or state; every word must match something |
| `state`              | string                                          | Exact state name                                                         |
| `ownership`          | `GOVERNMENT` \| `PRIVATE`                       |                                                                          |
| `minFees`, `maxFees` | integer ≥ 0                                     | `minFees` must not exceed `maxFees`                                      |
| `minRating`          | 0–5                                             |                                                                          |
| `sort`               | `rating` \| `fees_asc` \| `fees_desc` \| `name` | Default `rating`                                                         |
| `page`               | integer ≥ 1                                     | Default 1                                                                |
| `limit`              | 1–48                                            | Default 12                                                               |

Returns `200` with the list or `400` with per-field messages. Successful responses are cached by the CDN (`s-maxage=60, stale-while-revalidate=300`); errors never are.

### `GET /api/colleges/[slug]`

Returns `200` with the college, its courses, placement years, rating distribution and 10 most recent reviews. A malformed slug gets a `400` before any query runs; an unknown one gets a `404`.

### `GET /api/colleges/compare?slugs=a,b,c`

Takes one to three unique slugs and returns `200` with `{ colleges, missing }`. Colleges come back in the order requested. A slug that no longer exists is listed in `missing` instead of failing the request, so a shared link with one stale college still works. Returns `400` for no slugs, more than three, duplicates or a malformed slug.

### `POST /api/predict`

```json
{ "exam": "MHT_CET", "rank": 12450, "category": "GENERAL" }
```

Returns `200` with `{ exam, rank, category, basisYear, results, counts }`, and `400` for invalid JSON or fields, including a rank beyond that exam's merit list. Bodies over 10 KB get a `413`; other methods get a `405`.

## How it works

### Search and filters

The URL is the single source of truth for filter state, so refresh, sharing and the Back button all work without extra code.

```
URL  ──parse──▶  typed filters  ──▶  TanStack Query key  ──▶  GET /api/colleges
 ▲                    │
 └────serialize───────┘
```

- **One schema** (`validation/colleges.ts`) defines a valid filter. The API route, the server page and the browser all use it.
- **URL parsing is forgiving.** A hand-edited or outdated URL drops only the invalid parameters and still shows results. The API applies the same rules strictly and answers with a 400.
- **Defaults are left out of the URL**: `?state=Maharashtra`, not `?state=Maharashtra&sort=rating&page=1&limit=12`.
- **Changing a filter or the sort resets to page 1**, since "results 25–36" means nothing once the filters change.
- **History:** typing uses `replaceState`, so a search phrase doesn't leave one entry per keystroke. Filters, sorting and paging use `pushState`, so Back undoes one change at a time.
- **URL updates go through the History API, not the router.** A router navigation would re-run the server component and query the database for data the client is already fetching.
- **Loading and errors:** results stay on screen while the next page loads, a failed refresh keeps the old list and offers a retry, and an empty result explains which filter to relax.
- **Filter options come from the database**, including the state list and its counts.

### Comparison

- **The selection** lives in a small module store read through `useSyncExternalStore`, saved to `localStorage` and synced across tabs. The rules (at most three, no duplicates) are a pure reducer.
- **The tray** is sticky rather than fixed and sits before the footer, so it never covers content. It hides itself on `/compare`.
- **On `/compare` the URL wins.** A shared link shows exactly those colleges and becomes the visitor's selection. Removing a column updates the table, the URL and the tray together.
- **One table, two layouts.** From the `sm` breakpoint up it's a normal side-by-side table. On phones, each attribute becomes a full-width label with the values in equal columns underneath, so three colleges fit at 375 px with no horizontal scrolling.
- **Best values** are labelled "Lowest" or "Highest" in text, and only when the values actually differ.

### Predictor

A closing rank is the last merit-list position admitted to a course. The predictor compares it with the student's rank as a ratio:

```
ratio = closingRank / studentRank

ratio ≥ 1.10          Likely      closed well after this rank
0.90 ≤ ratio < 1.10   Borderline  closed close to this rank
0.70 ≤ ratio < 0.90   Reach       closed ahead of this rank
ratio < 0.70          not shown
```

- **A ratio, not a fixed gap**, because 500 ranks matters a lot at rank 1,000 and hardly at all at rank 2,00,000.
- **Only the last counselling round** of the most recent year is used, since earlier rounds always close earlier.
- **Each college gets the band of its best course**, and lists its matching branches with their closing ranks.
- **Ordering:** by band, then by how close the nearest matching course is to the student's rank, then by name.
- **Results are capped at 20 per band**, while the headings show the true totals.
- **The database pre-filters** at the Reach threshold, so only plausible matches are loaded.

The rules are fixed on purpose. There's no admissions-outcome data to train a model on, fixed thresholds can be inspected and tested, and a model would suggest more confidence than this data supports. The page states that results are estimates from past closing ranks, not an official prediction.

### State

| State                       | Where it lives                | Why                                           |
| --------------------------- | ----------------------------- | --------------------------------------------- |
| Filters, search, sort, page | URL                           | Shareable, survives refresh, Back works       |
| Predictor inputs            | URL                           | A prediction can be shared                    |
| Server data                 | TanStack Query cache          | Caching, cancellation, retries, hydration     |
| Search text before debounce | Local `useState`              | Keystrokes shouldn't touch the URL or network |
| Mobile filter draft         | Local state in the sheet      | Avoids refetching behind an overlay           |
| Comparison selection        | Module store + `localStorage` | Must survive navigation between pages         |

Example URLs:

```
/colleges?search=kaveri&state=Karnataka&ownership=PRIVATE&minRating=4&sort=fees_asc&page=2
/compare?slugs=slug-a,slug-b,slug-c
/predictor?exam=JEE_MAIN&rank=45000&category=OBC
```

There's no Redux or Zustand. The comparison selection is at most three items that change on a click, and a tested reducer behind `useSyncExternalStore` covers it. A module store works better than React context here: the tray lives in the root layout while the buttons live in pages, the store starts empty on the server so the markup matches, and there's no provider to pass through the tree. The comparison URL uses slugs rather than IDs because slugs are readable and survive a reseed.

## Performance

Measured on the production build:

| Measurement                               | Value                                      |
| ----------------------------------------- | ------------------------------------------ |
| JavaScript transferred on `/colleges`     | **177.5 KB** (down from 252 KB)            |
| CSS                                       | 6.4 KB                                     |
| Font (self-hosted variable, latin subset) | 64.6 KB                                    |
| Prerendered college page                  | ~30 ms                                     |
| Dynamic pages, warm                       | 320–380 ms (mostly the round trip to Neon) |

- **Zod was 91 KB gzipped in the client bundle**, because its chained API can't be tree-shaken. Moving the shared schemas to `zod/mini` (same library and rules) cut that to 5.7 KB and the page's JavaScript by 29%.
- **All 125 college pages are prerendered** and revalidated hourly, so the most-visited pages don't touch the database on request.
- **The listing's count and page queries run in parallel, not in a transaction.** Under parallel load, holding a pooled connection across two round trips exhausted Neon's pooler. The data only changes on reseed, so a shared snapshot wasn't needed.
- **Debounced search** (300 ms) and **request cancellation** keep it to one request per phrase.
- **Server Components by default.** The profile page ships no page-specific JavaScript.
- **CDN caching** on API GET responses.

## Accessibility

Every page and every open dialog passes an **axe-core** audit (WCAG 2.1 A/AA plus best practices) with no violations.

The app also uses semantic landmarks and a skip link, one `h1` per page with ordered headings, and labels on every control. `aria-pressed` marks the compare toggle, invalid fields get `aria-invalid` and `aria-describedby`, and result counts are announced with `aria-live`. Status is shown as text and icon rather than by colour alone. Dialogs use the native `<dialog>` element for focus trapping and Escape. Focus rings are visible everywhere, touch targets on phones are 44 px, and `prefers-reduced-motion` is respected.

## Security

The app has no accounts and stores no personal data, so the realistic risks are hostile input, data leaking through errors, abuse of the public API, and vulnerable dependencies.

| Concern                | How it's handled                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SQL injection**      | All queries go through Prisma's query builder, which parameterises values. There's no raw SQL.                                                                                                               |
| **Input validation**   | Every endpoint parses its input with a Zod schema before touching the database, checking type, range, length, allowed values and slug format. Unknown keys (including `__proto__`) are dropped.              |
| **Oversized requests** | JSON bodies are read as a stream and cut off at 10 KB with a `413`, whether or not `Content-Length` is present or honest.                                                                                    |
| **Error leakage**      | Unexpected errors are logged on the server and returned with a fixed generic message, never with stack traces, SQL or connection details.                                                                    |
| **XSS**                | React escapes all rendered values. There's no `dangerouslySetInnerHTML`, `eval` or `innerHTML`.                                                                                                              |
| **Security headers**   | `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security` on every response. `X-Powered-By` is removed. |
| **Secrets**            | Connection strings live only in environment variables. Database code is marked `server-only`, so importing it into a client component fails the build.                                                       |
| **Dependencies**       | `npm audit` reports 0 vulnerabilities. Two packages pulled in by the Prisma CLI (`mysql2`, `deepmerge-ts`) are pinned to patched releases with npm `overrides`.                                              |

Two known gaps:

- **The CSP allows inline scripts.** Next.js injects inline bootstrap scripts, and removing `'unsafe-inline'` needs a per-request nonce. That forces every page to render dynamically and gives up the prerendered college pages.
- **There's no rate limiting.** In-memory limits don't work on serverless, because each instance counts separately. The right fix is platform-level protection (Vercel Firewall) or a shared store such as Upstash Redis.

## Testing

```bash
npm test         # 133 unit and component tests (Vitest)
npm run test:e2e # 22 scenarios on desktop and mobile (Playwright)
npm run db:check # 23 service checks against the real database
```

**Unit and component tests** cover:

- the data generator's invariants: determinism, referential integrity, denormalised fields and cutoff ordering
- URL filter parsing, serialisation and page-reset rules
- pagination windows
- predictor banding, grouping, ordering and caps
- comparison selection limits and recovery from bad stored data
- `en-IN` number formatting
- API routes, with the service mocked: validation, status codes and error envelopes
- the compare button's behaviour in a DOM

**End-to-end tests** cover:

- search, filter, change page, then Back
- opening a college profile
- a real 404 for an unknown college
- selecting and comparing colleges, the three-college limit and removing a column
- a shared comparison link that includes a deleted college
- predictor validation messages, banded results, shared predictions and a rank with no matches
- the API against the live database

These tests found real bugs along the way:

- radio groups sharing a name between the sidebar and the mobile filter sheet
- a pending debounced search reappearing after pressing Back
- reserved-category cutoffs generated below General ones
- the pagination ellipsis hiding a single page number
- unknown colleges returning 200 instead of 404
- transaction timeouts under concurrent load

## Design decisions and trade-offs

| Decision                                           | Why                                                                                                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Numbered pagination, not infinite scroll**       | Positions are linkable, Back returns to the same place, the footer stays reachable, and screen readers handle it better.                             |
| **URL as filter state**                            | Refresh, sharing and Back work without extra code. The cost is serialisation code, kept in one tested module.                                        |
| **Prerendered profiles, `dynamicParams = false`**  | The only way to get a real 404 for an unknown college, since streaming metadata sends a 200 before `notFound()` runs. Also makes those pages ~30 ms. |
| **API routes, not a separate backend**             | One deployment, one type system, shared validation. A separate service would add operational work for no gain at this size.                          |
| **Fictional colleges**                             | Attaching invented fees and placements to real institutions would present made-up numbers as fact.                                                   |
| **Fee ranges instead of numeric inputs**           | Typing rupee amounts is tedious on a phone, and fee brackets match how students think about cost.                                                    |
| **Prisma 7 stable, not the 8.0 release candidate** | npm's `latest` tag pointed at an RC at the time.                                                                                                     |

And what they cost:

- **`dynamicParams = false`** means the build needs database access and a new college needs a redeploy.
- **Denormalised `rating` and `annualFees`** make filtering cheap. If reviews ever become user-submitted, these fields must be updated in the same transaction.
- **Substring (`contains`) search** is simple and needs no index. Beyond a few thousand colleges it should become PostgreSQL full-text or trigram search.
- **Offset pagination** gives page numbers and totals at the cost of a `COUNT` per query: fine at this size, wrong for millions of rows.
- **Opening a shared comparison link replaces the visitor's own selection.** That keeps one simple mental model, but their previous picks are lost.
- **Predictions are capped at 20 per band**, so a very high rank shows the closest matches, not all of them.
