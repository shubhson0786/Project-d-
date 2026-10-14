$ErrorActionPreference = 'Stop'
$reportPath = 'C:\Users\shubham sonkar\Desktop\project d\Stashflow_AKTU_Report_Corrected.docx'
$pdfPath = 'C:\Users\shubham sonkar\Desktop\project d\report_render\corrected.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $document = $word.Documents.Open($reportPath, $false, $false)
    $document.Repaginate()
    foreach ($toc in $document.TablesOfContents) { $toc.Update() }
    $document.Fields.Update() | Out-Null
    $document.Repaginate()
    foreach ($toc in $document.TablesOfContents) { $toc.UpdatePageNumbers() }
    $document.Save()
    $document.ExportAsFixedFormat($pdfPath,17)
    Write-Output ('Pages: ' + $document.ComputeStatistics(2))
    $document.Close($false)
} finally { $word.Quit() }
