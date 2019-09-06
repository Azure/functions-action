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
class ZipDeploy {
    static execute(state, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = context.publishContentPath;
            let deploymentId;
            try {
                deploymentId = yield context.kuduServiceUtil.deployUsingZipDeploy(filePath);
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
            }
            if (deploymentId) {
                yield context.kuduServiceUtil.postZipDeployOperation(deploymentId, deploymentId);
            }
            return deploymentId;
        });
    }
}
exports.ZipDeploy = ZipDeploy;
