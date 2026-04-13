Add-Type -AssemblyName System.Drawing

$outputDir = "C:\Users\Adam\Documents\New project\assets\icons"
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

function New-Color($hex) {
  $clean = $hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    255,
    [Convert]::ToInt32($clean.Substring(0, 2), 16),
    [Convert]::ToInt32($clean.Substring(2, 2), 16),
    [Convert]::ToInt32($clean.Substring(4, 2), 16)
  )
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-PointArray([object[]]$values) {
  $points = New-Object "System.Drawing.Point[]" $values.Count
  for ($i = 0; $i -lt $values.Count; $i++) {
    $pair = $values[$i]
    $points[$i] = New-Object System.Drawing.Point($pair[0], $pair[1])
  }
  return $points
}

function Draw-IconShape($graphics, $iconId, $accentColor) {
  $pen = New-Object System.Drawing.Pen($accentColor, 5)
  $pen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Center
  $brush = New-Object System.Drawing.SolidBrush($accentColor)
  $glassBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, $accentColor))
  $darkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 4, 6, 10), 3)

  switch ($iconId) {
    "bank" {
      $graphics.FillEllipse($glassBrush, 24, 18, 48, 48)
      $graphics.DrawEllipse($pen, 24, 18, 48, 48)
      $graphics.DrawLine($pen, 48, 26, 48, 58)
      $graphics.DrawLine($pen, 32, 42, 64, 42)
      $graphics.DrawLine($pen, 36, 30, 60, 54)
      $graphics.DrawLine($pen, 60, 30, 36, 54)
    }
    "casino" {
      $graphics.FillEllipse($glassBrush, 18, 18, 28, 28)
      $graphics.DrawEllipse($pen, 18, 18, 28, 28)
      $graphics.DrawEllipse($pen, 50, 28, 20, 20)
      $graphics.DrawRectangle($pen, 30, 40, 28, 18)
      $graphics.DrawLine($darkPen, 36, 48, 52, 48)
    }
    "market" {
      $graphics.DrawRectangle($pen, 20, 28, 56, 28)
      $graphics.DrawLine($pen, 20, 38, 76, 38)
      $graphics.DrawLine($pen, 34, 28, 34, 56)
      $graphics.DrawLine($pen, 48, 28, 48, 56)
      $graphics.DrawLine($pen, 62, 28, 62, 56)
      $graphics.DrawLine($pen, 28, 64, 68, 64)
      $graphics.DrawLine($pen, 60, 58, 68, 64)
      $graphics.DrawLine($pen, 60, 70, 68, 64)
    }
    "dealer" {
      $graphics.DrawRectangle($pen, 34, 22, 28, 38)
      $graphics.FillRectangle($glassBrush, 34, 34, 28, 26)
      $graphics.DrawRectangle($pen, 41, 16, 14, 8)
      $graphics.DrawLine($pen, 34, 34, 62, 34)
    }
    "club" {
      $graphics.DrawArc($pen, 22, 24, 52, 28, 180, 180)
      $graphics.DrawLine($pen, 22, 38, 22, 64)
      $graphics.DrawLine($pen, 74, 38, 74, 64)
      $graphics.DrawLine($pen, 22, 64, 74, 64)
      $graphics.FillRectangle($brush, 32, 36, 6, 18)
      $graphics.FillRectangle($brush, 45, 30, 6, 24)
      $graphics.FillRectangle($brush, 58, 40, 6, 14)
    }
    "factory" {
      $graphics.DrawRectangle($pen, 18, 34, 58, 28)
      $graphics.DrawRectangle($pen, 56, 20, 10, 14)
      $graphics.FillRectangle($glassBrush, 18, 34, 58, 28)
      $graphics.DrawLine($darkPen, 28, 50, 28, 62)
      $graphics.DrawLine($darkPen, 42, 46, 42, 62)
      $graphics.DrawLine($darkPen, 56, 42, 56, 62)
    }
    "supplier" {
      $graphics.DrawRectangle($pen, 18, 38, 24, 20)
      $graphics.DrawRectangle($pen, 38, 26, 24, 22)
      $graphics.DrawRectangle($pen, 54, 42, 20, 16)
      $graphics.FillRectangle($glassBrush, 18, 38, 24, 20)
      $graphics.FillRectangle($glassBrush, 38, 26, 24, 22)
    }
    "pvp" {
      $graphics.DrawEllipse($pen, 24, 20, 48, 48)
      $graphics.DrawLine($pen, 48, 14, 48, 30)
      $graphics.DrawLine($pen, 48, 66, 48, 82)
      $graphics.DrawLine($pen, 18, 44, 34, 44)
      $graphics.DrawLine($pen, 62, 44, 78, 44)
      $graphics.FillEllipse($brush, 43, 39, 10, 10)
    }
    "energy" {
      $graphics.FillPolygon(
        $brush,
        (New-PointArray @(
          @(52, 16), @(34, 48), @(47, 48), @(38, 80), @(62, 44), @(48, 44)
        ))
      )
    }
    "heat" {
      $graphics.FillPolygon(
        $brush,
        (New-PointArray @(
          @(48, 18), @(30, 44), @(36, 72), @(48, 82), @(62, 72), @(68, 48)
        ))
      )
      $graphics.FillPolygon(
        (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 255, 211, 122))),
        (New-PointArray @(
          @(48, 34), @(40, 48), @(44, 66), @(48, 72), @(56, 60), @(54, 46)
        ))
      )
    }
    "cash" {
      $graphics.DrawRectangle($pen, 20, 28, 46, 28)
      $graphics.DrawRectangle($pen, 30, 22, 46, 28)
      $graphics.FillRectangle($glassBrush, 30, 22, 46, 28)
      $graphics.DrawEllipse($darkPen, 42, 28, 18, 16)
    }
    "street" {
      $graphics.FillPolygon(
        $glassBrush,
        (New-PointArray @(
          @(34, 24), @(62, 24), @(54, 72), @(42, 72)
        ))
      )
      $graphics.DrawLine($pen, 34, 24, 42, 72)
      $graphics.DrawLine($pen, 62, 24, 54, 72)
      $graphics.DrawLine($pen, 48, 28, 48, 68)
      $graphics.DrawLine($pen, 48, 36, 48, 46)
      $graphics.DrawLine($pen, 48, 54, 48, 64)
      $graphics.DrawEllipse($pen, 18, 20, 12, 12)
      $graphics.DrawLine($pen, 24, 32, 24, 56)
    }
    "premium" {
      $graphics.FillPolygon(
        $brush,
        (New-PointArray @(
          @(48, 16), @(28, 36), @(36, 66), @(48, 78), @(60, 66), @(68, 36)
        ))
      )
      $graphics.DrawPolygon($darkPen, (New-PointArray @(
        @(48, 16), @(28, 36), @(36, 66), @(48, 78), @(60, 66), @(68, 36)
      )))
    }
    "attack" {
      $graphics.DrawLine($pen, 28, 26, 66, 64)
      $graphics.DrawLine($pen, 28, 64, 66, 26)
      $graphics.DrawLine($pen, 60, 20, 70, 30)
      $graphics.DrawLine($pen, 60, 70, 70, 60)
    }
    "defense" {
      $graphics.FillPolygon(
        $glassBrush,
        (New-PointArray @(
          @(48, 18), @(24, 30), @(28, 60), @(48, 78), @(68, 60), @(72, 30)
        ))
      )
      $graphics.DrawPolygon($pen, (New-PointArray @(
        @(48, 18), @(24, 30), @(28, 60), @(48, 78), @(68, 60), @(72, 30)
      )))
      $graphics.DrawLine($pen, 48, 28, 48, 64)
    }
    "respect" {
      $graphics.FillPolygon(
        $brush,
        (New-PointArray @(
          @(24, 52), @(30, 28), @(42, 42), @(48, 24), @(54, 42), @(66, 28), @(72, 52)
        ))
      )
      $graphics.DrawLine($darkPen, 24, 52, 72, 52)
    }
    "heist" {
      $graphics.DrawRectangle($pen, 22, 34, 52, 24)
      $graphics.DrawArc($pen, 34, 22, 28, 18, 180, 180)
      $graphics.FillRectangle($glassBrush, 22, 34, 52, 24)
      $graphics.DrawLine($darkPen, 30, 46, 66, 46)
    }
    default {
      $graphics.FillEllipse($glassBrush, 22, 22, 52, 52)
      $graphics.DrawEllipse($pen, 22, 22, 52, 52)
    }
  }

  $pen.Dispose()
  $brush.Dispose()
  $glassBrush.Dispose()
  $darkPen.Dispose()
}

function New-UiIcon($iconId, $label, $accent, $accentSoft) {
  $bitmap = New-Object System.Drawing.Bitmap 96, 96
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $baseRect = New-Object System.Drawing.Rectangle 0, 0, 96, 96
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $baseRect,
    (New-Color "#151820"),
    (New-Color "#060709"),
    65
  )
  $graphics.FillRectangle($bgBrush, $baseRect)

  $outerPath = New-RoundedRectPath 4 4 88 88 22
  $innerPath = New-RoundedRectPath 8 8 80 80 18

  $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($innerPath)
  $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(90, (New-Color $accentSoft))
  $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, (New-Color $accentSoft)))
  $graphics.FillPath($glowBrush, $innerPath)

  $borderPen = New-Object System.Drawing.Pen((New-Color $accent), 2)
  $borderPen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Inset
  $graphics.DrawPath($borderPen, $outerPath)

  $innerBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, (New-Color $accentSoft)), 1)
  $graphics.DrawPath($innerBorderPen, $innerPath)

  $topRect = New-Object System.Drawing.Rectangle 12, 12, 72, 4
  $topBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $topRect,
    (New-Color $accent),
    (New-Color $accentSoft),
    0
  )
  $graphics.FillRectangle($topBrush, $topRect)

  Draw-IconShape $graphics $iconId (New-Color $accent)

  $labelPath = New-RoundedRectPath 18 72 60 14 7
  $labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 5, 8, 13))
  $graphics.FillPath($labelBrush, $labelPath)
  $graphics.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, (New-Color $accentSoft)), 1)), $labelPath)

  $font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = New-Object System.Drawing.SolidBrush((New-Color $accent))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString($label.ToUpper(), $font, $textBrush, (New-Object System.Drawing.RectangleF 18, 72, 60, 14), $format)

  $path = Join-Path $outputDir "ui-$iconId.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
  $bgBrush.Dispose()
  $glowBrush.Dispose()
  $borderPen.Dispose()
  $innerBorderPen.Dispose()
  $topBrush.Dispose()
  $labelBrush.Dispose()
  $font.Dispose()
  $textBrush.Dispose()
  $outerPath.Dispose()
  $innerPath.Dispose()
  $labelPath.Dispose()
}

$icons = @(
  @{ id = "bank"; label = "BNK"; accent = "#4ad7ff"; soft = "#17344c" },
  @{ id = "casino"; label = "CAS"; accent = "#db7cff"; soft = "#35174a" },
  @{ id = "market"; label = "MRK"; accent = "#4af0c8"; soft = "#163a34" },
  @{ id = "dealer"; label = "DLR"; accent = "#d58cff"; soft = "#3f1e46" },
  @{ id = "club"; label = "CLB"; accent = "#ff4aa8"; soft = "#4a1732" },
  @{ id = "factory"; label = "FAC"; accent = "#ffb44a"; soft = "#4a2a14" },
  @{ id = "supplier"; label = "SUP"; accent = "#7cc8ff"; soft = "#1b3550" },
  @{ id = "pvp"; label = "PVP"; accent = "#ff5f5f"; soft = "#4a1919" },
  @{ id = "energy"; label = "ENG"; accent = "#f2e25a"; soft = "#4b4217" },
  @{ id = "heat"; label = "HOT"; accent = "#ff814a"; soft = "#4b2416" },
  @{ id = "cash"; label = "CASH"; accent = "#5cff8a"; soft = "#163b21" },
  @{ id = "street"; label = "STR"; accent = "#ff7a7a"; soft = "#4a1c24" },
  @{ id = "premium"; label = "VIP"; accent = "#c48dff"; soft = "#30204f" },
  @{ id = "attack"; label = "ATK"; accent = "#ff6f8d"; soft = "#471a26" },
  @{ id = "defense"; label = "DEF"; accent = "#69a9ff"; soft = "#182c4a" },
  @{ id = "respect"; label = "RSP"; accent = "#ffd25a"; soft = "#483617" },
  @{ id = "heist"; label = "JOB"; accent = "#8dffea"; soft = "#173a34" },
  @{ id = "gang"; label = "GNG"; accent = "#9fa8ff"; soft = "#20284c" }
)

foreach ($icon in $icons) {
  New-UiIcon -iconId $icon.id -label $icon.label -accent $icon.accent -accentSoft $icon.soft
}
