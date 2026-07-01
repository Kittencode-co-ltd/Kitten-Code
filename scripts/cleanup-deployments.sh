#!/usr/bin/env bash
# Deletes old GitHub Deployments for this repo, keeping only the latest.
# Requires: gh CLI authenticated (gh auth login) with repo scope.
#
# Usage:
#   bash scripts/cleanup-deployments.sh            # dry run, lists what would be deleted
#   bash scripts/cleanup-deployments.sh --apply     # actually deletes

set -euo pipefail

REPO="Kittencode-co-ltd/Kitten-Code"
APPLY="${1:-}"

echo "Fetching deployments for $REPO..."
mapfile -t ids < <(gh api "repos/$REPO/deployments?per_page=100" --paginate --jq '.[].id')

total="${#ids[@]}"
if [ "$total" -le 1 ]; then
  echo "Nothing to clean up ($total deployment found)."
  exit 0
fi

# Keep the first id (most recent — API returns newest first), delete the rest
keep_id="${ids[0]}"
echo "Total deployments: $total"
echo "Keeping most recent: $keep_id"
echo

for id in "${ids[@]:1}"; do
  if [ "$APPLY" = "--apply" ]; then
    echo "Deactivating + deleting deployment $id..."
    gh api "repos/$REPO/deployments/$id/statuses" -f state=inactive -X POST >/dev/null
    gh api "repos/$REPO/deployments/$id" -X DELETE >/dev/null
  else
    echo "[dry-run] would delete deployment $id"
  fi
done

echo
if [ "$APPLY" = "--apply" ]; then
  echo "Done. Deleted $((total - 1)) old deployments."
else
  echo "Dry run complete. Re-run with --apply to actually delete."
fi
