#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Configures optional Azure Artifacts Maven authentication for GitHub Actions.

.DESCRIPTION
    When AZURE_ARTIFACTS_PAT is supplied, copies the repository Maven settings template to the
    runner-local Maven directory and adds credentials for the upstream-public feed. When the
    secret is absent, Maven continues using anonymous CFS reads for packages already cached in the
    feed. The PAT is never written to the repository or logged.
#>

[CmdletBinding()]
param(
    [string] $FeedId = 'upstream-public'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:AZURE_ARTIFACTS_PAT)) {
    Write-Host 'AZURE_ARTIFACTS_PAT is not configured; using anonymous Maven feed access.'
    return
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path
$settingsTemplate = Join-Path $repoRoot 'settings.xml'
if (-not (Test-Path $settingsTemplate)) {
    throw "Maven settings template was not found at '$settingsTemplate'."
}

$settings = New-Object System.Xml.XmlDocument
$settings.PreserveWhitespace = $true
$settings.Load($settingsTemplate)

$namespaceUri = 'http://maven.apache.org/SETTINGS/1.0.0'
$servers = $settings.CreateElement('servers', $namespaceUri)
$server = $settings.CreateElement('server', $namespaceUri)

$id = $settings.CreateElement('id', $namespaceUri)
$id.InnerText = $FeedId
$username = $settings.CreateElement('username', $namespaceUri)
$username.InnerText = 'AzureDevOps'
$password = $settings.CreateElement('password', $namespaceUri)
$password.InnerText = $env:AZURE_ARTIFACTS_PAT

[void]$server.AppendChild($id)
[void]$server.AppendChild($username)
[void]$server.AppendChild($password)
[void]$servers.AppendChild($server)
[void]$settings.DocumentElement.PrependChild($servers)

$mavenDirectory = Join-Path $HOME '.m2'
New-Item -ItemType Directory -Path $mavenDirectory -Force | Out-Null
$settings.Save((Join-Path $mavenDirectory 'settings.xml'))

Write-Host "Configured Maven authentication for the '$FeedId' Azure Artifacts feed."
