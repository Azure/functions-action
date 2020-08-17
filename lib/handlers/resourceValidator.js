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
const exceptions_1 = require("../exceptions");
const function_runtime_1 = require("../constants/function_runtime");
const function_sku_1 = require("../constants/function_sku");
const authentication_type_1 = require("../constants/authentication_type");
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const azure_app_service_1 = require("azure-actions-appservice-rest/Arm/azure-app-service");
const AzureAppServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureAppServiceUtility");
const AzureResourceFilterUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility");
const configuration_1 = require("../constants/configuration");
const azure_app_kudu_service_1 = require("azure-actions-appservice-rest/Kudu/azure-app-kudu-service");
const KuduServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/KuduServiceUtility");
const utils_1 = require("../utils");
const runtime_stack_1 = require("../constants/runtime_stack");
const state_1 = require("../constants/state");
class ResourceValidator {
    invoke(state, params, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.authenticationType == authentication_type_1.AuthenticationType.Rbac) {
                utils_1.Logger.Log('Using RBAC for authentication, GitHub Action will perform resource validation.');
                yield this.getDetailsByRbac(state, params);
            }
            else if (context.authenticationType == authentication_type_1.AuthenticationType.Scm) {
                utils_1.Logger.Log('Using SCM credential for authentication, GitHub Action will not perform resource validation.');
                yield this.getDetailsByScm(state, context);
            }
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
            context.os = this.getOsTypeFromIsLinux(this._isLinux);
            context.sku = this._sku;
            context.language = this._language;
            context.appUrl = this._appUrl;
            this.validateRuntimeSku(state, context);
            this.validateLanguage(state, context);
            return context;
        });
    }
    getDetailsByRbac(state, params) {
        return __awaiter(this, void 0, void 0, function* () {
            this._endpoint = yield AuthorizerFactory_1.AuthorizerFactory.getAuthorizer();
            yield this.getResourceDetails(state, this._endpoint, params.appName);
            this._appService = new azure_app_service_1.AzureAppService(this._endpoint, this._resourceGroupName, params.appName, params.slot);
            this._appServiceUtil = new AzureAppServiceUtility_1.AzureAppServiceUtility(this._appService);
            this._kuduService = yield this._appServiceUtil.getKuduService();
            this._kuduServiceUtil = new KuduServiceUtility_1.KuduServiceUtility(this._kuduService);
            this._sku = yield this.getFunctionappSku(state, this._appService);
            this._appSettings = yield this.getFunctionappSettingsRbac(state, this._appService);
            this._language = yield this.getFunctionappLanguage(this._appSettings);
            this._appUrl = yield this._appServiceUtil.getApplicationURL();
        });
    }
    getDetailsByScm(state, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const scm = context.scmCredentials;
            this._kuduService = new azure_app_kudu_service_1.Kudu(scm.uri, scm.username, scm.password);
            this._kuduServiceUtil = new KuduServiceUtility_1.KuduServiceUtility(this._kuduService);
            this._appSettings = yield this.getFunctionappSettingsScm(state, this._kuduService);
            this._appUrl = scm.appUrl;
            this._isLinux = null;
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
    getOsTypeFromIsLinux(isLinux) {
        if (isLinux === null || isLinux === undefined) {
            return runtime_stack_1.RuntimeStackConstant.Unknown;
        }
        else if (isLinux === true) {
            return runtime_stack_1.RuntimeStackConstant.Linux;
        }
        else {
            return runtime_stack_1.RuntimeStackConstant.Windows;
        }
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
    getFunctionappSettingsRbac(state, appService) {
        return __awaiter(this, void 0, void 0, function* () {
            let appSettings;
            try {
                appSettings = yield appService.getApplicationSettings(true);
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'Failed to acquire app settings (RBAC)', expt);
            }
            if (appSettings === undefined || appSettings.properties === undefined) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'Function app settings should not be empty (RBAC)');
            }
            if (!appSettings.properties['AzureWebJobsStorage']) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'AzureWebJobsStorage cannot be empty');
            }
            else {
                console.log(`::add-mask::${appSettings.properties['AzureWebJobsStorage']}`);
            }
            utils_1.Logger.Log('Sucessfully acquired app settings from function app (RBAC)!');
            for (const key in appSettings.properties) {
                utils_1.Logger.Debug(`- ${key} = ${appSettings.properties[key]}`);
            }
            const result = {
                AzureWebJobsStorage: appSettings.properties['AzureWebJobsStorage'],
                FUNCTIONS_WORKER_RUNTIME: appSettings.properties['FUNCTIONS_WORKER_RUNTIME'],
                ENABLE_ORYX_BUILD: appSettings.properties['ENABLE_ORYX_BUILD'],
                SCM_DO_BUILD_DURING_DEPLOYMENT: appSettings.properties['SCM_DO_BUILD_DURING_DEPLOYMENT'],
                WEBSITE_RUN_FROM_PACKAGE: appSettings.properties['WEBSITE_RUN_FROM_PACKAGE'],
                SCM_RUN_FROM_PACKAGE: appSettings.properties['SCM_RUN_FROM_PACKAGE']
            };
            return result;
        });
    }
    getFunctionappSettingsScm(state, kuduService) {
        return __awaiter(this, void 0, void 0, function* () {
            let appSettings;
            try {
                appSettings = yield kuduService.getAppSettings();
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'Failed to acquire app settings (SCM)', expt);
            }
            if (appSettings === undefined) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'Function app settings should not be empty (SCM)');
            }
            if (!appSettings['AzureWebJobsStorage']) {
                throw new exceptions_1.AzureResourceError(state, 'Get Function App Settings', 'AzureWebJobsStorage cannot be empty');
            }
            else {
                console.log(`::add-mask::${appSettings['AzureWebJobsStorage']}`);
            }
            utils_1.Logger.Log('Sucessfully acquired app settings from function app (SCM)!');
            for (const key in appSettings) {
                utils_1.Logger.Debug(`- ${key} = ${appSettings[key]}`);
            }
            const result = {
                AzureWebJobsStorage: appSettings['AzureWebJobsStorage'],
                FUNCTIONS_WORKER_RUNTIME: appSettings['FUNCTIONS_WORKER_RUNTIME'],
                ENABLE_ORYX_BUILD: appSettings['ENABLE_ORYX_BUILD'],
                SCM_DO_BUILD_DURING_DEPLOYMENT: appSettings['SCM_DO_BUILD_DURING_DEPLOYMENT'],
                WEBSITE_RUN_FROM_PACKAGE: appSettings['WEBSITE_RUN_FROM_PACKAGE'],
                SCM_RUN_FROM_PACKAGE: appSettings['SCM_RUN_FROM_PACKAGE']
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
    validateRuntimeSku(_, context) {
        if (context.os === undefined || context.sku === undefined) {
            return;
        }
    }
    validateLanguage(state, context) {
        if (context.os === undefined || context.language === undefined) {
            return;
        }
        // Windows Python is not supported
        if (context.os === runtime_stack_1.RuntimeStackConstant.Windows) {
            if (context.language === function_runtime_1.FunctionRuntimeConstant.Python) {
                throw new exceptions_1.ValidationError(state, 'Function Runtime', "Python Function App on Windows is not yet supported");
            }
        }
        // Linux Java and Linux Powershell is not supported
        if (context.os === runtime_stack_1.RuntimeStackConstant.Linux) {
            if (context.language === function_runtime_1.FunctionRuntimeConstant.Powershell) {
                throw new exceptions_1.ValidationError(state, 'Function Runtime', "PowerShell Function App on Windows is not yet supported");
            }
        }
    }
}
exports.ResourceValidator = ResourceValidator;
