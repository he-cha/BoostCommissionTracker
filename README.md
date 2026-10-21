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

Automatic backfill and IMEI deletion jobs are disabled by default. `RUN_MAINTENANCE_JOBS=true` explicitly enables them, including the protected backfill endpoint. Keep this false for routine evaluation. Create a local user through the supplied seed scripts only after reviewing their inputs. The backend requires a non-placeholder `JWT_SECRET` of at least 32 characters.

## Parser checks

With Node.js 22.18+ or 24 and dependencies installed:

```bash
npm test
```

This executes the existing Node tests for month-range expansion, date-based inference and unrelated payment categories. The tests were run during this cleanup. Their passing result does not establish accounting accuracy across all provider file formats.

## Important implementation limits

Commission and uploaded-file routes now require a valid signed session. This application remains a single shared staff workspace: all authenticated staff can access its records. It does not provide separate tenants or role-based permissions. CSV allocations, inferred months and historical backfills still need validation against reconciled examples.

The authorization/validation update also attaches session tokens to frontend API requests, clears local session data after expiry/logout, normalizes database IDs for edits, and waits for server confirmation before displaying successful writes. Frontend and backend builds and frontend type checking passed. See [verification and rollout notes](docs/API_VALIDATION.md) for test coverage and the blocked database integration check.
