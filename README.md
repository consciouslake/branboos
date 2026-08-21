# branboos-structura

Monorepo for Branboos backend services.

## Services

| Service | Path | Language | Purpose |
|---|---|---|---|
| **Atrium** | `atrium/` | Node.js | API gateway / public-facing layer |
| **Quarry** | `quarry/` | Node.js | Data extraction & processing pipeline |
| **Keystone** | `keystone/` | Node.js | Shared contract layer (schemas, events) |
| **Deploy** | `deploy/` | Docker Compose | Compose files, env templates |

## Why a monorepo?

Atrium, Quarry, and Keystone are closely coupled — a contract change in Keystone typically requires coordinated updates in both Atrium and Quarry. A monorepo keeps them versioned together, simplifies local dev (`docker compose up`), and avoids cross-repo dependency gymnastics.

## Quick start

```bash
cp deploy/.env.template deploy/.env
docker compose -f deploy/docker-compose.yml up
```

## Dev (without Docker)

```bash
# Install all workspaces
npm install

# Run individual services
npm run dev --workspace=atrium
npm run dev --workspace=quarry
npm run dev --workspace=keystone
```

## Related repos

- [`branboos-groundwork`](https://github.com/branboos/branboos-groundwork) — Frappe CRM customization app
- [`branboos-formwork`](https://github.com/branboos/branboos-formwork) — Frappe ERP customization app
