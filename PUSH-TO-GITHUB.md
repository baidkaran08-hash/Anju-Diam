# Pushing this to GitHub

The repo is already initialised with one commit on `main`. Nothing to set up —
just create the remote and push.

## 1. Create the empty repository

Go to https://github.com/new

- **Repository name:** `Anju-Diam-Website`
- **Visibility:** Private (it is client work)
- **Do NOT** tick "Add a README", "Add .gitignore", or "Choose a license" —
  this repo already has them, and pre-filling causes a push conflict

Click **Create repository**.

## 2. Push

From inside this folder, with `YOUR-USERNAME` replaced:

```bash
git remote add origin https://github.com/YOUR-USERNAME/Anju-Diam-Website.git
git push -u origin main
```

If GitHub asks for a password, it wants a **Personal Access Token**, not your
account password. Generate one at Settings → Developer settings → Personal
access tokens → Fine-grained tokens, scoped to this repo with
**Contents: Read and write**.

Easier alternative — the GitHub CLI does the whole thing in one line:

```bash
gh auth login
gh repo create Anju-Diam-Website --private --source=. --push
```

## What is in the commit

543 files, about 16 MB. The bulk is `public/frames` — 480 WebP files, the
scroll sequence at desktop and mobile resolutions. Well inside GitHub's limits
(it warns above 50 MB per *file*; the largest here is under 100 KB).

`.env` is gitignored and **not** committed. `.env.example` is, so whoever
clones knows which variables to set. Set the real values in Vercel's dashboard,
never in the repo.

## After pushing

Import the repo at https://vercel.com/new. Add these environment variables:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon, Supabase, Railway) |
| `AUTH_SECRET` | 32+ chars. `openssl rand -base64 32` |
| `NEXT_PUBLIC_WHATSAPP` | Digits only with country code |
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL |

Then run the seed once against production:

```bash
DATABASE_URL="<production url>" npm run db:seed
```

Change the seeded admin password (`admin@anjudiam.com`) before anyone else has
the URL.
