param(
  [Parameter(Mandatory=$true)][string]$Path,
  [Parameter(Mandatory=$true)][string]$Content
)

$ErrorActionPreference = "Stop"

# Anchor relative paths to *current PowerShell location* (repo root)
$base = (Get-Location).Path
[System.Environment]::CurrentDirectory = $base

if ([System.IO.Path]::IsPathRooted($Path)) {
  $fullPath = $Path
} else {
  $fullPath = Join-Path $base $Path
}

$fullPath = [System.IO.Path]::GetFullPath($fullPath)
$dir = Split-Path $fullPath -Parent
if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($fullPath, $Content, $utf8NoBom)

Write-Host "[OK] Wrote: $fullPath"
