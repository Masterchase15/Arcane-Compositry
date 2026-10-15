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

Avoid "serverless" hosts with no disk (Vercel, Netlify functions): the
database file would be wiped.

### Settings

| Variable        | Meaning                                          | Default     |
| --------------- | ------------------------------------------------ | ----------- |
| `PORT`          | Port to listen on                                | `3000`      |
| `HOST`          | Network interface                                | `0.0.0.0`   |
| `STORAGE_DIR`   | Folder for the database file                     | `./storage` |
| `COOKIE_SECURE` | Set to `1` when the site is served over HTTPS    | off         |

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
