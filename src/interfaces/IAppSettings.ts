export interface IAppSettings {
    AzureWebJobsStorage: Readonly<string>;
    FUNCTIONS_WORKER_RUNTIME: Readonly<string>;
    ENABLE_ORYX_BUILD: Readonly<string>;
    SCM_DO_BUILD_DURING_DEPLOYMENT: Readonly<string>;
    WEBSITE_RUN_FROM_PACKAGE: Readonly<string>;
    SCM_RUN_FROM_PACKAGE: Readonly<string>;
}
