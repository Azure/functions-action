#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Configures Maven to use the Azure Artifacts upstream-public feed in CI.

.DESCRIPTION
    Downloads the Azure Artifacts Maven credential provider and writes the Maven core extension
    and settings files required by the Java E2E workflow. The generated .mvn directory is local to
    the runner and is intentionally not committed.
#>

[CmdletBinding()]
param(
    [string] $Version = '3.2.1',
    [string] $FeedUrl = 'https://pkgs.dev.azure.com/azfunc/public/_packaging/upstream-public/maven/v1',
    [string] $FeedId = 'upstream-public'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$groupId = 'com.microsoft.azure'
$artifactId = 'artifacts-maven-credprovider'
$bootstrapFeed = 'https://pkgs.dev.azure.com/artifacts-public/PublicTools/_packaging/AzureArtifacts/maven/v1'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path

if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    throw "Maven ('mvn') was not found on PATH."
}

$localRepositoryPath = Join-Path $HOME '.m2' 'repository'
$artifactDirectory = $localRepositoryPath
foreach ($segment in ($groupId.Split('.') + @($artifactId, $Version))) {
    $artifactDirectory = Join-Path $artifactDirectory $segment
}

$artifactPath = Join-Path $artifactDirectory "$artifactId-$Version.jar"
if (-not (Test-Path $artifactPath)) {
    Write-Host "Installing Azure Artifacts Maven credential provider $Version..."
    $workingDirectory = Join-Path ([IO.Path]::GetTempPath()) ('credprovider-bootstrap-' + [Guid]::NewGuid().ToString('n'))
    New-Item -ItemType Directory -Path $workingDirectory -Force | Out-Null

    try {
        Push-Location $workingDirectory
        & mvn --batch-mode dependency:get "-Dartifact=${groupId}:${artifactId}:${Version}" "-DremoteRepositories=central::::${bootstrapFeed}"
        if ($LASTEXITCODE -ne 0) {
            throw "'mvn dependency:get' failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
        Remove-Item $workingDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Test-Path $artifactPath)) {
    throw "Credential provider was not found at '$artifactPath' after bootstrap."
}

$extensionsDirectory = Join-Path $repoRoot '.mvn'
New-Item -ItemType Directory -Path $extensionsDirectory -Force | Out-Null

@"
<?xml version="1.0" encoding="UTF-8"?>
<extensions xmlns="http://maven.apache.org/EXTENSIONS/1.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/EXTENSIONS/1.1.0 https://maven.apache.org/xsd/core-extensions-1.0.0.xsd">
  <extension>
    <groupId>$groupId</groupId>
    <artifactId>$artifactId</artifactId>
    <version>$Version</version>
  </extension>
</extensions>
"@ | Set-Content -Path (Join-Path $extensionsDirectory 'extensions.xml') -Encoding utf8

$mavenDirectory = Join-Path $HOME '.m2'
New-Item -ItemType Directory -Path $mavenDirectory -Force | Out-Null

@"
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>$FeedId</id>
      <name>Azure Artifacts upstream public Maven feed</name>
      <url>$FeedUrl</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>
</settings>
"@ | Set-Content -Path (Join-Path $mavenDirectory 'settings.xml') -Encoding utf8

Write-Host "Configured Maven to use '$FeedId' and installed the credential provider."