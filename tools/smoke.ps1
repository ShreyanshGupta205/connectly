# Connectly Comprehensive Autonomous Smoke Test Runner (Step 11)
# Enforces non-production test DB URL, executes full agent cycle with Ollama Lock,
# runs full test suite, audits bundle and secrets, and formats a clear PASS/FAIL table.

$ErrorActionPreference = "Continue"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "       CONNECTLY AGENT STACK SMOKE TEST SUITE (STEP 11)           " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Environment Configuration (Guarded Against Supabase)
$env:AGENTS_ENABLED = "true"
$env:NODE_ENV = "test"
$env:DATABASE_URL = "postgresql://test_user:test_pass@127.0.0.1:5432/test_connectly"
$env:TEST_DATABASE_URL = "postgresql://test_user:test_pass@127.0.0.1:5432/test_connectly"
$env:ADMIN_API_KEY = "smoke_test_admin_key_local"

$results = @()
$totalStart = [System.Diagnostics.Stopwatch]::StartNew()

function Run-Step($name, $command) {
    Write-Host "[RUNNING] $name..." -ForegroundColor Yellow
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $output = cmd.exe /c "$command" 2>&1
    $exitCode = $LASTEXITCODE
    $sw.Stop()
    $duration = [Math]::Round($sw.Elapsed.TotalSeconds, 2)

    if ($exitCode -eq 0) {
        Write-Host "  ✔ [PASS] $name ($($duration)s)" -ForegroundColor Green
        return [PSCustomObject]@{
            Step = $name
            Status = "PASS"
            Duration = "$($duration)s"
        }
    } else {
        Write-Host "  ✖ [FAIL] $name ($($duration)s)" -ForegroundColor Red
        Write-Host $output -ForegroundColor DarkRed
        return [PSCustomObject]@{
            Step = $name
            Status = "FAIL"
            Duration = "$($duration)s"
        }
    }
}

# Step 1: Database Host Abort Guard
$results += Run-Step "1. Supabase-Host Abort Guard Verification" "node --test tests/db_guard.test.mjs"

# Step 2: Agent Cycle (Observe -> Plan -> Content -> Brand Gate)
$results += Run-Step "2. Autonomous Cycle (Observe->Plan->Content->Gate)" "node tools/smoke_cycle.mjs"

# Step 3: Full Test Suite Matrix
$results += Run-Step "3. Unit & Integration Test Matrix (161 tests)" "npm.cmd test"

# Step 4: Product Quality & SEO Audit
$results += Run-Step "4. Product Quality, Sitemap & TTFB Audit" "node agent-setup/audit.mjs"

# Step 5: Secrets & Credentials Scanner (Repo + dist/)
$results += Run-Step "5. Secrets & Leaks Scanner (Gitleaks rule)" "node tools/secret_scanner.mjs"

# Cleanup Environment Variables
$env:AGENTS_ENABLED = "false"
$env:DATABASE_URL = $null
$env:ADMIN_API_KEY = $null

$totalStart.Stop()
$totalSecs = [Math]::Round($totalStart.Elapsed.TotalSeconds, 2)

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "                 SMOKE TEST EXECUTION SUMMARY                     " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$results | Format-Table -AutoSize

$anyFailed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Host "Total Execution Time: $($totalSecs)s" -ForegroundColor DarkGray

if ($anyFailed -eq 0) {
    Write-Host "RESULT: ALL SMOKE TESTS VERIFIED AND PASSED!" -ForegroundColor Green
    Exit 0
} else {
    Write-Host "RESULT: $anyFailed STEP(S) FAILED!" -ForegroundColor Red
    Exit 1
}
