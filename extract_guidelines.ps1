$ErrorActionPreference = 'Stop'
$source = 'C:\Users\shubham sonkar\Downloads\Mini Project Report Guidelines.doc'
$output = 'C:\Users\shubham sonkar\Desktop\project d\report_render\guidelines.txt'
$pdf = 'C:\Users\shubham sonkar\Desktop\project d\report_render\guidelines.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $document = $word.Documents.Open($source, $false, $true)
    [System.IO.File]::WriteAllText($output, $document.Content.Text)
    $document.ExportAsFixedFormat($pdf, 17)
    Write-Output ('Guidelines pages: ' + $document.ComputeStatistics(2))
    $document.Close($false)
} finally {
    $word.Quit()
}
