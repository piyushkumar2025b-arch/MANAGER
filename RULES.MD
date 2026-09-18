# Cloudflare Build & Deployment Rules

To guarantee build and deployment success on Cloudflare Pages and Workers, strictly adhere to these rules:

---

### 1. Package Manager & Lockfile Consistency
- **Primary Package Manager**: Always use `npm` (`npm@10.9.2`).
- **No Bun Lockfiles**: Never create or commit `bun.lock` or `bun.lockb`. If Cloudflare detects a `bun.lock` file, it will invoke `bun install --frozen-lockfile` which breaks npm-based builds.
- **Lockfile Synchronization**: Whenever any package in `package.json` (`dependencies` or `devDependencies`) is added, updated, or removed:
  1. Run `npm install` to update `package-lock.json`.
  2. Verify compatibility with `npm ci --dry-run`.
  3. Ensure `package.json` and `package-lock.json` are completely in sync before pushing.

---

### 2. Cloudflare Bindings & Environment Variables
- **KV Namespace IDs**: Cloudflare requires KV namespace IDs to be a valid 32-character hexadecimal ID (e.g., `c3019808639d48adb386a347895e69e7`).
  - Never use alias names (such as `vault_kv_namespace`) as the KV namespace ID in Cloudflare dashboard or `wrangler.toml`.
  - If a KV namespace is not configured, remove the binding from the Cloudflare dashboard or comment it out in `wrangler.toml`.
- **Runtime Defensive Guarding**: All code accessing environment bindings must defensively check existence (e.g., `if (env.VAULT_KV) { ... }`) to allow zero-config fallback.

---

### 3. Git Hygiene (`.gitignore`)
Always ensure `.gitignore` excludes:
- `node_modules/`
- `bun.lock` and `bun.lockb`
- `.env` and `.dev.env.json`
- `.wrangler/`
- `vault.db` (local SQLite database)
- `dist/` and build logs

---

### 4. Pre-Deployment Verification Checklist
Before pushing or triggering a Cloudflare build:
1. `npm run lint` — Verify all scripts and functions have zero syntax errors.
2. `npm ci --dry-run` — Verify lockfile synchronization for Cloudflare's `npm clean-install`.
3. `npm run build` — Verify the build command succeeds without errors.
