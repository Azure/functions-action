# Alternate authentication methods

This document covers authentication methods other than OpenID Connect (OIDC) for the [Azure Functions GitHub Action](../README.md). **OIDC is the recommended method** — see [Use OIDC](../README.md#use-oidc-recommended) in the main README.

The methods documented here are kept for users who cannot adopt OIDC. They store long-lived secrets and are less secure.

- [Azure service principal](#azure-service-principal)
- [Publish profile](#publish-profile)

## Azure service principal

You can alternatively use a service principal, which requires you to manage secrets. You must configure the workflow with these secrets, and then it can use them to authenticate with Azure.

> [!IMPORTANT]  
> When possible, you should [use OIDC for authentication](../README.md#use-oidc-recommended) instead of service principal-based authentication.

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
          uses: azure/login@v3
          with:
            cred-id: ${{ secrets.AZURE_RBAC_CREDENTIALS }}
          
        - name: 'Run the Azure Functions action'
          uses: Azure/functions-action@v1
          id: deploy-to-function-app
          with:
            app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
            package: '${{ env.AZURE_FUNCTIONAPP_PROJECT_PATH }}'   
```

## Publish profile

A publish profile contains plain-text secrets that authenticate with your function app using basic authentication with the `scm` HTTP endpoint.

> [!WARNING]  
> Publish profile authentication uses a shared secret which you must manage. It also requires you to enable publishing credential access to the app, which is off by default and is not recommended. You should instead use a more secure option like [OIDC authentication](../README.md#use-oidc-recommended).

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
    # Deploy to an app on the Flex Consumption plan using a publish profile as authentication
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
