param(
  [string]$From = ".env.vercel.local",
  [string]$To   = ".env.local"
)

$ErrorActionPreference = "Stop"
if (!(Test-Path $From)) { throw "From file not found: $From" }

function ReadEnv([string]$path) {
  if (!(Test-Path $path)) { return @() }
  Get-Content $path
}

function KeysOf($lines) {
  $lines |
    Where-Object { $_ -match '^[A-Z0-9_]+=' } |
    ForEach-Object { ($_ -split '=')[0] } |
    Sort-Object -Unique
}

$fromLines = ReadEnv $From
$toLines   = ReadEnv $To

$fromKeys = KeysOf $fromLines
$toKeys   = KeysOf $toLines

$missing = $fromKeys | Where-Object { $toKeys -notcontains $_ }

if ($missing.Count -eq 0) {
  Write-Host "[OK] No missing keys to merge."
  exit 0
}

Write-Host "[INFO] Append-only merge into $To (no overwrites):"
$missing | ForEach-Object { Write-Host ("  + " + $_) }

foreach ($k in $missing) {
  $line = $fromLines | Where-Object { $_ -match ("^" + [regex]::Escape($k) + "=") } | Select-Object -First 1
  if ($line) { Add-Content -Encoding UTF8 $To $line }
}

Write-Host "[OK] Merge complete."
