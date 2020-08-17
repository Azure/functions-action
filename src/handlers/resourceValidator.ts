import { AzureResourceError, ValidationError } from '../exceptions';
import { FunctionRuntimeConstant, FunctionRuntimeUtil } from '../constants/function_runtime';
import { FunctionSkuConstant, FunctionSkuUtil } from '../constants/function_sku';

import { AuthenticationType } from '../constants/authentication_type';
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';
import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { AzureResourceFilterUtility } from 'azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility';
import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from '../interfaces/IActionContext';
import { IActionParameters } from '../interfaces/IActionParameters';
import { IAppSettings } from '../interfaces/IAppSettings';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { IScmCredentials } from '../interfaces/IScmCredentials';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { Logger } from '../utils';
import { RuntimeStackConstant } from '../constants/runtime_stack';
import { StateConstant } from '../constants/state';

export class ResourceValidator implements IOrchestratable {
    private _resourceGroupName: string;
    private _isLinux: boolean;
    private _kind: string;
    private _endpoint: IAuthorizer;
    private _sku: FunctionSkuConstant;
    private _language: FunctionRuntimeConstant;
    private _appSettings: IAppSettings;
    private _appUrl: string;

    private _appService: AzureAppService;
    private _appServiceUtil: AzureAppServiceUtility;
    private _kuduService: Kudu;
    private _kuduServiceUtil: KuduServiceUtility;

    public async invoke(state: StateConstant, params: IActionParameters, context: IActionContext): Promise<StateConstant> {
        if (context.authenticationType == AuthenticationType.Rbac) {
            Logger.Log('Using RBAC for authentication, GitHub Action will perform resource validation.');
            await this.getDetailsByRbac(state, params);
        } else if (context.authenticationType == AuthenticationType.Scm) {
            Logger.Log('Using SCM credential for authentication, GitHub Action will not perform resource validation.');
            await this.getDetailsByScm(state, context);
        }

        return StateConstant.PreparePublishContent;
    }

    public async changeContext(state: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.isLinux = this._isLinux;
        context.kind = this._kind;
        context.resourceGroupName = this._resourceGroupName;
        context.endpoint = this._endpoint;

        context.appService = this._appService;
        context.appServiceUtil = this._appServiceUtil;
        context.kuduService = this._kuduService;
        context.kuduServiceUtil = this._kuduServiceUtil;

        context.appSettings = this._appSettings;
        context.os = this.getOsTypeFromIsLinux(this._isLinux);
        context.sku = this._sku;
        context.language = this._language;
        context.appUrl = this._appUrl;

        this.validateRuntimeSku(state, context);
        this.validateLanguage(state, context);
        return context;
    }

    private async getDetailsByRbac(state: StateConstant, params: IActionParameters) {
        this._endpoint = await AuthorizerFactory.getAuthorizer();
        await this.getResourceDetails(state, this._endpoint, params.appName);
        this._appService = new AzureAppService(this._endpoint, this._resourceGroupName, params.appName, params.slot);
        this._appServiceUtil = new AzureAppServiceUtility(this._appService);
        this._kuduService = await this._appServiceUtil.getKuduService();
        this._kuduServiceUtil = new KuduServiceUtility(this._kuduService);
        this._sku = await this.getFunctionappSku(state, this._appService);
        this._appSettings = await this.getFunctionappSettingsRbac(state, this._appService);
        this._language = await this.getFunctionappLanguage(this._appSettings);
        this._appUrl = await this._appServiceUtil.getApplicationURL();
    }

    private async getDetailsByScm(state: StateConstant, context: IActionContext) {
        const scm: IScmCredentials = context.scmCredentials;
        this._kuduService = new Kudu(scm.uri, scm.username, scm.password);
        this._kuduServiceUtil = new KuduServiceUtility(this._kuduService);
        this._appSettings = await this.getFunctionappSettingsScm(state, this._kuduService);
        this._appUrl = scm.appUrl;
        this._isLinux = null;
    }

    private async getResourceDetails(state: StateConstant, endpoint: IAuthorizer, appName: string) {
        const appDetails = await AzureResourceFilterUtility.getAppDetails(endpoint, appName);
        if (appDetails === undefined) {
            throw new ValidationError(state, ConfigurationConstant.ParamInAppName, "function app should exist");
        }

        this._resourceGroupName = appDetails["resourceGroupName"];
        this._kind = appDetails["kind"];
        this._isLinux = this._kind.indexOf('linux') >= 0;
    }

    private getOsTypeFromIsLinux(isLinux: boolean) {
        if (isLinux === null || isLinux === undefined) {
            return RuntimeStackConstant.Unknown;
        } else if (isLinux === true) {
            return RuntimeStackConstant.Linux;
        } else {
            return RuntimeStackConstant.Windows;
        }
    }

    private async getFunctionappSku(state: StateConstant, appService: AzureAppService): Promise<FunctionSkuConstant> {
        let configSettings;
        try {
            configSettings = await appService.get(true);
        } catch (expt) {
            throw new AzureResourceError(state, 'Get Function App SKU', 'Failed to get site config', expt);
        }

        if (configSettings === undefined || configSettings.properties === undefined) {
            throw new AzureResourceError(state, 'Get Function App SKU', 'Function app sku should not be empty');
        }

        Logger.Log('Sucessfully acquired site configs from function app!');
        for (const key in configSettings.properties) {
            Logger.Debug(`- ${key} = ${configSettings.properties[key]}`);
        }

        const result: FunctionSkuConstant = FunctionSkuUtil.FromString(configSettings.properties.sku);
        Logger.Log(`Detected function app sku: ${FunctionSkuConstant[result]}`);
        return result;
    }

    private async getFunctionappSettingsRbac(state: StateConstant, appService: AzureAppService): Promise<IAppSettings> {
        let appSettings: any;
        try {
            appSettings = await appService.getApplicationSettings(true);
        } catch (expt) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'Failed to acquire app settings (RBAC)', expt);
        }

        if (appSettings === undefined || appSettings.properties === undefined) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'Function app settings should not be empty (RBAC)');
        }

        if (!appSettings.properties['AzureWebJobsStorage']) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'AzureWebJobsStorage cannot be empty');
        } else {
            console.log(`::add-mask::${appSettings.properties['AzureWebJobsStorage']}`);
        }

        Logger.Log('Sucessfully acquired app settings from function app (RBAC)!');
        for (const key in appSettings.properties) {
            Logger.Debug(`- ${key} = ${appSettings.properties[key]}`);
        }

        const result: IAppSettings = {
            AzureWebJobsStorage: appSettings.properties['AzureWebJobsStorage'],
            FUNCTIONS_WORKER_RUNTIME: appSettings.properties['FUNCTIONS_WORKER_RUNTIME'],
            ENABLE_ORYX_BUILD: appSettings.properties['ENABLE_ORYX_BUILD'],
            SCM_DO_BUILD_DURING_DEPLOYMENT: appSettings.properties['SCM_DO_BUILD_DURING_DEPLOYMENT'],
            WEBSITE_RUN_FROM_PACKAGE: appSettings.properties['WEBSITE_RUN_FROM_PACKAGE'],
            SCM_RUN_FROM_PACKAGE: appSettings.properties['SCM_RUN_FROM_PACKAGE']
        };
        return result;
    }

    private async getFunctionappSettingsScm(state: StateConstant, kuduService: Kudu): Promise<IAppSettings> {
        let appSettings: any;
        try {
            appSettings = await kuduService.getAppSettings();
        } catch (expt) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'Failed to acquire app settings (SCM)', expt);
        }

        if (appSettings === undefined) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'Function app settings should not be empty (SCM)');
        }

        if (!appSettings['AzureWebJobsStorage']) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'AzureWebJobsStorage cannot be empty');
        } else {
            console.log(`::add-mask::${appSettings['AzureWebJobsStorage']}`);
        }

        Logger.Log('Sucessfully acquired app settings from function app (SCM)!');
        for (const key in appSettings) {
            Logger.Debug(`- ${key} = ${appSettings[key]}`);
        }

        const result: IAppSettings = {
            AzureWebJobsStorage: appSettings['AzureWebJobsStorage'],
            FUNCTIONS_WORKER_RUNTIME: appSettings['FUNCTIONS_WORKER_RUNTIME'],
            ENABLE_ORYX_BUILD: appSettings['ENABLE_ORYX_BUILD'],
            SCM_DO_BUILD_DURING_DEPLOYMENT: appSettings['SCM_DO_BUILD_DURING_DEPLOYMENT'],
            WEBSITE_RUN_FROM_PACKAGE: appSettings['WEBSITE_RUN_FROM_PACKAGE'],
            SCM_RUN_FROM_PACKAGE: appSettings['SCM_RUN_FROM_PACKAGE']
        };
        return result
    }

    private getFunctionappLanguage(appSettings: IAppSettings): FunctionRuntimeConstant {
        const result: FunctionRuntimeConstant = FunctionRuntimeUtil.FromString(appSettings.FUNCTIONS_WORKER_RUNTIME);

        if (result === FunctionRuntimeConstant.None) {
            Logger.Log('Detected function app language: None (V1 function app)');
        } else {
            Logger.Log(`Detected function app language: ${FunctionRuntimeConstant[result]}`);
        }
        return result;
    }

    private validateRuntimeSku(_: StateConstant, context: IActionContext) {
        if (context.os === undefined || context.sku === undefined) {
            return;
        }
    }

    private validateLanguage(state: StateConstant, context: IActionContext) {
        if (context.os === undefined || context.language === undefined) {
            return;
        }

        // Windows Python is not supported
        if (context.os === RuntimeStackConstant.Windows) {
            if (context.language === FunctionRuntimeConstant.Python) {
                throw new ValidationError(state, 'Function Runtime',
                    "Python Function App on Windows is not yet supported");
            }
        }

        // Linux Java and Linux Powershell is not supported
        if (context.os === RuntimeStackConstant.Linux) {
            if (context.language === FunctionRuntimeConstant.Powershell) {
                throw new ValidationError(state, 'Function Runtime',
                    "PowerShell Function App on Windows is not yet supported");
            }
        }
    }
}
