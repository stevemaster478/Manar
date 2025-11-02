# Script PowerShell per trovare e terminare il processo sulla porta 5173

Write-Host "🔍 Looking for processes using port 5173..." -ForegroundColor Cyan

# Trova il processo che usa la porta 5173
$process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "✅ Found process(es) using port 5173:" -ForegroundColor Yellow
    Get-Process -Id $process | Format-Table Id, ProcessName, Path -AutoSize
    
    $confirm = Read-Host "Do you want to kill these processes? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        foreach ($pid in $process) {
            try {
                Stop-Process -Id $pid -Force
                Write-Host "✅ Killed process $pid" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to kill process $pid : $_" -ForegroundColor Red
            }
        }
        Write-Host "`n✅ Done! You can now run 'npm run dev' again." -ForegroundColor Green
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No process found using port 5173" -ForegroundColor Red
    Write-Host "The error might be from a previous session. Try running 'npm run dev' again." -ForegroundColor Yellow
}

