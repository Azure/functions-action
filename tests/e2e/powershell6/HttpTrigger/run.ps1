using namespace System.Net

# Input bindings are passed in via param block.
param($Request, $TriggerMetadata)

$data = (Get-Content -Path "sha.txt")

# Associate values to output bindings by calling 'Push-OutputBinding'.
Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
    StatusCode = [HttpStatusCode]::OK
    Body = $data
})
