"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthorizationHandlerFactory_1 = require("pipelines-appservice-lib/lib/AuthorizationHandlerFactory");
const AzureResourceFilterUtility_1 = require("pipelines-appservice-lib/lib/RestUtilities/AzureResourceFilterUtility");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
const azure_app_service_1 = require("pipelines-appservice-lib/lib/ArmRest/azure-app-service");
const AzureAppServiceUtility_1 = require("pipelines-appservice-lib/lib/RestUtilities/AzureAppServiceUtility");
const KuduServiceUtility_1 = require("pipelines-appservice-lib/lib/RestUtilities/KuduServiceUtility");
const function_sku_1 = require("../constants/function_sku");
const configuration_1 = require("../constants/configuration");
const runtime_stack_1 = require("../constants/runtime_stack");
const function_runtime_1 = require("../constants/function_runtime");
const utils_1 = require("../utils");
class ResourceValidator {
    invoke(state, params) {
        return __awaiter(this, void 0, void 0, function* () {
            this._endpoint = AuthorizationHandlerFactory_1.getHandler();
            yield this.getResourceDetails(state, this._endpoint, params.appName);
            this._appService = new azure_app_service_1.AzureAppService(this._endpoint, this._resourceGroupName, params.appName);
            this._appServiceUtil = new AzureAppServiceUtility_1.AzureAppServiceUtility(this._appService);
            this._kuduService = yield this._appServiceUtil.getKuduService();
            this._kuduServiceUtil = new KuduServiceUtility_1.KuduServiceUtility(this._kuduService);
            this._sku = yield this.getFunctionappSku(state, this._appService);
            this._appSettings = yield this.getFunctionappSettings(state, this._appService);
            this._language = yield this.getFunctionappLanguage(this._appSettings);
            return state_1.StateConstant.PreparePublishContent;
        });
    }
    changeContext(state, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.isLinux = this._isLinux;
            context.kind = this._kind;
            context.resourceGroupName = this._resourceGroupName;
            context.endpoint = this._endpoint;
            context.appService = this._appService;
            context.appServiceUtil = this._appServiceUtil;
            context.kuduService = this._kuduService;
            context.kuduServiceUtil = this._kuduServiceUtil;
            context.appSettings = this._appSettings;
            context.os = this._isLinux ? runtime_stack_1.RuntimeStackConstant.Linux : runtime_stack_1.RuntimeStackConstant.Windows;
            context.sku = this._sku;
            context.language = this._language;
            this.validateRuntimeSku(state, context);
            this.validateLanguage(state, context);
            return context;
        });
    }
    getResourceDetails(state, endpoint, appName) {
        return __awaiter(this, void 0, void 0, function* () {
            const appDetails = yield AzureResourceFilterUtility_1.AzureResourceFilterUtility.getAppDetails(endpoint, appName);
            if (appDetails === undefined) {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInAppName, "function app should exist");
            }
            this._resourceGroupName = appDetails["resourceGroupName"];
            this._kind = appDetails["kind"];
            this._isLinux = this._kind.indexOf('linux') >= 0;
        });
    }
    getFunctionappSku(state, appService) {
        return __awaiter(this, void 0, void 0, function* () {
            let configSettings;
            try {
                configSettings = yield appService.get(true);
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App SKU', 'Failed to get site config', expt);
            }
            if (configSettings === undefined || configSettings.properties === undefined) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App SKU', 'Function app sku should not be empty');
            }
            utils_1.Logger.Log('Sucessfully acquired site configs from function app!');
            for (const key in configSettings.properties) {
                utils_1.Logger.Debug(`- ${key} = ${configSettings.properties[key]}`);
            }
            const result = function_sku_1.FunctionSkuUtil.FromString(configSettings.properties.sku);
            utils_1.Logger.Log(`Detected function app sku: ${function_sku_1.FunctionSkuConstant[result]}`);
            return result;
        });
    }
    getFunctionappSettings(state, appService) {
        return __awaiter(this, void 0, void 0, function* () {
            let appSettings;
            try {
                appSettings = yield appService.getApplicationSettings(true);
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'Failed to acquire app settings', expt);
            }
            if (appSettings === undefined || appSettings.properties === undefined) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'Function app settings should not be empty');
            }
            if (!appSettings.properties['AzureWebJobsStorage']) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'AzureWebJobsStorage cannot be empty');
            }
            utils_1.Logger.Log('Sucessfully acquired app settings from function app!');
            for (const key in appSettings.properties) {
                utils_1.Logger.Debug(`- ${key} = ${appSettings.properties[key]}`);
            }
            const result = {
                AzureWebJobsStorage: appSettings.properties['AzureWebJobsStorage'],
                FUNCTIONS_WORKER_RUNTIME: appSettings.properties['FUNCTIONS_WORKER_RUNTIME']
            };
            return result;
        });
    }
    getFunctionappLanguage(appSettings) {
        const result = function_runtime_1.FunctionRuntimeUtil.FromString(appSettings.FUNCTIONS_WORKER_RUNTIME);
        if (result === function_runtime_1.FunctionRuntimeConstant.None) {
            utils_1.Logger.Log('Detected function app language: None (V1 function app)');
        }
        else {
            utils_1.Logger.Log(`Detected function app language: ${function_runtime_1.FunctionRuntimeConstant[result]}`);
        }
        return result;
    }
    validateRuntimeSku(state, context) {
        // Linux Elastic Premium is not supported
        if (context.os === runtime_stack_1.RuntimeStackConstant.Linux && context.sku === function_sku_1.FunctionSkuConstant.ElasticPremium) {
            throw new exceptions_1.ValidationError(state, 'Function Runtime', "Linux ElasticPremium plan is not yet supported");
        }
    }
    validateLanguage(state, context) {
        // Windows Python is not supported
        if (context.os === runtime_stack_1.RuntimeStackConstant.Windows) {
            if (context.language === function_runtime_1.FunctionRuntimeConstant.Python) {
                throw new exceptions_1.ValidationError(state, 'Function Runtime', "Python Function App on Windows is not yet supported");
            }
        }
        // Linux Java and Linux Powershell is not supported
        if (context.os === runtime_stack_1.RuntimeStackConstant.Linux) {
            if (context.language === function_runtime_1.FunctionRuntimeConstant.Java) {
                throw new exceptions_1.ValidationError(state, 'Function Runtime', "Java Function App on Linux is not yet supported");
            }
            if (context.language === function_runtime_1.FunctionRuntimeConstant.Powershell) {
                throw new exceptions_1.ValidationError(state, 'Function Runtime', "PowerShell Function App on Windows is not yet supported");
            }
        }
    }
}
exports.ResourceValidator = ResourceValidator;
