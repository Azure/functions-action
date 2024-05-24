"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneDeployFlex = void 0;
const exceptions_1 = require("../exceptions");
const utils_1 = require("../utils");
class OneDeployFlex {
    static execute(state, context, remoteBuild) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = context.publishContentPath;
            let deploymentId;
            let isDeploymentSucceeded = false;
            try {
                utils_1.Logger.Info('Will use parameter remote-build: ' + remoteBuild.toString());
                deploymentId = yield context.kuduServiceUtil.deployUsingOneDeployFlex(filePath, remoteBuild.toString(), {
                    'slotName': context.appService ? context.appService.getSlot() : 'production'
                });
                isDeploymentSucceeded = true;
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "oneDeploy", `Failed to use ${filePath} as OneDeploy content`, expt);
            }
            return deploymentId;
        });
    }
}
exports.OneDeployFlex = OneDeployFlex;
