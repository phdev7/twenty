#!/usr/bin/env bash
# Lints the files you actually changed, working tree included.
#
# `nx lint:diff-with-main` compares main...HEAD and is blind to uncommitted
# work: it prints "No changed files" and exits 0 over code it never read. This
# script takes the file list from `git status` instead, so staged, unstaged and
# untracked files are all covered.
#
# Usage:
#   bash scripts/lint-changed.sh [diex-server|diex-front] [--fix] [--staged]
#
# --staged looks only at what is staged for commit. That is the mode the
# pre-commit hook uses, so unrelated work in progress cannot block a commit.
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FIX=0
STAGED=0
PACKAGES="diex-server diex-front"

for arg in "$@"; do
  case "$arg" in
    --fix) FIX=1 ;;
    --staged) STAGED=1 ;;
    diex-server|diex-front) PACKAGES="$arg" ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

list_candidate_files() {
  if [ "$STAGED" -eq 1 ]; then
    git diff --cached --name-only --diff-filter=d
  else
    git status --porcelain --untracked-files=all | awk '{print $NF}'
  fi
}

status=0

for package in $PACKAGES; do
  files=$(
    list_candidate_files \
      | grep -E "^packages/${package}/src/.*\.(ts|tsx)$" \
      | sed "s|packages/${package}/||" \
      || true
  )

  if [ -z "$files" ]; then
    echo "==> ${package}: no changed files"
    continue
  fi

  count=$(printf '%s\n' "$files" | wc -l | tr -d ' ')
  echo "==> ${package}: linting ${count} changed file(s)"

  # oxfmt sai com erro quando todos os arquivos caem em ignorePatterns, o que
  # acontece sempre que a mudança toca só upgrade-version-command. Isso não é
  # falha de formatação: sem alvo, não há o que checar.
  run_oxfmt() {
    # O if evita que `set -e` aborte antes de inspecionarmos a saída.
    if output=$(printf '%s\n' "$files" | (cd "packages/${package}" && xargs npx oxfmt "$@") 2>&1); then
      printf '%s\n' "$output"

      return 0
    fi

    printf '%s\n' "$output"

    if ! printf '%s' "$output" | grep -q 'Expected at least one target file'; then
      status=1
    fi
  }

  if [ "$FIX" -eq 1 ]; then
    printf '%s\n' "$files" \
      | (cd "packages/${package}" && xargs npx oxlint --type-aware -c .oxlintrc.json --fix) || status=1
    run_oxfmt
  else
    printf '%s\n' "$files" \
      | (cd "packages/${package}" && xargs npx oxlint --type-aware -c .oxlintrc.json) || status=1
    run_oxfmt --check
  fi
done

exit $status
