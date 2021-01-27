export class ConfigurationConstant {
    public static readonly ParamInAppName: string = 'app-name';
    public static readonly ParamInPackagePath: string = 'package';
    public static readonly ParamInSlot: string = 'slot-name';
    public static readonly ParamInPublishProfile: string = 'publish-profile';
    public static readonly ParamInRespectPomXml: string = 'respect-pom-xml';
    public static readonly ParamInRespectFuncignore: string = 'respect-funcignore';
    public static readonly ParamInEnableOryxBuild: string = 'enable-oryx-build';
    public static readonly ParamInScmDoBuildDuringDeployment: string = 'scm-do-build-during-deployment';

    public static readonly ParamOutResultName: string = 'app-url';

    public static readonly ActionName: string = 'DeployFunctionAppToAzure';
    public static readonly BlobContainerName: string = 'github-actions-deploy';

    public static readonly BlobNamePrefix: string = 'Functionapp';
    public static readonly BlobServiceTimeoutMs: number = 3 * 1000;
    public static readonly BlobUploadTimeoutMs: number = 30 * 60 * 1000;
    public static readonly BlobUploadBlockSizeByte: number = 4 * 1024 * 1024;
    public static readonly BlobUplaodBlockParallel: number = 4;
    public static readonly BlobPermission: string = 'r';

    public static readonly ProductionSlotName: string = 'production';
}