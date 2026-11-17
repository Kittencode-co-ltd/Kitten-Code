# Security notes — back-office

The site is static (GitHub Pages). **All real protection is Firestore rules + Firebase Auth.** The web API key and
project ids in the page source are public by design and are not secrets.

## For whoever deploys (hand-off)
The rules in `firestore.rules` are **not live until deployed**. The app code assumes the new rules (admin-only approvals,
`isStaff()` gate, read-only `company_profile`), so deploy them together with the new site.

1. Sign in to the Firebase CLI with the Google account that **owns or edits the `kitten-code` project**
   (needs *Firebase Rules Admin* + *Service Usage Consumer*, or Editor).
2. (Optional but recommended) run the rule tests — needs Java 11+ and `npm i -D firebase-tools @firebase/rules-unit-testing`:
   `npx firebase emulators:exec --only firestore --project demo-kitten "node scripts/firestore-rules.test.mjs"` → expect **65 passed, 0 failed**.
3. `firebase deploy --only firestore:rules --project kitten-code`
4. Smoke test with an admin and a normal staff login: staff can open Today/Calendar/Attendance, cannot see Contracts or approve money;
   admin can do both.
5. If anything locks staff out, roll back in the console (Firestore → Rules → history) and report it.

## What the code enforces (`firestore.rules`)
- **Staff = an admin-created `users/{uid}` profile.** Anyone can create a Firebase Auth account, but without a profile
  they can read and write nothing (`isStaff()`). Only an admin can create a profile, so nobody can make themselves admin.
- Admin-only: contracts, user management, approving money (`fin_transactions` paid/rejected, quotation/voucher
  *Approved/Paid*), editing approved ledger rows, equipment management, announcements.
- Staff cannot rewrite their own check-in time (only the check-out); borrowing equipment can only be for yourself and
  only the holder can return it.

## Do these in the Firebase / Google Cloud console (not possible from code)
1. **Deploy the rules**: `firebase deploy --only firestore:rules` (rules changes do nothing until deployed).
2. **Restrict the API key** (Google Cloud → APIs & Services → Credentials): HTTP referrers = your GitHub Pages domain
   (+ `localhost` for development); API restrictions = Identity Toolkit, Firestore, Token Service.
3. **Authentication → Settings**: keep *Email enumeration protection* ON; set a password policy (min 10, upper/lower/number).
   Do **not** disable sign-up — the admin "add user" screen creates accounts with the client SDK. The `isStaff()` rule
   already makes stray sign-ups useless.
4. **Turn on App Check** (reCAPTCHA v3) for Firestore and Auth once the web app is registered.
5. **Require 2-step verification** on the Google accounts that own the Firebase project and the GitHub repository.
6. Enable **Firestore backups / point-in-time recovery**, and review Authentication → Users for accounts you don't recognise.
7. When an employee leaves: delete their user in the back-office (removes the profile → no access) **and** disable the
   Auth account in the console.

## Known limits
- `usernames/{name}` can be read by anyone who guesses a username (needed so people can sign in with a username); it
  returns that person's login email. Use long, non-obvious usernames for admins, or switch the login to email only.
- Check-in times come from the employee's device clock (the document is server-stamped, the time string is not).
- GitHub Pages cannot send HTTP security headers. The pages carry a minimal CSP meta tag (`object-src`, `base-uri`,
  `form-action`) and `noindex`; clickjacking protection needs a host that can set `X-Frame-Options`/`frame-ancestors`.
- Signing out clears cached drafts/hand-off data from the browser; there is no idle auto-logout yet.
