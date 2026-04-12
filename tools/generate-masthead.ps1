$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$outputPath = "C:\Users\Adam\Documents\New project\assets\branding\hustle-city-masthead.png"
$width = 1600
$height = 420

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function New-Color([int]$a, [int]$r, [int]$g, [int]$b) {
  return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function New-Point([int]$x, [int]$y) {
  return [System.Drawing.Point]::new($x, $y)
}

function Add-Silhouette {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$X,
    [int]$Y,
    [double]$Scale,
    [bool]$Female = $false,
    [bool]$Gun = $false
  )

  $brush = [System.Drawing.SolidBrush]::new((New-Color 245 8 8 10))

  $Graphics.FillEllipse($brush, $X, $Y, [int](36 * $Scale), [int](40 * $Scale))
  $Graphics.FillRectangle($brush, $X + [int](10 * $Scale), $Y + [int](36 * $Scale), [int](18 * $Scale), [int](78 * $Scale))

  if ($Female) {
    $dress = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $dress.AddPolygon(@(
        (New-Point ([int]($X + 5 * $Scale)) ([int]($Y + 108 * $Scale))),
        (New-Point ([int]($X + 19 * $Scale)) ([int]($Y + 72 * $Scale))),
        (New-Point ([int]($X + 41 * $Scale)) ([int]($Y + 108 * $Scale)))
      ))
    $Graphics.FillPath($brush, $dress)
    $Graphics.FillEllipse($brush, $X - [int](2 * $Scale), $Y + [int](8 * $Scale), [int](12 * $Scale), [int](30 * $Scale))
    $dress.Dispose()
  } else {
    $Graphics.FillRectangle($brush, $X + [int](2 * $Scale), $Y + [int](66 * $Scale), [int](34 * $Scale), [int](44 * $Scale))
  }

  $Graphics.FillRectangle($brush, $X + [int](2 * $Scale), $Y + [int](110 * $Scale), [int](10 * $Scale), [int](54 * $Scale))
  $Graphics.FillRectangle($brush, $X + [int](26 * $Scale), $Y + [int](110 * $Scale), [int](10 * $Scale), [int](54 * $Scale))
  $Graphics.FillRectangle($brush, $X - [int](12 * $Scale), $Y + [int](52 * $Scale), [int](16 * $Scale), [int](54 * $Scale))
  $Graphics.FillRectangle($brush, $X + [int](34 * $Scale), $Y + [int](52 * $Scale), [int](16 * $Scale), [int](54 * $Scale))

  if ($Gun) {
    $Graphics.FillRectangle($brush, $X + [int](46 * $Scale), $Y + [int](58 * $Scale), [int](38 * $Scale), [int](8 * $Scale))
    $Graphics.FillRectangle($brush, $X + [int](68 * $Scale), $Y + [int](48 * $Scale), [int](8 * $Scale), [int](20 * $Scale))
  }

  $brush.Dispose()
}

$rect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
$bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  $rect,
  (New-Color 255 7 6 8),
  (New-Color 255 47 17 12),
  18
)
$blend = [System.Drawing.Drawing2D.ColorBlend]::new()
$blend.Colors = @(
  (New-Color 255 7 6 8),
  (New-Color 255 22 9 18),
  (New-Color 255 74 28 11),
  (New-Color 255 6 5 6)
)
$blend.Positions = @(0.0, 0.28, 0.76, 1.0)
$bgBrush.InterpolationColors = $blend
$graphics.FillRectangle($bgBrush, $rect)

$graphics.FillEllipse([System.Drawing.SolidBrush]::new((New-Color 90 255 120 40)), 1120, 18, 310, 220)
$graphics.FillEllipse([System.Drawing.SolidBrush]::new((New-Color 65 112 55 190)), 84, 48, 360, 200)

for ($i = 0; $i -lt 90; $i++) {
  $x = Get-Random -Minimum 0 -Maximum $width
  $y = Get-Random -Minimum 0 -Maximum 260
  $len = Get-Random -Minimum 12 -Maximum 28
  $rainPen = [System.Drawing.Pen]::new((New-Color (Get-Random -Minimum 18 -Maximum 46) 240 240 240), 2)
  $graphics.DrawLine($rainPen, $x, $y, [int]($x - $len / 3), $y + $len)
  $rainPen.Dispose()
}

$skylineBrush = [System.Drawing.SolidBrush]::new((New-Color 255 11 11 14))
$windowWarm = [System.Drawing.SolidBrush]::new((New-Color 255 241 187 84))
$windowHot = [System.Drawing.SolidBrush]::new((New-Color 255 255 116 70))
$baseY = 245

for ($i = 0; $i -lt 16; $i++) {
  $buildingWidth = Get-Random -Minimum 42 -Maximum 96
  $buildingHeight = Get-Random -Minimum 70 -Maximum 190
  $buildingX = ($i * 105) + (Get-Random -Minimum -18 -Maximum 18)
  $buildingY = $baseY - $buildingHeight
  $graphics.FillRectangle($skylineBrush, $buildingX, $buildingY, $buildingWidth, $buildingHeight)

  for ($wx = $buildingX + 8; $wx -lt ($buildingX + $buildingWidth - 8); $wx += (Get-Random -Minimum 12 -Maximum 18)) {
    for ($wy = $buildingY + 10; $wy -lt ($baseY - 12); $wy += (Get-Random -Minimum 12 -Maximum 18)) {
      if ((Get-Random -Minimum 0 -Maximum 100) -lt 38) {
        $windowBrush = if ((Get-Random -Minimum 0 -Maximum 2) -eq 0) { $windowHot } else { $windowWarm }
        $graphics.FillRectangle($windowBrush, $wx, $wy, 6, 8)
      }
    }
  }
}

$roadBrush = [System.Drawing.SolidBrush]::new((New-Color 255 8 8 10))
$graphics.FillRectangle($roadBrush, 0, 260, $width, 160)

$reflectBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(0, 250, $width, 80),
  (New-Color 80 255 180 80),
  (New-Color 0 0 0 0),
  90
)
$graphics.FillRectangle($reflectBrush, 0, 250, $width, 60)

$dashPen = [System.Drawing.Pen]::new((New-Color 110 220 220 220), 5)
$dashPen.DashPattern = @(18, 16)
$graphics.DrawLine($dashPen, 560, 350, 1220, 350)

$carBody = [System.Drawing.Drawing2D.GraphicsPath]::new()
$carBody.AddPolygon(@(
    (New-Point 880 282),
    (New-Point 940 242),
    (New-Point 1110 238),
    (New-Point 1180 280),
    (New-Point 1275 288),
    (New-Point 1265 330),
    (New-Point 850 330),
    (New-Point 858 296)
  ))
$graphics.FillPath([System.Drawing.SolidBrush]::new((New-Color 255 18 18 22)), $carBody)
$graphics.FillEllipse([System.Drawing.SolidBrush]::new((New-Color 90 0 0 0)), 920, 308, 98, 98)
$graphics.FillEllipse([System.Drawing.SolidBrush]::new((New-Color 90 0 0 0)), 1130, 308, 98, 98)
$graphics.FillEllipse([System.Drawing.SolidBrush]::new((New-Color 255 6 6 8)), 932, 320, 72, 72)
$graphics.FillEllipse([System.Drawing.SolidBrush]::new((New-Color 255 6 6 8)), 1142, 320, 72, 72)
$graphics.FillRectangle([System.Drawing.SolidBrush]::new((New-Color 255 178 40 30)), 854, 296, 18, 10)
$graphics.FillRectangle([System.Drawing.SolidBrush]::new((New-Color 255 255 224 145)), 1245, 292, 22, 12)

$beam = [System.Drawing.Drawing2D.GraphicsPath]::new()
$beam.AddPolygon(@(
    (New-Point 1260 292),
    (New-Point 1590 246),
    (New-Point 1590 354),
    (New-Point 1260 304)
  ))
$graphics.FillPath([System.Drawing.SolidBrush]::new((New-Color 40 255 214 120)), $beam)

Add-Silhouette -Graphics $graphics -X 210 -Y 170 -Scale 1.45 -Female:$false -Gun:$true
Add-Silhouette -Graphics $graphics -X 360 -Y 168 -Scale 1.55 -Female:$true -Gun:$true
Add-Silhouette -Graphics $graphics -X 520 -Y 182 -Scale 1.25 -Female:$false -Gun:$false

$fogBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(0, 210, $width, 170),
  (New-Color 0 0 0 0),
  (New-Color 90 0 0 0),
  90
)
$graphics.FillRectangle($fogBrush, 0, 210, $width, 170)

$titlePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$titlePath.AddString("HUSTLE CITY", [System.Drawing.FontFamily]::new("Arial"), [System.Drawing.FontStyle]::Bold, 124, (New-Point 640 32), [System.Drawing.StringFormat]::GenericDefault)
$strokePen = [System.Drawing.Pen]::new((New-Color 220 8 8 10), 8)
$graphics.DrawPath($strokePen, $titlePath)
$titleBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(620, 20, 760, 120),
  (New-Color 255 255 239 222),
  (New-Color 255 241 180 70),
  0
)
$graphics.FillPath($titleBrush, $titlePath)

$subFont = [System.Drawing.Font]::new("Segoe UI Semibold", 24, [System.Drawing.FontStyle]::Bold)
$smallFont = [System.Drawing.Font]::new("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
$tagFont = [System.Drawing.Font]::new("Segoe UI Semibold", 14, [System.Drawing.FontStyle]::Bold)
$graphics.DrawString("NEONY. FURY. GANGI. BRUDNY HAJS.", $subFont, [System.Drawing.SolidBrush]::new((New-Color 255 226 211 189)), 648, 156)
$graphics.DrawString("Wejdz do miasta, zbuduj ekipe i przejmij nocne imperium.", $smallFont, [System.Drawing.SolidBrush]::new((New-Color 255 196 168 128)), 650, 196)
$tagPen = [System.Drawing.Pen]::new((New-Color 120 255 191 88), 2)
$graphics.DrawRectangle($tagPen, 650, 240, 250, 34)
$graphics.DrawString("NOWA GENERACJA BROWSEROWEJ GANGSTERKI", $tagFont, [System.Drawing.SolidBrush]::new((New-Color 255 247 205 126)), 662, 247)

$outerPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$outerPath.AddRectangle([System.Drawing.Rectangle]::new(0, 0, $width, $height))
$innerPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$innerPath.AddRectangle([System.Drawing.Rectangle]::new(36, 24, $width - 72, $height - 48))
$region = [System.Drawing.Region]::new($outerPath)
$region.Exclude($innerPath)
$graphics.FillRegion([System.Drawing.SolidBrush]::new((New-Color 110 0 0 0)), $region)
$framePen = [System.Drawing.Pen]::new((New-Color 130 255 191 88), 2)
$graphics.DrawRectangle($framePen, 10, 10, $width - 20, $height - 20)

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $outputPath
