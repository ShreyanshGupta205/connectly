param (
    [Parameter(Position = 0)]
    [string]$BaseUrl = "https://connectly-hazel.vercel.app",

    [Parameter(Position = 1)]
    [string]$Handle = "shreyansh",

    [Parameter()]
    [string]$BypassToken = "",

    [Parameter()]
    [string]$Source = ""
)

$BaseUrl = $BaseUrl.TrimEnd('/')
$CleanHandle = $Handle.TrimStart('@')
$TargetUrl = $BaseUrl + '/@' + $CleanHandle

if ($Source) {
    $CleanSource = $Source.TrimStart('?')
    if ($CleanSource.StartsWith('s=')) {
        $CleanSource = $CleanSource.Substring(2)
    }
    $TargetUrl = $TargetUrl + '?s=' + $CleanSource
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Connectly OpenGraph & Crawler Verification Tool" -ForegroundColor Cyan
Write-Host " Target URL: $TargetUrl" -ForegroundColor Cyan
if ($BypassToken) {
    Write-Host " Protection Bypass Token: [Configured & Active]" -ForegroundColor Green
} else {
    Write-Host " Protection Bypass Token: [None provided - pass -BypassToken <token> if Vercel Protection is active]" -ForegroundColor DarkGray
}
Write-Host "==========================================================" -ForegroundColor Cyan

$UserAgents = @(
    @{ Name = "WhatsApp"; UA = "WhatsApp/2.21.12.21" },
    @{ Name = "Twitterbot"; UA = "Twitterbot/1.0" },
    @{ Name = "LinkedInBot"; UA = "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)" },
    @{ Name = "facebookexternalhit"; UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" },
    @{ Name = "Normal Browser (Chrome)"; UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
)

foreach ($agent in $UserAgents) {
    Write-Host "`n--- Testing User-Agent: $($agent.Name) ---" -ForegroundColor Yellow
    
    # Build curl arguments
    $curlArgs = @("-i", "-s", "-L", "-A", $agent.UA)
    if ($BypassToken) {
        $curlArgs += @("-H", "x-vercel-protection-bypass: $BypassToken")
    }
    $curlArgs += $TargetUrl

    # Run curl to get headers and body
    $curlOutput = & curl.exe @curlArgs
    
    # Check for HTTP status code
    $statusLine = ($curlOutput | Where-Object { $_ -match "^HTTP\/[12]" } | Select-Object -Last 1)
    $statusCode = 0
    if ($statusLine -match "HTTP\/\S+\s+(\d+)") {
        $statusCode = [int]$matches[1]
    }
    
    # Check for preview protection
    $is401 = ($statusCode -eq 401)
    $hasLoginPage = ($curlOutput | Where-Object { $_ -match "Deployment Protection" -or $_ -match "Authentication Required" -or $_ -match "<form[^>]*action=[^>]*login" })
    
    if ($is401 -or ($hasLoginPage -and -not $BypassToken)) {
        Write-Host "preview protection is on (Pass -BypassToken <token> to authenticate)" -ForegroundColor Red
        Write-Host "Status: $statusLine" -ForegroundColor DarkGray
        continue
    }

    Write-Host "Status: $statusLine" -ForegroundColor Green
    
    # Extract Cache-Control
    $cacheControl = ($curlOutput | Where-Object { $_ -match "^[Cc]ache-[Cc]ontrol:" } | Select-Object -Last 1)
    if ($cacheControl) {
        Write-Host "$cacheControl" -ForegroundColor Gray
    } else {
        Write-Host "Cache-Control: [Not Present]" -ForegroundColor DarkGray
    }

    # Extract Canonical Link (<link rel="canonical" href="...">)
    $canonicalTag = ($curlOutput | Where-Object { $_ -match '<link[^>]*rel=["'']canonical["'']' } | Select-Object -First 1)
    if ($canonicalTag) {
        Write-Host "Canonical: $($canonicalTag.Trim())" -ForegroundColor Cyan
    } else {
        # Fallback check for og:url
        $ogUrl = ($curlOutput | Where-Object { $_ -match 'property=["'']og:url["'']' } | Select-Object -First 1)
        if ($ogUrl) {
            Write-Host "Canonical (og:url): $($ogUrl.Trim())" -ForegroundColor Cyan
        } else {
            Write-Host "Canonical: [Not Found]" -ForegroundColor DarkGray
        }
    }

    # Extract Robots Meta (<meta name="robots" content="...">)
    $robotsMeta = ($curlOutput | Where-Object { $_ -match '<meta[^>]*name=["'']robots["'']' } | Select-Object -First 1)
    if ($robotsMeta) {
        Write-Host "Robots: $($robotsMeta.Trim())" -ForegroundColor Cyan
    } else {
        Write-Host "Robots: [Not Found]" -ForegroundColor DarkGray
    }
    
    # Extract og:title
    $ogTitle = ($curlOutput | Where-Object { $_ -match 'property=["'']og:title["'']' } | Select-Object -First 1)
    if ($ogTitle) {
        Write-Host "$($ogTitle.Trim())" -ForegroundColor Cyan
    } else {
        Write-Host "og:title: [Not Found]" -ForegroundColor DarkGray
    }
    
    # Extract og:image
    $ogImage = ($curlOutput | Where-Object { $_ -match 'property=["'']og:image["'']' } | Select-Object -First 1)
    if ($ogImage) {
        Write-Host "$($ogImage.Trim())" -ForegroundColor Cyan
    } else {
        Write-Host "og:image: [Not Found]" -ForegroundColor DarkGray
    }
}
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Verification Completed." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
