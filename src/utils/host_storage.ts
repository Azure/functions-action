export class HostStorage {
    private static readonly IdentityPrefix = 'AzureWebJobsStorage__';

    /**
     * True when the host storage is configured in any supported form: the AzureWebJobsStorage connection string,
     * or any identity-based AzureWebJobsStorage__* setting (accountName, blobServiceUri, queueServiceUri,
     * tableServiceUri, credential, clientId).
     */
    public static isConfigured(appSettings: { [key: string]: string }): boolean {
        if (!appSettings) {
            return false;
        }

        if (appSettings['AzureWebJobsStorage']) {
            return true;
        }

        return Object.keys(appSettings).some(key => key.startsWith(HostStorage.IdentityPrefix) && !!appSettings[key]);
    }

    /**
     * Blob service endpoint for identity-based host storage. AzureWebJobsStorage__blobServiceUri takes precedence,
     * falling back to the endpoint derived from AzureWebJobsStorage__accountName. Undefined when neither is set.
     */
    public static getBlobServiceUri(blobServiceUri: string, accountName: string): string | undefined {
        if (blobServiceUri) {
            return blobServiceUri;
        }

        return accountName ? `https://${accountName}.blob.core.windows.net` : undefined;
    }
}
