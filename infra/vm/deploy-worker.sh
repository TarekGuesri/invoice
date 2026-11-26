#!/usr/bin/env bash
# Runs on the worker VM as root, piped in over SSH by .github/workflows/deploy.yml.
set -euo pipefail

: "${WORKER_IMAGE:?WORKER_IMAGE is required}"

install -m 644 /tmp/docker-compose.worker.yml /opt/invoice/docker-compose.worker.yml
cd /opt/invoice

export WORKER_IMAGE
docker compose -f docker-compose.worker.yml pull --quiet
docker compose -f docker-compose.worker.yml up -d --remove-orphans

# Keep the 30 GB disk from filling up with old images.
docker image prune -af --filter "until=72h" > /dev/null

echo "Worker running $WORKER_IMAGE"
