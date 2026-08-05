#!/usr/bin/env bash
# Configures optional Azure Artifacts Maven authentication for GitHub Actions.
# When AZURE_ARTIFACTS_PAT is absent, Maven continues with anonymous CFS access.

set -euo pipefail

feed_id='upstream-public'

if [[ -z "${AZURE_ARTIFACTS_PAT:-}" ]]; then
    echo 'AZURE_ARTIFACTS_PAT is not configured; using anonymous Maven feed access.'
    exit 0
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/../.." && pwd)"
settings_template="$repo_root/settings.xml"
settings_path="$HOME/.m2/settings.xml"

if [[ ! -f "$settings_template" ]]; then
    echo "error: Maven settings template was not found at '$settings_template'." >&2
    exit 1
fi

mkdir -p "$(dirname -- "$settings_path")"

AZURE_ARTIFACTS_FEED_ID="$feed_id" \
AZURE_ARTIFACTS_SETTINGS_TEMPLATE="$settings_template" \
AZURE_ARTIFACTS_SETTINGS_PATH="$settings_path" \
python3 - <<'PY'
import os
import xml.etree.ElementTree as ET

namespace = 'http://maven.apache.org/SETTINGS/1.0.0'
ET.register_namespace('', namespace)
ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')

settings = ET.parse(os.environ['AZURE_ARTIFACTS_SETTINGS_TEMPLATE'])
root = settings.getroot()
servers = ET.Element(f'{{{namespace}}}servers')
server = ET.SubElement(servers, f'{{{namespace}}}server')
ET.SubElement(server, f'{{{namespace}}}id').text = os.environ['AZURE_ARTIFACTS_FEED_ID']
ET.SubElement(server, f'{{{namespace}}}username').text = 'AzureDevOps'
ET.SubElement(server, f'{{{namespace}}}password').text = os.environ['AZURE_ARTIFACTS_PAT']
root.insert(0, servers)
settings.write(os.environ['AZURE_ARTIFACTS_SETTINGS_PATH'], encoding='utf-8', xml_declaration=True)
PY

echo "Configured Maven authentication for the '$feed_id' Azure Artifacts feed."