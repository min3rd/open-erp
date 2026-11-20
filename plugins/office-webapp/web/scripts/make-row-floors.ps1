<#
  Regenerates the QA row calibration (samples/qa-row-floors.json) from the Word
  document open in this Word instance: line counts per row cell from
  Characters.Information(10), the page a row starts on from Information(3).
  Only the rows given are scanned (the rest are fixed by the document's own
  w:lastRenderedPageBreak hints) and the other calibration keys already in the
  file (pageContentHeight, paragraphBreaks, paragraphStarts) are preserved.

    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-row-floors.ps1 -RowList 30,47
#>
param(
  [string]$RowsCsv = '30,47',
  [int]$TableIndex = 5,
  [int]$BlockIndex = 392,
  [int]$LineHeightPx = 23,
  [int]$CellPaddingPx = 12,
  [string]$Out = 'samples/qa-row-floors.json'
)

$rowList = $RowsCsv.Split(',') | ForEach-Object { [int]$_.Trim() }

$word = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
if ($word.Documents.Count -eq 0) { throw 'No document is open in Word' }
$doc = $word.ActiveDocument
$doc.Repaginate()
$tableObject = $doc.Tables.Item($TableIndex)

$floors = [ordered]@{}
$starts = New-Object System.Collections.Generic.List[int]

foreach ($row in $rowList) {
  $maxLines = 0
  $page = 0
  for ($column = 1; $column -le $tableObject.Columns.Count; $column++) {
    try { $cell = $tableObject.Cell($row + 1, $column) } catch { continue }
    $range = $cell.Range
    if ($page -eq 0) { $page = $range.Characters.Item(1).Information(3) }
    $count = $range.Characters.Count
    $lineNumbers = New-Object System.Collections.Generic.HashSet[int]
    for ($i = 1; $i -le $count; $i++) { [void]$lineNumbers.Add($range.Characters.Item($i).Information(10)) }
    if ($lineNumbers.Count -gt $maxLines) { $maxLines = $lineNumbers.Count }
  }
  if ($maxLines -gt 0) { $floors[[string]$row] = [Math]::Round($maxLines * $LineHeightPx + $CellPaddingPx, 1) }
  if ($page -gt 0) { $starts.Add($row) }
  Write-Output ("row {0}: page={1} lines={2} floor={3}px" -f $row, $page, $maxLines, $floors[[string]$row])
}

$path = Join-Path (Get-Location) $Out
$existing = [ordered]@{}
if (Test-Path $path) {
  $json = Get-Content $path -Raw | ConvertFrom-Json
  foreach ($property in $json.PSObject.Properties) { $existing[$property.Name] = $property.Value }
}
$existing['floors'] = [ordered]@{ "$BlockIndex" = $floors }
$existing['pageStarts'] = [ordered]@{ "$BlockIndex" = @($starts) }
$existing | ConvertTo-Json -Depth 8 | Set-Content $path -Encoding utf8
Write-Output ("wrote {0}: rows={1} pageStarts={2} keys={3}" -f $path, $floors.Count, $starts.Count, (($existing.Keys) -join ','))
