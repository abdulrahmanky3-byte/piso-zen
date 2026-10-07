param(
    [string]$VideoPath     = "public/videos/hero.mp4",
    [string]$OutputDir     = "public/frames",
    [string]$MobileOut     = "public/videos/hero-mobile.mp4",
    [string]$PosterPath    = "public/images/poster.webp",
    [int]$TargetWidth      = 1280,
    [int]$FrameCountTarget = 150,
    [int]$WebpQuality      = 80,
    [double]$FpsRate       = 10
)

$ErrorActionPreference = "Stop"
$base         = $PSScriptRoot | Split-Path -Parent
$videoFull    = Join-Path $base $VideoPath
$outFull      = Join-Path $base $OutputDir
$mobileFull   = Join-Path $base $MobileOut
$posterFull   = Join-Path $base $PosterPath

# Locate ffmpeg / ffprobe
$ffPaths = @(
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe"
)
$FFMPEG  = ($ffPaths | Where-Object { Test-Path $_ })[0]
$FFPROBE = $FFMPEG.Replace('ffmpeg.exe', 'ffprobe.exe')
if (-not $FFMPEG -or -not (Test-Path $FFMPEG)) { throw "ffmpeg not found" }

Write-Host "[1] Probe hero.mp4"
$probeJson  = & "$FFPROBE" -v error `
    -show_entries format=duration,bit_rate,size `
    -show_entries stream=width,height,r_frame_rate,nb_frames `
    -of json $videoFull 2>$null
$probe      = $probeJson | ConvertFrom-Json
$duration       = [double]$probe.format.duration
$fpsParts       = $probe.streams[0].r_frame_rate.Split('/')
$fpsOriginal    = [int]([int]$fpsParts[0] / [int]$fpsParts[1])
$width          = [int]$probe.streams[0].width
$height         = [int]$probe.streams[0].height
$totalFrames    = [int]$probe.streams[0].nb_frames
$szBytes        = [long]$probe.format.size
Write-Host "     $width x $height  $fpsOriginal fps  $duration s  $totalFrames frames  $([math]::Round($szBytes/1MB,1)) MB"

Write-Host "[2] Extract PNG frames (fps=$FpsRate)"
if (-not (Test-Path $outFull)) { New-Item -ItemType Directory -Path $outFull -Force | Out-Null }

$maxFrames = [math]::Ceiling($duration * $FpsRate)
$limit     = [math]::Min($maxFrames, $FrameCountTarget * 2)

# Build filter string carefully for PowerShell
$filter1 = "fps=$FpsRate"
$filter2 = "scale=$TargetWidth`:-1:flags=lanczos"
$vfFull  = "$filter1,$filter2"

& $FFMPEG -v error -i $videoFull -vf $vfFull -frames:v $limit `
    (Join-Path $outFull "f_%04d.png") -y 2>&1 | Out-Null

$pngFiles = Get-ChildItem $outFull -Filter "f_*.png" | Sort-Object Name
$actualFrames = $pngFiles.Count
Write-Host "     extracted $actualFrames PNG frames"

if ($actualFrames -gt 0) {
    Write-Host "[3] Convert PNG to WebP (quality=$WebpQuality)"
    $jsScript = Join-Path $PSScriptRoot "convert-webp.js"
    $convOut  = & node $jsScript $outFull $WebpQuality 2>&1
    
    if ($convOut -match '^CONVERTED:(\d+):(\d+)$') {
        Write-Host "     converted $($Matches[1]) WebP frames"
    } elseif ($convOut -match '^ERROR:') {
        Write-Host "     Conversion failed: $convOut"
    } else {
        Write-Host "     (conversion output: $convOut)"
    }

    $webpFiles = Get-ChildItem $outFull -Filter "f_*.webp"
    $totalFrameSize = ($webpFiles | Measure-Object -Property Length -Sum).Sum
    Write-Host "     total WebP size: $([math]::Round($totalFrameSize/1MB,2)) MB"
} else {
    Write-Host "[3] No PNG frames to convert (skipping)"
    $totalFrameSize = 0
}

Write-Host "[4] Create mobile hero video (720p, no audio, crf 28)"
$vfMobile = "scale=-2:720:flags=lanczos"
& $FFMPEG -v error -i $videoFull -c:v libx264 -preset fast -crf 28 -vf $vfMobile `
    -pix_fmt yuv420p -movflags +faststart -an -y $mobileFull 2>&1 | Out-Null
$mobsz = (Get-Item $mobileFull).Length
Write-Host "     created hero-mobile.mp4  $([math]::Round($mobsz/1MB,1)) MB"

Write-Host "[5] Create poster from first frame"
$vfPoster = "scale=$TargetWidth`:-1"
& $FFMPEG -v error -ss 0 -i $videoFull -frames:v 1 -vf $vfPoster `
    -q:v $WebpQuality -y $posterFull 2>&1 | Out-Null
Write-Host "     created poster.webp"

Write-Host ""
Write-Host "=== DONE ==="
Write-Host "FRAME_COUNT = $actualFrames"
Write-Host "TOTAL_MB    = $([math]::Round(($totalFrameSize + $mobsz) / 1MB, 2))"
