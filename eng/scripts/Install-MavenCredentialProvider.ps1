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
    [string] $FeedId = 'upstream-public'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:AZURE_ARTIFACTS_PAT)) {
    throw 'AZURE_ARTIFACTS_PAT must be set to an Azure DevOps PAT with Packaging Read permission for the upstream-public feed.'
}

$mavenDirectory = Join-Path $HOME '.m2'
New-Item -ItemType Directory -Path $mavenDirectory -Force | Out-Null

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
$settings.Save((Join-Path $mavenDirectory 'settings.xml'))

Write-Host "Configured Maven to authenticate to the '$FeedId' Azure Artifacts mirror."