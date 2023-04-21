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
exports.PublishValidator = void 0;
const core = require("@actions/core");
const configuration_1 = require("../constants/configuration");
const state_1 = require("../constants/state");
const AnnotationUtility_1 = require("../appservice-rest/Utilities/AnnotationUtility");
class PublishValidator {
    invoke(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.endpoint && context.appService) {
                yield (0, AnnotationUtility_1.addAnnotation)(context.endpoint, context.appService, true);
            }
            // Set app-url output to function app url
            core.setOutput(configuration_1.ConfigurationConstant.ParamOutResultName, context.appUrl);
            // Clean up AZURE_USER_AGENT
            core.exportVariable('AZURE_HTTP_USER_AGENT', context.azureHttpUserAgentPrefix);
            return state_1.StateConstant.Succeeded;
        });
    }
}
exports.PublishValidator = PublishValidator;
