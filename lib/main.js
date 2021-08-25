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
/*
 * This code snippet needs to be executed at the very beginning of the action.
 * Since the underlying azure-actions-appservice-rest will load the AZURE_HTTP_USER_AGENT
 * environment variable in the initialization.
 * Thus, the AZURE_HTTP_USER_AGENT needs to be set before any rest request.
 */
const core = require("@actions/core");
const crypto = require("crypto");
const configuration_1 = require("./constants/configuration");
const prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
const usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
const actionName = configuration_1.ConfigurationConstant.ActionName;
const userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
const orchestrator_1 = require("./managers/orchestrator");
const state_1 = require("./constants/state");
const initializer_1 = require("./handlers/initializer");
const parameterValidator_1 = require("./handlers/parameterValidator");
const resourceValidator_1 = require("./handlers/resourceValidator");
const contentPreparer_1 = require("./handlers/contentPreparer");
const contentPublisher_1 = require("./handlers/contentPublisher");
const publishValidator_1 = require("./handlers/publishValidator");
const utils_1 = require("./utils");
const exceptions_1 = require("./exceptions");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const actionManager = new orchestrator_1.Orchestrator();
        actionManager.register(state_1.StateConstant.Initialize, new initializer_1.Initializer());
        actionManager.register(state_1.StateConstant.ValidateParameter, new parameterValidator_1.ParameterValidator());
        actionManager.register(state_1.StateConstant.ValidateAzureResource, new resourceValidator_1.ResourceValidator());
        actionManager.register(state_1.StateConstant.PreparePublishContent, new contentPreparer_1.ContentPreparer());
        actionManager.register(state_1.StateConstant.PublishContent, new contentPublisher_1.ContentPublisher());
        actionManager.register(state_1.StateConstant.ValidatePublishedContent, new publishValidator_1.PublishValidator());
        while (!actionManager.isDone) {
            try {
                yield actionManager.execute();
            }
            catch (expt) {
                if (expt instanceof exceptions_1.BaseException) {
                    expt.PrintTraceback(utils_1.Logger.Error);
                }
                else if (expt instanceof Error) {
                    utils_1.Logger.Error(expt.message);
                    if (expt.stack) {
                        utils_1.Logger.Error(expt.stack);
                    }
                }
                break;
            }
        }
        switch (actionManager.state) {
            case state_1.StateConstant.Succeeded:
                core.debug("Deployment Succeeded!");
                return;
            case state_1.StateConstant.Failed:
                core.setFailed("Deployment Failed!");
                return;
            default:
                const expt = new exceptions_1.UnexpectedExitException(actionManager.state);
                core.setFailed(expt.message);
                throw expt;
        }
    });
}
main();
