import { Package, PackageType } from 'azure-actions-utility/packageUtility';

import { AuthenticationType } from '../constants/authentication_type';
import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { FunctionRuntimeConstant } from '../constants/function_runtime';
import { FunctionSkuConstant } from '../constants/function_sku';
import { IAppSettings } from './IAppSettings';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { IScmCredentials } from './IScmCredentials';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { PublishMethodConstant } from '../constants/publish_method';
import { RuntimeStackConstant } from '../constants/runtime_stack';

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

    endpoint: IAuthorizer; //rbac only
    appService: AzureAppService; //rbac only
    appServiceUtil: AzureAppServiceUtility; //rbac only
    kuduService: Kudu;
    kuduServiceUtil: KuduServiceUtility;
}
