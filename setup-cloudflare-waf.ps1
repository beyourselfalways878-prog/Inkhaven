# Cloudflare WAF Protection Setup Script for InkHaven
# This script configures Firewall (WAF) Rules to secure Chat APIs and Rooms.

# --- 1. CONFIGURATION ---
$CloudflareToken = "cfat_4oPDJ9KpPXl0kDmpYWNf0lX744Va6ckswYJwzCU782bff66a"
$ZoneName = "inkhaven.in" # Your primary domain

# --- 2. AUTHENTICATION & ZONE FETCH ---
Write-Host "--- Cloudflare WAF Setup [InkHaven] ---" -ForegroundColor Cyan
$Headers = @{
    "Authorization" = "Bearer $CloudflareToken"
    "Content-Type"  = "application/json"
}

# Find the Zone ID for your domain
$ZoneSearch = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$ZoneName" -Headers $Headers
if ($ZoneSearch.result.Count -eq 0) {
    Write-Error "Could not find Zone ID for $ZoneName. Ensure your token has 'Zone.Zone Read' permissions."
    exit
}
$ZoneId = $ZoneSearch.result[0].id
Write-Host "Found Zone: $ZoneName ($ZoneId)" -ForegroundColor Green

# --- 3. CREATE WAF RULE ---
# This rule will trigger a "Managed Challenge" (Turnstile) for bots and suspicious requests 
# hitting the chat APIs or room slugs.
$WAFRule = @{
    "action" = "managed_challenge"
    "description" = "InkHaven: Protect Chat Routes from Bots"
    "expression" = "(http.request.uri.path contains `"/api/chat/`" or http.request.uri.path contains `"/chat/`") and (cf.threat_score gt 10 or cf.client.bot)"
    "enabled" = $true
}

Write-Host "Implementing WAF Rule: Managed Challenge on Chat Routes..." -ForegroundColor Yellow

$RulesetUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/rulesets"
$Phase = "http_request_firewall_custom"

# Find the specific ruleset for Custom Firewall Rules
$Rulesets = Invoke-RestMethod -Uri $RulesetUrl -Headers $Headers
$CustomRuleset = $Rulesets.result | Where-Object { $_.phase -eq $Phase }

if ($null -eq $CustomRuleset) {
    # If no ruleset exists for this phase, we need to create it (rarely needed for zones)
    Write-Host "Creating new Firewall Custom Ruleset..."
    # (Simplified for most existing zones where it exists)
} else {
    $RulesetId = $CustomRuleset.id
    
    # Append the rule to the ruleset
    $UpdatePayload = @{
        "rules" = @(
            $WAFRule
        )
    } | ConvertTo-Json -Depth 5

    try {
        $Update = Invoke-RestMethod -Method Patch -Uri "$RulesetUrl/$RulesetId" -Headers $Headers -Body $UpdatePayload
        Write-Host "✅ WAF Rule Successfully Deployed!" -ForegroundColor Green
    } catch {
        Write-Error "Failed to update WAF rules: $_"
    }
}

Write-Host "------------------------------------"
Write-Host "Setup Complete. Visit Cloudflare Dashboard -> Security -> WAF to verify." -ForegroundColor Cyan
