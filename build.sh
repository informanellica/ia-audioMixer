#!/usr/bin/env bash
# Packages the extension into a versioned zip for Chrome / Edge submission.
#
# Usage (from anywhere):
#   ./build.sh
#
# Output: dist/ia-audioMixer-v<version>.zip  (version read from manifest.json)
# Only the files listed in $include are bundled, so dev files (.git,
# .gitignore, build.ps1/.sh, dist/, etc.) never leak into the published package.

set -euo pipefail

# Move to the script's own directory so it works from anywhere.
cd "$(dirname "$0")"

# Files / directories that make up the shipped extension.
include=(
  manifest.json
  background.js
  offscreen.html
  offscreen.js
  popup.html
  popup.js
  icons
  _locales
)

# Fail early if anything expected is missing.
missing=()
for f in "${include[@]}"; do
  [[ -e "$f" ]] || missing+=("$f")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing files, aborting: ${missing[*]}" >&2
  exit 1
fi

# Read "version" from manifest.json (no jq dependency).
version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n1)
if [[ -z "$version" ]]; then
  echo 'manifest.json has no "version" field.' >&2
  exit 1
fi

out="dist/ia-audioMixer-v${version}.zip"
mkdir -p dist
rm -f "$out"

# Pick whatever archiver is available. Git for Windows' bash usually has no
# `zip`, so fall back to PowerShell (Windows) and then Python (portable).
if command -v zip >/dev/null 2>&1; then
  # -r recurse (icons/), -X strip extra attrs for a clean cross-platform zip.
  zip -rqX "$out" "${include[@]}"
elif command -v powershell.exe >/dev/null 2>&1; then
  joined=$(IFS=,; echo "${include[*]}")
  powershell.exe -NoProfile -Command \
    "Compress-Archive -Path $joined -DestinationPath '$out' -Force"
elif PYBIN=$(command -v python3 || command -v python); then
  "$PYBIN" - "$out" "${include[@]}" <<'PY'
import os, sys, zipfile
out, *items = sys.argv[1:]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for it in items:
        if os.path.isdir(it):
            for root, _, files in os.walk(it):
                for f in files:
                    p = os.path.join(root, f)
                    z.write(p, p.replace(os.sep, "/"))
        else:
            z.write(it, it)
PY
else
  echo "Need one of: zip, powershell.exe, or python to build the archive." >&2
  exit 1
fi

size=$(du -h "$out" | cut -f1)
echo "Built $out ($size)"
