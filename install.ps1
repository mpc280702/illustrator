# Tự động yêu cầu quyền Administrator nếu chưa có
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[*] Đang yêu cầu quyền Administrator để cài đặt vào thư mục Adobe Illustrator..." -ForegroundColor Cyan
    try {
        Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs
        exit
    } catch {
        Write-Host "[!] Cần cấp quyền Administrator để cài đặt vào Program Files!" -ForegroundColor Red
        Pause
        exit
    }
}

$sourceFile = Join-Path $PSScriptRoot "VectorTracerPro.jsx"

if (-not (Test-Path $sourceFile)) {
    Write-Host "[!] Không tìm thấy file VectorTracerPro.jsx trong thư mục này!" -ForegroundColor Red
    Pause
    exit
}

$adobePaths = @(
    "C:\Program Files\Adobe",
    "C:\Program Files (x86)\Adobe"
)

$installedCount = 0

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
                            Copy-Item -Path $sourceFile -Destination $destPath -Force -ErrorAction Stop
                            Write-Host "[+] Cài đặt thành công vào: $destPath" -ForegroundColor Green
                            $installedCount++
                        } catch {
                            Write-Host "[!] Lỗi khi sao chép vào $destPath: $_" -ForegroundColor Red
                        }
                    }
                }
            }
        }
    }
}

if ($installedCount -gt 0) {
    Write-Host "`n>>> Hoàn tất! Khởi động lại Adobe Illustrator." -ForegroundColor Cyan
    Write-Host ">>> Bạn sẽ thấy script tại menu: File > Scripts > VectorTracerPro" -ForegroundColor Green
} else {
    Write-Host "`n[!] Không tìm thấy thư mục Presets\Scripts của Adobe Illustrator." -ForegroundColor Yellow
    Write-Host "Mẹo: Bạn có thể nhấn Ctrl + F12 trong Illustrator và chọn trực tiếp file VectorTracerPro.jsx để dùng ngay." -ForegroundColor Gray
}

Write-Host "`nNhấn phím bất kỳ để đóng..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
