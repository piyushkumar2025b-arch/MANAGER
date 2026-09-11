# Vault — Cloudflare Worker + D1

## Repository structure

```text
MANAGER/
├── functions/
│   └── api/
│       └── [[route]].js
├── public/
│   └── index.html
├── src/
│   └── index.js
├── wrangler.toml
├── .gitignore
└── README.md
```

## Cloudflare Workers Builds settings

Repository: `piyushkumar2025b-arch/MANAGER`

Root directory: `/`

Build command: leave empty

Deploy command:

```text
npx wrangler deploy
```

The project is now Worker-native. `src/index.js` is the Worker entry point, `/api/*` is routed to the existing API handler, and all other requests are served from `public/` through the `ASSETS` binding.

## D1

Replace `YOUR_DATABASE_ID_HERE` in `wrangler.toml` with the real D1 database ID.

The D1 binding name must remain:

```text
DB
```

## GitHub workflow

```bash
git add .
git commit -m "Convert Vault to Cloudflare Worker"
git push
```

Cloudflare Workers Builds will run `npx wrangler deploy`.

## Important

Do not use the old Pages `pages_build_output_dir` setting with this Worker deployment. This configuration uses:

```toml
main = "src/index.js"

[assets]
directory = "./public"
binding = "ASSETS"
```
