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

The Azure Functions action is used in a [GitHub Actions workflow](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions) to deploy packaged project code to an existing [function app](https://azure.microsoft.com/services/functions/) hosted in Azure. Using this action, you can create continuous workflow automation that builds, authenticates, and deploys code to your function app when you make changes in the GitHub repository.

The Azure Functions action is defined in this [action.yml](https://github.com/Azure/functions-action/blob/master/action.yml) file. To learn about specific parameters, see the [Reference section](#parameter-reference) in this readme.

> [!IMPORTANT]
> If you're looking for a GitHub Action to deploy your customized container image to Azure Functions, instead use [functions-container-action](https://github.com/Azure/functions-container-action).

## Getting started

You can create a workflow for your function app deployments in one of these ways:

+ [**Workflow templates**](#workflow-templates): choose a workflow template that matches your function app's code language, operating system, and hosting plan. Add this workflow (.yaml) file to the `.github/workflows/` folder of the repository that contains your project code.

+ [**Azure portal**](https://portal.azure.com): you can create a workflow (.yaml) file directly in your repository from your app's **Deployment center** page in the portal by following the detailed instructions in [Continuous delivery by using GitHub Actions](https://learn.microsoft.com/azure/azure-functions/functions-how-to-github-actions?pivots=method-portal).

### Workflow templates

| Templates  | Windows |  Linux |
|------------|---------|--------|
| .NET (C#)     | [windows-dotnet-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-dotnet-functionapp-on-azure.yml) | [linux-dotnet-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-dotnet-functionapp-on-azure.yml) |
| Node       | [windows-node.js-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-node.js-functionapp-on-azure.yml) | [linux-node.js-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-node.js-functionapp-on-azure.yml) |
| PowerShell | [windows-powershell-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-powershell-functionapp-on-azure.yml) | [linux-powershell-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/blob/master/FunctionApp/linux-powershell-functionapp-on-azure.yml) |
| Java       | [windows-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/windows-java-functionapp-on-azure.yml) | [linux-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-java-functionapp-on-azure.yml) |
| Python     | Not supported | [linux-python-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp/linux-python-functionapp-on-azure.yml) |

## Workflow template considerations

Keep these considerations in mind when working with the `azure-functions` action in your workflows:

+ These sample templates require updates when deploying apps that run in a [Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan) plan. For more information, see [GitHub Action parameters](#parameter-reference).

+ When using run-from-package deployment, apps can use external storage on a blob container, which is specified using the app setting `WEBSITE_RUN_FROM_PACKAGE=<URL>`. In this case, the `<URL>` points to the external blob storage container. This is the default deployment for apps running on Linux in a Consumption plan. To protect the deployment package, the container should require private access. Managed identities are recommended, but shared access signature (SAS) tokens can also be used. There are specific app settings required when using managed identities to access the deployment container. For more information, see [Fetch a package from Azure Blob Storage using a managed identity](https://learn.microsoft.com/en-us/azure/azure-functions/run-functions-from-deployment-package#fetch-a-package-from-azure-blob-storage-using-a-managed-identity).  

+ If you have a non-.NET project that includes an explicit binding reference (extensions.csproj), the Functions Action ignores this file and doesn't build the extensions project. For more information, see [Binding extensions projects](#binding-extensions-projects).

+ The _remove additional files at destination_ functionality provided by a `scm` (Kudu) deployment isn't supported by the deployment method used in this action. When you use [zip deploy](https://learn.microsoft.com/azure/azure-functions/functions-deployment-technologies#zip-deploy) or [one deploy for Flex Consumption plans](https://learn.microsoft.com/azure/azure-functions/functions-deployment-technologies#one-deploy), all files from a previous deployment are removed or are updated with the latest files from the deployment package. Any other files and directories outside of the deployment, such as added using FTP or created by your app during runtime, are preserved. If you're using `scm` with a package deployment, you must handle the removal of previously deployed files outside of the Functions action.

## Supported Languages and versions

+ [Language versions supported in each runtime version](https://docs.microsoft.com/en-us/azure/azure-functions/supported-languages#languages-by-runtime-version)
+ [Languages supported in each OS](https://docs.microsoft.com/en-us/azure/azure-functions/supported-languages#language-support-details)

## Authentication methods

You must choose how the action authenticates with Azure when deploying code from GitHub to your function app. There are three supported authentication methods:

| Method| Description |
| ---- | ---- |
| [OpenID Connect (OIDC)](#use-oidc-recommended) | **Recommended**. This is the most secure authentication option. Supports role-based access control (RBAC) for accessing Azure resources. Leverages user-assigned managed identities, which means that secrets are managed by Azure. |
| [Azure service principal](#use-an-azure-service-principal-not-recommeded) | **Not recommended**. GitHub uses service principal credentials to access Azure resources using RBAC. You must manage the service principal secrets in GitHub. |  
| [Publish profile](#use-a-publish-profile-not-recommended) | **Not recommended**. Credentials (username and password) are stored in GitHub and used to access the `scm` endpoint using HTTP basic authentication during deployment. This will require you to enable basic authentication for your app. |

These are special considerations for certain hosting scenarios:

+ When your app is hosted in a sovereign cloud or on Azure Stack Hub, make sure to include the relevant `environment` and `audience` parameters for the `azure/login` action when using OIDC or service principal authentication.
+ Publish profile as an authentication method is not supported when your app is hosted on Linux in a Consumption plan and the project contains an executable file, such as a custom handler, or `chrome` in [Puppeteer](https://github.com/puppeteer/puppeteer)/[Playwright](https://github.com/microsoft/playwright).
+ OIDC authentication uses [Workload identity federation](https://learn.microsoft.com/entra/workload-id/workload-identity-federation) in Azure, which only supports user-assigned managed identities.  

### Use OIDC (recommended)

When using [Open ID Connect (OIDC)](https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers) for authentication, you configure a user-assigned managed identity in Azure to allow your GitHub to use this identity from the context of your workflow. The workflow can then authenticate with Azure without the need for credentials. You must also grant the managed identity permissions to deploy to your function app, which is done using a role assignment.

> [!TIP]  
> This method is the most secure and recommended for those with permissions to configure identity.

To configure your workflow to use OIDC authentication:

1. [Create an Azure user-assigned managed identity](https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/how-manage-user-assigned-managed-identities#create-a-user-assigned-managed-identity).

1. Copy down the values for Client ID, Subscription ID, and Directory (tenant) ID for the new user-assigned managed identity resource.

1. [Assign the role](https://learn.microsoft.com/azure/role-based-access-control/role-assignments-portal) [`Website Contributor`](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/web-and-mobile#website-contributor) to your user-assigned managed identity, scoped to the function app you want to deploy to.

1. [Create a federated credential](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity#configure-a-federated-identity-credential-on-a-user-assigned-managed-identity) with the following settings:  

    + Federated credential scenario: `Configure a GitHub issued token to impersonate this application and deploy to Azure`
    + Organization: `<GITHUB_ORGANIZATION>`
    + Repository: `<REPO_CONTAINING_FUNCTIONS_PROJECT>`
    + Entity type: `Branch`
    + Branch: `<BRANCH_NAME>`

    Replace these placeholders with the information for your GitHub repository.

> [!TIP]
> The `Entity` in the OIDC definition is what triggers the workflow to fetch the OIDC token. Our samples assume you want to trigger the workflow on pushes to `main`. To use a different trigger, see our [entity type examples](https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity#entity-type-examples).

1. [Create these variables in your repository](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#defining-configuration-variables-for-multiple-workflows) using the values you recorded in step 2:  

    + AZURE_CLIENT_ID: `<CLIENT_ID>`
    + AZURE_TENANT_ID: `<DIRECTORY_TENANT_ID>`
    + AZURE_SUBSCRIPTION_ID: `<SUBSCRIPTION_ID>`

1. In the job containing the `checkout` action (in our samples, the `build` job), add the following permissions:  

    + `id-token: write`
    + `contents: read`

> [!NOTE]
> `id-token: write` is required for GitHub's OIDC provider to fetch an OIDC token. `contents: read` is required to checkout a private repo. [Learn more about OIDC permissions](https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-permissions-settings).

1. Add an `azure/login` action in the step before your Azure Functions action. The new action must have these parameters, which map to the new variables you just added to your repository:

    + `client-id`: ${{ vars.AZURE_CLIENT_ID }}
    + `tenant-id`: ${{ vars.AZURE_TENANT_ID }}
    + `subscription-id`: ${{ vars.AZURE_SUBSCRIPTION_ID }}

1. In the job containing the Azure Functions action (in our samples, the `deploy` job) add the `id-token: write` permission.

When using OIDC authentication, the `jobs` section of your workflow looks something like this:

```yml
# Deploy to an app on the Flex Consumption plan using OIDC authentication
jobs:
    build:
      runs-on: ubuntu-latest
      permissions:
          id-token: write # Required for OIDC
          contents: read # Required for actions/checkout
      steps: 
        # ...checkout your repository
        # ...required build steps for your language
        # ...upload your build artifact
    
    deploy:
      runs-on: ubuntu-latest
      needs: build
      permissions:
          id-token: write # Required for OIDC
      steps:
        # ...download your build artifact

        - name: 'Log in to Azure with AZ CLI'
          uses: azure/login@v2
          with:
            client-id: ${{ vars.AZURE_CLIENT_ID }} # Required to log in with OIDC
            tenant-id: ${{ vars.AZURE_TENANT_ID }} # Required to log in with OIDC
            subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }} # Required to log in with OIDC
          
        - name: 'Run the Azure Functions action'
          uses: Azure/functions-action@v1
          id: deploy-to-function-app
          with:
            app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
            package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'   
```

### Use an Azure service principal (not recommeded)

You can alternatively use a service principal, which requires you to manage secrets. You must configure the workflow with these secrets, and then it can use them to authenticate with Azure.

> [!IMPORTANT]  
> When possible, you should [use OIDC for authentication](#use-oidc-recommended) instead of service principal-based authentication.

To configure your workflow to use a service principal for authentication:

1. If you don't already have it installed, [download Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) and run `az login` to sign in with your Azure credentials.

1. Run this Azure CLI command:

    ```azurecli
    az ad sp create-for-rbac --name "myApp" --role "Website Contributor" \
                            --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.Web/sites/<APP_NAME> \
                            --json-auth
    ```

    In this example, Replace `<SUBSCRIPTION_ID>`, `<RESOURCE_GROUP>`, and `<APP_NAME>` with the names of your subscription, resource group, and Azure function app. The command should return JSON output like this:

    ```json
    {
      "clientId": "<GUID>",
      "clientSecret": "<GUID>",
      "subscriptionId": "<GUID>",
      "tenantId": "<GUID>",
      (...)
    }
    ```

1. Copy this JSON response output, which is the credential you provide to GitHub for authentication.

> [!WARNING]  
> Keep this credential safe. It provides `Website Contributor` role access to your function app.

1. In your GitHub Repository, select **Settings** > **Secrets** > **Add a new secret**, name the secret something like `AZURE_RBAC_CREDENTIALS`, and paste in JSON credentials of the service principal.

1. Add the `azure/login` action as a step prior to the Azure Functions action:

    + Make sure to include the parameter `cred-id`, which maps to your recently created repository secret `AZURE_RBAC_CREDENTIALS`.
    + Make sure you don't also have any publish profiles in your workflow, which would be in the `publish-profile` parameter of the Azure Functions action.

When you use a service principal with RBAC, the `jobs` section of your workflow looks something like this:

```yml
# Deploy to an app on the Flex Consumption plan using a service principal with RBAC as authentication
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
          
        - name: 'Run the Azure Functions action'
          uses: Azure/functions-action@v1
          id: deploy-to-function-app
          with:
            app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
            package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'   
```

### Use a publish profile (not recommended)

A publish profile contains plain-text secrets that authenticate with your function app using basic authentication with the `scm` HTTP endpoint.

> [!WARNING]  
> Publish profile authentication uses a shared secret which you must manage. It also requires you to enable publishing credential access to the app, which is off by default and is not recommended. You should instead use a more secure option like [OIDC authentication](#use-oidc-recommended).

To configure your workflow using the publish profile:

1. In the [Azure portal](https://portal.azure.com), locate your function app.

1. Make sure that **Basic authentication** is enabled in the `scm` endpoint in your app under **Settings** > **Configuration** > **SCM Basic Auth Publishing Credentials**.

1. In the **Overview** blade, select **Get publish profile** and download the **.PublishSettings** file, which contains the plain-text publishing credentials for your `scm` endpoint.

1. Open the **.PublishSettings** file and copy the XML file contents. Delete or secure this secrets file when you're done.

1. In your GitHub Repository, select **Settings** > **Secrets** > **Add a new secret**, name the secret **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**, and paste in the XML profile file contents.

1. Make sure that your workflow isn't using the `azure/login` action.

1. Include the `publish-profile` parameter in the Azure Functions action, referencing the **AZURE_FUNCTIONAPP_PUBLISH_PROFILE** secret.

    When using a publish profile, the `jobs` section of your workflow looks something like this:

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
    
            - name: 'Run the Azure Functions action'
              uses: Azure/functions-action@v1
              id: deploy-to-function-app
              with:
                app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
                package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'
                sku: `flexconsumption`    # Parameter required when using a publish profile with Flex Consumption
                publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
    ```

## Parameter reference

This section describes the input parameters supported by the Azure Functions action. The parameters you use depends how your function app is hosted on Azure.  For example, the Flex Consumption plan uses different parameters than the other plans to enable a [remote build](https://learn.microsoft.com/azure/azure-functions/functions-deployment-technologies#remote-build). If you intend to deploy to the [Container Apps](https://learn.microsoft.com/azure/azure-functions/functions-container-apps-hosting) plan, use [`functions-container-action`](https://github.com/Azure/functions-container-action) instead.

Parameters required on all [hosting plans](https://learn.microsoft.com/azure/azure-functions/functions-scale):

| Parameter | Description |
| ---- | ---- |
| **app-name** | The function app name on Azure. For example, when your app's site URL is `https://your-site-name.azurewebsites.net/`, then `app-name` is `your-site-name`. |
| **package** | This is the path to your project in the repo being published. By default, this value is set to `.`, which means all files and folders in the GitHub repository are deployed. |

Parameters used with the [Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan) plan:

| Parameter | Description |
| ---- | ---- |
| **sku** | Required only when authenticating a Flex Consumption plan app deployment using `publish-profile`. In this case, you must set `sku` to `flexconsumption`. When publishing to a Flex Consumption plan app using OIDC or service principle authentication with RBAC credentials, the action can resolve the value. Other plans also don't require this parameter. |
| **remote-build** | When set to `true`, enables a build action in the `scm` (Kudu) site. By default, this parameter is set to `false`. For a Flex Consumption plan app, an Oryx build is always performed during a remote build in Flex Consumption; don't set **scm-do-build-during-deployment** or **enable-oryx-build**.  |

Parameters used with the [Consumption](https://learn.microsoft.com/azure/azure-functions/consumption-plan), [Elastic Premium](https://learn.microsoft.com/azure/azure-functions/functions-premium-plan), and [App Service (Dedicated)](https://learn.microsoft.com/azure/azure-functions/dedicated-plan) plans:

| Parameter | Description |
| ---- | ---- |
| **scm-do-build-during-deployment** | Requests the `scm` (Kudu) site to perform predeployment operations, such as `npm install` or `dotnet build`/`dotnet publish`. This is equivalent to using the [`SCM_DO_BUILD_DURING_DEPLOYMENT`](https://learn.microsoft.com/azure/azure-functions/functions-app-settings#scm_do_build_during_deployment) app setting. A remote build isn't required for package-based deployments, so this is set to `false` by default. If for some reason you don't want to use a deployment package and instead need to use Kudu or KuduLite, set this to `true` to have Kudu build your project during deployment. For more information, see [remote build](https://docs.microsoft.com/en-us/azure/azure-functions/functions-deployment-technologies#remote-build). |  
| **enable-oryx-build** | Requests that a remote `scm` (Kudu) build be done using the [Oryx build system](https://github.com/Microsoft/Oryx). By default, this is set to `false`. To have Oryx to resolve your dependencies and build your project instead of the workflow, set both `scm-do-build-during-deployment` and `enable-oryx-build` to `true`. Only supported for Linux function apps.|

Optional parameters for all hosting plans:

| Parameter | Description |
| ---- | ---- |
| **slot-name** | Specifies a named slot as the deployment target. By default, this value isn't set, which means the action deploys to your production slot. When this setting resolves to a named slot, make sure that `publish-profile` also contains the credentials for the target slot instead of the production slot. Currently not supported in a Flex Consumption plan. |
| **publish-profile** | The plain-text credentials used to access the `scm` endpoint using HTTP basic authentication during deployment. This must contain the XML contents of your `.PublishSettings` file. To use this authentication method, see [Publish profile (HTTP basic) authentication](#use-a-publish-profile-not-recommended). We highly recommend setting the content in GitHub secrets since it contains sensitive information such as your site URL, username, and password. When the publish profile is rotated in your function app, you also need to update the GitHub secret. Otherwise, a 401 error occurs when accessing the /api/settings endpoint. |
| **respect-pom-xml** | Allow the GitHub Action to derive the Java function app's artifact from pom.xml for deployments. By default, it's set to `false`, which means the **package** parameter needs to point to your Java function app's artifact, such as `./target/azure-functions/<FUNCTION_APP_NAME>`. It's recommended to set **package** to `.` and **respect-pom-xml** to `true` when deploying Java function apps. |
| **respect-funcignore** | Allow the GitHub Action to parse your .funcignore file and exclude files and folders defined in it. By default, this value is set to `false`. If your GitHub repo contains .funcignore file and you want to exclude certain paths (for example, text editor configs .vscode/, Python virtual environment .venv/), we recommend setting this to `true`. |

## Special scenarios

### Binding extensions projects

By default, non-.NET projects use [extension bundles](https://learn.microsoft.com/azure/azure-functions/functions-bindings-register#extension-bundles) to include the .NET NuGet packages potentially required by binding extensions in your app.  

In some cases, such as when using a prerelease or specific version of an extension, you're required to [explicitly install extensions](https://learn.microsoft.com/azure/azure-functions/functions-bindings-register#explicitly-install-extensions), which is done in an extensions.csproj file in the root folder. The Functions Action doesn't build the extension.csproj file.

If you can't convert to using extension bundles, you must instead include these steps before the `function-action` step in your workflow to build the extensions project:

```yaml
# Adding DOTNET_VERSION to your workflow's environment variables is recommeded
...
- name: 'Set up .NET version: ${{ env.DOTNET_VERSION }}'
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: ${{ env.DOTNET_VERSION }}

- name: 'Build the extensions project' 
  run: dotnet build --output ./bin
```

## Dependencies on other GitHub Actions

The Azure Functions action itself has no dependencies. However, you might need the following actions when constructing an end-to-end GitHub workflow similar to our samples.

+ [Checkout](https://github.com/actions/checkout): Check out your Git repository content into GitHub Actions agent.
+ [Azure Login](https://github.com/Azure/login): Sign in with your Azure credentials when authenticating with OIDC or service principal.
+ Environment setup actions:
  + [Setup DotNet](https://github.com/actions/setup-dotnet): Build your DotNet core function app or function app extensions.
  + [Setup Node](https://github.com/actions/setup-node): Resolve Node function app dependencies using npm.
  + [Setup Python](https://github.com/actions/setup-python): Resolve Python function app dependencies using pip.
  + [Setup Java](https://github.com/actions/setup-java): Resolve Java function app dependencies using maven.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (for example, status check, comment). Follow the instructions
provided by the bot. You'll only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any other questions or comments.
