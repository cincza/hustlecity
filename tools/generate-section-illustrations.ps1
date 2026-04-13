$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = "C:\Users\Adam\Documents\New project"
$outDir = Join-Path $root "assets\generated"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Canvas($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-AndClose($canvas, $path) {
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

function New-Brush($color) {
  return New-Object System.Drawing.SolidBrush($color)
}

function New-Point($x, $y) {
  return New-Object System.Drawing.Point -ArgumentList ([int]$x), ([int]$y)
}

function Draw-Gradient($graphics, $rect, $topColor, $bottomColor, $angle = 90) {
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $topColor, $bottomColor, $angle)
  $graphics.FillRectangle($brush, $rect)
  $brush.Dispose()
}

function Draw-Cityline($graphics, $baseline, $accentColor) {
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 2)
  $brush = New-Brush([System.Drawing.Color]::FromArgb(120, 10, 10, 14))
  $windowBrush = New-Brush([System.Drawing.Color]::FromArgb(110, $accentColor))

  $seed = @(80, 128, 184, 242, 298, 360, 432, 500, 576, 650, 728, 806, 900, 980, 1060, 1144, 1230, 1318, 1406)
  foreach ($x in $seed) {
    $height = 120 + (($x % 7) * 22)
    $width = 44 + (($x % 3) * 12)
    $graphics.FillRectangle($brush, $x, $baseline - $height, $width, $height)
    for ($y = $baseline - $height + 16; $y -lt ($baseline - 14); $y += 24) {
      for ($wx = $x + 8; $wx -lt ($x + $width - 8); $wx += 14) {
        $graphics.FillRectangle($windowBrush, $wx, $y, 6, 10)
      }
    }
    $graphics.DrawRectangle($pen, $x, $baseline - $height, $width, $height)
  }

  $brush.Dispose()
  $windowBrush.Dispose()
  $pen.Dispose()
}

function Draw-Road($graphics, $width, $height, $accentColor) {
  $roadBrush = New-Brush([System.Drawing.Color]::FromArgb(170, 8, 8, 10))
  $graphics.FillPie($roadBrush, -220, $height - 220, $width + 440, 360, 184, 172)
  $roadBrush.Dispose()

  $dashPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(170, $accentColor), 5)
  $dashPen.DashPattern = @(14, 10)
  $graphics.DrawArc($dashPen, 140, $height - 108, $width - 280, 110, 196, 148)
  $dashPen.Dispose()
}

function Draw-MuscleCar($graphics, $x, $y, $scale, $bodyColor, $neonColor) {
  $bodyBrush = New-Brush($bodyColor)
  $shadowBrush = New-Brush([System.Drawing.Color]::FromArgb(150, 6, 6, 8))
  $windowBrush = New-Brush([System.Drawing.Color]::FromArgb(170, 18, 22, 28))
  $lightBrush = New-Brush([System.Drawing.Color]::FromArgb(210, $neonColor))
  $wheelBrush = New-Brush([System.Drawing.Color]::FromArgb(245, 14, 14, 18))
  $rimBrush = New-Brush([System.Drawing.Color]::FromArgb(220, 176, 176, 182))

  $graphics.FillEllipse($shadowBrush, $x - 10 * $scale, $y + 72 * $scale, 280 * $scale, 38 * $scale)
  $graphics.FillPolygon($bodyBrush, @(
    (New-Point ($x + 10 * $scale) ($y + 62 * $scale)),
    (New-Point ($x + 40 * $scale) ($y + 22 * $scale)),
    (New-Point ($x + 126 * $scale) ($y + 18 * $scale)),
    (New-Point ($x + 170 * $scale) ($y + 40 * $scale)),
    (New-Point ($x + 236 * $scale) ($y + 42 * $scale)),
    (New-Point ($x + 262 * $scale) ($y + 66 * $scale)),
    (New-Point ($x + 240 * $scale) ($y + 84 * $scale)),
    (New-Point ($x + 26 * $scale) ($y + 84 * $scale))
  ))
  $graphics.FillRectangle($windowBrush, [int]($x + 62 * $scale), [int]($y + 30 * $scale), [int]($80 * $scale), [int]($28 * $scale))
  $graphics.FillRectangle($windowBrush, [int]($x + 146 * $scale), [int]($y + 40 * $scale), [int]($42 * $scale), [int]($22 * $scale))
  $graphics.FillRectangle($lightBrush, [int]($x + 236 * $scale), [int]($y + 52 * $scale), [int]($18 * $scale), [int]($8 * $scale))
  $graphics.FillRectangle($lightBrush, [int]($x + 20 * $scale), [int]($y + 64 * $scale), [int]($14 * $scale), [int]($6 * $scale))
  foreach ($offset in @(52, 188)) {
    $graphics.FillEllipse($wheelBrush, [int]($x + $offset * $scale), [int]($y + 60 * $scale), [int]($44 * $scale), [int]($44 * $scale))
    $graphics.FillEllipse($rimBrush, [int]($x + ($offset + 10) * $scale), [int]($y + 70 * $scale), [int]($24 * $scale), [int]($24 * $scale))
  }

  $bodyBrush.Dispose()
  $shadowBrush.Dispose()
  $windowBrush.Dispose()
  $lightBrush.Dispose()
  $wheelBrush.Dispose()
  $rimBrush.Dispose()
}

function Draw-Gangster($graphics, $x, $y, $scale, $accentColor, $withWeapon = $true, $female = $false) {
  $bodyBrush = New-Brush([System.Drawing.Color]::FromArgb(228, 10, 10, 12))
  $accentBrush = New-Brush($accentColor)
  $graphics.FillEllipse($bodyBrush, [int]($x + 26 * $scale), [int]($y), [int]($34 * $scale), [int]($34 * $scale))
  if ($female) {
    $graphics.FillEllipse($accentBrush, [int]($x + 14 * $scale), [int]($y - 2 * $scale), [int]($58 * $scale), [int]($28 * $scale))
  }
  $graphics.FillRectangle($bodyBrush, [int]($x + 28 * $scale), [int]($y + 30 * $scale), [int]($30 * $scale), [int]($76 * $scale))
  $graphics.FillRectangle($bodyBrush, [int]($x + 6 * $scale), [int]($y + 42 * $scale), [int]($24 * $scale), [int]($16 * $scale))
  $graphics.FillRectangle($bodyBrush, [int]($x + 58 * $scale), [int]($y + 42 * $scale), [int]($24 * $scale), [int]($16 * $scale))
  $graphics.FillRectangle($bodyBrush, [int]($x + 28 * $scale), [int]($y + 104 * $scale), [int]($12 * $scale), [int]($54 * $scale))
  $graphics.FillRectangle($bodyBrush, [int]($x + 46 * $scale), [int]($y + 104 * $scale), [int]($12 * $scale), [int]($54 * $scale))
  if ($withWeapon) {
    $graphics.FillRectangle($accentBrush, [int]($x + 74 * $scale), [int]($y + 46 * $scale), [int]($38 * $scale), [int]($8 * $scale))
    $graphics.FillRectangle($accentBrush, [int]($x + 86 * $scale), [int]($y + 54 * $scale), [int]($8 * $scale), [int]($12 * $scale))
  }
  $bodyBrush.Dispose()
  $accentBrush.Dispose()
}

function Draw-NeonText($graphics, $title, $subtitle, $accentColor) {
  $titleFont = New-Object System.Drawing.Font("Arial Black", 30, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
  $titleBrush = New-Brush([System.Drawing.Color]::FromArgb(245, 245, 238))
  $subtitleBrush = New-Brush($accentColor)
  $glowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, $accentColor), 6)
  $graphics.DrawLine($glowPen, 36, 74, 280, 74)
  $graphics.DrawString($title.ToUpper(), $titleFont, $titleBrush, 36, 28)
  $graphics.DrawString($subtitle, $subtitleFont, $subtitleBrush, 38, 84)
  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $titleBrush.Dispose()
  $subtitleBrush.Dispose()
  $glowPen.Dispose()
}

function Draw-Frame($graphics, $width, $height, $accentColor) {
  $outerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(72, $accentColor), 12)
  $innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(190, $accentColor), 2.5)
  $graphics.DrawRectangle($outerPen, 10, 10, $width - 20, $height - 20)
  $graphics.DrawRectangle($innerPen, 22, 22, $width - 44, $height - 44)
  $outerPen.Dispose()
  $innerPen.Dispose()
}

function New-Scene($fileName, $title, $subtitle, $topColor, $bottomColor, $accentColor, $drawBlock) {
  $width = 1536
  $height = 768
  $canvas = New-Canvas $width $height
  $g = $canvas.Graphics
  $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)

  Draw-Gradient $g $rect $topColor $bottomColor
  Draw-Cityline $g 520 $accentColor
  Draw-Road $g $width $height $accentColor
  & $drawBlock $g
  Draw-NeonText $g $title $subtitle $accentColor
  Draw-Frame $g $width $height $accentColor

  Save-AndClose $canvas (Join-Path $outDir $fileName)
}

New-Scene "escort-scene.png" "Street Queens" "Klub, szybka fura i uliczny zarobek" ([System.Drawing.Color]::FromArgb(36, 10, 22)) ([System.Drawing.Color]::FromArgb(6, 5, 8)) ([System.Drawing.Color]::FromArgb(232, 108, 160)) {
  param($graphics)
  $pinkBrush = New-Brush([System.Drawing.Color]::FromArgb(55, 232, 108, 160))
  $graphics.FillEllipse($pinkBrush, 760, 120, 500, 300)
  $pinkBrush.Dispose()
  Draw-MuscleCar $graphics 860 474 1.3 ([System.Drawing.Color]::FromArgb(208, 38, 18, 28)) ([System.Drawing.Color]::FromArgb(232, 128, 180))
  Draw-Gangster $graphics 640 300 1.5 ([System.Drawing.Color]::FromArgb(232, 128, 180)) $true $true
  Draw-Gangster $graphics 510 330 1.15 ([System.Drawing.Color]::FromArgb(188, 82, 140)) $false $true
  Draw-Gangster $graphics 1120 318 1.18 ([System.Drawing.Color]::FromArgb(220, 176, 92)) $true $false
}

New-Scene "gang-scene-large.png" "Family Pressure" "Bossowie, viceboss i robota dla zaufanych" ([System.Drawing.Color]::FromArgb(30, 18, 18)) ([System.Drawing.Color]::FromArgb(5, 5, 6)) ([System.Drawing.Color]::FromArgb(228, 124, 74)) {
  param($graphics)
  $smokeBrush = New-Brush([System.Drawing.Color]::FromArgb(48, 228, 124, 74))
  $graphics.FillEllipse($smokeBrush, 220, 150, 540, 280)
  $graphics.FillEllipse($smokeBrush, 860, 130, 420, 260)
  $smokeBrush.Dispose()
  Draw-Gangster $graphics 350 272 1.8 ([System.Drawing.Color]::FromArgb(228, 124, 74)) $true $false
  Draw-Gangster $graphics 560 316 1.35 ([System.Drawing.Color]::FromArgb(208, 90, 60)) $true $false
  Draw-Gangster $graphics 870 290 1.55 ([System.Drawing.Color]::FromArgb(190, 190, 190)) $true $false
  Draw-Gangster $graphics 1120 332 1.18 ([System.Drawing.Color]::FromArgb(220, 166, 84)) $false $false
  Draw-MuscleCar $graphics 120 486 1.22 ([System.Drawing.Color]::FromArgb(204, 26, 26, 30)) ([System.Drawing.Color]::FromArgb(228, 124, 74))
}

New-Scene "club-scene.png" "Velvet Empire" "VIP wejscie, tancerki i stoliki z towarem" ([System.Drawing.Color]::FromArgb(28, 12, 28)) ([System.Drawing.Color]::FromArgb(5, 4, 8)) ([System.Drawing.Color]::FromArgb(180, 98, 230)) {
  param($graphics)
  $lightBrush = New-Brush([System.Drawing.Color]::FromArgb(52, 180, 98, 230))
  $graphics.FillPie($lightBrush, 860, 100, 420, 380, 220, 100)
  $graphics.FillPie($lightBrush, 240, 100, 300, 280, 240, 84)
  $lightBrush.Dispose()
  Draw-Gangster $graphics 930 296 1.48 ([System.Drawing.Color]::FromArgb(210, 120, 240)) $true $true
  Draw-Gangster $graphics 760 322 1.18 ([System.Drawing.Color]::FromArgb(172, 102, 216)) $false $true
  Draw-Gangster $graphics 1134 340 1.12 ([System.Drawing.Color]::FromArgb(232, 176, 102)) $true $false
  Draw-MuscleCar $graphics 120 486 1.18 ([System.Drawing.Color]::FromArgb(214, 34, 22, 36)) ([System.Drawing.Color]::FromArgb(180, 98, 230))
}

New-Scene "casino-scene-large.png" "High Rollers" "Ruletka, blackjack i goracy stol" ([System.Drawing.Color]::FromArgb(18, 34, 22)) ([System.Drawing.Color]::FromArgb(4, 8, 5)) ([System.Drawing.Color]::FromArgb(86, 198, 120)) {
  param($graphics)
  $tableBrush = New-Brush([System.Drawing.Color]::FromArgb(205, 12, 52, 26))
  $graphics.FillEllipse($tableBrush, 360, 300, 820, 320)
  $tableBrush.Dispose()
  $roulettePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 220, 186, 96), 16)
  $graphics.DrawEllipse($roulettePen, 540, 208, 220, 220)
  $roulettePen.Dispose()
  $innerBrush = New-Brush([System.Drawing.Color]::FromArgb(170, 26, 26, 28))
  $graphics.FillEllipse($innerBrush, 584, 252, 132, 132)
  $innerBrush.Dispose()
  Draw-Gangster $graphics 962 250 1.42 ([System.Drawing.Color]::FromArgb(86, 198, 120)) $true $true
  Draw-Gangster $graphics 1130 304 1.12 ([System.Drawing.Color]::FromArgb(220, 182, 90)) $false $false
  Draw-MuscleCar $graphics 118 492 1.08 ([System.Drawing.Color]::FromArgb(204, 18, 22, 18)) ([System.Drawing.Color]::FromArgb(86, 198, 120))
}
