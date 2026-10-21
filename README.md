# Commission Payment Reconciliation Dashboard

**React · TypeScript · Zustand · Express · MongoDB · CSV processing**

A dashboard for comparing commission payments across device identifiers and payment months. It imports provider CSV files, groups records by IMEI, and helps investigate expected, missing, withheld or adjusted payments.

## Workflows visible in the source

- CSV import and normalization, including explicit month ranges and inferred month numbers.
- Per-device payment summaries, filters, notes and drill-down pages.
- Views for overdue alerts, suspended/deactivated devices, BYOD and blacklist records.
- An Express/Mongoose API for commissions, uploaded-file metadata and login.

This differs from [CommissionTracker](https://github.com/he-cha/CommissionTracker), which centers on manual sales entry and sales/bounty summaries. The older `Boost_Comm` and `Boost_Comm_Tracker` repositories are incomplete prototypes rather than equivalent finished applications.

## Run locally

1. Install frontend dependencies with `npm ci` at the root.
2. Copy `.env.example` to `.env`; set the frontend API base URL.
3. In `backend`, run `npm ci`, copy `.env.example` to `.env`, and configure a disposable local MongoDB database and a random `JWT_SECRET`.
4. Run `npm run dev` in `backend` and `npm run dev` at the root.

Backend startup currently runs a month-number backfill and schedules IMEI cleanup. Use a disposable demo database when evaluating the project; do not point a trial run at live business records. Create a local user through the supplied seed scripts only after reviewing their inputs.

## Parser checks

With Node.js 22.18+ or 24 and dependencies installed:

```bash
npm test
```

This executes the existing Node tests for month-range expansion, date-based inference and unrelated payment categories. The tests were run during this cleanup. Their passing result does not establish accounting accuracy across all provider file formats.

## Important implementation limits

The login endpoint exists, but commission and uploaded-file routes currently do not enforce authentication middleware. Do not expose this API with real customer or business data. Add authorization and verify ownership boundaries before a public deployment. CSV allocations, inferred months and historical backfills also need validation against reconciled examples.

This portfolio cleanup adds project-specific documentation, environment examples and an npm test command. It preserves the existing reconciliation behavior and does not claim measured savings or recovered revenue. The frontend and database-backed application were not fully built or run during this review.
