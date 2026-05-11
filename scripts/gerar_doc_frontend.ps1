# C:\Users\victo\workspace\teamflowweb\scripts\gerar_doc_frontend.ps1

$OutputFile = "C:\Users\victo\workspace\teamflowweb\TeamFlowFrontend_SourceCode.txt"
$IgnorarPastas = @("node_modules", ".git", "dist", ".vite", "coverage", "scripts", ".vscode")
$IgnorarArquivos = @("package-lock.json", "tsconfig.json", "*.log", ".env", "style.css")

# Fechar o arquivo se estiver aberto
if (Test-Path $OutputFile) { 
    try {
        Remove-Item $OutputFile -Force
    } catch {
        Write-Host "Arquivo em uso. Feche o arquivo e tente novamente." -ForegroundColor Red
        exit 1
    }
}

# Ir para a raiz do projeto
Push-Location "C:\Users\victo\workspace\teamflowweb"

$Files = Get-ChildItem -File -Include *.vue, *.ts, *.html, *.css, *.json, *.md -Recurse | Where-Object {
    $ignorar = $false
    foreach ($pasta in $IgnorarPastas) {
        if ($_.DirectoryName -like "*\$pasta*") { $ignorar = $true; break }
    }
    foreach ($arquivo in $IgnorarArquivos) {
        if ($_.Name -eq $arquivo) { $ignorar = $true; break }
    }
    -not $ignorar
}

Add-Content -Path $OutputFile -Value "=========================================================="
Add-Content -Path $OutputFile -Value "  TEAMFLOW FRONTEND - CODIGO FONTE COMPLETO"
Add-Content -Path $OutputFile -Value "  Gerado em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
Add-Content -Path $OutputFile -Value "  Projeto: TeamFlow Frontend (Vue 3 + PrimeVue + Vite)"
Add-Content -Path $OutputFile -Value "=========================================================="
Add-Content -Path $OutputFile -Value ""

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  GERANDO DOCUMENTACAO DO FRONTEND" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($File in $Files | Sort-Object FullName) {
    $relPath = $File.FullName.Replace("C:\Users\victo\workspace\teamflowweb\", "").Replace("\", "/")
    Write-Host "Processando: $relPath" -ForegroundColor Green

    Add-Content -Path $OutputFile -Value ""
    Add-Content -Path $OutputFile -Value "// =========================================================="
    Add-Content -Path $OutputFile -Value "// ARQUIVO: $relPath"
    Add-Content -Path $OutputFile -Value "// =========================================================="
    Add-Content -Path $OutputFile -Value ""

    Get-Content $File.FullName | Add-Content -Path $OutputFile
}

Pop-Location

Write-Host ""
Write-Host "CONCLUIDO! Arquivo gerado: $OutputFile" -ForegroundColor Green
Write-Host "Total de arquivos processados: $($Files.Count)" -ForegroundColor Yellow
