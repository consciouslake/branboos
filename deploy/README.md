# deploy/

Everything needed to run the BranBoos Structura suite with Docker Compose.

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | All services with profile flags |
| `.env.example` | Copy to `.env` and fill in secrets |

## Quick start

```bash
cd deploy/
cp .env.example .env
# Fill in .env — at minimum: GEMINI_API_KEY, KEYSTONE_SERVICE_TOKEN, BASE_DOMAIN

# Run the full suite
docker compose --profile full up -d

# Or run individual bundles:
docker compose --profile atrium --profile groundwork up -d   # Sales bundle
docker compose --profile quarry --profile formwork up -d     # Procurement bundle
docker compose --profile atrium up -d                        # Atrium only (still needs Keystone)
```

## Profiles

| Profile | Services started |
|---|---|
| `atrium` | reverse-proxy, keystone, atrium-app, groundwork-db, groundwork-redis, groundwork-web/worker/scheduler |
| `quarry` | reverse-proxy, keystone, quarry-app, quarry-cache, formwork-db, formwork-redis, formwork-web/worker/scheduler |
| `groundwork` | reverse-proxy, groundwork-db, groundwork-redis, groundwork-web/worker/scheduler |
| `formwork` | reverse-proxy, formwork-db, formwork-redis, formwork-web/worker/scheduler |
| `full` | Everything |

## Keystone

Keystone is **internal only** — it has no Traefik labels and no exposed ports. Only Atrium and Quarry can reach it via the `branboos-net` Docker network at `http://keystone:8000`.

The AI provider key (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY`) lives **only** in Keystone's environment. It is never passed to Atrium, Quarry, or the frontend.

## Frappe apps (Groundwork / Formwork)

The `groundwork-web` and `formwork-web` images are stubs pointing to `ghcr.io/branboos/groundwork:stable` and `ghcr.io/branboos/formwork:stable`. These images don't exist yet — before running these profiles, build them by adapting [`frappe_docker`](https://github.com/frappe/frappe_docker)'s custom-app image process to install `branboos_groundwork` / `branboos_formwork` at image build time.

## Validate config (no containers started)

```bash
docker compose --profile full config
```
