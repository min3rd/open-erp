param(
  [string]$TmpDir = "$PSScriptRoot\..\.tmp"
)

$ErrorActionPreference = 'Stop'
$resolvedTmp = (Resolve-Path $TmpDir).Path
$files = @('export-from-doc.docx', 'export-from-rtf.docx', 'export-from-odt.docx')

$word = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  foreach ($name in $files) {
    $full = Join-Path $resolvedTmp $name
    if (-not (Test-Path $full)) { throw "Missing exported file: $full" }
    $doc = $null
    try {
      # Open with NoRepairDialog semantics via Open($full, $false, $true, $false, "", "", $false, "", "", 0, 65001, $true, $true)
      $doc = $word.Documents.Open([string]$full, $false, $true)
      $content = $doc.Content.Text
      $tables = $doc.Tables.Count
      $paras = $doc.Paragraphs.Count
      $hasTitle = $content.Contains('Báo cáo kiểm thử đa định dạng Word')
      $hasCell = $content.Contains('Đọc tài liệu Word đa định dạng')
      if (-not $hasTitle -or -not $hasCell -or $tables -lt 1) {
        throw "Word verification failed for ${name}: hasTitle=$hasTitle hasCell=$hasCell tables=$tables"
      }
      Write-Output "WORD16_COM_OK $name paras=$paras tables=$tables len=$($content.Length)"
    } finally {
      if ($doc) { try { $doc.Close($false) } catch {} }
    }
  }
} catch {
  Write-Error $_
  exit 1
} finally {
  if ($word) { try { $word.Quit($false) } catch {} }
}
