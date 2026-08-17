# AKHIL 360 RAM App

Production studio dashboard for shoot bookings, client follow-up, online payment tracking, wfolio delivery, calendar planning, and 30-day storage clearance.

## What It Does

- Tracks direct and third-party shoots with event-level schedules, venues, client contacts, and notes.
- Automatically moves shoots through booked, in progress, editing, delivered, and data cleared based on session times and delivery/retention dates.
- Keeps client contact details readily available with copy actions and vCard export.
- Uses online payment methods only: UPI, bank transfer, card, cheque, and other non-cash methods.
- Supports wfolio gallery URL and PIN delivery without local test-link messaging.
- Syncs shared shoot data through Firebase Realtime Database so entries can reflect across devices.
- Keeps delete tombstones in Firebase so removed shoots do not reappear from another device.

## Cloud Sync

The app reads Firebase configuration from Vite environment variables. Local development can use `.env.local`, and `.env.example` documents the required keys.

The GitHub Pages workflow builds with Firebase enabled at:

```text
akhil360/studio
```

Firebase web configuration is public client configuration. For private production use, protect the database with Firebase Authentication and Realtime Database security rules before storing real client phone numbers, email addresses, or payment notes.

## Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run qa
npm exec tsc -- --noEmit --pretty false -p tsconfig.app.json
npm exec oxlint -- src index.html api capacitor.config.ts vite.config.ts
npm run build
```

## Deployment

Push to `main`. The GitHub Actions workflow builds the Vite app and publishes `dist` to the `gh-pages` branch.
