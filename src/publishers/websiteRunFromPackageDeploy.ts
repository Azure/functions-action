import { Aborter, ContainerURL, IBlobSASSignatureValues, ServiceURL, SharedKeyCredential, StorageURL } from '@azure/storage-blob';
import { AzureResourceError, ValidationError } from '../exceptions';
import { BlobURL, BlockBlobURL, Pipeline, generateBlobSASQueryParameters, uploadFileToBlockBlob } from '@azure/storage-blob';
import { Client, Logger, Parser, Sleeper } from '../utils';

import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from '../interfaces/IActionContext';
import { IStorageAccount } from '../interfaces/IStorageAccount';
import { StateConstant } from '../constants/state';

export class WebsiteRunFromPackageDeploy {
    public static async execute(state: StateConstant, context: IActionContext) {
        const storage: IStorageAccount = await this.getStorageCredential(state, context.appSettings.AzureWebJobsStorage);
        const blobServiceCredential: SharedKeyCredential = new SharedKeyCredential(storage.AccountName, storage.AccountKey);
        const blobServicePipeline: Pipeline = StorageURL.newPipeline(blobServiceCredential, {
            retryOptions: {
                maxTries: 3
            }
        });
        const blobServiceUrl: ServiceURL = new ServiceURL(
            `https://${storage.AccountName}.blob.core.windows.net`,
            blobServicePipeline
        );
        const containerUrl: ContainerURL = await this.createBlobContainerIfNotExists(state, blobServiceUrl);
        const blobName: string = this.createBlobName();
        const blobUrl: BlobURL = await this.uploadBlobFromFile(state, containerUrl, blobName, context.publishContentPath);
        const blobSasParams: string = this.getBlobSasQueryParams(blobName, blobServiceCredential);
        await this.publishToFunctionapp(state, context.appService, `${blobUrl.url}?${blobSasParams}`);
    }

    private static async getStorageCredential(state: StateConstant, storageString: string): Promise<IStorageAccount> {
        let storageData: IStorageAccount;
        let dictionary: { [key: string]: string };
        try {
            dictionary = Parser.GetAzureWebjobsStorage(storageString);
        } catch (expt) {
            throw new ValidationError(state, 'AzureWebjobsStorage', 'Failed to convert by semicolon delimeter', expt);
        }

        storageData = {
            AccountKey: dictionary["AccountKey"],
            AccountName: dictionary["AccountName"]
        };

        if (!storageData.AccountKey || !storageData.AccountName) {
            throw new ValidationError(state, 'AzureWebjobsStorage', 'Failed to fetch AccountKey or AccountName');
        }

        return storageData;
    }

    private static async createBlobContainerIfNotExists(state: StateConstant, blobServiceUrl: ServiceURL): Promise<ContainerURL> {
        const containerName: string = ConfigurationConstant.BlobContainerName;
        const containerURL = ContainerURL.fromServiceURL(blobServiceUrl, containerName);
        try {
            await containerURL.create(Aborter.timeout(ConfigurationConstant.BlobServiceTimeoutMs));
        } catch (expt) {
            if (expt instanceof Error && expt.message.indexOf('ContainerAlreadyExists') >= 0) {
                return containerURL;
            }
            throw new AzureResourceError(state, "Create Blob Container", `Failed to create container ${containerName}`, expt);
        }
        return containerURL;
    }

    private static createBlobName(): string {
        const now: Date = new Date();
        const time: string = `${now.getUTCFullYear()}${now.getUTCMonth() + 1}${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}${now.getUTCSeconds()}`;
        return `${ConfigurationConstant.BlobNamePrefix}_${time}.zip`;
    }

    private static async uploadBlobFromFile(state: StateConstant, containerUrl: ContainerURL, blobName:string, filePath: string): Promise<BlobURL> {
        // Upload blob to storage account
        const blobURL: BlobURL = BlobURL.fromContainerURL(containerUrl, blobName);
        const blockBlobURL: BlockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
        try {
            uploadFileToBlockBlob(Aborter.timeout(ConfigurationConstant.BlobUploadTimeoutMs), filePath, blockBlobURL, {
                blockSize: ConfigurationConstant.BlobUploadBlockSizeByte,
                parallelism: ConfigurationConstant.BlobUplaodBlockParallel,
            });
        } catch (expt) {
            throw new AzureResourceError(state, "Upload File to Blob", `Failed when uploading ${filePath}`, expt);
        }
        return blockBlobURL;
    }

    private static getBlobSasQueryParams(blobName: string, credential: SharedKeyCredential): string {
        const now: Date = new Date();
        const startTime: Date = new Date();
        startTime.setMinutes(now.getMinutes() - 5);
        const expiryTime: Date = new Date();
        expiryTime.setFullYear(now.getFullYear() + 1);

        const blobSasValues: IBlobSASSignatureValues = {
            blobName: blobName,
            containerName: ConfigurationConstant.BlobContainerName,
            startTime: startTime,
            expiryTime: expiryTime,
            permissions: ConfigurationConstant.BlobPermission
        }
        return generateBlobSASQueryParameters(blobSasValues, credential).toString();
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
