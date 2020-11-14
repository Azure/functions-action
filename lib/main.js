"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const orchestrator_1 = require("./managers/orchestrator");
const state_1 = require("./constants/state");
const initializer_1 = require("./handlers/initializer");
const parameterValidator_1 = require("./handlers/parameterValidator");
const resourceValidator_1 = require("./handlers/resourceValidator");
const contentPreparer_1 = require("./handlers/contentPreparer");
const contentPublisher_1 = require("./handlers/contentPublisher");
const publishValidator_1 = require("./handlers/publishValidator");
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
                if (expt instanceof exceptions_1.ExecutionException) {
                    expt.PrintTraceback(core.error);
                }
                else if (expt instanceof Error) {
                    core.error(expt.message);
                    core.error(expt.stack);
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
