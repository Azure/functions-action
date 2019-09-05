import { IAuthorizationHandler } from 'pipelines-appservice-lib/lib/ArmRest/IAuthorizationHandler';
import { getHandler } from 'pipelines-appservice-lib/lib/AuthorizationHandlerFactory';
import { AzureResourceFilterUtility } from 'pipelines-appservice-lib/lib/RestUtilities/AzureResourceFilterUtility';
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { StateConstant } from '../constants/state';
import { ValidationError, AzureResourceError } from '../exceptions';
import { IActionParameters } from '../interfaces/IActionParameters';
import { IActionContext } from '../interfaces/IActionContext';
import { AzureAppService } from 'pipelines-appservice-lib/lib/ArmRest/azure-app-service';
import { AzureAppServiceUtility } from 'pipelines-appservice-lib/lib/RestUtilities/AzureAppServiceUtility';
import { Kudu } from 'pipelines-appservice-lib/lib/KuduRest/azure-app-kudu-service';
import { KuduServiceUtility } from 'pipelines-appservice-lib/lib/RestUtilities/KuduServiceUtility';
import { FunctionSkuConstant, FunctionSkuUtil } from '../constants/function_sku';
import { IAppSettings } from '../interfaces/IAppSettings';
import { ConfigurationConstant } from '../constants/configuration';
import { RuntimeStackConstant } from '../constants/runtime_stack';
import { FunctionRuntimeConstant, FunctionRuntimeUtil } from '../constants/function_runtime';
import { Logger } from '../utils';

export class ResourceValidator implements IOrchestratable {
    private _resourceGroupName: string;
    private _isLinux: boolean;
    private _kind: string;
    private _endpoint: IAuthorizationHandler;
    private _sku: FunctionSkuConstant;
    private _language: FunctionRuntimeConstant;
    private _appSettings: IAppSettings;

    private _appService: AzureAppService;
    private _appServiceUtil: AzureAppServiceUtility;
    private _kuduService: Kudu;
    private _kuduServiceUtil: KuduServiceUtility;

    public async invoke(state: StateConstant, params: IActionParameters): Promise<StateConstant> {
        this._endpoint = getHandler();
        await this.getResourceDetails(state, this._endpoint, params.appName);

        this._appService = new AzureAppService(this._endpoint, this._resourceGroupName, params.appName);
        this._appServiceUtil = new AzureAppServiceUtility(this._appService);
        this._kuduService = await this._appServiceUtil.getKuduService();
        this._kuduServiceUtil = new KuduServiceUtility(this._kuduService);

        this._sku = await this.getFunctionappSku(state, this._appService);
        this._appSettings = await this.getFunctionappSettings(state, this._appService);
        this._language = await this.getFunctionappLanguage(this._appSettings);

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
        context.os = this._isLinux ? RuntimeStackConstant.Linux : RuntimeStackConstant.Windows;
        context.sku = this._sku;
        context.language = this._language;

        this.validateRuntimeSku(state, context);
        this.validateLanguage(state, context);
        return context;
    }

    private async getResourceDetails(state: StateConstant, endpoint: IAuthorizationHandler, appName: string) {
        const appDetails = await AzureResourceFilterUtility.getAppDetails(endpoint, appName);
        if (appDetails === undefined) {
            throw new ValidationError(state, ConfigurationConstant.ParamInAppName, "function app should exist");
        }

        this._resourceGroupName = appDetails["resourceGroupName"];
        this._kind = appDetails["kind"];
        this._isLinux = this._kind.indexOf('linux') >= 0;
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

    private async getFunctionappSettings(state: StateConstant, appService: AzureAppService): Promise<IAppSettings> {
        let appSettings;
        try {
            appSettings = await appService.getApplicationSettings(true);
        } catch (expt) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'Failed to acquire app settings', expt);
        }

        if (appSettings === undefined || appSettings.properties === undefined) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'Function app settings should not be empty');
        }

        if (!appSettings.properties['AzureWebJobsStorage']) {
            throw new AzureResourceError(state, 'Get Function App Settings', 'AzureWebJobsStorage cannot be empty');
        }

        Logger.Log('Sucessfully acquired app settings from function app!');
        for (const key in appSettings.properties) {
            Logger.Debug(`- ${key} = ${appSettings.properties[key]}`);
        }

        const result: IAppSettings = {
            AzureWebJobsStorage: appSettings.properties['AzureWebJobsStorage'],
            FUNCTIONS_WORKER_RUNTIME: appSettings.properties['FUNCTIONS_WORKER_RUNTIME']
        };
        return result;
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

    private validateRuntimeSku(state: StateConstant, context: IActionContext) {
        // Linux Elastic Premium is not supported
        if (context.os === RuntimeStackConstant.Linux && context.sku === FunctionSkuConstant.ElasticPremium) {
            throw new ValidationError(state, 'Function Runtime',
                "Linux ElasticPremium plan is not yet supported");
        }
    }

    private validateLanguage(state: StateConstant, context: IActionContext) {
        // Windows Python is not supported
        if (context.os === RuntimeStackConstant.Windows) {
            if (context.language === FunctionRuntimeConstant.Python) {
                throw new ValidationError(state, 'Function Runtime',
                    "Python Function App on Windows is not yet supported");
            }
        }

        // Linux Java and Linux Powershell is not supported
        if (context.os === RuntimeStackConstant.Linux) {
            if (context.language === FunctionRuntimeConstant.Java) {
                throw new ValidationError(state, 'Function Runtime',
                    "Java Function App on Linux is not yet supported");
            }

            if (context.language === FunctionRuntimeConstant.Powershell) {
                throw new ValidationError(state, 'Function Runtime',
                    "PowerShell Function App on Windows is not yet supported");
            }
        }
    }
}