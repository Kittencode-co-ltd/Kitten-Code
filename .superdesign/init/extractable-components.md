# Extractable components

## NavBar
- Source: `assets/js/core/layout.js` (headerHtml)
- Category: layout
- Description: Fixed top bar: KITTEN CODE wordmark, 6 anchor links, TH/EN/中/日/한 switch, dark-mode toggle; collapses to burger <1200px
- Extractable props: activeItem (string: home|about|services|portfolio|team|contact)
- Hardcoded: labels (i18n keys nav.*), icons

## Footer
- Source: `assets/js/core/layout.js` (footerHtml)
- Category: layout
- Description: Dark footer: address/phone/email, useful links, 11 service links in 2 columns, admin login, copyright + juristic registration no.
- Extractable props: signedIn (boolean, default false)

## ValueCard
- Source: `index.html` #vision `.value-card`
- Category: basic
- Description: Card with giant faded letter (K/I/T/T/E/N), English title, tag, Thai description

## RecognitionCard
- Source: `index.html` #credentials `.rec-card`
- Category: basic
- Description: Issuer logo, highlighted ranking (e.g. "1 ใน 25"), programme title, date

## ServiceCard
- Source: `index.html` #services-2
- Category: basic
- Description: Icon, service title, description, starting price, "More detail" link
