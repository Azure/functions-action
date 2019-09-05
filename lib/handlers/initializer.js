"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const core = __importStar(require("@actions/core"));
const state_1 = require("../constants/state");
const configuration_1 = require("../constants/configuration");
class Initializer {
    invoke() {
        return __awaiter(this, void 0, void 0, function* () {
            this.getUserAgentInformation();
            const userAgentName = this.getUserAgentName(this._userAgentActionName, this._userAgentRepo, this._userAgentPrefix);
            core.exportVariable(configuration_1.ConfigurationConstant.EnvAzureHttpUserAgent, userAgentName);
            return state_1.StateConstant.ValidateParameter;
        });
    }
    changeContext(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.azureHttpUserAgent = this.getUserAgentName(this._userAgentActionName, this._userAgentRepo, this._userAgentPrefix);
            return context;
        });
    }
    getUserAgentInformation() {
        if (process.env.AZURE_HTTP_USER_AGENT !== undefined) {
            this._userAgentPrefix = String(process.env.AZURE_HTTP_USER_AGENT);
        }
        this._userAgentActionName = configuration_1.ConfigurationConstant.ActionName;
        this._userAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
    }
    getUserAgentName(actionName, repo, prefix) {
        let agentName = `GITHUBACTIONS_${actionName}_${repo}`;
        if (prefix !== undefined) {
            agentName = `${prefix} ${agentName}`;
        }
        return agentName;
    }
}
exports.Initializer = Initializer;
