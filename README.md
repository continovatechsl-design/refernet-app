# ReferNet — Referral Marketing App

Full-stack referral app: users sign in with Google, get a unique referral
link, submit service requests (Power Electrical, CCTV, Solar, House
Automation, Building Construction, Industrial Automation), and earn points
(awarded automatically once the admin marks an invoice as paid) whenever a
job they referred goes through the full quote → accept → invoice → paid →
payout lifecycle.

Stack: React + Vite + Tailwind, Firebase Auth (Google), Firestore, Firebase
Storage (quotation/invoice PDFs), Cloud Messaging (web push), Cloud
Functions (to actually send the push).

---

## 1. Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Inside the project: **Build → Authentication → Get started → Sign-in method → Google → Enable**.
3. **Build → Firestore Database → Create database** (start in production mode — the rules file below locks it down properly).
4. **Build → Storage → Get started** (also production mode) — this is where quotation/invoice PDFs are stored. On the same Blaze plan needed for Cloud Functions below; Storage has its own generous free tier too.
5. **Project settings (gear icon) → General → Your apps → Web (</>)** → register an app → copy the `firebaseConfig` values.
6. **Project settings → Cloud Messaging → Web configuration → Web Push certificates** → Generate key pair → copy the key.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Paste the values you copied above into `.env.local`, including
`VITE_ADMIN_EMAILS` — a comma-separated list of the Google account(s) that
should have access to `/admin`, e.g. `VITE_ADMIN_EMAILS=you@gmail.com`.

**Important:** also update the admin email list in three more places, since
`.env.local` isn't visible to Firestore/Storage rules or Cloud Functions:
- `firestore.rules` → `adminEmails()` function
- `storage.rules` → `adminEmails()` function
- `functions/index.js` → `ADMIN_EMAILS` constant

And paste the same six `firebaseConfig` values into
`public/firebase-messaging-sw.js` (service workers can't read `.env` files).

## 3. Install & run locally

```bash
npm install
npm run dev
```

## 4. Deploy Firestore & Storage rules

Install the Firebase CLI once if you don't have it: `npm install -g firebase-tools`

```bash
firebase login
firebase use --add        # pick your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The first time you deploy `storage.rules`, the Firebase console will prompt
you to approve "cross-service" access so Storage rules can read Firestore
(this is how a referrer/customer is allowed to view *their own* request's
PDFs, while everyone else is blocked) — just click enable.

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
`referrerUid` (whoever gets the points), `status`, plus the fields added at
each stage below:

| Status | Set by | Fields added |
|---|---|---|
| `pending` | referrer submits the request | — |
| `quoted` | admin uploads quotation PDF + amount | `quotationAmount`, `quotationPdfUrl`, `quotationPdfPath`, `quotationPdfName` |
| `accepted` | admin confirms customer said OK (phone/WhatsApp) | `acceptedAt` |
| `invoiced` | admin uploads invoice PDF + amount | `invoiceAmount`, `invoicePdfUrl`, `invoicePdfPath`, `invoicePdfName` |
| `paid` | admin marks invoice paid + enters points | `pointsAwarded`, `paidAt`, `payoutDueDate` (paidAt + 7 days) |
| `completed` | admin confirms referrer was actually paid out | `payoutCompletedAt` |
| `rejected` | admin, from `pending` or `quoted` | — |

Quotation/invoice PDFs live in Firebase Storage at
`requests/{requestId}/quotation-*.pdf` and `requests/{requestId}/invoice-*.pdf`.

## How points & payouts work

Points are **auto-calculated** from the invoice (or quotation, if no
invoice amount was entered) amount — no fixed manual entry needed, though
admin can still override per-request if needed. Rates (all in
`src/firebase.js`, easy to tune):

- **1 point = LKR 1,000**
- **Normal rate: 8%** of the amount, converted to points
- **Bonus rate: 10%** — once a referrer's points earned *within the
  current calendar month* cross **100 points**, the portion of the amount
  that pushes them past 100 is calculated at the bonus rate instead
- **Partial split, not all-or-nothing** — e.g. if a referrer is at 95
  points this month and a new invoice would take them to 110, the first 5
  points' worth of the amount is calculated at 8%, and the remaining
  amount (worth 15 points) is calculated at 10%. See
  `calculateTieredPoints()` in `src/utils/referral.js`.
- Each referrer's monthly running total is tracked in
  `monthlyPoints/{uid}_{YYYY-MM}` and resets naturally each new calendar
  month.

The flow, end to end:

1. Admin generates the quotation in your own invoice management system,
   downloads it as a PDF, and uploads it on the request's admin page along
   with the amount. Status → `quoted`. (Customer receives it however you
   normally send it — WhatsApp, email, etc.; the app just stores/hosts the
   file, it doesn't email it out.)
2. Once the customer confirms they're happy, admin clicks **"Mark
   quotation accepted"**. Status → `accepted`.
3. Admin uploads the invoice PDF (+ amount, defaults to the quotation
   amount). Status → `invoiced`.
4. Once the invoice is paid, the admin page shows a **live preview** of
   how many points this invoice will earn (with the 8%/10% split
   explained), then admin clicks **"Mark invoice paid"** — that many
   points are credited to the referrer's `points` balance and to their
   monthly running total **immediately**, in one atomic transaction, and a
   7-day payout countdown (`payoutDueDate`) starts. Status → `paid`.
   (Admin can tick "Override the calculated points manually" to set a
   custom value instead, if needed for a one-off exception.)
5. Within those 7 days, admin actually pays the referrer (bank transfer,
   cash, etc. — outside the app) and clicks **"Mark referrer paid out"**.
   Status → `completed`. The admin request-detail page shows a red
   "payout overdue" warning once `payoutDueDate` has passed and the
   request is still sitting at `paid`.

The referrer's Dashboard shows their points balance and job status live
via `onSnapshot`, so points appear there the moment step 4 happens.

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
