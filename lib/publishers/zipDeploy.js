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
class ZipDeploy {
    static execute(state, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = context.publishContentPath;
            let deploymentId;
            let isDeploymentSucceeded = false;
            try {
                deploymentId = yield context.kuduServiceUtil.deployUsingZipDeploy(filePath);
                if (!context.isLinux) {
                    this.patchWebsiteRunFromPackageSetting(context);
                }
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
                    'slotName': context.appService.getSlot()
                });
            }
            return deploymentId;
        });
    }
    static patchWebsiteRunFromPackageSetting(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield context.appService.patchApplicationSettings({ 'WEBSITE_RUN_FROM_PACKAGE': '1' });
            }
            catch (expt) {
                utils_1.Logger.Warn("Patch Application Settings: Failed to set WEBSITE_RUN_FROM_PACKAGE to 1.");
            }
        });
    }
}
exports.ZipDeploy = ZipDeploy;
