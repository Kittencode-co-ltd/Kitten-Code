# Components

Stack: static HTML5 + vanilla JS, Bootstrap 5.3.3 grid/utilities, Bootstrap Icons, AOS, Swiper, GLightbox, Isotope. No React/Tailwind. Custom CSS in `assets/css/main.css` (BootstrapMade 'Dewi' template, heavily extended). i18n via `data-i18n` attributes (5 languages).

Shared UI primitives are CSS classes, not JS components:

#### Language switcher (.lang-toggle/.lang-btn)

```css
/* Language Switcher (TH / EN / 中 / 日 / 한) */
.lang-toggle-wrapper {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.lang-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: color-mix(in srgb, var(--default-color) 10%, transparent);
  border-radius: 20px;
  padding: 3px;
}

.lang-toggle .lang-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--nav-color);
  font-family: var(--nav-font);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  min-width: 34px;
  padding: 7px 10px;
  border-radius: 16px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.lang-toggle .lang-btn:hover:not(.active) {
  color: var(--nav-hover-color);
}

.lang-toggle .lang-btn.active {
  background-color: var(--accent-color);
  color: var(--contrast-color);
}

.lang-toggle .lang-btn:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* Mobile Navigation */
@media (max-width: 1199px) {
  .mobile-nav-toggle {
    color: var(--nav-color);
    font-size: 28px;
    line-height: 0;
    margin-right: 10px;
    cursor: pointer;
    transition: color 0.3s;
  }

  .lang-toggle-wrapper {
    margin-left: 0;
    padding: 10px 20px;
  }

  .navmenu {
    padding: 0;
    z-index: 9997;
  }

  .navmenu ul {
    display: none;
    list-style: none;
    position: absolute;
    inset: 60px 20px 20px 20px;
    padding: 10px 0;
    margin: 0;
    border-radius: 6px;
    background-color: var(--nav-mobile-background-color);
    border: 1px solid color-mix(in srgb, var(--default-color), transparent 90%);
    box-shadow: none;
    overflow-y: auto;
    transition: 0.3s;
    z-index: 9998;
  }

  .navmenu a,
  .navmenu a:focus {
    color: var(--nav-dropdown-color);
    padding: 10px 20px;
    font-family: var(--nav-font);
    font-size: 17px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    transition: 0.3s;
  }

  .navmenu a i,
  .navmenu a:focus i {
    font-size: 12px;
    line-height: 0;
    margin-left: 5px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: 0.3s;
    background-color: color-mix(in srgb, var(--accent-color), transparent 90%);
  }

  .navmenu a i:hover,
  .navmenu a:focus i:hover {
    background-color: var(--accent-color);
    color: var(--contrast-color);
  }

  .navmenu a:hover,
  .navmenu .active,
  .navmenu .active:focus {
    color: var(--nav-dropdown-hover-color);
  }

  .navmenu .active i,
  .navmenu .active:focus i {
    background-color: var(--accent-color);
    color: var(--contrast-color);
    transform: rotate(180deg);
  }

  .navmenu .dropdown ul {
    position: static;
    display: none;
    z-index: 99;
    padding: 10px 0;
    margin: 10px 20px;
    background-color: var(--nav-dropdown-background-color);
    transition: all 0.5s ease-in-out;
  }

  .navmenu .dropdown ul ul {
    background-color: rgba(33, 37, 41, 0.1);
  }

  .navmenu .dropdown > .dropdown-active {
    display: block;
    background-color: rgba(33, 37, 41, 0.03);
  }

  .mobile-nav-active {
    overflow: hidden;
  }

  .mobile-nav-active .mobile-nav-toggle {
    color: #fff;
    position: absolute;
    font-size: 32px;
    top: 15px;
    right: 15px;
    margin-right: 0;
    z-index: 9999;
  }

  .mobile-nav-active .navmenu {
    position: fixed;
    overflow: hidden;
    inset: 0;
    background: rgba(33, 37, 41, 0.8);
    transition: 0.3s;
  }

  .mobile-nav-active .navmenu > ul {
    display: block;
  }
}
```

#### Theme toggle

```css
# Theme Toggle Button
--------------------------------------------------------------*/
.theme-toggle-wrapper {
  display: flex;
  align-items: center;
  margin-left: 6px;
}

.theme-toggle-btn {
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  color: var(--nav-color, #e5eaee);
  font-size: 16px;
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background: rgba(255, 255, 255, 0.05);
  transform: rotate(15deg);
}

.theme-toggle-btn .theme-icon-dark,
.theme-toggle-btn .theme-icon-light {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* When scrolled on light mode, adjust toggle visibility */
[data-theme="light"] .scrolled .theme-toggle-btn,
.scrolled .theme-toggle-btn {
  border-color: rgba(255, 255, 255, 0.25);
}

/* Mobile: adjust toggle inside menu */
@media (max-width: 1199px) {
  .theme-toggle-wrapper {
    margin-left: 0;
    padding: 10px 20px;
  }

  .theme-toggle-btn {
    border-color: rgba(0, 0, 0, 0.15);
    color: var(--nav-dropdown-color, #444444);
  }

  [data-theme="dark"] .theme-toggle-btn {
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--nav-color, #c8cdd5);
  }
}
```

#### Buttons (.btn-kc/.btn-kc-ghost)

```css
# Shared buttons
--------------------------------------------------------------*/
.btn-kc,
.btn-kc-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}

.btn-kc {
  background: var(--accent-color);
  color: var(--contrast-color);
  border: 2px solid var(--accent-color);
}

.btn-kc:hover {
  background: color-mix(in srgb, var(--accent-color), #000 12%);
  color: var(--contrast-color);
}

.btn-kc-ghost {
  border: 2px solid color-mix(in srgb, var(--default-color), transparent 70%);
  color: var(--heading-color);
}

.btn-kc-ghost:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}
```

#### Value cards

```css
# Vision & KITTEN values
--------------------------------------------------------------*/
.vision-statement {
  max-width: 880px;
  margin: 0 auto 72px;
}

.vision-label {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--accent-color);
  margin-bottom: 16px;
}

.vision-en {
  font-family: "Inter", var(--heading-font);
  font-size: clamp(1.9rem, 4.6vw, 3.4rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -1px;
  color: var(--heading-color);
  margin-bottom: 14px;
}

.vision-local {
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  line-height: 1.6;
  color: color-mix(in srgb, var(--default-color), transparent 10%);
  margin-bottom: 22px;
}

html[lang="en"] .vision-local {
  display: none;
}

.vision-philosophy {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 10px;
  padding: 10px 22px;
  border-radius: 50px;
  border: 1px solid color-mix(in srgb, var(--accent-color), transparent 60%);
  font-size: 0.95rem;
  margin: 0;
}

.vision-philosophy strong {
  color: var(--accent-color);
}

.value-card {
  position: relative;
  height: 100%;
  padding: 32px 28px 28px;
  background: var(--surface-color);
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--default-color), transparent 90%);
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.value-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--accent-color), transparent 50%);
}

.value-letter {
  position: absolute;
  top: -18px;
  right: 14px;
  font-family: "Inter", var(--heading-font);
  font-size: 120px;
  font-weight: 800;
  line-height: 1;
  color: color-mix(in srgb, var(--accent-color), transparent 84%);
  pointer-events: none;
}

.value-card h3 {
  position: relative;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.value-card h3::first-letter {
  color: var(--accent-color);
}

.value-tag {
  position: relative;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
  margin-bottom: 14px;
}

.value-desc {
  position: relative;
  margin: 0;
}
```

#### Recognition + proof cards

```css
# Awards & credentials
--------------------------------------------------------------*/
.rec-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px 22px;
  background: var(--surface-color);
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--default-color), transparent 88%);
}

.rec-issuer {
  height: 44px;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.rec-issuer img {
  max-height: 40px;
  max-width: 120px;
  object-fit: contain;
}

.issuer-text {
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 1px;
  padding: 6px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent-color), transparent 88%);
  color: var(--accent-color);
}

.rec-highlight {
  font-family: "Inter", var(--heading-font);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--accent-color);
  margin-bottom: 8px;
}

.rec-card h3 {
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 14px;
}

.rec-date {
  margin-top: auto;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
}

.proof-card {
  position: relative;
  height: 100%;
  padding: 28px 26px 26px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface-color), var(--default-color) 3%);
  border: 1px solid color-mix(in srgb, var(--default-color), transparent 88%);
}

.proof-docs {
  display: flex;
  height: 130px;
  margin-bottom: 20px;
}

.proof-docs img {
  height: 120px;
  width: auto;
  border-radius: 6px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: rotate(-4deg);
}

.proof-docs img + img {
  margin-left: -28px;
  margin-top: 10px;
  transform: rotate(5deg);
}

.proof-docs-wide img {
  height: 96px;
}

.proof-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--default-color), transparent 30%);
  margin-bottom: 8px;
}

.proof-kicker img {
  height: 22px;
  width: auto;
}

.proof-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 14px;
}

.proof-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.92rem;
}

.proof-list li {
  padding: 7px 0;
  border-top: 1px solid color-mix(in srgb, var(--default-color), transparent 90%);
}

.proof-list code {
  font-family: "Inter", var(--default-font);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-color);
  margin-right: 6px;
}

.proof-verify {
  margin-left: 6px;
  font-weight: 600;
  white-space: nowrap;
}

.proof-note {
  font-size: 0.8rem;
  margin: 10px 0 0;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
}

.credentials-foot {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.credentials-foot p {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
}
```

#### Process steps

```css
# Process
--------------------------------------------------------------*/
.process-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  position: relative;
}

.process-list::before {
  content: "";
  position: absolute;
  top: 22px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: color-mix(in srgb, var(--accent-color), transparent 70%);
}

.process-step {
  position: relative;
  text-align: center;
  padding: 0 6px;
}

.process-num {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--accent-color);
  color: var(--contrast-color);
  font-weight: 700;
  margin-bottom: 16px;
  box-shadow: 0 0 0 6px var(--background-color);
}

.process-step > i {
  display: block;
  font-size: 28px;
  color: var(--heading-color);
  margin-bottom: 8px;
}

.process-step h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.process-step p {
  font-size: 0.9rem;
  margin: 0;
  color: color-mix(in srgb, var(--default-color), transparent 15%);
}

@media (max-width: 991px) {
  .process-list {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .process-list::before {
    top: 0;
    bottom: 0;
    left: 22px;
    right: auto;
    width: 2px;
    height: auto;
  }

  .process-step {
    display: grid;
    grid-template-columns: 46px 1fr;
    column-gap: 18px;
    text-align: left;
    padding: 0 0 26px;
  }

  .process-num {
    grid-row: span 3;
    margin: 0;
  }

  .process-step > i {
    display: none;
  }
}
```

#### Product section

```css
# Our product: FUFU Pet Care
--------------------------------------------------------------*/
.product-kicker {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent-color);
  margin-bottom: 14px;
}

.product-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.product-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 18px;
  background: #fff;
}

.product-brand h2 {
  font-size: clamp(1.8rem, 3.4vw, 2.4rem);
  font-weight: 700;
  margin: 0;
}

.product-slogan {
  margin: 2px 0 0;
  color: color-mix(in srgb, var(--default-color), transparent 30%);
}

.product-intro {
  font-size: 1.05rem;
  margin-bottom: 18px;
}

.product-features {
  list-style: none;
  padding: 0;
  margin: 0 0 22px;
}

.product-features li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 7px 0;
}

.product-features i {
  color: var(--accent-color);
  font-size: 1.2rem;
  line-height: 1.4;
}

.product-proof {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--surface-color);
  border-left: 4px solid var(--accent-color);
}

.product-proof strong {
  font-family: "Inter", var(--heading-font);
  font-size: 2.4rem;
  line-height: 1;
  color: var(--accent-color);
}

.product-disclaimer {
  font-size: 0.85rem;
  margin: 10px 0 24px;
  color: color-mix(in srgb, var(--default-color), transparent 35%);
}

.product-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.product-phones {
  position: relative;
  height: 560px;
  max-width: 520px;
  margin: 0 auto;
}

.product-phones .phone {
  position: absolute;
  width: 46%;
  border-radius: 28px;
  padding: 8px;
  background: #11161b;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.18);
}

.product-phones .phone img {
  display: block;
  width: 100%;
  border-radius: 21px;
}

.product-phones .phone-front {
  left: 27%;
  top: 0;
  z-index: 2;
}

.product-phones .phone-back-left {
  left: 0;
  top: 60px;
  transform: rotate(-6deg);
}

.product-phones .phone-back-right {
  right: 0;
  top: 60px;
  transform: rotate(6deg);
}

@media (max-width: 575px) {
  .product-phones {
    height: 420px;
  }
}
```

#### Payment cards

```css
# Payment Section — Themeable Classes
--------------------------------------------------------------*/
.payment-method-card {
  cursor: pointer;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  background: var(--surface-color, #fff);
  border: 2px solid rgba(128, 128, 128, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.payment-method-card .method-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(128, 128, 128, 0.15);
  border-radius: 16px 16px 0 0;
}

.payment-method-card .pm-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.payment-method-card .pm-sublabel {
  font-size: 10px;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
  margin-top: 2px;
}

.payment-method-card .pm-icon-wrap {
  font-size: 42px;
  line-height: 1;
  margin-bottom: 10px;
}

.payment-method-card .pm-logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Payment Detail Panel */
.payment-panel-card {
  background: var(--surface-color, #fff);
  border-radius: 24px;
  padding: 40px 36px;
  border: 1px solid rgba(128, 128, 128, 0.12);
  transition: background-color 0.35s ease, border-color 0.35s ease;
}

.payment-panel-card .panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}

.payment-panel-card .panel-header .bank-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.payment-panel-card .panel-bank-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--heading-color);
}

.payment-panel-card .panel-secure-label {
  font-size: 13px;
  font-weight: 500;
  margin-top: 2px;
}

.payment-panel-card .panel-account-badge {
  margin-left: auto;
  background: rgba(128, 128, 128, 0.08);
  border-radius: 10px;
  padding: 8px 14px;
  text-align: center;
}

.payment-panel-card .panel-badge-label {
  font-size: 10px;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.payment-panel-card .panel-badge-value {
  font-size: 13px;
  font-weight: 700;
}

.payment-panel-card .panel-field-label {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--default-color), transparent 40%);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.payment-panel-card .panel-holder-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--heading-color);
}

.payment-panel-card .panel-holder-sub {
  font-size: 14px;
  font-weight: 500;
  color: color-mix(in srgb, var(--default-color), transparent 30%);
}

.payment-panel-card .panel-acno-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(128, 128, 128, 0.05);
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid rgba(128, 128, 128, 0.12);
}

.payment-panel-card .panel-acno {
  font-size: 22px;
  font-weight: 700;
  color: var(--heading-color);
  letter-spacing: 2px;
  font-family: monospace;
}

.payment-panel-card .panel-btn-group {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.payment-panel-card .btn-show-acno {
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  background: rgba(128, 128, 128, 0.08);
  border: 1.5px solid currentColor;
}

.payment-panel-card .btn-copy-acno {
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-panel-card .copy-msg {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.3s;
}

/* QR Payment Panels */
.payment-panel-card.qr-panel {
  text-align: center;
}

.payment-panel-card .qr-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--heading-color);
  margin-bottom: 6px;
}

.payment-panel-card .qr-desc {
  font-size: 13px;
  color: color-mix(in srgb, var(--default-color), transparent 30%);
  margin-bottom: 24px;
}

.payment-panel-card .qr-frame {
  display: inline-block;
  padding: 16px;
  background: rgba(128, 128, 128, 0.04);
  border-radius: 20px;
  border: 2px solid rgba(128, 128, 128, 0.12);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.payment-panel-card .qr-frame img {
  width: 240px;
  height: 240px;
  object-fit: contain;
  border-radius: 12px;
  display: block;
}

/* Dark mode specifics for payment */
[data-theme="dark"] .payment-method-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

[data-theme="dark"] .payment-panel-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .payment-panel-card .qr-frame {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}
```

### `assets/js/core/main.js`

```js
/**
* Template Name: Dewi
* Template URL: https://bootstrapmade.com/dewi-free-multi-purpose-html-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', () => {
    aosInit();
    // Listen for image load events in capture phase to refresh AOS when lazy-loaded images load
    document.body.addEventListener('load', (e) => {
      if (e && e.target && e.target.tagName === 'IMG') {
        if (typeof AOS !== 'undefined') {
          AOS.refresh();
        }
      }
    }, true);
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   * data-kc-since="2019" keeps a "years since" counter current without editing the page.
   */
  document.querySelectorAll('[data-kc-since]').forEach(function(el) {
    var years = new Date().getFullYear() - parseInt(el.getAttribute('data-kc-since'), 10);
    if (years > 0) el.setAttribute('data-purecounter-end', String(years));
  });
  new PureCounter();

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      if (swiperElement.swiper) return;

      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  window.addEventListener("load", initSwiper);

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    // Items marked .portfolio-hidden stay collapsed until "Load More" is clicked
    let withHidden = function(f) {
      return isotopeItem.querySelector('.isotope-item.portfolio-hidden') ? f + ':not(.portfolio-hidden)' : f;
    };

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: withHidden(filter),
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: withHidden(this.getAttribute('data-filter'))
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

    let loadMoreBtn = isotopeItem.parentElement.querySelector('.portfolio-load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        isotopeItem.querySelectorAll('.isotope-item.portfolio-hidden').forEach(function(item) {
          item.classList.remove('portfolio-hidden');
        });
        let activeFilter = isotopeItem.querySelector('.isotope-filters .filter-active');
        initIsotope.arrange({
          filter: activeFilter ? activeFilter.getAttribute('data-filter') : '*'
        });
        loadMoreBtn.parentElement.remove();
      });
    }

  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a:not(.lang-btn)');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active:not(.lang-btn)').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);

  /**
   * Horizontal timeline: drop the edge fade once scrolled to the end
   */
  document.querySelectorAll('.timeline-scroll').forEach(function(box) {
    function check() {
      box.classList.toggle('at-end', box.scrollLeft + box.clientWidth >= box.scrollWidth - 4);
    }
    box.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  });
  document.addEventListener('scroll', navmenuScrollspy);

})();

/**
 * Payment Section
 *  [data-pay-method]  switches the visible panel (#panel-<method>)
 *  [data-acno-toggle] shows / hides the full account number
 *  [data-acno-copy]   copies the account number (enabled only while shown)
 * Brand colours come from the .brand-<method> classes in main.css.
 */
(function() {
  "use strict";

  function t(key, fallback) {
    var v = window.KCi18n && window.KCi18n.t(key);
    return typeof v === 'string' && v ? v : fallback;
  }

  function setToggleLabel(btn, shown) {
    btn.setAttribute('aria-pressed', shown ? 'true' : 'false');
    btn.querySelector('i').className = shown ? 'bi bi-eye-slash' : 'bi bi-eye';
    var label = btn.querySelector('span');
    label.setAttribute('data-i18n', shown ? 'payment.hide' : 'payment.show');
    label.textContent = shown ? t('payment.hide', 'Hide') : t('payment.show', 'Show');
  }

  document.addEventListener('click', function(e) {
    var method = e.target.closest('[data-pay-method]');
    if (method) {
      var code = method.getAttribute('data-pay-method');
      document.querySelectorAll('[data-pay-method]').forEach(function(c) {
        var on = c === method;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.querySelectorAll('.payment-panel').forEach(function(p) {
        p.hidden = p.id !== 'panel-' + code;
      });
      return;
    }

    var toggle = e.target.closest('[data-acno-toggle]');
    if (toggle) {
      var panel = toggle.closest('.payment-panel');
      var full = panel.querySelector('[data-acno-full]');
      var show = full.hidden;
      full.hidden = !show;
      panel.querySelector('[data-acno-mask]').hidden = show;
      panel.querySelector('[data-acno-copy]').disabled = !show;
      setToggleLabel(toggle, show);
      return;
    }

    var copy = e.target.closest('[data-acno-copy]');
    if (copy) {
      var box = copy.closest('.payment-panel');
      var text = box.querySelector('[data-acno-full]').textContent.trim();
      navigator.clipboard.writeText(text).then(function() {
        var msg = box.querySelector('[data-acno-msg]');
        msg.classList.add('show');
        clearTimeout(msg._t);
        msg._t = setTimeout(function() { msg.classList.remove('show'); }, 2500);
      });
    }
  });
})();

```

