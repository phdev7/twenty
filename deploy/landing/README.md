# Diex CRM public landing

This directory versions the static marketing entrypoint served at
`https://crm.bydiex.com`.

Coolify resource: `diex-landing` (`v6slpc91kx3n5wa6w0euzcu6`).

- `index.html` is mounted at `/usr/share/nginx/html/index.html`.
- `default.conf` is mounted at `/etc/nginx/conf.d/default.conf`.
- `/login` and legacy CRM paths redirect to `https://app.crm.bydiex.com`.
- The diagnostic form opens the official Diex WhatsApp with the commercial
  context pre-filled. No lead data is persisted by the landing itself.

Keep the files in this directory synchronized with the Coolify persistent
storage entries when publishing changes.
