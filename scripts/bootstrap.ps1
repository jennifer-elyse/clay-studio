# Uses Node.js 26 with npm. Downloads the official archive when either is missing.
# The install rule matches needsRuntimeInstall in launch-plan.js.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$Version = (Get-Content (Join-Path $Root "scripts\node-version.txt") -Raw).Trim()
$PinBare = $Version.TrimStart("v")
$PinMajor = $PinBare.Split(".")[0]
$Runtime = Join-Path $Root ".clay\runtime\node"

function Get-NodeVersion([string]$Exe) {
  if (-not (Test-Path $Exe)) { return "" }
  try {
    return ((& $Exe -p "process.versions.node") | Out-String).Trim()
  } catch {
    return ""
  }
}

function Test-NpmBeside([string]$Exe) {
  $npm = Join-Path (Split-Path $Exe) "npm.cmd"
  if (-not (Test-Path $npm)) { return $false }
  $saved = $env:Path
  $env:Path = "$(Split-Path $Exe);$env:Path"
  try {
    & $npm --version | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  } finally {
    $env:Path = $saved
  }
}

function Test-Usable([string]$Exe, [bool]$Private) {
  $ver = Get-NodeVersion $Exe
  if (-not $ver) { return $false }
  if ($Private) {
    if ($ver -ne $PinBare) { return $false }
  } elseif ($ver.Split(".")[0] -ne $PinMajor) {
    return $false
  }
  return Test-NpmBeside $Exe
}

function Install-Node {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
  $name = "node-$Version-win-$arch"
  $url = "https://nodejs.org/dist/$Version/$name.zip"
  $found = Get-Command node -ErrorAction SilentlyContinue
  $reason = "Clay Studio uses Node.js $PinMajor. Downloading $Version with npm. This happens once."
  if (-not $found) {
    $reason = "Node.js $PinMajor is not installed. Downloading it with npm. This happens once."
  } else {
    $ver = Get-NodeVersion $found.Source
    $npm = Join-Path (Split-Path $found.Source) "npm.cmd"
    if ($ver -and $ver.Split(".")[0] -eq $PinMajor -and -not (Test-Path $npm)) {
      $reason = "Node.js $ver is installed, and npm is not. Downloading Node.js $Version, which includes npm."
    }
  }
  Write-Host $reason
  $tmp = Join-Path $env:TEMP "clay-node-$PinBare"
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Path $tmp | Out-Null
  $zip = Join-Path $tmp "$name.zip"
  & curl.exe -fL --retry 3 --retry-delay 2 -o $zip $url
  if ($LASTEXITCODE -ne 0) { throw "Could not download Node.js $Version." }
  Write-Host "Checking the download…"
  $sums = (Invoke-WebRequest -Uri "https://nodejs.org/dist/$Version/SHASUMS256.txt" -UseBasicParsing).Content
  $expected = ""
  foreach ($line in ($sums -split "`n")) {
    $parts = $line.Trim() -split "\s+"
    if ($parts.Length -ge 2 -and $parts[1] -eq "$name.zip") { $expected = $parts[0].ToLower(); break }
  }
  $actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
  if (-not $expected -or $actual -ne $expected) { throw "The Node.js download did not match its checksum." }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  New-Item -ItemType Directory -Path (Split-Path $Runtime) -Force | Out-Null
  if (Test-Path $Runtime) { Remove-Item -Recurse -Force $Runtime }
  Move-Item (Join-Path $tmp $name) $Runtime
  Remove-Item -Recurse -Force $tmp
  if (-not (Test-Usable (Join-Path $Runtime "node.exe") $true)) {
    throw "Node.js $Version installed, but npm did not start."
  }
}

Write-Host "Clay Studio"
$node = $null
$portable = Join-Path $Runtime "node.exe"
if (Test-Usable $portable $true) { $node = $portable }
if (-not $node) {
  $found = Get-Command node -ErrorAction SilentlyContinue
  if ($found -and (Test-Usable $found.Source $false)) { $node = $found.Source }
}
if (-not $node) {
  Install-Node
  $node = Join-Path $Runtime "node.exe"
}

$npm = Join-Path (Split-Path $node) "npm.cmd"
$nodeVer = Get-NodeVersion $node
$npmVer = ((& $npm --version) | Out-String).Trim()
Write-Host "Using Node.js $nodeVer and npm $npmVer."
Write-Host ""

$env:Path = "$(Split-Path $node);$env:Path"
& $node (Join-Path $Root "scripts\launch.js") @args
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Clay Studio did not start."
  Read-Host "Press Enter to close"
  exit $LASTEXITCODE
}
