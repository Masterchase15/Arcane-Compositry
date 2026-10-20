# Putting it online and installing it as an app

## 1. Let players reach it

The site is one small Node.js program plus one database file, so it runs
almost anywhere. Pick one.

### On your own PC, over Tailscale (simplest)

1. Run `node server.js` (or double-click `start.bat`) on your PC.
2. Players join your tailnet and open `http://<your-pc-tailscale-name>:3000`.

Your PC must be on while people play. Nothing else to set up.

### In Docker

A `Dockerfile` is included.

```bash
docker build -t arcane-compositry .
```

```bash
docker run -d --name arcane -p 3000:3000 -v arcane-data:/app/storage --restart unless-stopped arcane-compositry
```

The `-v arcane-data:/app/storage` part keeps accounts and characters safe when
the container is rebuilt.

### On a hosting service

Any host that runs Node.js 22.13+ and gives you a **persistent disk** works
(Railway, Render, Fly.io, a small VPS...).

- Start command: `node server.js`
- Set `STORAGE_DIR` to the path of the persistent disk, so the database
  survives restarts.
- The host provides HTTPS; set `COOKIE_SECURE=1`.
- The host puts a proxy in front of the site; set `TRUST_PROXY=1` so the
  sign-in attempt limit counts each player separately.
- Set `INVITE_CODE` so strangers cannot sign up. With it set, signing up
  needs either this code (give it to people who will run their own group) or a
  group's invite code (players).
- Turn on email (optional but recommended): make a free Resend account, verify
  a domain you own, create an API key, and set `RESEND_API_KEY`, `MAIL_FROM`
  and `SITE_URL`. Players can then confirm their email and reset forgotten
  passwords themselves. Without it the site still works; a site admin resets
  passwords instead.
- Make yourself site admin: sign up on the site, then open the host's shell
  (for example `fly ssh console`, or the shell / `railway ssh` on Railway) and
  run `npm run make-admin <your username>`. Run it in the app folder, with the
  same `STORAGE_DIR` the site uses, so it changes the right database.

Avoid "serverless" hosts with no disk (Vercel, Netlify functions): the
database file would be wiped.

### On Railway, step by step

1. New project > Deploy from GitHub repo > pick this repo, branch `main`.
   Railway builds the `Dockerfile` by itself.
2. Settings: keep **1 replica** (the database is one file, and the sign-in
   limit lives in memory).
3. Add a **volume** to the service, mounted at `/app/storage`. Turn on its
   backups if your plan has them.
4. Variables: `COOKIE_SECURE=1`, `TRUST_PROXY=1`, `INVITE_CODE=...`,
   `SITE_URL=https://<your domain>`, and for email `RESEND_API_KEY=...` and
   `MAIL_FROM=Arcane Compositry <noreply@<your domain>>`. Do not set `HOST`
   or `MAIL_LOG`; Railway sets `PORT` itself. (`STORAGE_DIR` is already
   `/app/storage` in the Dockerfile.)
5. Settings > Networking: add your custom domain and create the DNS record
   Railway shows you at your domain registrar.
6. In Resend, add the same domain and create the DNS records it shows (they
   let Resend send as `noreply@<your domain>`).
7. Once it is live: sign up, then in Railway's shell run
   `node scripts/make-admin.js <your username>`. Redeploy once and check your
   account is still there - that proves the volume works.

### Settings

| Variable        | Meaning                                          | Default     |
| --------------- | ------------------------------------------------ | ----------- |
| `PORT`          | Port to listen on                                | `3000`      |
| `HOST`          | Network interface                                | `0.0.0.0`   |
| `STORAGE_DIR`   | Folder for the database file                     | `./storage` |
| `COOKIE_SECURE` | Set to `1` when the site is served over HTTPS    | off         |
| `INVITE_CODE`   | Lets people sign up without a group's invite code (e.g. new DMs). When set, signing up needs this code or a group's code | off: anyone can sign up |
| `TRUST_PROXY`   | Number of proxies in front of the site (`1` on Railway, Render, Fly.io, Cloudflare Tunnel...). Leave unset when players connect straight to the server. | `0` |
| `RESEND_API_KEY` | Turns on email (confirm your email, forgot password) through [Resend](https://resend.com) | off: no email; admins reset passwords |
| `MAIL_FROM`     | Sender, on a domain you verified in Resend, e.g. `Arcane Compositry <noreply@example.com>` | - |
| `SITE_URL`      | The site's public address, used in emailed links, e.g. `https://arcane.example.com` | `http://localhost:PORT` |
| `MAIL_LOG`      | `1` = no real email; print each one in the server console instead. For trying it locally only. | off |

### Use HTTPS when it is on the public internet

Logins travel in the clear over plain `http://`. That is fine on your home
network or Tailscale, but on the public internet put the site behind HTTPS (a
hosting service does this for you; on a VPS use Caddy or a Cloudflare Tunnel).
HTTPS is also required for the "install as app" feature below, except on
`localhost`.

## 2. Install it as a web app

The site is already a Progressive Web App: it has a manifest
(`public/manifest.webmanifest`), icons and a service worker (`public/sw.js`).

- **Android / Chrome / Edge:** open the site, then menu > *Install app* (or
  *Add to Home screen*).
- **iPhone / iPad:** open in Safari, Share > *Add to Home Screen*.
- **Desktop Chrome / Edge:** the install icon at the right of the address bar.

It then opens in its own window with the forest-green title bar. The rules,
calculators and spell lists stay readable if the connection drops; accounts
and saving need the server.

To change the app name, colours or icon, edit `public/manifest.webmanifest`
and the two files in `public/icons/`. For the sharpest icon on iPhones, add a
180 x 180 PNG and point the `apple-touch-icon` line in `public/index.html` at
it.

## 3. Back up

Everything players create is in `storage/arcane.db`. Copy it somewhere safe
now and then (stop the server first, or copy the `-wal` and `-shm` files next
to it as well).
