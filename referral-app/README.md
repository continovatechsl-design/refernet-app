# ReferNet — Referral Marketing App

Full-stack referral app: users sign in with Google, get a unique referral
link, submit service requests (Power Electrical, CCTV, Solar, House
Automation, Building Construction, Industrial Automation), and earn points
(awarded manually by admin) whenever a job they referred is completed.

Stack: React + Vite + Tailwind, Firebase Auth (Google), Firestore, Cloud
Messaging (web push), Cloud Functions (to actually send the push).

---

## 1. Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Inside the project: **Build → Authentication → Get started → Sign-in method → Google → Enable**.
3. **Build → Firestore Database → Create database** (start in production mode — the rules file below locks it down properly).
4. **Project settings (gear icon) → General → Your apps → Web (</>)** → register an app → copy the `firebaseConfig` values.
5. **Project settings → Cloud Messaging → Web configuration → Web Push certificates** → Generate key pair → copy the key.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Paste the values you copied above into `.env.local`, including
`VITE_ADMIN_EMAILS` — a comma-separated list of the Google account(s) that
should have access to `/admin`, e.g. `VITE_ADMIN_EMAILS=you@gmail.com`.

**Important:** also update the admin email list in two more places, since
`.env.local` isn't visible to Firestore rules or Cloud Functions:
- `firestore.rules` → `adminEmails()` function
- `functions/index.js` → `ADMIN_EMAILS` constant

And paste the same six `firebaseConfig` values into
`public/firebase-messaging-sw.js` (service workers can't read `.env` files).

## 3. Install & run locally

```bash
npm install
npm run dev
```

## 4. Deploy Firestore rules & indexes

Install the Firebase CLI once if you don't have it: `npm install -g firebase-tools`

```bash
firebase login
firebase use --add        # pick your project
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Deploy Cloud Functions (push notifications)

Sending a push notification requires a server — this is what the
`functions/` folder does (triggers on new/updated requests). This needs the
**Blaze (pay-as-you-go)** plan; it has a generous free tier and this app's
volume will likely cost $0/month.

```bash
cd functions
npm install
npm run deploy
cd ..
```

If you'd rather skip this for now, everything else works fine — you just
won't get push notifications yet.

## 6. Deploy the web app (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

You'll get a live URL like `https://your-project.web.app`.

---

## How the data is structured

**`users/{uid}`**
`name`, `email`, `photoURL`, `referralCode` (own unique code), `referredByUid`
(who referred them, if anyone), `points`, `fcmToken`.

**`referralCodes/{code}`** → `{ uid }`
A write-once lookup table that guarantees referral codes are unique and lets
the app resolve `yoursite.com/ref/ABC123` back to a user.

**`requests/{id}`**
`category`, `customerName`, `customerNumber`, `submittedByUid`,
`referrerUid` (whoever gets the points), `status`
(`pending → quoted → completed`, or `rejected`), `quotationAmount`,
`pointsAwarded`.

## How points work

Points are **manual, admin-controlled** — there's no fixed LKR conversion
rate baked into the app. On the admin request detail page, once a job is
quoted, the admin types in a point value and clicks **"Complete & award
points"**; that number is added to the referrer's `points` balance in one
atomic transaction. Convert to LKR and pay out however you handle that
today (bank transfer, etc.) — the app just tracks the running balance.

## Notes / things to double check before going live

- Email notifications aren't wired up (you asked for push only) — if you
  want email too later, the cleanest path is the **"Trigger Email" Firebase
  Extension**, which sends mail whenever a document is added to a `mail`
  collection; `functions/index.js` could `db.collection('mail').add(...)`
  alongside the push calls.
- The Google sign-in popup can be blocked by some browsers/ad-blockers —
  if that's an issue for your users, swap `signInWithPopup` for
  `signInWithRedirect` in `src/context/AuthContext.jsx`.
- Referral codes are 6 characters from a 32-character alphabet (~1 billion
  combinations) — plenty of headroom for collision-free codes.
