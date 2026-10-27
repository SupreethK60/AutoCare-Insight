# ============================================================
# AutoCare Insight — Automated Database Migration Runner
# Executes all database scripts in strict dependency order
# ============================================================

param (
    [string]$MySqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    [string]$User = "root",
    [string]$Password = ""
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " AutoCare Insight — Database Deployment & Verification" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (-not (Test-Path $MySqlPath)) {
    Write-Error "MySQL CLI executable not found at $MySqlPath"
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$scripts = @(
    "01_create_database.sql",
    "02_create_tables.sql",
    "03_advanced_features.sql",
    "04_import_csv_vehicle_catalogue.sql",
    "05_sample_data.sql",
    "08_ddl_alter_drop_demo.sql",
    "verify_database.sql"
)

$authArgs = @("-u", $User)
if ($Password -ne "") {
    $authArgs += "-p$Password"
} else {
    $authArgs += "-p"
}

foreach ($script in $scripts) {
    $fullPath = Join-Path $scriptDir $script
    if (-not (Test-Path $fullPath)) {
        Write-Warning "Script not found: $script"
        continue
    }

    Write-Host "`n--> Executing $script..." -ForegroundColor Yellow
    $cmd = "& `"$MySqlPath`" $($authArgs -join ' ') < `"$fullPath`""
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Execution of $script failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    Write-Host "--> Completed $script successfully." -ForegroundColor Green
}

Write-Host "`nAll database migrations and verification completed successfully!" -ForegroundColor Green

