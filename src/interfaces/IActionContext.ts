import { Package, PackageType } from 'pipelines-appservice-lib/lib/Utilities/packageUtility';
import { IAuthorizationHandler } from 'pipelines-appservice-lib/lib/ArmRest/IAuthorizationHandler';
import { AzureAppService } from 'pipelines-appservice-lib/lib/ArmRest/azure-app-service';
import { AzureAppServiceUtility } from 'pipelines-appservice-lib/lib/RestUtilities/AzureAppServiceUtility';
import { Kudu } from 'pipelines-appservice-lib/lib/KuduRest/azure-app-kudu-service';
import { KuduServiceUtility } from 'pipelines-appservice-lib/lib/RestUtilities/KuduServiceUtility';
import { IAppSettings } from './IAppSettings';
import { PublishMethodConstant } from '../constants/publish_method';
import { FunctionSkuConstant } from '../constants/function_sku';
import { RuntimeStackConstant } from '../constants/runtime_stack';
import { FunctionRuntimeConstant } from '../constants/function_runtime';

export interface IActionContext {
    azureHttpUserAgent: string;
    resourceGroupName: string;
    kind: string;
    isLinux: boolean;
    package: Package;
    packageType: PackageType;
    publishContentPath: string;
    publishMethod: PublishMethodConstant;
    deploymentId: string;

    appSettings: IAppSettings;
    sku: FunctionSkuConstant;
    os: RuntimeStackConstant;
    language: FunctionRuntimeConstant;

    endpoint: IAuthorizationHandler;
    appService: AzureAppService;
    appServiceUtil: AzureAppServiceUtility;
    kuduService: Kudu;
    kuduServiceUtil: KuduServiceUtility;
}
