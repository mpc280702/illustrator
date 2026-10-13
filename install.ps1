# VectorTracer Pro 1.0.1 - Bộ cài đặt tự động cho Adobe Illustrator
$ErrorActionPreference = "SilentlyContinue"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Cài đặt VectorTracer Pro 1.0.1        " -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 1. Cài đặt CEP Panel vào AppData của người dùng (Không cần quyền Admin)
$cepUserDir = Join-Path $env:APPDATA "Adobe\CEP\extensions"
$cepDestDir = Join-Path $cepUserDir "VectorTracerPro"

if (-not (Test-Path $cepUserDir)) {
    New-Item -ItemType Directory -Path $cepUserDir -Force | Out-Null
}

$sourceDir = $PSScriptRoot

Write-Host "[1/2] Đang cài đặt Panel công cụ gắn cố định (CEP Extension)..." -ForegroundColor Yellow

try {
    # Sao chép toàn bộ source vào thư mục CEP extension
    $excludeList = @(".git", ".gitignore", "install.ps1")
    $items = Get-ChildItem -Path $sourceDir | Where-Object { $excludeList -notcontains $_.Name }

    if (-not (Test-Path $cepDestDir)) {
        New-Item -ItemType Directory -Path $cepDestDir -Force | Out-Null
    }

    foreach ($item in $items) {
        Copy-Item -Path $item.FullName -Destination $cepDestDir -Recurse -Force
    }
    Write-Host "[+] Cài đặt Panel thành công tại: $cepDestDir" -ForegroundColor Green
} catch {
    Write-Host "[!] Lỗi khi cài đặt Panel CEP: $_" -ForegroundColor Red
}

# 2. Cài đặt Script vào Menu Scripts của Illustrator (nếu có quyền Admin)
Write-Host "`n[2/2] Cài đặt Script độc lập vào menu File > Scripts..." -ForegroundColor Yellow
$scriptSource = Join-Path $sourceDir "VectorTracerPro.jsx"

$adobePaths = @(
    "C:\Program Files\Adobe",
    "C:\Program Files (x86)\Adobe"
)

$scriptInstalled = 0
foreach ($basePath in $adobePaths) {
    if (Test-Path $basePath) {
        $aiFolders = Get-ChildItem -Path $basePath -Directory -Filter "Adobe Illustrator*" -ErrorAction SilentlyContinue
        foreach ($aiFolder in $aiFolders) {
            $presetsFolder = Join-Path $aiFolder.FullName "Presets"
            if (Test-Path $presetsFolder) {
                $langFolders = Get-ChildItem -Path $presetsFolder -Directory -ErrorAction SilentlyContinue
                foreach ($lang in $langFolders) {
                    $scriptsFolder = Join-Path $lang.FullName "Scripts"
                    if (Test-Path $scriptsFolder) {
                        $destPath = Join-Path $scriptsFolder "VectorTracerPro.jsx"
                        try {
                            Copy-Item -Path $scriptSource -Destination $destPath -Force -ErrorAction Stop
                            Write-Host "[+] Đã cài đặt vào: $destPath" -ForegroundColor Green
                            $scriptInstalled++
                        } catch {}
                    }
                }
            }
        }
    }
}

if ($scriptInstalled -eq 0) {
    Write-Host "[*] Lưu ý: Để script xuất hiện trong menu File > Scripts, chạy install.ps1 bằng quyền Administrator." -ForegroundColor Gray
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host ">>> HOÀN TẤT CÀI ĐẶT!" -ForegroundColor Green
Write-Host "1. Khởi động lại Adobe Illustrator." -ForegroundColor White
Write-Host "2. Mở panel tại: Window > Extensions > VectorTracer Pro" -ForegroundColor White
Write-Host "3. Kéo thả tab vào thanh công cụ bên phải để sử dụng lâu dài." -ForegroundColor White
Write-Host "=========================================`n" -ForegroundColor Cyan

Write-Host "Nhấn phím bất kỳ để thoát..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
