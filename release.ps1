# Remove old node_modules
$node_module_path = "$PSScriptRoot\node_modules"
$node_module_exists = Test-Path -Path "$node_module_path"
if ($node_module_exists) {
    Remove-Item -Recurse -Force -Path $node_module_path
}

# Restore package
npm install --production
npm run build

# Remove node_modules/ and lib/ from .gitignore
Set-Content -Path .\.gitignore -Value (Get-Content -Path .\.gitignore | Select-String -NotMatch 'node_modules/|lib/')