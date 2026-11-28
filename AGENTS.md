# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Company website and back-office financial management system for **KITTEN CODE Co.,Ltd (บริษัท คิทเท่น โค้ด จำกัด)** — a Thai digital agency. Two distinct sections:
- **Public website** (`index.html`, `trust.html`, `services/`, `team-profile/`): Marketing, portfolio, team profiles, credentials and the customer-facing Trust page. Company claims on these pages must be verifiable (see the Awards & Credentials section); don't add unproven figures
- **Back-office** (`back-office/`): Authenticated internal tool for invoices, quotations, receipts, financial tracking, and calendaring

## Tech Stack

- **Frontend**: Vanilla HTML5 + JavaScript (ES6 modules) — no framework
- **Styling**: Bootstrap 5.3.3 + custom SCSS/CSS
- **Backend**: Firebase (Firestore, Auth, Realtime Database)
- **Data Connect**: Firebase Data Connect with PostgreSQL (`fdcdb` database, `asia-southeast1`)
- **i18n**: Custom switcher for Thai, English, Chinese (Simplified), Japanese and Korean via `assets/js/core/i18n.js` and `assets/i18n/{th,en,zh,ja,ko}.json`
- **UI libs**: AOS, GLightbox, Swiper, Chart.js

## Local Development

```bash
npm install                  # install Firebase SDK
firebase emulators:start     # run local Firebase emulators
```

Firebase emulator ports: Firestore `8080`, Auth `9099`, Realtime DB `9000`, Data Connect `9399`.

Firebase config lives in `assets/js/bo/core/firebase-config.js`. It reads `window.__ENV__` (injected at build time by GitHub Actions secrets) and falls back to the public web config hard-coded in the file, so local development works without extra setup. The file is committed (only `assets/js/__ENV__.js` is git-ignored).

There are no npm build scripts, linting, or test suites configured.

## Deployment

CI/CD runs automatically on push to `main` via `.github/workflows/deploy.yml`. It:
1. Copies `assets/`, `back-office/`, `team-profile/`, `services/`, `index.html`, `card.html` and `trust.html` into `public/`
2. Injects Firebase secrets from GitHub Actions environment
3. Deploys `public/` to GitHub Pages

Firebase rules and indexes deploy separately via `firebase deploy`.

## Architecture

### JavaScript (`assets/js/`)

The public website uses `assets/js/core/` (`layout.js`, `main.js`, `hero.js`, `i18n.js`, `theme.js`) and `portfolio-loader.js`. `layout.js` renders the shared header and footer into `<div data-kc-header data-active="…">` / `<div data-kc-footer>` and must load (deferred) before `main.js`; edit the header or footer there, not in the pages.

The back office lives entirely under `assets/js/bo/`:
- `bo/core/firebase-config.js` — Firebase SDK initialization (Auth, Firestore) and re-exports of SDK helpers; every back-office page imports from here
- `bo/core/bo-theme.js` — theme, text size and language preferences; loaded in `<head>` of every back-office page so they apply before first paint
- `bo/core/team-avatars.js` — maps user profiles (`firstName`, `lastName`, `email`) to their official team portrait in `assets/img/team/`
- `bo/pages/` — one module per screen: `user.js` (user management, maintains the `usernames` index), `dashboard.js` (Chart.js charts), `financial.js` (transaction/category CRUD)
- `bo/documents/` — `doc-common.js` (auto numbering, no-overwrite save, edit mode), `script-*.js` (form logic) and `*-template.js` (A4 renderers) for quotation, invoice, receipt, voucher (PR/PO/EXP/PV), certificate and letter (store raw text; escape only at render time); `document-record.js` and `script-document-viewer.js` for the register and re-print viewer

Import paths inside `bo/` are relative: `../core/...` from `bo/pages/` and `bo/documents/`.

### CSS (`assets/css/`)

`main.css` serves the public site and `login.html`. The back office uses `assets/css/bo/`, loaded in this order:
1. `tokens.css` — all colours, type, radius, shadows and motion for light and dark (`:root[data-theme="dark"]`). Change the look here.
2. `base.css` — reset, page frame (`body.bo-page`), helpers
3. `components.css` — buttons, fields, cards, tables, badges, tabs, modal, toast, floating button
4. `shell.css` — sidebar, header, bottom dock, profile menu (only `back-office.html`)
5. `paper.css` — the printed A4 documents; colours here are deliberately fixed and must not use tokens
6. `pages/*.css` — styles for one screen only (`calendar`, `dashboard`, `finance`, `editor`, `profile`, `qr`, `viewer`)

Rules: use `--kc-*` tokens, never raw hex colours, outside `paper.css`; put page-specific rules in `pages/`, not inline; the only inline `style` left in pages are display toggles written by scripts.

Back-office pages are loaded inside the `back-office/back-office.html` shell via an iframe and hash routes (`routeMap`). Each page guards itself with `onAuthStateChanged` and redirects to `login.html`.

### Firestore Security Model

`firestore.rules` enforces role-based access:
- **admin** role: full access to financial data, user management
- **user** role: read-only or scoped write access; may edit own profile but not `role`/`uid`/`email`/`username`
- All operations require authentication, except single-document `get` on `usernames/{name}` (login lookup)

### Firestore Collections

Key collections: `users`, `usernames` (public username → `{ uid, email }` index used by login; get-only, no list), `fin_categories`, `fin_transactions`, `quotations`, `invoices`, `receipts`, `vouchers`, `certificates`, `letters`, `calendar_events`, `staff_directory`.

### Data Connect Schema (`dataconnect/schema/schema.gql`)

PostgreSQL tables via Firebase Data Connect: `User`, `Collection`, `Entry`.

### Multilingual Support

Public pages support th, en, zh, ja and ko. All user-facing strings are keyed in `assets/i18n/<lang>.json`; English is the source of truth and any key missing from another language falls back to English. Markup: `data-i18n="<key>"` (text), `data-i18n-alt` (image alt), `data-i18n-list` (a `<ul>` rebuilt from a string array, optional `data-i18n-icon`), and `<body data-i18n-title="<key>">` for the page title. Add a new key to all five files. Scripts can call `window.KCi18n.t(key)` and listen for the `kc:langchange` event.
