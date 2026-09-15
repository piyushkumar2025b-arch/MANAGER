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

## Optional Services (R2 & KV)

The application works out-of-the-box using D1 (attachments and auth are fully handled with D1 and in-memory fallbacks).

If you wish to enable dedicated R2 object storage or Cloudflare KV for edge rate limiting:
1. **R2 Bucket**: Run `npx wrangler r2 bucket create vault-attachments` and uncomment `[[r2_buckets]]` in `wrangler.toml`.
2. **KV Namespace**: Run `npx wrangler kv namespace create VAULT_KV` and put the generated 32-character ID in `wrangler.toml` under `[[kv_namespaces]]`.

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
