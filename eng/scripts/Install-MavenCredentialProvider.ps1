#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Configures Maven to authenticate to the Azure Artifacts upstream-public feed in CI.

.DESCRIPTION
    Writes a runner-local Maven settings.xml with an Azure Artifacts mirror and credentials.
    Supply the access token through the AZURE_ARTIFACTS_PAT environment variable; the token is not
    written to the repository or emitted to the build log.
#>

[CmdletBinding()]
param(
    [string] $FeedUrl = 'https://pkgs.dev.azure.com/azfunc/public/_packaging/upstream-public/maven/v1',
    [string] $FeedId = 'upstream-public'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:AZURE_ARTIFACTS_PAT)) {
    throw 'AZURE_ARTIFACTS_PAT must be set to an Azure DevOps PAT with Packaging Read permission for the upstream-public feed.'
}

$mavenDirectory = Join-Path $HOME '.m2'
New-Item -ItemType Directory -Path $mavenDirectory -Force | Out-Null

$escapedFeedId = [System.Security.SecurityElement]::Escape($FeedId)
$escapedFeedUrl = [System.Security.SecurityElement]::Escape($FeedUrl)
$escapedPat = [System.Security.SecurityElement]::Escape($env:AZURE_ARTIFACTS_PAT)

@"
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <servers>
    <server>
      <id>$escapedFeedId</id>
      <username>AzureDevOps</username>
      <password>$escapedPat</password>
    </server>
  </servers>
  <mirrors>
    <mirror>
      <id>$escapedFeedId</id>
      <name>Azure Artifacts upstream public Maven feed</name>
      <url>$escapedFeedUrl</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>
</settings>
"@ | Set-Content -Path (Join-Path $mavenDirectory 'settings.xml') -Encoding utf8

Write-Host "Configured Maven to authenticate to the '$FeedId' Azure Artifacts mirror."