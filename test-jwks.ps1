$jwksUrl = "https://nvyxecumnhksxkaydfxi.supabase.co/.well-known/jwks.json"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eXhlY3Vtbmhrc3hrYXlkZnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTgwMzksImV4cCI6MjA3NzY3NDAzOX0.x_4z2z4j7eRBJN86IpJTgQagWoPPg7ti12c5sQleiY8"

Write-Host "Testing JWKS endpoint: $jwksUrl"

try {
    $response = Invoke-WebRequest -Uri $jwksUrl -Method GET
    
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response Body:"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
