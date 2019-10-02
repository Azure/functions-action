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
import { IScmCredentials } from './IScmCredentials';
import { AuthenticationType } from '../constants/authentication_type';

export interface IActionContext {
    azureHttpUserAgent: string;
    azureHttpUserAgentPrefix: string;
    resourceGroupName: string; //rbac only
    kind: string; //rbac only
    isLinux: boolean; //rbac only
    package: Package;
    packageType: PackageType;
    publishContentPath: string;
    publishMethod: PublishMethodConstant;

    scmCredentials: IScmCredentials; //scm only
    authenticationType: AuthenticationType;

    appSettings: IAppSettings;
    sku: FunctionSkuConstant; //rbac only
    os: RuntimeStackConstant; //rbac only
    language: FunctionRuntimeConstant; //rbac only
    appUrl: string;

    endpoint: IAuthorizationHandler; //rbac only
    appService: AzureAppService; //rbac only
    appServiceUtil: AzureAppServiceUtility; //rbac only
    kuduService: Kudu;
    kuduServiceUtil: KuduServiceUtility;
}
