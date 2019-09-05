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
const AuthorizationHandlerFactory_1 = require("pipelines-appservice-lib/lib/AuthorizationHandlerFactory");
const AzureResourceFilterUtility_1 = require("pipelines-appservice-lib/lib/RestUtilities/AzureResourceFilterUtility");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
class ResourceHandler {
    invoke(state, params) {
        return __awaiter(this, void 0, void 0, function* () {
            this._endpoint = AuthorizationHandlerFactory_1.getHandler();
            yield this.getResourceDetails(state, this._endpoint, params.appName);
            return state_1.StateConstant.ValidateFunctionappSettings;
        });
    }
    changeContext(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.isLinux = this._isLinux;
            context.kind = this._kind;
            context.resourceGroupName = this._resourceGroupName;
            context.endpoint = this._endpoint;
            return context;
        });
    }
    getResourceDetails(state, endpoint, appName) {
        return __awaiter(this, void 0, void 0, function* () {
            let appDetails = yield AzureResourceFilterUtility_1.AzureResourceFilterUtility.getAppDetails(endpoint, appName);
            if (appDetails === undefined) {
                throw new exceptions_1.ValidationError(state, "app-name", "function app should exist");
            }
            this._resourceGroupName = appDetails["resourceGroupName"];
            this._kind = appDetails["kind"];
            this._isLinux = this._kind.indexOf('linux') >= 0;
        });
    }
}
exports.ResourceHandler = ResourceHandler;
