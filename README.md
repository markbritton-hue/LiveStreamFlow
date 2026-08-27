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
4. (Optional) To auto-detect video length for Google Drive-hosted videos, set up a Drive API key — see below.
5. Run the app:
   ```
   npm run dev
   ```

### Optional: Google Drive API key (video length detection)

Without this, Drive-hosted video blocks show a thumbnail and play fine but won't display a length badge (direct `.mp4`/etc. links elsewhere still get their length read locally in the browser, no key needed).

1. In [Google Cloud Console](https://console.cloud.google.com), create/select a project and enable the **Google Drive API** (APIs & Services → Library).
2. Create an API key (APIs & Services → Credentials → Create Credentials → API key).
3. **Restrict the key** (Credentials → click the key → Edit):
   - Application restrictions → **Websites** → add your GitHub Pages URL (`https://<username>.github.io/*`) and `http://localhost:*` for local dev.
   - API restrictions → **Restrict key** → select only **Google Drive API**.
   - This key will be visible in the built frontend bundle (it's a public repo/site), so the restrictions above are what actually keep it safe — don't skip them.
4. Add it to `.env` as `VITE_GOOGLE_DRIVE_API_KEY=...`, and add the same value as a `VITE_GOOGLE_DRIVE_API_KEY` repository secret for the GitHub Pages deploy to pick it up (see below).

## Deploying to GitHub Pages

The `.github/workflows/deploy.yml` workflow builds and deploys `dist/` to GitHub Pages on every push to `main`.

Before it will work:

1. In the repo's **Settings → Pages**, set Source to "GitHub Actions".
2. In **Settings → Secrets and variables → Actions**, add each `VITE_FIREBASE_*` value from your `.env` as a repository secret, plus `VITE_GOOGLE_DRIVE_API_KEY` if you set one up.
3. In the Firebase console, under Authentication → Settings → Authorized domains, add your GitHub Pages domain (`<username>.github.io`) so sign-in works there.
4. `vite.config.ts` sets `base: '/LiveStreamFlow/'` to match this repo's name — update it if the repo is renamed.

## Data model

- `shows/{showId}` — a production/stream event (title, scheduled time, target duration, status)
- `shows/{showId}/segments/{segmentId}` — ordered rundown items (title, type, duration, owner, notes, status)

All authenticated users currently share one workspace (single Firestore project = single team). Multi-team support is not yet implemented.

## Deferred (post-MVP)

Calendar/scheduling view, task/checklist management, comments/notifications, platform integrations (Twitch/YouTube/StreamElements), multi-team support, live on-air "run mode".
