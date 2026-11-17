# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Company website and back-office financial management system for **KITTEN CODE Co.,Ltd (บริษัท คิทเท่น โค้ด จำกัด)** — a Thai digital agency. Two distinct sections:
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

Firebase config is injected at build time via GitHub Actions secrets. For local development, `assets/js/bo/core/firebase-config.js` falls back to the public web config, so no manual setup is needed.

There are no npm build scripts, linting, or test suites configured.

## Deployment

CI/CD runs automatically on push to `main` via `.github/workflows/deploy.yml`. It:
1. Copies `assets/`, `back-office/`, and `index.html` into `public/`
2. Injects Firebase secrets from GitHub Actions environment
3. Deploys `public/` to GitHub Pages

Firebase rules and indexes deploy separately via `firebase deploy`.

## Architecture

### JavaScript Modules (`assets/js/`)

Each page has a dedicated JS file:
- `bo/core/firebase-config.js` — Firebase SDK initialization (Auth, Firestore); back-office code lives in `assets/js/bo/` and styles in `assets/css/bo/` (see AGENTS.md)
- `i18n.js` — language switching; persists selection to `localStorage`
- `main.js` — global UI (scroll behavior, mobile nav, AOS animations)
- `dashboard.js` — Chart.js financial charts
- `financial.js` — transaction/category CRUD
- `script-invoice.js`, `script-quotation.js`, `script-receipt.js` — document generation

### Firestore Security Model

`firestore.rules` enforces role-based access:
- **admin** role: full access to financial data, user management
- **user** role: read-only or scoped write access
- All operations require authentication

### Firestore Collections

Key collections: `users`, `categories`, `transactions`, `quotations`, `invoices`, `receipts`, `calendar_events`, `attendance`, `leave_requests`, `equipment`, `equipment_log`, `announcements`, `company_profile`, `contracts` (admin only), `ims_docs`, `ims_policies`, `ims_acks`, `ims_roles`, `ims_raci`, `ims_training`, `ims_stakeholders`, `ims_comms`, `ims_risks`, `ims_objectives`, `ims_changes` (ISO registers; staff read, admin write; `ims_acks` = own policy acknowledgements).

### Data Connect Schema (`dataconnect/schema/schema.gql`)

PostgreSQL tables via Firebase Data Connect: `User`, `Collection`, `Entry`.

### Bilingual Support

All user-facing strings are keyed in `assets/i18n/en.json` and `assets/i18n/th.json`. HTML elements use `data-i18n="<key>"` attributes; `i18n.js` swaps text on language toggle.
