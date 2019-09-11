# GitHub Actions for deploying to Azure Functions

With the Azure Functions Github Action, you can automate your workflow to deploy [Azure Functions](https://azure.microsoft.com/en-us/services/functions/).

Get started today with a [free Azure account](https://azure.com/free/open-source)!

The repository contains a Github Action to deploy your function app project into Azure Functions. If you are looking for a Github Action to deploy your customized image into an Azure Functions container, please consider using [functions-container-action](https://github.com/Azure/functions-container-action).

The definition of this Github Action is in [action.yml](https://github.com/Azure/functions-action/blob/master/action.yml).

# End-to-End Workflow

## Dependencies on other Github Actions
* [Checkout](https://github.com/actions/checkout) Checkout your Git repository content into Github Actions agent.
* [Azure Login](https://github.com/Azure/actions) Login with your Azure credentials for function app deployment authentication.
* Environment setup actions
  * [Setup DotNet](https://github.com/actions/setup-dotnet) Build your DotNet core function app or function app extensions.
  * [Setup Node](https://github.com/actions/setup-node) Resolve Node function app dependencies using npm.
  * [Setup Python](https://github.com/actions/setup-python) Resolve Python function app dependencies using pip.
  * [Setup Java](https://github.com/actions/setup-java) Resolve Java function app dependencies using maven.

## Azure Service Principle for RBAC
You may want to create an [Azure Service Principal for RBAC](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview) and add them as a Github Secret in your repository.
1. Download Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest), run `az login` to login with your Azure credentials.
2. Run Azure CLI command
```
   az ad sp create-for-rbac --name "myApp" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/{app-name} \
                            --sdk-auth

  # Replace {subscription-id}, {resource-group}, and {app-name} with the names of your subscription, resource group,and Azure function app.
```
3. Paste the json response from above Azure CLI to your Github Repository > Settings > Secrets > Add a new secret > **AZURE_CREDENTIALS**

## Create Azure Functionapps and Deploy using Github Actions
1. Follow the tutorial [Azure Functions Quickstart](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code)
2. Pick a template from the following table depends on your Azure Functions **runtime** and **OS type** and place the template to `.github/workflows/` in your project repository.
3. Commit and push your project to Github repository, you should see a new Github Action initiated in **Actions** tab.

| Templates  | Windows |  Linux |
|------------|---------|--------|
| DotNet     | [windows_dotnet.yml](https://github.com/Azure/functions-action/blob/master/templates/windows_dotnet.yml) | [linux_dotnet.yml](https://github.com/Azure/functions-action/blob/master/templates/linux_dotnet.yml) |
| Node       | [windows_node.yml](https://github.com/Azure/functions-action/blob/master/templates/windows_node.yml) | [linux_node.yml](https://github.com/Azure/functions-action/blob/master/templates/linux_node.yml) |
| PowerShell | [windows_powershell.yml](https://github.com/Azure/functions-action/blob/master/templates/windows_powershell.yml) | - |
| Java       | [windows_java.yml](https://github.com/Azure/functions-action/blob/master/templates/windows_java.yml) | - |
| Python     | - | [linux_python.yml](https://github.com/Azure/functions-action/blob/master/templates/linux_python.yml) |

These templates will **NOT** resolve the **extensions.csproj** in your project. If you want to use binding extensions (e.g. Blob/Queue/EventHub Triggers), please consider [registering Azure Functions binding extensions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-register) in your host.json.

Alternatively, you can add a `- run: dotnet build --output ./bin` step **before** functions-action step.

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
