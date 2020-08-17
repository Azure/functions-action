"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_blob_1 = require("@azure/storage-blob");
const exceptions_1 = require("../exceptions");
const storage_blob_2 = require("@azure/storage-blob");
const utils_1 = require("../utils");
const configuration_1 = require("../constants/configuration");
class WebsiteRunFromPackageDeploy {
    static execute(state, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const storage = yield this.getStorageCredential(state, context.appSettings.AzureWebJobsStorage);
            const blobServiceCredential = new storage_blob_1.SharedKeyCredential(storage.AccountName, storage.AccountKey);
            const blobServicePipeline = storage_blob_1.StorageURL.newPipeline(blobServiceCredential, {
                retryOptions: {
                    maxTries: 3
                }
            });
            const blobServiceUrl = new storage_blob_1.ServiceURL(`https://${storage.AccountName}.blob.core.windows.net`, blobServicePipeline);
            const containerUrl = yield this.createBlobContainerIfNotExists(state, blobServiceUrl);
            const blobName = this.createBlobName();
            const blobUrl = yield this.uploadBlobFromFile(state, containerUrl, blobName, context.publishContentPath);
            const blobSasParams = this.getBlobSasQueryParams(blobName, blobServiceCredential);
            yield this.publishToFunctionapp(state, context.appService, `${blobUrl.url}?${blobSasParams}`);
        });
    }
    static getStorageCredential(state, storageString) {
        return __awaiter(this, void 0, void 0, function* () {
            let storageData;
            let dictionary;
            try {
                dictionary = utils_1.Parser.GetAzureWebjobsStorage(storageString);
            }
            catch (expt) {
                throw new exceptions_1.ValidationError(state, 'AzureWebjobsStorage', 'Failed to convert by semicolon delimeter', expt);
            }
            storageData = {
                AccountKey: dictionary["AccountKey"],
                AccountName: dictionary["AccountName"]
            };
            if (!storageData.AccountKey || !storageData.AccountName) {
                throw new exceptions_1.ValidationError(state, 'AzureWebjobsStorage', 'Failed to fetch AccountKey or AccountName');
            }
            return storageData;
        });
    }
    static createBlobContainerIfNotExists(state, blobServiceUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const containerName = configuration_1.ConfigurationConstant.BlobContainerName;
            const containerURL = storage_blob_1.ContainerURL.fromServiceURL(blobServiceUrl, containerName);
            try {
                yield containerURL.create(storage_blob_1.Aborter.timeout(configuration_1.ConfigurationConstant.BlobServiceTimeoutMs));
            }
            catch (expt) {
                if (expt instanceof Error && expt.message.indexOf('ContainerAlreadyExists') >= 0) {
                    return containerURL;
                }
                throw new exceptions_1.AzureResourceError(state, "Create Blob Container", `Failed to create container ${containerName}`, expt);
            }
            return containerURL;
        });
    }
    static createBlobName() {
        const now = new Date();
        const time = `${now.getUTCFullYear()}${now.getUTCMonth() + 1}${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}${now.getUTCSeconds()}`;
        return `${configuration_1.ConfigurationConstant.BlobNamePrefix}_${time}.zip`;
    }
    static uploadBlobFromFile(state, containerUrl, blobName, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Upload blob to storage account
            const blobURL = storage_blob_2.BlobURL.fromContainerURL(containerUrl, blobName);
            const blockBlobURL = storage_blob_2.BlockBlobURL.fromBlobURL(blobURL);
            try {
                storage_blob_2.uploadFileToBlockBlob(storage_blob_1.Aborter.timeout(configuration_1.ConfigurationConstant.BlobUploadTimeoutMs), filePath, blockBlobURL, {
                    blockSize: configuration_1.ConfigurationConstant.BlobUploadBlockSizeByte,
                    parallelism: configuration_1.ConfigurationConstant.BlobUplaodBlockParallel,
                });
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "Upload File to Blob", `Failed when uploading ${filePath}`, expt);
            }
            return blockBlobURL;
        });
    }
    static getBlobSasQueryParams(blobName, credential) {
        const now = new Date();
        const startTime = new Date();
        startTime.setMinutes(now.getMinutes() - 5);
        const expiryTime = new Date();
        expiryTime.setFullYear(now.getFullYear() + 1);
        const blobSasValues = {
            blobName: blobName,
            containerName: configuration_1.ConfigurationConstant.BlobContainerName,
            startTime: startTime,
            expiryTime: expiryTime,
            permissions: configuration_1.ConfigurationConstant.BlobPermission
        };
        return storage_blob_2.generateBlobSASQueryParameters(blobSasValues, credential).toString();
    }
    static publishToFunctionapp(state, appService, blobSasUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield appService.patchApplicationSettings({ 'WEBSITE_RUN_FROM_PACKAGE': blobSasUrl });
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "Patch Application Settings", "Failed to set WEBSITE_RUN_FROM_PACKAGE with storage blob link." +
                    ` Please check if the ${blobSasUrl} does exist.`);
            }
            try {
                yield appService.syncFunctionTriggersViaHostruntime();
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "Sync Trigger Functionapp", "Failed to perform sync trigger on function app." +
                    " Function app may have malformed content. Please manually restart your function app and" +
                    " inspect the package from WEBSITE_RUN_FROM_PACKAGE.");
            }
        });
    }
    static waitForSpinUp(state, appUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.Logger.Log("Waiting for function app to spin up after app settings change.");
            yield utils_1.Sleeper.timeout(5000);
            try {
                yield utils_1.Client.ping(appUrl, 10, 5);
            }
            catch (_a) {
                throw new exceptions_1.AzureResourceError(state, "Wait For Spin Up", "Cannot detect heartbeats from your function app." +
                    " Please check if your function app is up and running. You may need to manually restart it.");
            }
        });
    }
}
exports.WebsiteRunFromPackageDeploy = WebsiteRunFromPackageDeploy;
