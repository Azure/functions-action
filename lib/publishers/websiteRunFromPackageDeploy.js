"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteRunFromPackageDeploy = void 0;
const core = require("@actions/core");
const storage_blob_1 = require("@azure/storage-blob");
const storage_blob_2 = require("@azure/storage-blob");
const arm_storage_1 = require("@azure/arm-storage");
const identity_1 = require("@azure/identity");
const exceptions_1 = require("../exceptions");
const utils_1 = require("../utils");
const configuration_1 = require("../constants/configuration");
class WebsiteRunFromPackageDeploy {
    static execute(state, context) {
        return __awaiter(this, void 0, void 0, function* () {
            let blobServiceClient;
            if (context.appSettings.AzureWebJobsStorage) {
                utils_1.Logger.Info("Using AzureWebJobsStorage for Blob access.");
                blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(context.appSettings.AzureWebJobsStorage);
            }
            else {
                utils_1.Logger.Info("Using AzureWebJobsStorage__accountName and RBAC for Blob access.");
                blobServiceClient = new storage_blob_1.BlobServiceClient(`https://${context.appSettings.AzureWebJobsStorage__accountName}.blob.core.windows.net`, new identity_1.DefaultAzureCredential());
            }
            const containerClient = blobServiceClient.getContainerClient(configuration_1.ConfigurationConstant.BlobContainerName);
            yield containerClient.createIfNotExists();
            const blobName = this.createBlobName();
            let blockBlobClient = containerClient.getBlockBlobClient(blobName);
            yield blockBlobClient.uploadFile(context.publishContentPath);
            const packageUrl = blockBlobClient.url;
            core.setOutput(configuration_1.ConfigurationConstant.ParamOutPackageUrl, packageUrl);
            let bobUrl;
            if (context.appSettings.AzureWebJobsStorage) {
                utils_1.Logger.Info("Package Url will use SAS.");
                bobUrl = yield this.getBlobSasUrl(blockBlobClient);
            }
            else {
                if (context.appSettings.WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID) {
                    utils_1.Logger.Info("Package Url will use RBAC with User-assigned managed identity because WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID app setting is present.");
                }
                else {
                    utils_1.Logger.Info("Package Url will use RBAC with System-assigned managed identity.");
                }
                bobUrl = packageUrl;
            }
            yield this.publishToFunctionapp(state, context.appService, bobUrl);
        });
    }
    static createBlobName() {
        const now = new Date();
        const time = `${now.getUTCFullYear()}${now.getUTCMonth() + 1}${now.getUTCDate()}${now.getUTCHours()}${now.getUTCMinutes()}${now.getUTCSeconds()}`;
        return `${configuration_1.ConfigurationConstant.BlobNamePrefix}_${time}.zip`;
    }
    static getBlobSasUrl(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const startTime = new Date();
            startTime.setMinutes(now.getMinutes() - 5);
            const expiryTime = new Date();
            expiryTime.setFullYear(now.getFullYear() + 1);
            const options = {
                permissions: storage_blob_1.BlobSASPermissions.parse("r"),
                startsOn: startTime,
                expiresOn: expiryTime
            };
            return client.generateSasUrl(options);
        });
    }
    static getBlobSasParams(accountName, blobName, containerName, context) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.Logger.Info("Looking up storage account Keys");
            const storageClient = new arm_storage_1.StorageManagementClient(new identity_1.DefaultAzureCredential(), context.endpoint.subscriptionID);
            const keys = yield storageClient.storageAccounts.listKeys(context.resourceGroupName, accountName);
            const key = (_a = keys.keys) === null || _a === void 0 ? void 0 : _a[0].value;
            const now = new Date();
            const startTime = new Date();
            startTime.setMinutes(now.getMinutes() - 5);
            const expiryTime = new Date();
            expiryTime.setFullYear(now.getFullYear() + 1);
            const sasOptions = {
                blobName,
                containerName,
                permissions: storage_blob_1.BlobSASPermissions.parse("r"),
                protocol: storage_blob_2.SASProtocol.Https,
                startsOn: startTime,
                expiresOn: expiryTime
            };
            const sasParams = (0, storage_blob_2.generateBlobSASQueryParameters)(sasOptions, new storage_blob_2.StorageSharedKeyCredential(accountName, key));
            return sasParams.toString();
        });
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
                // wait 30 second before calling sync trigger
                const retryInterval = 30000;
                utils_1.Logger.Info("##[debug]Starting 30 seconds wait time.");
                yield utils_1.Sleeper.timeout(retryInterval);
                utils_1.Logger.Info("##[debug]Finished wait time.");
                yield appService.syncFunctionTriggersViaHostruntime();
                utils_1.Logger.Info("Sync Trigger call was successful.");
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "Sync Trigger Functionapp", "Failed to perform sync trigger on function app." +
                    " Function app may have malformed content. Please manually restart your function app and" +
                    " inspect the package from WEBSITE_RUN_FROM_PACKAGE.");
            }
        });
    }
}
exports.WebsiteRunFromPackageDeploy = WebsiteRunFromPackageDeploy;
