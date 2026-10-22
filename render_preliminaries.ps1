$ErrorActionPreference = 'Stop'
$source = 'C:\Users\shubham sonkar\Downloads\Preliminaries Pages.docx'
$pdf = 'C:\Users\shubham sonkar\Desktop\project d\report_render\preliminaries-reference.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $document = $word.Documents.Open($source, $false, $true)
    $document.ExportAsFixedFormat($pdf, 17)
    Write-Output ('Template pages: ' + $document.ComputeStatistics(2))
    $document.Close($false)
} finally {
    $word.Quit()
}
