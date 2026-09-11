# 🔐 Vault — Cloudflare Pages + D1

A mobile-first password manager and task tracker using:

- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1
- GitHub automatic deployments

## Project structure

```text
vaultapp/
├── public/
│   └── index.html
├── functions/
│   └── api/
│       └── [[route]].js
├── wrangler.toml
└── README.md
```

## 1. Create the D1 database

Install Wrangler:

```bash
npm install -g wrangler
wrangler login
```

Create the database:

```bash
wrangler d1 create vaultapp-db
```

Copy the returned `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vaultapp-db"
database_id = "YOUR_REAL_DATABASE_ID"
```

Do not commit API tokens or other secrets to GitHub.

## 2. Push this project to GitHub

From the project directory:

```bash
git init
git add .
git commit -m "Initial Vault deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vaultapp.git
git push -u origin main
```

## 3. Connect GitHub to Cloudflare

In Cloudflare:

**Workers & Pages → Create application → Pages → Connect to Git**

Select this GitHub repository.

Build settings:

- Framework preset: None
- Build command: leave empty
- Build output directory: `public`
- Root directory: `/`

Do NOT use the Cloudflare drag-and-drop Direct Upload for this project. The repository contains a `functions` directory and `wrangler.toml`, so use Git integration or Wrangler.

## 4. Add the D1 binding

In the Cloudflare project settings, add:

- Binding type: D1 database
- Variable name: `DB`
- Database: `vaultapp-db`

The API uses `env.DB`, so the binding name must remain exactly `DB`.

## 5. Deploy

Push any change to GitHub:

```bash
git add .
git commit -m "Deploy Vault"
git push
```

Cloudflare will build/deploy the repository automatically.

## Important security note

This source version is suitable for deployment testing, but the current application stores password values directly in D1 and its master-password mechanism is not a complete cryptographic authentication system. Do not use it for real sensitive credentials until the authentication and encryption layer has been hardened.

## Local Wrangler deployment (alternative)

After replacing `YOUR_DATABASE_ID_HERE`:

```bash
wrangler pages deploy public --project-name=vaultapp
```

For GitHub automatic deployment, prefer the Cloudflare Git integration described above.
