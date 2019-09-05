export class ConfigurationConstant {
    public static readonly ParamInAppName: string = 'app-name';
    public static readonly ParamInPackagePath: string = 'package';
    public static readonly ParamOutResultName: string = 'app-url';

    public static readonly EnvAzureHttpUserAgent: string = 'AZURE_HTTP_USER_AGENT';

    public static readonly ActionName: string = 'functionapp';
    public static readonly BlobContainerName: string = 'github-actions-deploy';

    public static readonly BlobNamePrefix: string = 'Functionapp';
    public static readonly BlobServiceTimeoutMs: number = 3 * 1000;
    public static readonly BlobUploadTimeoutMs: number = 30 * 60 * 1000;
    public static readonly BlobUploadBlockSizeByte: number = 4 * 1024 * 1024;
    public static readonly BlobUplaodBlockParallel: number = 4;
    public static readonly BlobPermission: string = 'r';
}