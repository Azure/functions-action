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
exports.Initializer = void 0;
const crypto = require("crypto");
const core = require("@actions/core");
const state_1 = require("../constants/state");
const configuration_1 = require("../constants/configuration");
class Initializer {
    invoke() {
        return __awaiter(this, void 0, void 0, function* () {
            const userAgentName = this.getUserAgent();
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentName);
            return state_1.StateConstant.ValidateParameter;
        });
    }
    changeContext(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.azureHttpUserAgent = this.getUserAgent();
            context.azureHttpUserAgentPrefix = this.getUserAgentPrefix();
            return context;
        });
    }
    getUserAgentPrefix() {
        return !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
    }
    getUserAgent() {
        const prefix = this.getUserAgentPrefix();
        const repo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        const action = configuration_1.ConfigurationConstant.ActionName;
        return (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${action}_${repo}`;
    }
}
exports.Initializer = Initializer;
