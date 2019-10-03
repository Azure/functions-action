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
const core = __importStar(require("@actions/core"));
const xml2js_1 = require("xml2js");
const packageUtility_1 = require("pipelines-appservice-lib/lib/Utilities/packageUtility");
const state_1 = require("../constants/state");
const authentication_type_1 = require("../constants/authentication_type");
const exceptions_1 = require("../exceptions");
const configuration_1 = require("../constants/configuration");
class ParameterValidator {
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
            context.authenticationType = this._scmCredentials ? authentication_type_1.AuthenticationType.Scm : authentication_type_1.AuthenticationType.Rbac;
            return context;
        });
    }
    parseScmCredentials(state, publishProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            let creds = undefined;
            if (publishProfile === undefined || publishProfile.trim() === "") {
                return creds;
            }
            yield xml2js_1.parseString(publishProfile, (error, result) => {
                if (error) {
                    throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPublishProfile, "should be a valid XML");
                }
                const res = result.publishData.publishProfile[0].$;
                creds = {
                    uri: res.publishUrl.split(":")[0],
                    username: res.userName,
                    password: res.userPWD,
                    appUrl: res.destinationAppUrl
                };
                console.log(`::add-mask::${creds.username}`);
                console.log(`::add-mask::${creds.password}`);
                if (creds.uri.indexOf("scm") < 0) {
                    throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPublishProfile, "should contain scm URL");
                }
                creds.uri = `https://${creds.username}:${creds.password}@${creds.uri}`;
            });
            return creds;
        });
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
}
exports.ParameterValidator = ParameterValidator;
