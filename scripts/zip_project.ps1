$dest = "C:\Users\SIDDHARTH\Downloads\Record2Code-Project.zip"
if (Test-Path $dest) {
    Remove-Item $dest -Force
}
$files = Get-ChildItem -Path "c:\Users\SIDDHARTH\Downloads\Record2Code ag" | Where-Object { $_.Name -notin @('node_modules', '.next', '.git') }
Compress-Archive -Path $files -DestinationPath $dest -Force
Get-Item $dest | Select-Object Name, Length, LastWriteTime
