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
const utils_1 = require("../utils");
const authentication_type_1 = require("../constants/authentication_type");
const runtime_stack_1 = require("../constants/runtime_stack");
class ZipDeploy {
    static execute(state, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = context.publishContentPath;
            let deploymentId;
            let isDeploymentSucceeded = false;
            this.validateApplicationSettings(state, context);
            const originalAppSettings = context.appSettings;
            try {
                yield this.patchApplicationSettings(context);
                deploymentId = yield context.kuduServiceUtil.deployUsingZipDeploy(filePath);
                isDeploymentSucceeded = true;
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
            }
            finally {
                if (isDeploymentSucceeded) {
                    yield context.kuduServiceUtil.postZipDeployOperation(deploymentId, deploymentId);
                }
                yield context.kuduServiceUtil.updateDeploymentStatus(isDeploymentSucceeded, null, {
                    'type': 'Deployment',
                    'slotName': context.appService ? context.appService.getSlot() : 'production'
                });
            }
            yield this.restoreScmTemporarySettings(context, originalAppSettings);
            yield this.deleteScmTemporarySettings(context, originalAppSettings);
            return deploymentId;
        });
    }
    static validateApplicationSettings(state, context) {
        const appSettings = context.appSettings;
        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trim().startsWith('http')) {
            throw new exceptions_1.AzureResourceError(state, "zipDepoy", "WEBSITE_RUN_FROM_PACKAGE in your function app is " +
                "set to an URL. Please remove WEBSITE_RUN_FROM_PACKAGE app setting from your function app.");
        }
        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trim() === '1' &&
            (context.os === undefined || context.os === runtime_stack_1.RuntimeStackConstant.Linux)) {
            utils_1.Logger.Warn("Detected WEBSITE_RUN_FROM_PACKAGE is set to '1'. If you are deploying to a Linux " +
                "function app, you may need to remove this app setting.");
            return;
        }
    }
    static patchApplicationSettings(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (context.os === runtime_stack_1.RuntimeStackConstant.Windows &&
                    context.authenticationType === authentication_type_1.AuthenticationType.Rbac &&
                    !utils_1.Parser.IsTrueLike(context.appSettings.WEBSITE_RUN_FROM_PACKAGE)) {
                    utils_1.Logger.Log('Setting WEBSITE_RUN_FROM_PACKAGE to 1');
                    yield this._updateApplicationSettings(context, { 'WEBSITE_RUN_FROM_PACKAGE': '1' });
                    yield this.checkAppSettingPropagatedToKudu(context, 'WEBSITE_RUN_FROM_PACKAGE', '1');
                }
                if (context.authenticationType === authentication_type_1.AuthenticationType.Scm &&
                    !utils_1.Parser.IsFalseLike(context.appSettings.SCM_DO_BUILD_DURING_DEPLOYMENT)) {
                    utils_1.Logger.Log('Setting SCM_DO_BUILD_DURING_DEPLOYMENT in Kudu container to false');
                    yield this._updateApplicationSettings(context, { 'SCM_DO_BUILD_DURING_DEPLOYMENT': 'false' });
                    yield this.checkAppSettingPropagatedToKudu(context, 'SCM_DO_BUILD_DURING_DEPLOYMENT', 'false');
                }
                if (context.authenticationType === authentication_type_1.AuthenticationType.Scm &&
                    !utils_1.Parser.IsFalseLike(context.appSettings.ENABLE_ORYX_BUILD)) {
                    utils_1.Logger.Log('Setting ENABLE_ORYX_BUILD in Kudu container to false');
                    yield this._updateApplicationSettings(context, { 'ENABLE_ORYX_BUILD': 'false' });
                    yield this.checkAppSettingPropagatedToKudu(context, 'ENABLE_ORYX_BUILD', 'false');
                }
            }
            catch (expt) {
                utils_1.Logger.Warn(`Patch Application Settings: Failed to change app settings. ${expt}`);
            }
        });
    }
    static restoreScmTemporarySettings(context, original) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (context.authenticationType === authentication_type_1.AuthenticationType.Scm) {
                    // Restore previous app settings if they are temporarily changed
                    if (original.WEBSITE_RUN_FROM_PACKAGE) {
                        yield utils_1.Client.updateAppSettingViaKudu(context.scmCredentials, {
                            'WEBSITE_RUN_FROM_PACKAGE': original.WEBSITE_RUN_FROM_PACKAGE
                        }, 3, 3, false);
                    }
                    if (original.SCM_DO_BUILD_DURING_DEPLOYMENT) {
                        yield utils_1.Client.updateAppSettingViaKudu(context.scmCredentials, {
                            'SCM_DO_BUILD_DURING_DEPLOYMENT': original.SCM_DO_BUILD_DURING_DEPLOYMENT
                        }, 3, 3, false);
                    }
                    if (original.ENABLE_ORYX_BUILD) {
                        yield utils_1.Client.updateAppSettingViaKudu(context.scmCredentials, {
                            'ENABLE_ORYX_BUILD': original.ENABLE_ORYX_BUILD
                        }, 3, 3, false);
                    }
                }
            }
            catch (expt) {
                utils_1.Logger.Warn("Restore Application Settings: Failed to restore temporary SCM app settings.");
            }
        });
    }
    static deleteScmTemporarySettings(context, original) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (context.authenticationType === authentication_type_1.AuthenticationType.Scm) {
                    // Delete previous app settings if they are temporarily set
                    if (original.WEBSITE_RUN_FROM_PACKAGE === undefined) {
                        yield utils_1.Client.deleteAppSettingViaKudu(context.scmCredentials, 'WEBSITE_RUN_FROM_PACKAGE', 3, 3, false);
                    }
                    if (original.SCM_DO_BUILD_DURING_DEPLOYMENT === undefined) {
                        yield utils_1.Client.deleteAppSettingViaKudu(context.scmCredentials, 'SCM_DO_BUILD_DURING_DEPLOYMENT', 3, 3, false);
                    }
                    if (original.ENABLE_ORYX_BUILD === undefined) {
                        yield utils_1.Client.deleteAppSettingViaKudu(context.scmCredentials, 'ENABLE_ORYX_BUILD', 3, 3, false);
                    }
                }
            }
            catch (expt) {
                utils_1.Logger.Warn("Delete Application Settings: Failed to delete temporary SCM app settings.");
            }
        });
    }
    static checkAppSettingPropagatedToKudu(context, key, expectedValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let isSuccess = false;
            let retryCount = 20;
            const retryInterval = 5000;
            while (retryCount > 0) {
                yield utils_1.Sleeper.timeout(retryInterval);
                try {
                    const settings = yield context.kuduService.getAppSettings();
                    if (settings && settings[key] && settings[key] === expectedValue) {
                        isSuccess = true;
                        break;
                    }
                }
                catch (expt) {
                    utils_1.Logger.Warn(`Failed to check app setting propagation for ${key}, remaining retry ${retryCount - 1}`);
                }
                utils_1.Logger.Log(`App setting ${key} has not been propagated to Kudu container yet, remaining retry ${retryCount - 1}`);
                retryCount--;
            }
            if (isSuccess) {
                utils_1.Logger.Log(`App setting ${key} propagated to Kudu container`);
            }
            else {
                utils_1.Logger.Warn(`App setting ${key} fails to propagate to Kudu container`);
            }
        });
    }
    static waitForSpinUp(state, appUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            utils_1.Logger.Log("Waiting for function app to spin up after app settings change.");
            yield utils_1.Sleeper.timeout(5000);
            try {
                yield utils_1.Client.ping(appUrl, 10, 5);
            }
            catch (_a) {
                throw new exceptions_1.AzureResourceError(state, "Wait For Spin Up", "Cannot detect heartbeats from your function app." +
                    " Please check if your function app is up and running. You may need to manually restart it.");
            }
        });
    }
    static _updateApplicationSettings(context, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.authenticationType === authentication_type_1.AuthenticationType.Rbac) {
                utils_1.Logger.Log("Update using context.appService.patchApplicationSettings");
                return yield context.appService.patchApplicationSettings(settings);
            }
            if (context.authenticationType === authentication_type_1.AuthenticationType.Scm) {
                utils_1.Logger.Log("Update using Client.updateAppSettingViaKudu");
                return yield utils_1.Client.updateAppSettingViaKudu(context.scmCredentials, settings, 3);
            }
        });
    }
}
exports.ZipDeploy = ZipDeploy;
