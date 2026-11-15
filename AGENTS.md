# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Company website and back-office financial management system for **Kitten Code Co., Ltd.** — a Thai digital agency. Two distinct sections:
- **Public website** (`index.html` + `team-profile/`): Marketing, portfolio, team profiles
- **Back-office** (`back-office/`): Authenticated internal tool for invoices, quotations, receipts, financial tracking, and calendaring

## Tech Stack

- **Frontend**: Vanilla HTML5 + JavaScript (ES6 modules) — no framework
- **Styling**: Bootstrap 5.3.3 + custom SCSS/CSS
- **Backend**: Firebase (Firestore, Auth, Realtime Database)
- **Data Connect**: Firebase Data Connect with PostgreSQL (`fdcdb` database, `asia-southeast1`)
- **i18n**: Custom English/Thai switcher via `assets/js/i18n.js` and `assets/i18n/{en,th}.json`
- **UI libs**: AOS, GLightbox, Swiper, Chart.js

## Local Development

```bash
npm install                  # install Firebase SDK
firebase emulators:start     # run local Firebase emulators
```

Firebase emulator ports: Firestore `8080`, Auth `9099`, Realtime DB `9000`, Data Connect `9399`.

Firebase config lives in `assets/js/core/firebase-config.js`. It reads `window.__ENV__` (injected at build time by GitHub Actions secrets) and falls back to the public web config hard-coded in the file, so local development works without extra setup. The file is committed (only `assets/js/__ENV__.js` is git-ignored).

There are no npm build scripts, linting, or test suites configured.

## Deployment

CI/CD runs automatically on push to `main` via `.github/workflows/deploy.yml`. It:
1. Copies `assets/`, `back-office/`, and `index.html` into `public/`
2. Injects Firebase secrets from GitHub Actions environment
3. Deploys `public/` to GitHub Pages

Firebase rules and indexes deploy separately via `firebase deploy`.

## Architecture

### JavaScript Modules (`assets/js/`)

Shared modules live in `assets/js/core/`:
- `core/firebase-config.js` — Firebase SDK initialization (Auth, Firestore) and re-exports of SDK helpers; every page imports from here
- `core/i18n.js` — language switching; persists selection to `localStorage`
- `core/main.js` — global UI (scroll behavior, mobile nav, AOS animations)
- `core/theme.js` — theme handling

Page modules (import paths are relative to the file: `./core/...` from `assets/js/`, `../core/...` from `assets/js/documents/`):
- `user.js` — user management (admin), maintains the `usernames` index
- `dashboard.js` — Chart.js financial charts
- `financial.js` — transaction/category CRUD
- `documents/script-invoice.js`, `documents/script-quotation.js`, `documents/script-receipt.js`, `documents/script-certificate.js`, `documents/certificate-template.js` — document & employment/internship certificate generation (store raw text; escape only at render time)
- `documents/document-record.js`, `documents/script-document-viewer.js` — document list and re-print viewer

Back-office pages are loaded inside the `back-office/back-office.html` shell via an iframe and hash routes (`routeMap`). Each page guards itself with `onAuthStateChanged` and redirects to `login.html`.

### Firestore Security Model

`firestore.rules` enforces role-based access:
- **admin** role: full access to financial data, user management
- **user** role: read-only or scoped write access; may edit own profile but not `role`/`uid`/`email`/`username`
- All operations require authentication, except single-document `get` on `usernames/{name}` (login lookup)

### Firestore Collections

Key collections: `users`, `usernames` (public username → `{ uid, email }` index used by login; get-only, no list), `fin_categories`, `fin_transactions`, `quotations`, `invoices`, `receipts`, `certificates`, `calendar_events`.

### Data Connect Schema (`dataconnect/schema/schema.gql`)

PostgreSQL tables via Firebase Data Connect: `User`, `Collection`, `Entry`.

### Bilingual Support

All user-facing strings are keyed in `assets/i18n/en.json` and `assets/i18n/th.json`. HTML elements use `data-i18n="<key>"` attributes; `i18n.js` swaps text on language toggle.
