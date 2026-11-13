# Finds a Node 20+ binary, downloading the pinned one into .clay/runtime on first use.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$Version = (Get-Content (Join-Path $Root "scripts\node-version.txt") -Raw).Trim()
$Runtime = Join-Path $Root ".clay\runtime\node"

function Test-NodeOk([string]$Exe) {
  if (-not $Exe) { return $false }
  if ($Exe -ne "node" -and $Exe -ne "node.exe" -and -not (Test-Path $Exe)) { return $false }
  try {
    $raw = & $Exe -p "process.versions.node"
    $major = [int](($raw | Out-String).Trim().Split(".")[0])
    return $major -ge 20
  } catch {
    return $false
  }
}

$node = $null
$portable = Join-Path $Runtime "node.exe"
if (Test-NodeOk $portable) { $node = $portable }
if (-not $node) {
  $found = Get-Command node -ErrorAction SilentlyContinue
  if ($found -and (Test-NodeOk $found.Source)) { $node = $found.Source }
}

if (-not $node) {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
  $name = "node-$Version-win-$arch"
  $url = "https://nodejs.org/dist/$Version/$name.zip"
  Write-Host "Downloading Node $Version. This happens once."
  $tmp = Join-Path $env:TEMP "clay-node-$Version"
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Path $tmp | Out-Null
  $zip = Join-Path $tmp "$name.zip"
  Invoke-WebRequest -Uri $url -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  New-Item -ItemType Directory -Path (Split-Path $Runtime) -Force | Out-Null
  if (Test-Path $Runtime) { Remove-Item -Recurse -Force $Runtime }
  Move-Item (Join-Path $tmp $name) $Runtime
  $node = Join-Path $Runtime "node.exe"
}

$env:Path = "$(Split-Path $node);$env:Path"
& $node (Join-Path $Root "scripts\launch.js") @args
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Clay Studio did not start."
  Read-Host "Press Enter to close"
  exit $LASTEXITCODE
}
