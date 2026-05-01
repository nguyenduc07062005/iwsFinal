param(
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$BackendHealthUrl = "http://localhost:8000/api/health",
  [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"
$failures = 0

function Write-CheckResult {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )

  if ($Ok) {
    Write-Host "[OK]   $Name - $Detail" -ForegroundColor Green
  } else {
    Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red
    $script:failures += 1
  }
}

function Invoke-JsonCheck {
  param([string]$Url)

  $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
  return @{
    StatusCode = $response.StatusCode
    Json = $response.Content | ConvertFrom-Json
  }
}

Write-Host "StudyVault demo readiness check" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipDocker) {
  try {
    $composePs = docker compose ps
    Write-CheckResult "Docker compose" $true "compose command is available"
    Write-Host $composePs
  } catch {
    Write-CheckResult "Docker compose" $false "cannot read compose status: $($_.Exception.Message)"
  }
}

try {
  $health = Invoke-JsonCheck -Url $BackendHealthUrl
  $isHealthy =
    $health.StatusCode -eq 200 -and
    $health.Json.status -eq "ok" -and
    $health.Json.checks.database -eq "ok"

  Write-CheckResult "Backend health" $isHealthy "$BackendHealthUrl -> status=$($health.Json.status), database=$($health.Json.checks.database)"
} catch {
  Write-CheckResult "Backend health" $false "$BackendHealthUrl is not ready: $($_.Exception.Message)"
}

try {
  $frontend = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 10
  Write-CheckResult "Frontend" ($frontend.StatusCode -ge 200 -and $frontend.StatusCode -lt 400) "$FrontendUrl -> HTTP $($frontend.StatusCode)"
} catch {
  Write-CheckResult "Frontend" $false "$FrontendUrl is not ready: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Manual demo flow to run after readiness is green:" -ForegroundColor Cyan
Write-Host "1. Register a new user and open the verification email."
Write-Host "2. Complete registration with a 12+ character strong password."
Write-Host "3. Log in, upload a PDF/DOCX/TXT file, and open the document viewer."
Write-Host "4. Show filters, favorite toggle, download, and document preview."
Write-Host "5. Show AI summary/Q&A if GEMINI_API_KEY has quota; explain upload/view still works without AI quota."
Write-Host "6. Log in as admin and show user management plus audit logs."
Write-Host "7. Log out and refresh the page to show the session is cleared."

if ($failures -gt 0) {
  Write-Host ""
  Write-Host "$failures readiness check(s) failed." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Readiness checks passed." -ForegroundColor Green
