param(
  [string]$OutDir = "$PSScriptRoot\..\samples"
)

$ErrorActionPreference = 'Stop'
$resolvedOut = (Resolve-Path $OutDir).Path
$tmpDir = Join-Path (Resolve-Path "$PSScriptRoot\..").Path ".tmp"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$pngPath = Join-Path $tmpDir "qa-logo.png"

Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(96, 48)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(31, 78, 121))
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("OPEN-ERP", $font, $brush, 8, 15)
$g.Dispose(); $brush.Dispose(); $font.Dispose()
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

$word = $null
$doc = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Add()

  # Header & Footer with PAGE
  $sect = $doc.Sections.Item(1)
  $hdrRange = $sect.Headers.Item(1).Range
  $hdrRange.Text = "OPEN-ERP QA HEADER - Báo cáo định dạng"
  $ftrRange = $sect.Footers.Item(1).Range
  $ftrRange.Text = "Trang "
  $ftrRange.Collapse(0)
  [void]$ftrRange.Fields.Add($ftrRange, 33) # wdFieldPage

  # Title Heading 1
  $p = $doc.Paragraphs.Item(1)
  $p.Range.Text = "Báo cáo kiểm thử đa định dạng Word — Tiếng Việt có dấu đầy đủ"
  $p.Style = -2 # wdStyleHeading1
  $p.Range.InsertParagraphAfter() | Out-Null

  # Heading 2
  $p2 = $doc.Paragraphs.Add()
  $p2.Range.Text = "Phần 1: Định dạng chữ, liên kết và chú thích"
  $p2.Style = -3 # wdStyleHeading2
  $p2.Range.InsertParagraphAfter() | Out-Null

  # Formatted inline paragraph + hyperlink + footnote
  $p3 = $doc.Paragraphs.Add()
  $r = $p3.Range
  $r.Text = ""
  $addRun = {
    param($text, $bold = $false, $italic = $false, $under = 0, $strike = $false, $color = -16777216)
    $end = $p3.Range
    $end.Collapse(0)
    $end.Text = $text
    $end.Font.Bold = [int]$bold
    $end.Font.Italic = [int]$italic
    $end.Font.Underline = $under
    $end.Font.StrikeThrough = [int]$strike
    $end.Font.Color = $color
  }
  & $addRun "Chữ thường " $false $false 0 $false
  & $addRun "Chữ đậm " $true $false 0 $false 255
  & $addRun "Chữ nghiêng " $false $true 0 $false
  & $addRun "Gạch chân " $false $false 1 $false
  & $addRun "Gạch ngang. " $false $false 0 $true
  $fnAnchor = $p3.Range
  $fnAnchor.Collapse(0)
  [void]$doc.Footnotes.Add($fnAnchor, "", "Chú thích tiếng Việt kiểm thử footnote đa định dạng.")
  $linkAnchor = $p3.Range
  $linkAnchor.Collapse(0)
  $linkAnchor.Text = " "
  $linkAnchor.Collapse(0)
  [void]$doc.Hyperlinks.Add($linkAnchor, "https://openerp.9ms.io.vn", [Type]::Missing, [Type]::Missing, "Open-ERP Portal")
  $p3.Range.InsertParagraphAfter() | Out-Null

  # Bullet list
  for ($i = 1; $i -le 2; $i++) {
    $lp = $doc.Paragraphs.Add()
    $lp.Range.Text = "Mục gạch đầu dòng số $i"
    $lp.Range.ListFormat.ApplyBulletDefault()
    $lp.Range.InsertParagraphAfter() | Out-Null
  }
  # Numbered list
  for ($i = 1; $i -le 2; $i++) {
    $np = $doc.Paragraphs.Add()
    $np.Range.Text = "Mục đánh số thứ tự $i"
    $np.Range.ListFormat.ApplyNumberDefault()
    $np.Range.InsertParagraphAfter() | Out-Null
  }

  # Reset normal paragraph + embedded PNG picture
  $imgP = $doc.Paragraphs.Add()
  $imgP.Range.ListFormat.RemoveNumbers()
  $imgP.Range.Text = "Ảnh nhúng PNG: "
  $imgEnd = $imgP.Range
  $imgEnd.Collapse(0)
  [void]$doc.InlineShapes.AddPicture($pngPath, $false, $true, $imgEnd)
  $imgP.Range.InsertParagraphAfter() | Out-Null

  # 3x3 table with merged top row and shading
  $tblRange = $doc.Paragraphs.Add().Range
  $tbl = $doc.Tables.Add($tblRange, 3, 3)
  $tbl.Borders.Enable = 1
  $tbl.Cell(1, 1).Range.Text = "Bảng tổng hợp tiếng Việt"
  $tbl.Cell(1, 1).Shading.BackgroundPatternColor = 0xE6D8AD
  $tbl.Cell(1, 1).Merge($tbl.Cell(1, 2))
  $tbl.Cell(1, 2).Range.Text = "Ghi chú"
  $tbl.Cell(2, 1).Range.Text = "STT"
  $tbl.Cell(2, 2).Range.Text = "Hạng mục"
  $tbl.Cell(2, 3).Range.Text = "Trạng thái"
  $tbl.Cell(3, 1).Range.Text = "01"
  $tbl.Cell(3, 2).Range.Text = "Đọc tài liệu Word đa định dạng"
  $tbl.Cell(3, 3).Range.Text = "Đạt chuẩn"

  $formats = @(
    @{ Name = 'qa-formats-real.docx'; Format = 12 },
    @{ Name = 'qa-formats-real.doc'; Format = 0 },
    @{ Name = 'qa-formats-real.rtf'; Format = 6 },
    @{ Name = 'qa-formats-real.odt'; Format = 23 },
    @{ Name = 'qa-formats-real.dotx'; Format = 14 },
    @{ Name = 'qa-formats-real.xml'; Format = 19 },
    @{ Name = 'qa-formats-word2003.xml'; Format = 11 },
    @{ Name = 'qa-formats-macro.docm'; Format = 13 }
  )

  foreach ($f in $formats) {
    $target = [string](Join-Path $resolvedOut $f.Name)
    if (Test-Path $target) { Remove-Item $target -Force }
    $doc.SaveAs2($target, [int]$f.Format)
    Write-Output "CREATED $($f.Name) ($( (Get-Item $target).Length ) bytes)"
  }
} finally {
  if ($doc) { try { $doc.Close($false) } catch {} }
  if ($word) { try { $word.Quit($false) } catch {} }
}
