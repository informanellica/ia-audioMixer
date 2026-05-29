# Packages the extension into a versioned zip for Chrome / Edge submission.
#
# Usage (from anywhere):
#   pwsh ./build.ps1
#
# Output: dist/ia-audioMixer-v<version>.zip  (version read from manifest.json)
# Only the files listed in $include are bundled, so dev files (.git,
# .gitignore, build.ps1, dist/, etc.) never leak into the published package.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

# Files / directories that make up the shipped extension.
$include = @(
  'manifest.json',
  'background.js',
  'offscreen.html',
  'offscreen.js',
  'popup.html',
  'popup.js',
  'icons'
)

# Fail early if anything expected is missing.
$missing = $include | Where-Object { -not (Test-Path (Join-Path $root $_)) }
if ($missing) {
  throw "Missing files, aborting: $($missing -join ', ')"
}

# Read version from the manifest.
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
if (-not $version) { throw 'manifest.json has no "version" field.' }

$distDir = Join-Path $root 'dist'
$out = Join-Path $distDir "ia-audioMixer-v$version.zip"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
if (Test-Path $out) { Remove-Item $out }

Compress-Archive -Path $include -DestinationPath $out

$size = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Host "Built $out ($size KB)" -ForegroundColor Green
