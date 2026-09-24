# Reelfetch — Media Downloader

A full-stack app for previewing and downloading YouTube, Instagram, and Facebook videos as MP4 or MP3.

> **Before you deploy this publicly:** YouTube, Instagram, and Facebook's Terms of Service
> restrict downloading video content outside of features they provide themselves, and the
> videos themselves are usually copyrighted. This project is built for personal/educational
> use and for downloading content you own or have explicit rights to. If you run this as a
> public service, you are responsible for complying with each platform's ToS and applicable
> copyright law in your jurisdiction.

## Folder structure

```
media-downloader/
├── frontend/                  # Next.js 14 (App Router) + Tailwind CSS
│   ├── app/
│   │   ├── components/        # Header, Downloader, PlatformsSection, HistorySection, Footer
│   │   ├── lib/                # firebase.ts, api.ts, platform.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── public/manifest.json   # PWA manifest
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
└── backend/                   # Node.js + Express
    ├── routes/                 # download.js, history.js, admin.js, qr.js
    ├── middleware/              # auth.js, validateUrl.js, rateLimiter.js
    ├── services/                 # downloader.js (yt-dlp wrapper), logger.js
    ├── config/firebase.js
    ├── firestore.rules
    ├── server.js
    └── package.json
```

## How it fits together

1. User pastes a link → frontend detects the platform client-side for instant UI feedback.
2. **Fetch details** hits `POST /api/preview` → backend re-validates the URL (never trusts
   the client), runs `yt-dlp --dump-single-json` to get title/thumbnail/duration/available
   qualities, and returns them — no file is downloaded at this stage.
3. User picks MP4/MP3 + quality and hits **Download** → `POST /api/download` extracts the
   media to a temp file, streams it to the browser, then deletes it immediately. A cleanup
   sweep in `server.js` also purges anything older than `TEMP_FILE_TTL_MS` as a safety net.
4. If the user is signed in (Firebase Auth), the request includes their ID token; the backend
   verifies it and logs the download to Firestore (`downloads` collection) for their history.
5. Admins (UIDs listed in `ADMIN_UIDS`) can hit `GET /api/admin/stats` for aggregate analytics.

## Local setup

### 1. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Google** (or Email/Password) sign-in method.
3. Enable **Firestore Database** (start in production mode).
4. Deploy `backend/firestore.rules`: `firebase deploy --only firestore:rules`.
5. Grab your **web app config** (Project Settings → General → Your apps) for the frontend `.env.local`.
6. Grab a **service account key** (Project Settings → Service Accounts → Generate new private key) for the backend `.env`.
7. Find your own Firebase Auth UID (Authentication tab, after you sign in once) and add it to `ADMIN_UIDS`.

### 2. Backend

```bash
cd backend
cp .env.example .env      # fill in Firebase Admin credentials + ADMIN_UIDS
npm install

# yt-dlp binary — yt-dlp-wrap needs the actual binary present.
mkdir -p bin
node -e "require('yt-dlp-wrap').default.downloadFromGithub('./bin/yt-dlp')"

npm run dev                # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in Firebase web config + API URL
npm install
npm run dev                        # http://localhost:3000
```

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo → set **Root Directory** to `frontend`.
3. Add the `NEXT_PUBLIC_*` env vars from `.env.local` in Vercel's Environment Variables settings.
4. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL (see below) + `/api`.
5. Deploy.

### Backend → Render or Railway

1. **New Web Service** → connect the repo → set **Root Directory** to `backend`.
2. Build command: `npm install && node -e "require('yt-dlp-wrap').default.downloadFromGithub('./bin/yt-dlp')"`
3. Start command: `node server.js`
4. Add all vars from `.env.example` (Firebase Admin credentials, `ADMIN_UIDS`, `CLIENT_URL`
   set to your Vercel domain, `RATE_LIMIT_*`).
5. Make sure the instance has ffmpeg available (Render/Railway's default Node buildpacks
   usually need `apt-get install ffmpeg` via a `render-build.sh` / Nixpacks config — check
   yt-dlp's docs for the current recommended setup) since merging video+audio and MP3
   extraction depend on it.
6. Deploy, then copy the live URL into the frontend's `NEXT_PUBLIC_API_URL`.

## Security notes

- All incoming URLs are re-validated server-side against an allow-list of platform hostnames
  and checked against private/local IP ranges (SSRF protection) — the frontend's platform
  detection is UX only, not a security boundary.
- `helmet` sets standard security headers; CORS is locked to `CLIENT_URL`.
- Two-tier rate limiting: a general limiter on all routes, plus a stricter one on the
  expensive preview/download routes, keyed by user ID when signed in.
- Firestore rules block all client-side writes to `downloads` — only the backend (via the
  Admin SDK, which bypasses rules) can write history, and users can only read their own rows.
- Downloaded files live in `backend/tmp/` only for the duration of the response stream, then
  are deleted; a periodic sweep also clears anything left behind after `TEMP_FILE_TTL_MS`.

## Extending further

- **Progress that reflects real bytes:** swap the simulated progress bar in `Downloader.tsx`
  for Server-Sent Events or WebSocket updates from `yt-dlp`'s `--newline` progress output.
- **Background jobs:** for longer videos, move extraction to a queue (BullMQ + Redis) instead
  of holding the HTTP request open.
- **Service worker:** add a `public/sw.js` and register it in `layout.tsx` for full offline-shell PWA support (the manifest is already in place).
