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
exports.ContentPublisher = void 0;
const state_1 = require("../constants/state");
const publish_method_1 = require("../constants/publish_method");
const exceptions_1 = require("../exceptions");
const publishers_1 = require("../publishers");
class ContentPublisher {
    invoke(state, params, context) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (context.publishMethod) {
                case publish_method_1.PublishMethodConstant.ZipDeploy:
                    yield publishers_1.ZipDeploy.execute(state, context, params.enableOryxBuild, params.scmDoBuildDuringDeployment);
                    break;
                case publish_method_1.PublishMethodConstant.WebsiteRunFromPackageDeploy:
                    yield publishers_1.WebsiteRunFromPackageDeploy.execute(state, context);
                    break;
                default:
                    throw new exceptions_1.ValidationError(state, "publisher", "can only performs ZipDeploy or WebsiteRunFromPackageDeploy");
            }
            return state_1.StateConstant.ValidatePublishedContent;
        });
    }
}
exports.ContentPublisher = ContentPublisher;
