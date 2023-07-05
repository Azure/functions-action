import * as core from '@actions/core';
import { BlobServiceClient, ContainerClient, BlockBlobClient, BlobSASPermissions, BlobGenerateSasUrlOptions } from '@azure/storage-blob';
import { generateBlobSASQueryParameters, StorageSharedKeyCredential, SASQueryParameters, BlobSASSignatureValues, SASProtocol } from '@azure/storage-blob';
import { StorageManagementClient, StorageAccountListKeysResult } from '@azure/arm-storage';
import { DefaultAzureCredential } from '@azure/identity';

import { AzureResourceError } from '../exceptions';
import { Logger, Sleeper } from '../utils';
import { AzureAppService } from '../appservice-rest/Arm/azure-app-service';
import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from '../interfaces/IActionContext';
import { StateConstant } from '../constants/state';

export class WebsiteRunFromPackageDeploy {
    public static async execute(state: StateConstant, context: IActionContext) {
        let blobServiceClient: BlobServiceClient;

        if (context.appSettings.AzureWebJobsStorage) {
            Logger.Info("Using AzureWebJobsStorage for Blob access.");
            blobServiceClient = BlobServiceClient.fromConnectionString(context.appSettings.AzureWebJobsStorage);
        } else {
            Logger.Info("Using AzureWebJobsStorage__accountName and RBAC for Blob access.");
            blobServiceClient = new BlobServiceClient(
                `https://${context.appSettings.AzureWebJobsStorage__accountName}.blob.core.windows.net`,
                new DefaultAzureCredential()
            );
        }
        const containerClient: ContainerClient = blobServiceClient.getContainerClient(ConfigurationConstant.BlobContainerName);
        await containerClient.createIfNotExists();
        const blobName: string = this.createBlobName();
        let blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadFile(context.publishContentPath);

        const packageUrl: string = blockBlobClient.url;
        core.setOutput(ConfigurationConstant.ParamOutPackageUrl, packageUrl);
        let bobUrl: string;
        if (context.appSettings.WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID) {
            Logger.Info("Package Url will use RBAC.");
            bobUrl = packageUrl;
        } else {
            Logger.Info("Package Url will use SAS.");
            if (context.appSettings.AzureWebJobsStorage) {
                bobUrl = await this.getBlobSasUrl(blockBlobClient);
            } else {
                const sasParams: string = await this.getBlobSasParams(blobServiceClient.accountName, blobName, containerClient.containerName, context);
                //bobUrl = `${packageUrl}?${sasParams}`;
                bobUrl = packageUrl;
            }
        }
        await this.publishToFunctionapp(state, context.appService, bobUrl);
    }

    private static createBlobName(): string {
        const now: Date = new Date();
        const time: string = `${now.getUTCFullYear()}${now.getUTCMonth() + 1}${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}${now.getUTCSeconds()}`;
        return `${ConfigurationConstant.BlobNamePrefix}_${time}.zip`;
    }

    private static async getBlobSasUrl(client: BlockBlobClient): Promise<string> {
        const now: Date = new Date();
        const startTime: Date = new Date();
        startTime.setMinutes(now.getMinutes() - 5);
        const expiryTime: Date = new Date();
        expiryTime.setFullYear(now.getFullYear() + 1);
        const options: BlobGenerateSasUrlOptions = {
            permissions: BlobSASPermissions.parse("r"),
            startsOn: startTime,
            expiresOn: expiryTime
        };

        return client.generateSasUrl(options);
    }

    private static async getBlobSasParams(accountName: string, blobName: string, containerName: string, context: IActionContext): Promise<string> {
        Logger.Info("Looking up storage account Keys");

        const storageClient: StorageManagementClient = new StorageManagementClient(new DefaultAzureCredential(), context.endpoint.subscriptionID);
        const keys: StorageAccountListKeysResult = await storageClient.storageAccounts.listKeys(context.resourceGroupName, accountName);
        const key = keys.keys?.[0].value;

        const now: Date = new Date();
        const startTime: Date = new Date();
        startTime.setMinutes(now.getMinutes() - 5);
        const expiryTime: Date = new Date();
        expiryTime.setFullYear(now.getFullYear() + 1);

        const sasOptions: BlobSASSignatureValues = {
            blobName,
            containerName,
            permissions: BlobSASPermissions.parse("r"),
            protocol: SASProtocol.Https,
            startsOn: startTime,
            expiresOn: expiryTime
        };
        const sasParams: SASQueryParameters = generateBlobSASQueryParameters(sasOptions, new StorageSharedKeyCredential(accountName, key));
        return sasParams.toString();
    }

    private static async publishToFunctionapp(state: StateConstant,
        appService: AzureAppService, blobSasUrl: string) {
        try {
            await appService.patchApplicationSettings({ 'WEBSITE_RUN_FROM_PACKAGE': blobSasUrl });
        } catch (expt) {
            throw new AzureResourceError(state, "Patch Application Settings", "Failed to set WEBSITE_RUN_FROM_PACKAGE with storage blob link." +
                ` Please check if the ${blobSasUrl} does exist.`);
        }

        try {
            // wait 30 second before calling sync trigger
            const retryInterval: number = 30000;

            Logger.Info("##[debug]Starting 30 seconds wait time.");
            await Sleeper.timeout(retryInterval);
            Logger.Info("##[debug]Finished wait time.");

            await appService.syncFunctionTriggersViaHostruntime();
            Logger.Info("Sync Trigger call was successful.");
        } catch (expt) {
            throw new AzureResourceError(state, "Sync Trigger Functionapp", "Failed to perform sync trigger on function app." +
                " Function app may have malformed content. Please manually restart your function app and" +
                " inspect the package from WEBSITE_RUN_FROM_PACKAGE.");
        }
    }
}
