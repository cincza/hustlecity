$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = "C:\Users\Adam\Documents\New project"
$portraitDir = Join-Path $root "assets\portraits"
$gangDir = Join-Path $root "assets\gangs"

New-Item -ItemType Directory -Force -Path $portraitDir | Out-Null
New-Item -ItemType Directory -Force -Path $gangDir | Out-Null

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

function Draw-Background($graphics, $rect, $top, $bottom) {
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $top, $bottom, 90)
  $graphics.FillRectangle($brush, $rect)
  $brush.Dispose()
}

function Draw-NeonFrame($graphics, $rect, $color) {
  $glow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, $color), 10)
  $graphics.DrawRectangle($glow, $rect.X + 6, $rect.Y + 6, $rect.Width - 12, $rect.Height - 12)
  $glow.Dispose()
  $pen = New-Object System.Drawing.Pen($color, 3)
  $graphics.DrawRectangle($pen, $rect.X + 10, $rect.Y + 10, $rect.Width - 20, $rect.Height - 20)
  $pen.Dispose()
}

function Draw-EscortPortrait($path, $title, $code, $topColor, $bottomColor, $accentColor) {
  $canvas = New-Canvas 420 520
  $g = $canvas.Graphics
  $rect = New-Object System.Drawing.Rectangle(0, 0, 420, 520)
  Draw-Background $g $rect $topColor $bottomColor

  $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(48, $accentColor))
  $g.FillEllipse($accentBrush, 38, 62, 330, 330)
  $g.FillRectangle($accentBrush, 0, 392, 420, 128)
  $accentBrush.Dispose()

  $cityPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), 3)
  foreach ($x in 28, 78, 124, 180, 232, 290, 342) {
    $height = 90 + (($x % 5) * 18)
    $g.DrawRectangle($cityPen, $x, 350 - $height, 28, $height)
  }
  $cityPen.Dispose()

  $figureBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 15, 10, 14))
  $g.FillEllipse($figureBrush, 156, 108, 104, 104)
  $g.FillEllipse($figureBrush, 112, 192, 194, 170)
  $g.FillRectangle($figureBrush, 174, 312, 26, 122)
  $g.FillRectangle($figureBrush, 220, 312, 26, 122)
  $g.FillPie($figureBrush, 106, 90, 214, 180, 192, 156)
  $g.FillPolygon($figureBrush, @(
    (New-Object System.Drawing.Point 124, 246),
    (New-Object System.Drawing.Point 76, 366),
    (New-Object System.Drawing.Point 118, 378),
    (New-Object System.Drawing.Point 168, 272)
  ))
  $g.FillPolygon($figureBrush, @(
    (New-Object System.Drawing.Point 294, 246),
    (New-Object System.Drawing.Point 344, 366),
    (New-Object System.Drawing.Point 304, 378),
    (New-Object System.Drawing.Point 252, 272)
  ))
  $figureBrush.Dispose()

  $accentBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, $accentColor))
  $g.FillPolygon($accentBrush2, @(
    (New-Object System.Drawing.Point 170, 438),
    (New-Object System.Drawing.Point 208, 438),
    (New-Object System.Drawing.Point 194, 470)
  ))
  $g.FillPolygon($accentBrush2, @(
    (New-Object System.Drawing.Point 216, 438),
    (New-Object System.Drawing.Point 254, 438),
    (New-Object System.Drawing.Point 240, 470)
  ))
  $g.FillEllipse($accentBrush2, 130, 150, 18, 18)
  $accentBrush2.Dispose()

  Draw-NeonFrame $g $rect $accentColor

  $titleFont = New-Object System.Drawing.Font("Arial Black", 20, [System.Drawing.FontStyle]::Bold)
  $codeFont = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 245, 236))
  $subBrush = New-Object System.Drawing.SolidBrush($accentColor)
  $g.DrawString($title.ToUpper(), $titleFont, $textBrush, 26, 24)
  $g.DrawString($code, $codeFont, $subBrush, 28, 470)
  $g.DrawString("HUSTLE CITY", $codeFont, $subBrush, 250, 470)
  $titleFont.Dispose()
  $codeFont.Dispose()
  $textBrush.Dispose()
  $subBrush.Dispose()

  Save-AndClose $canvas $path
}

function Draw-GangEmblem($path, $title, $code, $topColor, $bottomColor, $accentColor, $shape) {
  $canvas = New-Canvas 420 420
  $g = $canvas.Graphics
  $rect = New-Object System.Drawing.Rectangle(0, 0, 420, 420)
  Draw-Background $g $rect $topColor $bottomColor

  $haloBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, $accentColor))
  $g.FillEllipse($haloBrush, 40, 48, 340, 220)
  $haloBrush.Dispose()

  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), 3)
  $g.DrawLine($linePen, 40, 320, 380, 320)
  $g.DrawLine($linePen, 70, 340, 350, 340)
  $linePen.Dispose()

  $mainBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 15, 10, 14))
  switch ($shape) {
    "saints" {
      $g.FillEllipse($mainBrush, 145, 80, 128, 128)
      $g.FillRectangle($mainBrush, 196, 164, 26, 120)
      $g.FillRectangle($mainBrush, 148, 204, 122, 24)
    }
    "cold" {
      $g.FillRectangle($mainBrush, 108, 176, 204, 42)
      $g.FillEllipse($mainBrush, 118, 212, 64, 64)
      $g.FillEllipse($mainBrush, 238, 212, 64, 64)
      $g.FillPolygon($mainBrush, @(
        (New-Object System.Drawing.Point 136, 176),
        (New-Object System.Drawing.Point 180, 128),
        (New-Object System.Drawing.Point 258, 128),
        (New-Object System.Drawing.Point 300, 176)
      ))
    }
    "vultures" {
      $g.FillPolygon($mainBrush, @(
        (New-Object System.Drawing.Point 210, 86),
        (New-Object System.Drawing.Point 118, 148),
        (New-Object System.Drawing.Point 170, 156),
        (New-Object System.Drawing.Point 86, 248),
        (New-Object System.Drawing.Point 190, 188),
        (New-Object System.Drawing.Point 210, 300),
        (New-Object System.Drawing.Point 230, 188),
        (New-Object System.Drawing.Point 334, 248),
        (New-Object System.Drawing.Point 250, 156),
        (New-Object System.Drawing.Point 302, 148)
      ))
    }
    "velvet" {
      $g.FillPolygon($mainBrush, @(
        (New-Object System.Drawing.Point 210, 76),
        (New-Object System.Drawing.Point 290, 154),
        (New-Object System.Drawing.Point 250, 272),
        (New-Object System.Drawing.Point 170, 272),
        (New-Object System.Drawing.Point 130, 154)
      ))
      $g.FillEllipse($mainBrush, 178, 118, 64, 64)
    }
    default {
      $g.FillEllipse($mainBrush, 136, 88, 148, 148)
      $g.FillRectangle($mainBrush, 132, 206, 156, 28)
    }
  }
  $mainBrush.Dispose()

  Draw-NeonFrame $g $rect $accentColor

  $titleFont = New-Object System.Drawing.Font("Arial Black", 18, [System.Drawing.FontStyle]::Bold)
  $smallFont = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 245, 236))
  $accentBrush = New-Object System.Drawing.SolidBrush($accentColor)
  $g.DrawString($title.ToUpper(), $titleFont, $textBrush, 26, 26)
  $g.DrawString($code, $smallFont, $accentBrush, 28, 374)
  $g.DrawString("HUSTLE CITY", $smallFont, $accentBrush, 214, 374)
  $titleFont.Dispose()
  $smallFont.Dispose()
  $textBrush.Dispose()
  $accentBrush.Dispose()

  Save-AndClose $canvas $path
}

Draw-EscortPortrait (Join-Path $portraitDir "escort-street.png") "Street Heat" "ULICA" ([System.Drawing.Color]::FromArgb(32, 16, 24)) ([System.Drawing.Color]::FromArgb(6, 6, 10)) ([System.Drawing.Color]::FromArgb(224, 90, 130))
Draw-EscortPortrait (Join-Path $portraitDir "escort-velvet.png") "Velvet Vice" "KLUB" ([System.Drawing.Color]::FromArgb(36, 14, 28)) ([System.Drawing.Color]::FromArgb(8, 7, 12)) ([System.Drawing.Color]::FromArgb(212, 126, 214))
Draw-EscortPortrait (Join-Path $portraitDir "escort-vip.png") "Diamond Muse" "VIP" ([System.Drawing.Color]::FromArgb(40, 22, 12)) ([System.Drawing.Color]::FromArgb(8, 6, 5)) ([System.Drawing.Color]::FromArgb(232, 184, 84))

Draw-GangEmblem (Join-Path $gangDir "gang-grey-saints.png") "Grey Saints" "SAINTS" ([System.Drawing.Color]::FromArgb(26, 26, 30)) ([System.Drawing.Color]::FromArgb(8, 8, 10)) ([System.Drawing.Color]::FromArgb(196, 196, 196)) "saints"
Draw-GangEmblem (Join-Path $gangDir "gang-cold-avenue.png") "Cold Avenue" "AVENUE" ([System.Drawing.Color]::FromArgb(18, 24, 34)) ([System.Drawing.Color]::FromArgb(6, 8, 12)) ([System.Drawing.Color]::FromArgb(122, 180, 236)) "cold"
Draw-GangEmblem (Join-Path $gangDir "gang-night-vultures.png") "Night Vultures" "VULTURE" ([System.Drawing.Color]::FromArgb(24, 18, 18)) ([System.Drawing.Color]::FromArgb(8, 6, 6)) ([System.Drawing.Color]::FromArgb(228, 110, 70)) "vultures"
Draw-GangEmblem (Join-Path $gangDir "gang-velvet-ash.png") "Velvet Ash" "VELVET" ([System.Drawing.Color]::FromArgb(30, 14, 26)) ([System.Drawing.Color]::FromArgb(8, 6, 10)) ([System.Drawing.Color]::FromArgb(210, 118, 190)) "velvet"
Draw-GangEmblem (Join-Path $gangDir "gang-hustle-default.png") "Hustle Crew" "HC" ([System.Drawing.Color]::FromArgb(30, 20, 14)) ([System.Drawing.Color]::FromArgb(8, 6, 6)) ([System.Drawing.Color]::FromArgb(230, 172, 84)) "default"
