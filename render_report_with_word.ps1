$ErrorActionPreference = "Stop"
$docxPath = "C:\Users\shubham sonkar\Desktop\project d\Stashflow_AKTU_Project_Report_Completed.docx"
$renderInput = "C:\Users\shubham sonkar\Desktop\project d\report_render\report_qa_input.docx"
$pdfPath = "C:\Users\shubham sonkar\Desktop\project d\report_render\Stashflow_AKTU_Project_Report_Completed.pdf"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pdfPath) | Out-Null
Copy-Item -LiteralPath $docxPath -Destination $renderInput -Force
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.Options.SaveNormalPrompt = $false
try {
    Write-Output "Opening document"
    $document = $word.Documents.Open($renderInput, $false, $true)
    Write-Output "Updating fields"
    foreach ($toc in $document.TablesOfContents) { $toc.Update() }
    $document.Fields.Update() | Out-Null
    Write-Output "Exporting PDF"
    $document.ExportAsFixedFormat($pdfPath, 17)
    $document.Close($false)
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($document) | Out-Null
} finally {
    Write-Output "Closing Word"
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
Write-Output $pdfPath
