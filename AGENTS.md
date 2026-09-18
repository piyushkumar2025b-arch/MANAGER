# Project Instructions for AI Assistant

Follow the build, dependency, and deployment guidelines defined in `RULES.MD`:

1. **Lockfile Integrity**: Always keep `package.json` and `package-lock.json` in sync using `npm`. Never introduce or commit `bun.lock` or `bun.lockb`.
2. **Cloudflare Deployment**: When modifying dependencies, run `npm ci --dry-run` to ensure `npm clean-install` passes in Cloudflare Pages CI.
3. **Bindings**: Cloudflare KV bindings must use 32-character hexadecimal IDs or remain commented out.
4. **Code Quality**: Ensure `npm run lint` and `npm run build` pass before completing any changes.
