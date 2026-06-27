# Origin the local vite dev server runs on; the sync server requires it.
DEV_ORIGIN ?= http://localhost:8080

# Sync server the built bundle connects to. wss:// because the prod container
# sits behind Traefik doing automatic HTTPS. Vite inlines this at build time;
# `make dev` skips the build and falls back to ws://localhost:1234 (src/store.ts).
SYNC_URL ?= wss://worktimer-sync.rknt.de

.PHONY: dev
dev: node_modules
	@ALLOWED_ORIGINS=$(DEV_ORIGIN) npx tsx server/index.ts & \
	SERVER_PID=$$!; \
	trap "kill $$SERVER_PID 2>/dev/null" EXIT INT TERM; \
	npx vite --port 8080

.PHONY: dev-server
dev-server: node_modules
	ALLOWED_ORIGINS=$(DEV_ORIGIN) npx tsx server/index.ts

.PHONY: build
build: node_modules
	VITE_SYNC_URL=$(SYNC_URL) npx vite build

.PHONY: prod
prod: node_modules
	npx vite preview --port 8080

.PHONY: check
check: node_modules
	npx svelte-check --tsconfig ./tsconfig.app.json && npx tsc -p tsconfig.node.json && npx vitest run

LOCAL_TRUNK_VER := $(shell date --utc +%Y%m%d%H%M%S)-$(shell git rev-parse --short HEAD)$(shell if git diff --quiet; then echo ""; else echo "-dirty"; fi)

.PHONY: container
container:
	cd server && docker build -t rknt/worktimer-sync:$(LOCAL_TRUNK_VER) .

.PHONY: release
release: build container
	mc mirror --overwrite --remove ./dist rknt/tools/worktimer
	docker push rknt/worktimer-sync:$(LOCAL_TRUNK_VER)
	cd /home/hff/repos/rknt-server && git pull
	yq -i '.services.worktimer-sync.image = "rknt/worktimer-sync:$(LOCAL_TRUNK_VER)"' /home/hff/repos/rknt-server/worktimer-sync/docker-compose.yml
	cd /home/hff/repos/rknt-server && git add worktimer-sync/docker-compose.yml && git commit -m "bump worktimer-sync image version" && git push

node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile

