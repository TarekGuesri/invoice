# ADR 0001: $0 hosting on GCP, Vercel and managed free tiers

- **Status:** accepted
- **Date:** 2026-11-25

## Context

The project is open source with a public hosted instance. That instance must stay online at no cost and without expiring credits, and anyone self-hosting should be able to run the same setup for free. It has an HTTP API with WebSockets and a long-running queue worker that calls an LLM.

## Decision

- **Web** on Vercel Hobby, **API** on Google Cloud Run (`europe-west1`, request-based billing, scale to zero, max 1 instance).
- **Worker** on a Compute Engine **e2-micro** VM (`us-east1`), running the same Docker image as the API with a different command.
- **Postgres** on Neon (Frankfurt), **Redis** on Redis Cloud free, **storage** on Cloudflare R2.
- GCP over AWS because GCP's free tier does not expire, while AWS's free plan for new accounts ends after 6 months.
- Web and API on subdomains of one site (`invoice.tariqguesri.com`, `api.invoice.tariqguesri.com`) so `sameSite=lax` cookies work. `*.vercel.app` and `*.run.app` are different sites.
- CI deploys with Workload Identity Federation, so there are no long-lived GCP keys.

## Consequences

- **Worker not on Cloud Run:** a BullMQ worker never receives HTTP requests, so under request-based billing it would get no CPU. Always-on CPU would cost roughly $20–40 a month. The VM costs nothing but is a single point of failure with 1 GB of RAM; jobs survive restarts because they live in Redis.
- **Cold starts:** the first visitor after idle time waits for Cloud Run and Neon to wake up (about 2–4 s). API startup stays lean, and there is no uptime pinger keeping Neon awake.
- **Region split:** API and data are in the EU, the worker is in the US (the only free e2-micro regions). Documents already leave the EU through the Gemini free tier; `PRIVACY.md` states both.
- **Redis Cloud free has no TLS** and allows about 100 ops/sec. Job payloads hold IDs, never file contents, but the connection itself is unencrypted. Upgrading is a URL change (`rediss://`).
- **Two registries:** Cloud Run pulls from Artifact Registry in the same region; the VM pulls from GHCR, because cross-region pulls from Artifact Registry are billed.
- **Fallback:** if the e2-micro runs out of memory, the worker moves to an Oracle Cloud Always Free ARM VM with the same image and deploy steps.
