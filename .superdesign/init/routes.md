# Routes (static files, GitHub Pages)

| URL | File | Notes |
|---|---|---|
| `/` | `index.html` | One-page home: hero, about+mission, vision & KITTEN values, stats, featured services, services list (11), process, FUFU product, tech strip, portfolio (isotope), credentials, timeline, team, payment, contact |
| `/trust.html` | `trust.html` | Customer trust & data-care page |
| `/services/service-*.html` | 11 files | Service detail: sidebar list + features (i18n list) + price |
| `/team-profile/profile-*.html` | 10 files | Personal profile + portfolio swiper |
| `/card.html?u=` | `card.html` | Digital business card (Firestore) |
| `/back-office/*` | | Internal app, out of scope |

Deploy: `.github/workflows/deploy.yml` copies files to `public/`.
