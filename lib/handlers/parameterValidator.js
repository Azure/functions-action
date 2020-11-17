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
exports.ParameterValidator = void 0;
const core = __importStar(require("@actions/core"));
const packageUtility_1 = require("azure-actions-utility/packageUtility");
const authentication_type_1 = require("../constants/authentication_type");
const configuration_1 = require("../constants/configuration");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
const xml2js_1 = require("xml2js");
const builder_1 = require("../managers/builder");
const logger_1 = require("../utils/logger");
class ParameterValidator {
    constructor() {
        this.parseScmCredentials = this.parseScmCredentials.bind(this);
    }
    invoke(state) {
        return __awaiter(this, void 0, void 0, function* () {
            this._appName = core.getInput(configuration_1.ConfigurationConstant.ParamInAppName);
            this._packagePath = core.getInput(configuration_1.ConfigurationConstant.ParamInPackagePath);
            this._slot = core.getInput(configuration_1.ConfigurationConstant.ParamInSlot);
            this._publishProfile = core.getInput(configuration_1.ConfigurationConstant.ParamInPublishProfile);
            if (this._slot !== undefined && this._slot.trim() === "") {
                this._slot = undefined;
            }
            this.validateFields(state);
            this._scmCredentials = yield this.parseScmCredentials(state, this._publishProfile);
            this.validateScmCredentialsSlotName(state);
            return state_1.StateConstant.ValidateAzureResource;
        });
    }
    changeParams(_0, params) {
        return __awaiter(this, void 0, void 0, function* () {
            params.appName = this._appName;
            params.packagePath = this._packagePath;
            params.slot = this._slot;
            params.publishProfile = this._publishProfile;
            return params;
        });
    }
    changeContext(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.package = new packageUtility_1.Package(this._packagePath);
            context.scmCredentials = this._scmCredentials;
            context.authenticationType = this._scmCredentials.appUrl ? authentication_type_1.AuthenticationType.Scm : authentication_type_1.AuthenticationType.Rbac;
            return context;
        });
    }
    parseScmCredentials(state, publishProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            let creds = builder_1.Builder.GetDefaultScmCredential();
            if (publishProfile === undefined || publishProfile === "") {
                return creds;
            }
            let xmlProfile = undefined;
            yield xml2js_1.parseString(publishProfile, (error, xmlResult) => {
                if (error) {
                    throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPublishProfile, "should be a valid XML");
                }
                xmlProfile = xmlResult;
            });
            if (this.tryParseOldPublishProfile(xmlProfile, creds)) {
                logger_1.Logger.Log('Successfully parsed SCM credential from old publishProfile');
            }
            else if (this.tryParseNewPublishProfile(xmlProfile, creds)) {
                logger_1.Logger.Log('Successfully passed SCM crednetial from new publishProfile');
            }
            else {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPublishProfile, "should contain valid SCM credential");
            }
            core.setSecret(`${creds.username}`);
            core.setSecret(`${creds.password}`);
            return creds;
        });
    }
    tryParseOldPublishProfile(xmlResult, out) {
        // uri: hazeng-fa-python38-azurecli.scm.azurewebsites.net
        const options = xmlResult.publishData.publishProfile.filter((p) => {
            return p.$.publishMethod === "MSDeploy";
        });
        const msDeploy = options[0].$;
        const publishUrl = msDeploy.publishUrl.split(":")[0];
        if (publishUrl.indexOf(".scm.") >= 0) {
            out.uri = `https://${msDeploy.userName}:${msDeploy.userPWD}@${publishUrl}`;
            out.username = msDeploy.userName;
            out.password = msDeploy.userPWD;
            out.appUrl = msDeploy.destinationAppUrl;
            return true;
        }
        return false;
    }
    tryParseNewPublishProfile(xmlResult, out) {
        // uri: waws-prod-mwh-007.publish.azurewebsites.windows.net:443
        const options = xmlResult.publishData.publishProfile.filter((p) => {
            return p.$.publishMethod === "MSDeploy";
        });
        const msDeploy = options[0].$;
        const publishUrl = msDeploy.publishUrl.split(":")[0];
        if (publishUrl.indexOf(".publish.") >= 0) {
            // appName contains slot name setting
            const appName = msDeploy.userName.substring(1).replace('__', '-');
            out.uri = `https://${msDeploy.userName}:${msDeploy.userPWD}@${appName}.scm.azurewebsites.net`;
            out.username = msDeploy.userName;
            out.password = msDeploy.userPWD;
            out.appUrl = msDeploy.destinationAppUrl;
            return true;
        }
        return false;
    }
    validateFields(state) {
        // app-name
        if (this._appName === undefined || this._appName.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInAppName, "should not be empty");
        }
        // package
        if (this._packagePath === undefined || this._packagePath.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPackagePath, "should not be empty");
        }
        if (!packageUtility_1.exist(this._packagePath)) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPackagePath, `cannot find '${this._packagePath}'`);
        }
    }
    validateScmCredentialsSlotName(state) {
        if (this._scmCredentials && this._appName && this._slot) {
            let urlName = this._appName;
            // If slot name is 'production', the url name should not contain 'production' in it
            if (this._slot.toLowerCase() !== configuration_1.ConfigurationConstant.ProductionSlotName) {
                urlName = `${this._appName}-${this._slot}`;
            }
            if (this._scmCredentials.uri.indexOf(urlName) === -1) {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInSlot, `SCM credential does not match slot-name`);
            }
        }
    }
}
exports.ParameterValidator = ParameterValidator;
