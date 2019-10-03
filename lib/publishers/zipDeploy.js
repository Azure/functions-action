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
            try {
                yield this.patchApplicationSettings(context);
                yield this.waitForSpinUp(state, context.appUrl);
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
            yield this.restoreApplicationSettings(context);
            return deploymentId;
        });
    }
    static validateApplicationSettings(state, context) {
        const appSettings = context.appSettings;
        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trimLeft().startsWith('http')) {
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
                if (context.authenticationType === authentication_type_1.AuthenticationType.Rbac &&
                    context.os === runtime_stack_1.RuntimeStackConstant.Windows &&
                    context.appSettings.WEBSITE_RUN_FROM_PACKAGE !== '1') {
                    utils_1.Logger.Warn('Setting WEBSITE_RUN_FROM_PACKAGE to 1');
                    yield context.appService.patchApplicationSettings({
                        'WEBSITE_RUN_FROM_PACKAGE': '1'
                    });
                    yield this.checkAppSettingPropagatedToKudu(context, 'WEBSITE_RUN_FROM_PACKAGE', '1');
                }
                else if (context.authenticationType === authentication_type_1.AuthenticationType.Scm &&
                    context.appSettings.SCM_DO_BUILD_DURING_DEPLOYMENT !== 'false') {
                    utils_1.Logger.Warn('Setting SCM_DO_BUILD_DURING_DEPLOYMENT in Kudu container to false');
                    yield utils_1.Client.updateAppSettingViaKudu(context.scmCredentials.uri, {
                        'SCM_DO_BUILD_DURING_DEPLOYMENT': 'false'
                    }, 3);
                }
            }
            catch (expt) {
                utils_1.Logger.Warn("Patch Application Settings: Failed to change app settings.");
            }
        });
    }
    static restoreApplicationSettings(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const original = context.appSettings;
                if (context.authenticationType === authentication_type_1.AuthenticationType.Scm) {
                    if (context.appSettings.SCM_DO_BUILD_DURING_DEPLOYMENT != original.SCM_DO_BUILD_DURING_DEPLOYMENT) {
                        utils_1.Logger.Warn(`Restore SCM_DO_BUILD_DURING_DEPLOYMENT in Kudu container back to ${original.SCM_DO_BUILD_DURING_DEPLOYMENT}.`);
                        if (original.SCM_DO_BUILD_DURING_DEPLOYMENT === undefined) {
                            yield utils_1.Client.deleteAppSettingViaKudu(context.scmCredentials.uri, 'SCM_DO_BUILD_DURING_DEPLOYMENT', 3);
                        }
                        else {
                            yield utils_1.Client.updateAppSettingViaKudu(context.scmCredentials.uri, {
                                'SCM_DO_BUILD_DURING_DEPLOYMENT': original.SCM_DO_BUILD_DURING_DEPLOYMENT
                            }, 3);
                        }
                    }
                }
            }
            catch (expt) {
                utils_1.Logger.Warn("Restore Application Settings: Failed to restore app settings.");
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
                    if (settings && settings[key] === expectedValue) {
                        isSuccess = true;
                        break;
                    }
                }
                catch (expt) {
                    utils_1.Logger.Warn(`Failed to check app setting propagation for ${key}, remaining retry ${retryCount - 1}`);
                }
                utils_1.Logger.Warn(`App setting ${key} has not been propagated to Kudu container yet, remaining retry ${retryCount - 1}`);
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
}
exports.ZipDeploy = ZipDeploy;
