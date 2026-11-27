# Deployment

Production runs entirely on free tiers. This document is the one-time provisioning runbook, followed by how day-to-day deploys work.

| Piece           | Service                                    | Where                                         |
| --------------- | ------------------------------------------ | --------------------------------------------- |
| Web             | Vercel Hobby                               | `invoice.tariqguesri.com`                     |
| API + Socket.io | Cloud Run (`invoice-api`)                  | `europe-west1`, `api.invoice.tariqguesri.com` |
| Worker          | Compute Engine e2-micro (`invoice-worker`) | `us-east1-b`                                  |
| Postgres        | Neon                                       | AWS Frankfurt                                 |
| Redis           | Redis Cloud (free)                         | EU                                            |
| Storage         | Cloudflare R2                              | needed from Milestone 2                       |
| Images          | Artifact Registry + GHCR                   | `europe-west1` / `ghcr.io`                    |

## How a deploy works

1. A push to `main` runs [CI](../.github/workflows/ci.yml).
2. When CI succeeds, [Deploy](../.github/workflows/deploy.yml) runs:
    1. Authenticates to GCP with Workload Identity Federation (no JSON keys).
    2. Builds one image from `apps/api/Dockerfile`, tagged with the commit SHA, and pushes it to Artifact Registry and GHCR.
    3. Runs `prisma migrate deploy` against Neon's direct connection string. A failure stops the deploy.
    4. Deploys the image to Cloud Run (`node dist/main.js`).
    5. Copies `infra/vm/docker-compose.worker.yml` to the VM over IAP SSH and restarts the worker (`node dist/worker.js`).
    6. Smoke tests: `GET /api/v1/health` must return `status: ok` **and** the new commit SHA as `version`; the worker container must be running.
3. Vercel deploys the web app through its GitHub integration. `turbo-ignore` skips the build when nothing the web app depends on changed.

To redeploy without a new commit, run the Deploy workflow by hand from `main` (Actions → Deploy → Run workflow). Runs started from any other branch are skipped.

## One-time provisioning

Run the commands from a machine with the [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and logged in (`gcloud auth login`). Free-tier limits change: check each provider's pricing page while doing this.

```bash
export PROJECT_ID=invoice-prod-<suffix>   # project IDs are global, pick a free one
export REGION=europe-west1
export WORKER_ZONE=us-east1-b
export GITHUB_REPO=TarekGuesri/invoice
```

### 1. GCP projects and the cost guard

- **`invoice-gemini`**: create it in [AI Studio](https://aistudio.google.com/apikey) when you create the Gemini API key. **Never link a billing account to it**, or Gemini moves to the paid tier. The key is only needed from Milestone 2.
- **`invoice-prod`**: holds everything else and needs billing (Cloud Run requires it).

```bash
gcloud projects create "$PROJECT_ID" --name=invoice-prod
gcloud billing projects link "$PROJECT_ID" --billing-account=<BILLING_ACCOUNT_ID>
gcloud config set project "$PROJECT_ID"

gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  compute.googleapis.com iap.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com billingbudgets.googleapis.com

# €5 budget alert on the billing account (the currency must match the account's)
gcloud billing budgets create --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="invoice cost guard" --budget-amount=5EUR \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
```

### 2. Artifact Registry

```bash
gcloud artifacts repositories create invoice \
  --repository-format=docker --location="$REGION"
gcloud artifacts repositories set-cleanup-policies invoice \
  --location="$REGION" --policy=infra/gcp/ar-cleanup-policy.json --no-dry-run
```

The free tier is 0.5 GB. The image is about 125 MB compressed and consecutive versions share their base layers; the cleanup policy keeps the last 3.

### 3. Neon (Postgres)

1. Create a project in **AWS Europe Central 1 (Frankfurt)**, Postgres 17.
2. Copy two connection strings from **Connect**:
    - **Pooled** (host contains `-pooler`): the app's `DATABASE_URL`.
    - **Direct** (pooling off): used only by migrations, stored as the GitHub secret `DATABASE_DIRECT_URL`.

Free plan (checked Nov 2026): 1 GB storage per project, 100 CU-hours per month, compute suspends after 5 minutes idle.

### 4. Redis Cloud

1. Create a free (30 MB) database in an EU region.
2. Set **Eviction policy** to **`noeviction`** (BullMQ requires it).
3. Copy the public endpoint and default user password: `redis://default:<password>@<host>:<port>`.

> The free plan doesn't support TLS and allows about 100 ops/sec, so the URL is `redis://`, not `rediss://`. The app accepts both, so moving to a TLS plan is only a URL change.

### 5. Service accounts and Workload Identity Federation

```bash
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
export DEPLOYER=github-deployer@$PROJECT_ID.iam.gserviceaccount.com
export API_RUNTIME=invoice-api@$PROJECT_ID.iam.gserviceaccount.com

# Cloud Run runtime identity with no roles (instead of the default compute SA,
# which has Editor on the project).
gcloud iam service-accounts create invoice-api --display-name="invoice API runtime"

# Identity used by GitHub Actions
gcloud iam service-accounts create github-deployer --display-name="GitHub Actions deployer"
for role in roles/run.admin roles/artifactregistry.writer roles/compute.viewer \
            roles/compute.osAdminLogin roles/iap.tunnelResourceAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOYER" --role="$role" --condition=None
done
gcloud iam service-accounts add-iam-policy-binding "$API_RUNTIME" \
  --member="serviceAccount:$DEPLOYER" --role=roles/iam.serviceAccountUser

# Only workflows from this repository's main branch can impersonate the deployer.
gcloud iam workload-identity-pools create github \
  --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc invoice-repo \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == '$GITHUB_REPO' && assertion.ref == 'refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GITHUB_REPO"
```

### 6. Cloud Run service

The pipeline only swaps the image, so create the service once with its runtime env:

```bash
cp infra/gcp/api.env.example.yaml infra/gcp/api.env.yaml   # gitignored; fill it in
gcloud run deploy invoice-api \
  --image=us-docker.pkg.dev/cloudrun/container/hello \
  --region="$REGION" --service-account="$API_RUNTIME" \
  --env-vars-file=infra/gcp/api.env.yaml \
  --max-instances=1 --allow-unauthenticated
rm infra/gcp/api.env.yaml
```

`JWT_ACCESS_SECRET` signs access tokens. Generate it with `openssl rand -base64 48`; rotating it logs everyone out within 15 minutes (refresh tokens are stored in the database and keep working). The worker doesn't need it.

To change an env var later: `gcloud run services update invoice-api --region="$REGION" --update-env-vars KEY=value`. Add a variable the new code requires **before** merging that code, or the new revision fails to start and the deploy's smoke test fails.

**Custom domain.** Web and API must share the site `tariqguesri.com` so `sameSite=lax` auth cookies work (see [ADR 0001](adr/0001-hosting.md)).

```bash
gcloud domains verify tariqguesri.com     # one-time, through Search Console
gcloud beta run domain-mappings create --service=invoice-api \
  --domain=api.invoice.tariqguesri.com --region="$REGION"
```

Then add the DNS record it prints (a `CNAME` from `api.invoice` to `ghs.googlehosted.com.`). The managed certificate can take 15–60 minutes.

### 7. Worker VM

```bash
gcloud compute instances create invoice-worker \
  --zone="$WORKER_ZONE" --machine-type=e2-micro \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB --boot-disk-type=pd-standard \
  --metadata=enable-oslogin=TRUE \
  --no-service-account --no-scopes --tags=invoice-worker

# SSH only through Identity-Aware Proxy, never from the open internet.
gcloud compute firewall-rules create invoice-worker-iap-ssh \
  --network=default --direction=INGRESS --action=allow --rules=tcp:22 \
  --source-ranges=35.235.240.0/20 --target-tags=invoice-worker
# The default network allows SSH/RDP from anywhere; remove those rules.
gcloud compute firewall-rules delete default-allow-ssh default-allow-rdp --quiet
```

Only one e2-micro per billing account is free, and only in `us-west1`, `us-central1` or `us-east1`, with a 30 GB standard disk. The VM needs an external IP for outbound traffic (Redis, Neon, GHCR); the free tier doesn't charge for it.

Set up Docker, swap and the env file:

```bash
gcloud compute scp infra/vm/setup-vm.sh infra/vm/worker.env.example \
  invoice-worker:~ --zone="$WORKER_ZONE" --tunnel-through-iap
gcloud compute ssh invoice-worker --zone="$WORKER_ZONE" --tunnel-through-iap
# on the VM:
sudo bash setup-vm.sh
sudo nano /opt/invoice/worker.env      # same values as the API (see worker.env.example)
```

### 8. GitHub

**Repository variables** (Settings → Secrets and variables → Actions → Variables):

| Name                             | Value                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`                 | `$PROJECT_ID`                                                                                   |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/invoice-repo` |
| `GCP_DEPLOY_SERVICE_ACCOUNT`     | `$DEPLOYER`                                                                                     |
| `WORKER_VM`                      | `invoice-worker`                                                                                |
| `WORKER_ZONE`                    | `us-east1-b`                                                                                    |

**Environment `production`** (Settings → Environments): secret `DATABASE_DIRECT_URL` = Neon's direct connection string, and **Deployment branches** limited to `main`. Together with the Workload Identity condition above and the workflow's own check, only `main` can deploy.

**Branch protection** on `main`: require the CI checks _Format, spelling, types, lint, unit tests, build_, _Integration tests_ and _Docker image starts_ to pass. The last one builds the production image and starts the API and worker from it ([`infra/ci/check-image.sh`](../infra/ci/check-image.sh)), so a broken image fails in the PR instead of on Cloud Run.

**GHCR visibility.** The first deploy pushes `ghcr.io/tarekguesri/invoice-api` as a private package, so that run's worker step fails because the VM can't pull it. Open the package (GitHub profile → Packages → invoice-api → Package settings), change visibility to **Public**, then re-run the workflow. A public package lets the VM pull without stored credentials.

### 9. Vercel

1. Import the repository. Set **Root Directory** to `apps/web`; the build, install and ignore commands come from `apps/web/vercel.json`.
2. Env var for Production and Preview: `NEXT_PUBLIC_API_URL=https://api.invoice.tariqguesri.com/api/v1`.
3. Add the domain `invoice.tariqguesri.com` and create the `CNAME` it asks for.

Preview deployments live on `*.vercel.app`. They can show the landing page, but the API's CORS only allows the production origin, and auth cookies won't work there by design.

### 10. Sentry (optional)

Create a Node project and set `SENTRY_DSN` on the Cloud Run service and in `/opt/invoice/worker.env`. Without it, Sentry stays off.

## Verifying production

```bash
curl -s https://api.invoice.tariqguesri.com/api/v1/health | jq
```

Expect `status: "ok"`, `version` equal to the deployed commit, and `checks.worker.status: "up"` within about a minute of a worker restart (the heartbeat job runs every 5 minutes, starting at boot). The landing page footer shows the same status.

Logs:

```bash
gcloud run services logs read invoice-api --region="$REGION" --limit=50
gcloud compute ssh invoice-worker --zone="$WORKER_ZONE" --tunnel-through-iap \
  --command 'sudo docker logs --tail 50 invoice-worker'
```
