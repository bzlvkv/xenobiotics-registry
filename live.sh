#!/usr/bin/env bash
# live.sh — bring up the registry's dev environment.
#
# `pnpm dev` alone starts the client, and that is all it does: if dependencies
# are missing it fails with a module error, and if the data has a malformed
# record it serves it anyway, because the client fetches the committed JSON and
# trusts it (pnpm validate is the gate that earns that trust). Browsing a broken
# catalog and blaming the page is the failure this script exists to prevent.
#
# So, in order: install if needed, validate the data, then serve it.
#
#   ./live.sh                  install if needed, validate, serve on 5173
#   ./live.sh --port 4000      serve elsewhere
#   ./live.sh --open           open a browser once it is up
#   ./live.sh --no-validate    skip the gate (you are debugging the client itself)
#   ./live.sh --build          build and preview the production bundle instead
#
# Ctrl-C stops it. The server runs in the foreground on purpose: a dev server in
# the background is one you forget is running.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

PORT="${PORT:-5173}"
VALIDATE=1
BUILD=0
OPEN=()

# The header comment above IS the help text, so the two cannot drift.
usage() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "${BASH_SOURCE[0]}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="${2:?--port needs a number}"; shift 2 ;;
    --port=*) PORT="${1#*=}"; shift ;;
    --no-validate) VALIDATE=0; shift ;;
    --build) BUILD=1; shift ;;
    --open) OPEN=(--open); shift ;;
    -h | --help) usage; exit 0 ;;
    *)
      echo "live.sh: unknown argument $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

say() { printf '\n\033[1mlive:\033[0m %s\n' "$1"; }

if ! command -v pnpm >/dev/null 2>&1; then
  echo "live.sh: pnpm is not on PATH. Install it with \`corepack enable pnpm\`." >&2
  exit 1
fi

# A workspace package can be missing its own node_modules even when the root has
# one, which surfaces as an unresolved import rather than as a missing install.
if [ ! -d node_modules ] || [ ! -d packages/web/node_modules ] || [ ! -d packages/registry/node_modules ]; then
  say "installing dependencies"
  pnpm install
fi

if [ "$VALIDATE" -eq 1 ]; then
  say "validating the data before serving it"
  if ! pnpm validate --errors-only; then
    cat >&2 <<'MSG'

live.sh: the data did not pass the gate, so the client would render records the
         schema rejects. Fix the errors above, or pass --no-validate if you are
         debugging the client rather than the data.
MSG
    exit 1
  fi
fi

# Vite would silently pick the next free port, so a second copy of this script
# would serve stale data at an address you did not ask for. --strictPort makes
# that an error; this turns it into a readable one.
#
# Both loopback families are probed because Vite binds ::1 here, so a v4-only
# check called a busy port free and the failure arrived as a pnpm exit code.
port_in_use() {
  local host
  for host in 127.0.0.1 ::1; do
    if (echo >"/dev/tcp/$host/$PORT") >/dev/null 2>&1; then return 0; fi
  done
  return 1
}

if port_in_use; then
  echo "live.sh: something is already listening on port $PORT." >&2
  echo "         Stop it, or pass --port <n> to use another." >&2
  exit 1
fi

if [ "$BUILD" -eq 1 ]; then
  say "building the production bundle"
  pnpm build
  say "serving the built bundle at http://localhost:$PORT/"
  exec pnpm --filter @xeno/web preview --port "$PORT" --strictPort ${OPEN[@]+"${OPEN[@]}"}
fi

cat <<MSG

  Registry browser   http://localhost:$PORT/
  Health view        http://localhost:$PORT/#/health

  The datasets are served straight from data/, so an edit to a JSON file shows
  up on reload. Re-run \`pnpm validate\` after editing; this script only checked
  the data as it was at startup.

MSG

exec pnpm --filter @xeno/web dev --port "$PORT" --strictPort ${OPEN[@]+"${OPEN[@]}"}
