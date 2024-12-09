# GitHub Actions for deploying to Azure Functions

|                    | master | dev |
|--------------------|--------|-----|
| Coverage           | ![master coverage](https://codecov.io/gh/Azure/functions-action/branch/master/graph/badge.svg) | ![dev coverage](https://codecov.io/gh/Azure/functions-action/branch/dev/graph/badge.svg) |
| Unit Test          | ![master unit test](https://github.com/Azure/functions-action/workflows/RUN_UNIT_TESTS/badge.svg?branch=master) | ![dev unit test](https://github.com/Azure/functions-action/workflows/RUN_UNIT_TESTS/badge.svg?branch=dev) |
| .NETCore Windows   | ![master .netcore windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_DOTNET3_WCON/badge.svg?branch=master) | ![dev .netcore windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_DOTNET3_WCON/badge.svg?branch=dev) |
| .NETCore Linux     | ![master .netcore linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_DOTNET3_LCON/badge.svg?branch=master) | ![dev .netcore linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_DOTNET3_LCON/badge.svg?branch=dev) |
| Java Windows       | ![master java windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_JAVA8_WCON/badge.svg?branch=master) | ![dev java windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_JAVA8_WCON/badge.svg?branch=dev) |
| Java Linux         | ![master java linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_JAVA8_LCON/badge.svg?branch=master) | ![dev java linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_JAVA8_LCON/badge.svg?branch=dev) |
| Node JS Windows    | ![master nodejs windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_NODE20_WCON/badge.svg?branch=master) | ![dev nodejs windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_NODE20_WCON/badge.svg?branch=dev) |
| Node JS Linux      | ![master nodejs linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_NODE20_LCON/badge.svg?branch=master) | ![dev nodejs linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_NODE20_LCON/badge.svg?branch=dev) |
| PowerShell Windows | ![master powershell windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_POWERSHELL6_WCON/badge.svg?branch=master) | ![dev powershell windows e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_POWERSHELL6_WCON/badge.svg?branch=dev) |
| Python Linux       | ![master python linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_PYTHON37_LCON/badge.svg?branch=master) | ![dev python linux e2e](https://github.com/Azure/functions-action/workflows/RUN_E2E_TESTS_PYTHON37_LCON/badge.svg?branch=dev) |

The Azure Functions Action deploys your project code to your [function app](https://azure.microsoft.com/en-us/services/functions/). With this action, you can create an automated workflow that builds, authenticates, and deploys to your function app.

To get started, you can copy one of our end-to-end samples, or have one generated for you in the Azure Portal; just go to the Deployment Center blade of your app. For full guidance on creating automated workflows, see our Learn article [here](https://learn.microsoft.com/azure/azure-functions/functions-how-to-github-actions).

>[!IMPORTANT]
>If you are looking for a GitHub Action to deploy your customized container image to Azure Functions, please use [functions-container-action](https://github.com/Azure/functions-container-action).

The definition of this GitHub Action is in [action.yml](https://github.com/Azure/functions-action/blob/master/action.yml).

## End-to-end workflow samples

### Workflow templates

| Templates  | Windows |  Linux |
|------------|---------|--------|
| DotNet     | [windows-dotnet-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-dotnet-functionapp-on-azure.yml) | [linux-dotnet-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-dotnet-functionapp-on-azure.yml) |
| Node       | [windows-node.js-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-node.js-functionapp-on-azure.yml) | [linux-node.js-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-node.js-functionapp-on-azure.yml) |
| PowerShell | [windows-powershell-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-powershell-functionapp-on-azure.yml) | [linux-powershell-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/blob/master/FunctionApp/linux-powershell-functionapp-on-azure.yml) |
| Java       | [windows-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-java-functionapp-on-azure.yml) | [linux-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-java-functionapp-on-azure.yml) |
| Python     | - | [linux-python-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-python-functionapp-on-azure.yml) |

For guidance on how to adapt these samples to work with the [Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan) plan, please see [GitHub Action parameters](#input-parameters).

If you have extension project(s) in your repo, these templates will **NOT** resolve the **extensions.csproj** in your project. If you want to use binding extensions (e.g. Blob/Queue/EventHub Triggers), please consider [registering Azure Functions binding extensions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-register) in your host.json.

Alternatively, you can add a `- run: dotnet build --output ./bin` step **before** functions-action step.

"Remove additional files at destination" is not supported by Kudu deploy method used in this action and should be handled separately. When a new build is deployed with zipdeploy, files and directories that were created by the previous deployment but are no longer present in the build will be deleted. Any other files and directories found in the site that aren't being overwritten by the deployment, such as those placed there via FTP or created by your app during runtime, will be preserved.

### Supported Languages and versions

- [Language versions supported in each runtime version](https://docs.microsoft.com/en-us/azure/azure-functions/supported-languages#languages-by-runtime-version)
- [Languages supported in each OS](https://docs.microsoft.com/en-us/azure/azure-functions/supported-languages#language-support-details)

## Authentication methods

You'll have to decide how the action will authenticate with Azure to deploy content to your function app. There are three supported authentication methods:

1. OpenID Connect (OIDC) with an Azure user-assigned managed identity (recommended)
1. RBAC with an Azure service principal
1. Publish profile

There are special considerations for certain function app scenarios:

- Your app is on any hosting plan in the Azure government clouds or Azure Stack Hub:
  - When using OIDC or RBAC auth, include the relevant `environment` and `audience` parameters for the `azure/login` action.
- Your app is Linux-based on the Consumption plan and your project contains an executable file (custom handler, `chrome` in [Puppeteer](https://github.com/puppeteer/puppeteer)/[Playwright](https://github.com/microsoft/playwright), etc.):
  - RBAC is the only supported authentication method.

### Using OIDC for authentication (recommended)

[OpenID Connect](https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers) involves configuring your Azure user-assigned managed identity to trust GitHub's OIDC as a federated identity.

This method is the most secure and recommended for those with permissions to configure identity.

Follow these steps to configure your workflow to use OIDC for authentication:

1. [Create an Azure user-assigned managed identity](https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/how-manage-user-assigned-managed-identities#create-a-user-assigned-managed-identity).
    1. Federated identity credentials are not currently supported for system-assigned managed identities.
1. Copy down the values for Client ID, Subscription ID, and Directory (tenant) ID from the user-assigned managed identity resource.
1. [Create the following role assignment](https://learn.microsoft.com/azure/role-based-access-control/role-assignments-portal) for the user-assigned managed identity: `Website Contributor` scoped to the function app you want to deploy to.
1. [Create a federated credential](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity#configure-a-federated-identity-credential-on-a-user-assigned-managed-identity) with the following settings:
    1. Federated credential scenario: "Configure a GitHub issued token to impersonate this application and deploy to Azure"
    1. Organization: [YOUR_ORGANIZATION]
    1. Repository: [REPO_CONTAINING_FUNCTIONS_PROJECT]
    1. Entity type: "Branch"
    1. Branch: [BRANCH_NAME]
1. [Create the following secrets in your repository](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) from the values you copied earlier:
    1. AZURE_CLIENT_ID: [CLIENT_ID]
    1. AZURE_TENANT_ID: [DIRECTORY_TENANT_ID]
    1. AZURE_SUBSCRIPTION_ID: [SUBSCRIPTION_ID]
1. Add the following permissions to the `build` job:
    1. `id-token: write`
    1. `contents: read`
1. Add the following permission to the `deploy` job:
    1. `id-token: write`
1. Add the `azure/login` action as a step prior to the Azure Functions Action (see snippet below).
    1. Include the parameters `client-id`, `tenant-id`, and `subscription-id`, referencing your repository secrets.

>[!TIP]
>The `Entity` is what will trigger the workflow to fetch the OIDC token. Our samples assume you want to trigger the workflow on pushes to `main`. If you would like to customize this, please see our [entity type examples](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity#entity-type-examples).

By choosing OIDC for your authentication method, the `deploy` job of your automated workflow will look something like the following snippet:

```yml
# Deploy to an app on the Flex Consumption plan using OIDC authentication
jobs:
    build:
      runs-on: ubuntu-latest
      permissions:
          contents: read # Required for actions/checkout
      steps: 
        # ...checkout your repository
        # ...required build steps for your language
        # ...upload your build artifact
    
    deploy:
      runs-on: ubuntu-latest
      needs: build
      permissions:
          id-token: write # Required to fetch an OIDC token to authenticate with the job
      steps:
        # ...download your build artifact

        - name: 'Log in to Azure with AZ CLI'
          uses: azure/login@v2
          with:
            client-id: ${{ secrets.AZURE_CLIENT_ID }} # Required to log in with a user-assigned managed identity
            tenant-id: ${{ secrets.AZURE_TENANT_ID }} # Required to log in with a user-assigned managed identity
            subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }} # Required to log in with a user-assigned managed identity
          
        - name: 'Run the Azure Functions Action'
          uses: Azure/functions-action@v1
          id: deploy-to-function-app
          with:
            app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
            package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'   
```

### Using RBAC with an Azure service principal for authentication

Azure service principals support [RBAC](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview). This option will involve you creating an application service principal and managing the secrets yourself.

When possible, we recommend [using OIDC for authentication](#using-oidc-for-authentication-recommended) over application service principals.

Follow these steps to configure your workflow to use RBAC with a service principal for authentication:

1. Download Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest), run `az login` to login with your Azure credentials.
1. Run the following Azure CLI command

```bash
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

1. Copy and paste the json response from above Azure CLI to your GitHub Repository > Settings > Secrets > Add a new secret > **AZURE_RBAC_CREDENTIALS**
1. Add the `azure/login` action as a step prior to the Azure Functions Action (see snippet below).
    1. Include the parameter `cred`, referencing your recently created repository secret.
    1. Ensure that there is no mention of publish profiles in your workflow, especially the `publish-profile` parameter of the Azure Functions Action.

By choosing RBAC with a service principal for your authentication method, the `deploy` job of your automated workflow will look something like the following snippet:

```yml
# Deploy to an app on the Flex Consumption plan using RBAC with a service principal as authentication
jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        # ...checkout your repository
        # ...required build steps for your language
        # ...upload your build artifact

    deploy:
      runs-on: ubuntu-latest
      needs: build
      steps:
        # ...download your build artifact
        
        - name: 'Log in to Azure with AZ CLI'
          uses: azure/login@v2
          with:
            cred-id: ${{ secrets.AZURE_RBAC_CREDENTIALS }}
          
        - name: 'Run the Azure Functions Action'
          uses: Azure/functions-action@v1
          id: deploy-to-function-app
          with:
            app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
            package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'   
```

### Using publish profile for authentication

A publish profile contains plain-text secrets that authenticate with your function app.

Generally, secret-based authentication methods are not recommended. We recommend a more secure option like [using OIDC](#using-oidc-for-authentication-recommended).

Follow these steps to configure your workflow to use publish profile for authentication:

1. In Azure portal, go to your function app.
1. Ensure that **Basic authentication** is enabled by navigating to Settings > Configuration > SCM Basic Auth Publishing Credentials.
1. In the Overview blade, click **Get publish profile** and download **.PublishSettings** file.
1. Open the **.PublishSettings** file and copy the content.
1. Paste the XML content to your GitHub Repository > Settings > Secrets > Add a new secret > **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**
1. Ensure that your workflow is not using the `azure/login` action.
1. Include the `publish-profile` parameter in the Azure Functions Action, referencing **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**.

By choosing publish profile for your authentication method, the `deploy` job of your automated workflow will look something like the following snippet:

```yml
# Deploy to an app on the Flex Consumption plan using RBAC with a service principal as authentication
jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        # ...checkout your repository
        # ...required build steps for your language
        # ...upload your build artifact

    deploy:
      runs-on: ubuntu-latest
      needs: build
      steps:
        # ...download your build artifact

        - name: 'Run the Azure Functions Action'
          uses: Azure/functions-action@v1
          id: deploy-to-function-app
          with:
            app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
            package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'
            sku: `flexconsumption`    # When RBAC/managed identity is not used, the action cannot resolve the Flex Consumption SKU automatically.
            publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

### Manged identities for storage account access and package deployments on Linux Consumption SKU

If the function app uses managed identities for accessing the storage account (i.e. `AzureWebJobsStorage` is not set) then the action will use the RBAC account to publish a package deployment to the storage account defined in `AzureWebJobsStorage__accountName`. The app setting `WEBSITE_RUN_FROM_PACKAGE` will be created during deployment and will not include a SAS token.

If `WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID` is defined then user-assigned manage identity will be used, otherwise system-assigned manage identity. The RBAC account will require [Microsoft.Storage/storageAccounts/listkeys/action](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-data-operations-portal#use-the-account-access-key) if `AzureWebJobsStorage` is not set.

## Usage

### Input parameters

The parameters you use depend on the hosting plan your app is on. For example, the Flex Consumption plan uses different parameters than the other plans to enable a [remote build](https://learn.microsoft.com/azure/azure-functions/functions-deployment-technologies#remote-build). If you intend to deploy to the [Container Apps](https://learn.microsoft.com/azure/azure-functions/functions-container-apps-hosting) plan, please use [`functions-container-action`](https://github.com/Azure/functions-container-action) instead.

Required parameters for all function app plans:

- **app-name**: The function app name on Azure (e.g. if your app's homepage is https://your-site-name.azurewebsites.net/, then **app-name** should be `your-site-name`).
- **package**: This is the location in your project to be published. By default, this value is set to `.`, which means all files and folders in the GitHub repository will be deployed.

Parameters specific to the [Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan) plan:

- **sku**: Set this to `flexconsumption` when authenticating with **publish-profile**. When using RBAC credentials or deploying to a non-Flex Consumption plan, the Action can resolve the value, so the parameter does not need to be included.
- **remote-build**: Set this to `true` to enable a build action from Kudu when the package is deployed to a Flex Consumption app. Oryx build is always performed during a remote build in Flex Consumption; do not set **scm-do-build-during-deployment** or **enable-oryx-build**.
By default, this parameter is set to `false`.

Parameters specific to the [Consumption](https://learn.microsoft.com/azure/azure-functions/consumption-plan), [Elastic Premium](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan), and [App Service (Dedicated)](https://learn.microsoft.com/azure/azure-functions/dedicated-plan) plans:

- **scm-do-build-during-deployment**: Allow the Kudu site (e.g. https://your-site-name.scm.azurewebsites.net/) to perform pre-deployment operations. By default, this is set to `false`. If you don't want to resolve the dependencies in the GitHub Workflow, and instead, you want to control the deployments in Kudu / KuduLite, you may want to change this setting to `true`. For more information on SCM_DO_BUILD_DURING_DEPLOYMENT setting, please visit our [Kudu doc](https://github.com/projectkudu/kudu/wiki/Configurable-settings#enabledisable-build-actions).
- **enable-oryx-build**: Allow Kudu site to resolve your project dependencies with [Oryx](https://github.com/Microsoft/Oryx). By default, this is set to `false`. If you want to use Oryx to resolve your dependencies (e.g. [remote build](https://docs.microsoft.com/en-us/azure/azure-functions/functions-deployment-technologies#remote-build)) instead of the GitHub Workflow, set **scm-do-build-during-deployment** and **enable-oryx-build** to `true`.

Optional parameters for all function app plans:

- **slot-name**: This is the slot name to be deployed to. By default, this value is empty, which means the GitHub Action will deploy to your production site. When this setting points to a non-production slot, please ensure the **publish-profile** parameter contains the credentials for the slot instead of the production site. *Currently not supported in Flex Consumption*.
- **publish-profile**: The credentials that will be used during the deployment. It should contain a piece of XML content from your .PublishSettings file. You can acquire .PublishSettings by visiting the Azure Portal -> Your Function App -> Overview -> Get Publish Profile. We highly recommend setting the content in GitHub secrets since it contains sensitive information such as your site URL, username, and password. When the publish profile is rotated in your function app, you also need to update the GitHub secret. Otherwise, a 401 error will occur when accessing the /api/settings endpoint.
- **respect-pom-xml**: Allow the GitHub Action to derive the Java function app's artifact from pom.xml for deployments. By default, it is set to `false`, which means the **package** parameter needs to point to your Java function app's artifact (e.g. ./target/azure-functions/<function-app-name>). It is recommended to set **package** to `.` and **respect-pom-xml** to `true` when deploying Java function apps.
- **respect-funcignore**:  Allow the GitHub Action to parse your .funcignore file and exclude files and folders defined in it. By default, this value is set to `false`. If your GitHub repo contains .funcignore file and you want to exclude certain paths (e.g. text editor configs .vscode/, Python virtual environment .venv/), we recommend setting this to `true`.

## Dependencies on other GitHub Actions

- [Checkout](https://github.com/actions/checkout) Checkout your Git repository content into GitHub Actions agent.
- [Azure Login](https://github.com/Azure/login) Login with your Azure credentials when authenticating with OIDC or service principal.
- Environment setup actions:
  - [Setup DotNet](https://github.com/actions/setup-dotnet) Build your DotNet core function app or function app extensions.
  - [Setup Node](https://github.com/actions/setup-node) Resolve Node function app dependencies using npm.
  - [Setup Python](https://github.com/actions/setup-python) Resolve Python function app dependencies using pip.
  - [Setup Java](https://github.com/actions/setup-java) Resolve Java function app dependencies using maven.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
