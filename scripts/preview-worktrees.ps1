param(
  [ValidateSet('Start', 'Status', 'Stop')][string]$Action = 'Status',
  [string]$Workspace = (Join-Path $PSScriptRoot '../../..')
)
$ErrorActionPreference = 'Stop'
$previewRoot = (Resolve-Path -LiteralPath $Workspace).Path
$previewDefinitions = @(
  @{ Port = 4173; Folder = 'sito-pronto'; Branch = 'main' },
  @{ Port = 4174; Folder = 'concepts/dark-editorial-3d'; Branch = 'design/dark-editorial-3d' },
  @{ Port = 4175; Folder = 'concepts/light-minimal-3d'; Branch = 'design/light-minimal-3d' }
)
$previewOldPort = $env:PORT
try {
  foreach ($preview in $previewDefinitions) {
    $previewDirectory = (Resolve-Path -LiteralPath (Join-Path $previewRoot $preview.Folder)).Path
    $previewBranch = (& git -C $previewDirectory branch --show-current)
    if ($LASTEXITCODE -ne 0 -or $previewBranch -ne $preview.Branch) { throw "Branch inatteso in $previewDirectory" }
    $previewScript = (Join-Path $previewDirectory 'scripts/serve.mjs').Replace('\', '/')
    $previewListener = Get-NetTCPConnection -State Listen -LocalAddress '127.0.0.1' -LocalPort $preview.Port -ErrorAction SilentlyContinue
    if ($previewListener) {
      $previewProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($previewListener.OwningProcess)"
      if ($previewProcess.Name -ne 'node.exe' -or !$previewProcess.CommandLine.Replace('\', '/').Contains($previewScript)) {
        throw "Porta $($preview.Port) occupata da un processo non riconosciuto; non viene arrestato."
      }
    }
    if ($Action -eq 'Stop') {
      if ($previewListener) { Stop-Process -Id $previewListener.OwningProcess; Write-Output "Arrestata porta $($preview.Port) (PID $($previewListener.OwningProcess))" }
      else { Write-Output "Porta $($preview.Port) gia libera" }
      continue
    }
    if (!$previewListener -and $Action -eq 'Start') {
      $previewLogs = Join-Path $previewRoot 'artifacts/robot-previews'
      New-Item -ItemType Directory -Path $previewLogs -Force | Out-Null
      $env:PORT = [string]$preview.Port
      $previewLog = Join-Path $previewLogs "server-$($preview.Port)"
      Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @(('"' + $previewScript + '"')) -WorkingDirectory $previewDirectory -WindowStyle Hidden -RedirectStandardOutput "$previewLog.log" -RedirectStandardError "$previewLog.error.log" | Out-Null
      Start-Sleep -Milliseconds 800
    }
    try {
      $previewResponse = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$($preview.Port)/" -TimeoutSec 5
      if ($previewResponse.StatusCode -ne 200 -or $previewResponse.Content -cne [System.IO.File]::ReadAllText((Join-Path $previewDirectory 'index.html'))) { throw 'La pagina non corrisponde al worktree.' }
      Write-Output "$($preview.Branch) | http://127.0.0.1:$($preview.Port) | HTTP 200, HTML verificato"
    } catch { if ($Action -eq 'Start') { throw }; Write-Output "Porta $($preview.Port): non disponibile ($($_.Exception.Message))" }
  }
} finally { $env:PORT = $previewOldPort }
