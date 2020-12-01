# GitHub Actions for deploying to Azure Functions

| Build Status | Unit Test | UT CodeCov |
|--------------|-----------|------------|
| dev          | ![dev unit test](https://github.com/Azure/functions-action/workflows/RUN_UNIT_TESTS/badge.svg?branch=dev) | ![dev coverage](https://codecov.io/gh/Azure/functions-action/branch/dev/graph/badge.svg)
| master       | ![master unit test](https://github.com/Azure/functions-action/workflows/RUN_UNIT_TESTS/badge.svg?branch=master) | ![master coverage](https://codecov.io/gh/Azure/functions-action/branch/master/graph/badge.svg)

With the Azure Functions GitHub Action, you can automate your workflow to deploy [Azure Functions](https://azure.microsoft.com/en-us/services/functions/).

Get started today with a [free Azure account](https://azure.com/free/open-source)!

The repository contains a GitHub Action to deploy your function app project into Azure Functions. If you are looking for a GitHub Action to deploy your customized container image into an Azure Functions container, please consider using [functions-container-action](https://github.com/Azure/functions-container-action).

The definition of this GitHub Action is in [action.yml](https://github.com/Azure/functions-action/blob/master/action.yml).

[Kudu zip deploy](https://github.com/projectkudu/kudu/wiki/Deploying-from-a-zip-file-or-url) method is used by the action for deployment of Functions.

# End-to-End Workflow

## Workflow Templates

| Templates  | Windows |  Linux |
|------------|---------|--------|
| DotNet     | [windows-dotnet-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-dotnet-functionapp-on-azure.yml) | [linux-dotnet-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-dotnet-functionapp-on-azure.yml) |
| Node       | [windows-node.js-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-node.js-functionapp-on-azure.yml) | [linux-node.js-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-node.js-functionapp-on-azure.yml) |
| PowerShell | [windows-powershell-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-powershell-functionapp-on-azure.yml) | - |
| Java       | [windows-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-java-functionapp-on-azure.yml) | [linux-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-java-functionapp-on-azure.yml) |
| Python     | - | [linux-python-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-python-functionapp-on-azure.yml) |

If you are have extension project(s) in your repo, these templates will **NOT** resolve the **extensions.csproj** in your project. If you want to use binding extensions (e.g. Blob/Queue/EventHub Triggers), please consider [registering Azure Functions binding extensions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-register) in your host.json.

Alternatively, you can add a `- run: dotnet build --output ./bin` step **before** functions-action step.

"Remove additional files at destination" is not supported by Kudu deploy method which is used in this action and should be handled separately. When a new build is deployed with zipdeploy, files and directories that were created by the previous deployment but are no longer present in the build will be deleted. Any other files and directories found in the site that aren't being overwritten by the deployment, such as those placed there via FTP or created by your app during runtime, will be preserved.

## Using Publish Profile as Deployment Credential (recommended)
You may want to get the publish profile from your function app.
Using publish profile as deployemnt credential is recommended if you are not the owner of your Azure subscription.

1. In Azure portal, go to your function app.
2. Click **Get publish profile** and download **.PublishSettings** file.
3. Open the **.PublishSettings** file and copy the content.
4. Paste the XML content to your GitHub Repository > Settings > Secrets > Add a new secret > **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**
5. Use the above template to create the `.github/workflows/your-workflow.yml` file in your project repository.
6. Change variable values in `env:` section according to your function app.
7. Commit and push your project to GitHub repository, you should see a new GitHub workflow initiated in **Actions** tab.

## Using Azure Service Principle for RBAC as Deployment Credential
You may want to create an [Azure Service Principal for RBAC](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview) and add them as a GitHub Secret in your repository.
1. Download Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest), run `az login` to login with your Azure credentials.
2. Run Azure CLI command
```
   az ad sp create-for-rbac --name "myApp" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/{app-name} \
                            --sdk-auth

  # Replace {subscription-id}, {resource-group}, and {app-name} with the names of your subscription, resource group, and Azure function app.
  # The command should output a JSON object similar to this:

  {
    "clientId": "<GUID>",
    "clientSecret": "<GUID>",
    "subscriptionId": "<GUID>",
    "tenantId": "<GUID>",
    (...)
  }
```
3. Copy and paste the json response from above Azure CLI to your GitHub Repository > Settings > Secrets > Add a new secret > **AZURE_RBAC_CREDENTIALS**
4. Use [Windows DotNet Function App RBAC](https://github.com/Azure/actions-workflow-samples/blob/master/FunctionApp/windows-dotnet-functionapp-on-azure-rbac.yml) template as a reference to build your workflow in `.github/workflows/` directory.
5. Change variable values in `env:` section according to your function app.
6. Commit and push your project to GitHub repository, you should see a new GitHub workflow initiated in **Actions** tab.

## Dependencies on other GitHub Actions
* [Checkout](https://github.com/actions/checkout) Checkout your Git repository content into GitHub Actions agent.
* [Azure Login](https://github.com/Azure/actions) Login with your Azure credentials for function app deployment authentication.
* Environment setup actions
  * [Setup DotNet](https://github.com/actions/setup-dotnet) Build your DotNet core function app or function app extensions.
  * [Setup Node](https://github.com/actions/setup-node) Resolve Node function app dependencies using npm.
  * [Setup Python](https://github.com/actions/setup-python) Resolve Python function app dependencies using pip.
  * [Setup Java](https://github.com/actions/setup-java) Resolve Java function app dependencies using maven.

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
