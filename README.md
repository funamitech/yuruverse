# YuruVerse

Website for [funami.tech](https://funami.tech) — the hub of the YuruVerse: self-hosted
community services (Matrix chat, Mastodon, Lemmy, Minecraft and Linux mirrors) run
from Gyeonggi, South Korea since 2022.

Shares its design system with [YuruMirror](https://github.com/funamitech/mirror).

## Tech stack

- Tailwind CSS 4 (CSS-first config in `src/assets/css/input.css` — no `tailwind.config.js`)
- A tiny template builder (`build.js`, 73 lines) that expands shared partials into static pages
- Vanilla JS, self-hosted Inter variable font, inline SVG icon sprite — **no CDNs, no frameworks**
- Served by plain nginx (the vhost also proxies `/_matrix` and `/.well-known/*` for YuruChat;
  this repo only owns `/`)

## Project structure

```
yuruverse/
├── templates/            # HTML sources — EDIT THESE
│   ├── partials/         # head, nav, footer, icon sprite, error-page shell
│   ├── index.html
│   └── error/            # 403 / 404 / 50x (one include line each)
├── src/                  # deployable webroot — generated pages + static assets
│   └── assets/           # css (input.css + built tailwind.css), js, fonts, img
├── build.js              # expands templates/ -> src/
└── dev/server.js         # dev server: re-expands templates on every request
```

`src/*.html`, `src/error/*.html` and `src/assets/css/tailwind.css` are build artifacts
(committed so that `src/` can be deployed as-is). Edit `templates/` and `input.css`, then
rebuild.

## Development

```bash
npm install
npm run dev          # http://localhost:8080 — templates re-expand on every refresh
npm run build-css    # Tailwind in watch mode (run alongside `npm run dev`)
```

Append `?theme=dark` or `?theme=light` to any page to force a color scheme while
testing (this works on the production site too; it is handled by the inline script in
`partials/head.html` and is not persisted).

No Node? `python3 -m http.server 8080 --directory src` serves the built site just as well.

## Build & deploy

```bash
npm run build        # expand templates + minified CSS
```

Deploy the `src/` directory as the webroot. nginx expects the error pages at exactly
`/error/403.html`, `/error/404.html` and `/error/50x.html`, wired up with something like:

```nginx
error_page 403 /error/403.html;
error_page 404 /error/404.html;
error_page 500 502 503 504 /error/50x.html;
```

The live webroot also carries things that are **not** part of this repo and must survive
a deploy: `blend-docs-build/` (a Docusaurus site) and `.well-known/` (Matrix delegation).
Exclude them from any `rsync --delete`.

## Adding or removing a service

Update these spots (grep for the host name, e.g. `lemmy.funami.tech`):

1. `templates/partials/nav.html` — Services dropdown + mobile menu
2. `templates/partials/footer.html` — Services column
3. `templates/index.html` — service card grid, the "Services" count in the hero, and the
   meta description in `<head>`

## Scripts

- `npm run dev` — dev server
- `npm run build` — templates + minified CSS (production)
- `npm run build-css` — CSS watch mode
- `npm run lint` / `npm run lint:fix` — ESLint

## License

GPL-3.0 — see [LICENSE](LICENSE).
