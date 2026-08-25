# LiveStreamFlow

A shared run-of-show / rundown builder for small teams producing live streams. Plan a stream's segment-by-segment timeline together, in real time.

## Stack

- React + TypeScript, built with Vite
- Firebase Authentication (email/password)
- Cloud Firestore (real-time data, no custom backend)
- Deployed as a static SPA to GitHub Pages

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Firebase project at https://console.firebase.google.com
   - Enable **Authentication** → Email/Password sign-in method
   - Enable **Cloud Firestore** (production mode)
   - Deploy `firestore.rules` from this repo (Firestore console → Rules, paste the contents)
   - Under Project settings → General, register a Web app and copy the config values
3. Copy `.env.example` to `.env` and fill in the Firebase config values.
4. Run the app:
   ```
   npm run dev
   ```

## Deploying to GitHub Pages

The `.github/workflows/deploy.yml` workflow builds and deploys `dist/` to GitHub Pages on every push to `main`.

Before it will work:

1. In the repo's **Settings → Pages**, set Source to "GitHub Actions".
2. In **Settings → Secrets and variables → Actions**, add each `VITE_FIREBASE_*` value from your `.env` as a repository secret.
3. In the Firebase console, under Authentication → Settings → Authorized domains, add your GitHub Pages domain (`<username>.github.io`) so sign-in works there.
4. `vite.config.ts` sets `base: '/LiveStreamFlow/'` to match this repo's name — update it if the repo is renamed.

## Data model

- `shows/{showId}` — a production/stream event (title, scheduled time, target duration, status)
- `shows/{showId}/segments/{segmentId}` — ordered rundown items (title, type, duration, owner, notes, status)

All authenticated users currently share one workspace (single Firestore project = single team). Multi-team support is not yet implemented.

## Deferred (post-MVP)

Calendar/scheduling view, task/checklist management, comments/notifications, platform integrations (Twitch/YouTube/StreamElements), multi-team support, live on-air "run mode".
