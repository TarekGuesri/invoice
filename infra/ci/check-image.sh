#!/usr/bin/env bash
# Starts the production API image as both processes and checks they come up.
# Catches what the dev install hides: modules missing from the pruned
# production node_modules, native builds, env validation at startup.
#
# Usage: infra/ci/check-image.sh <image>
# Needs Postgres and Redis reachable from the host network (DATABASE_URL,
# REDIS_URL; defaults match the CI service containers).
set -euo pipefail

IMAGE=${1:?usage: check-image.sh <image>}
PORT=${CHECK_PORT:-18080}
API=invoice-check-api
WORKER=invoice-check-worker

env_args=(
	-e WEB_ORIGIN=http://localhost:3000
	-e "DATABASE_URL=${DATABASE_URL:-postgresql://invoice:invoice@localhost:5432/invoice}"
	-e "REDIS_URL=${REDIS_URL:-redis://localhost:6379}"
)

cleanup() {
	docker rm -f "$API" "$WORKER" > /dev/null 2>&1 || true
}
trap cleanup EXIT

fail() {
	echo "::error::$1"
	echo "--- $API logs"
	docker logs "$API" 2>&1 | tail -40 || true
	echo "--- $WORKER logs"
	docker logs "$WORKER" 2>&1 | tail -40 || true
	exit 1
}

docker run -d --name "$API" --network host "${env_args[@]}" \
	-e PORT="$PORT" \
	-e JWT_ACCESS_SECRET=image-check-secret-not-used-anywhere-else \
	"$IMAGE" > /dev/null
# The worker gets no JWT secret, as in production.
docker run -d --name "$WORKER" --network host "${env_args[@]}" \
	"$IMAGE" node dist/worker.js > /dev/null

health=''
for _ in $(seq 1 30); do
	health=$(curl -fsS "http://localhost:$PORT/api/v1/health" 2> /dev/null || true)
	[ -n "$health" ] && break
	[ "$(docker inspect -f '{{.State.Running}}' "$API")" = true ] ||
		fail 'API container exited during startup'
	sleep 1
done
echo "$health" | jq -e '.status == "ok"' > /dev/null ||
	fail "API health check failed: ${health:-no response}"
echo "API healthy"

# A protected route proves the auth module loaded and the guard runs.
me=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/v1/me")
[ "$me" = 401 ] || fail "GET /api/v1/me returned $me, expected 401"
echo "Auth guard answers 401"

for _ in $(seq 1 20); do
	docker logs "$WORKER" 2>&1 | grep -q 'Worker started' && break
	[ "$(docker inspect -f '{{.State.Running}}' "$WORKER")" = true ] ||
		fail 'Worker container exited during startup'
	sleep 1
done
docker logs "$WORKER" 2>&1 | grep -q 'Worker started' ||
	fail 'Worker did not log "Worker started"'
echo "Worker started"
