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
exports.ParameterValidator = void 0;
const core = require("@actions/core");
const packageUtility_1 = require("azure-actions-utility/packageUtility");
const authentication_type_1 = require("../constants/authentication_type");
const configuration_1 = require("../constants/configuration");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
const xml2js_1 = require("xml2js");
const builder_1 = require("../managers/builder");
const logger_1 = require("../utils/logger");
const parser_1 = require("../utils/parser");
const scm_build_1 = require("../constants/scm_build");
const enable_oryx_build_1 = require("../constants/enable_oryx_build");
class ParameterValidator {
    constructor() {
        this.parseScmCredentials = this.parseScmCredentials.bind(this);
        this.validateFields = this.validateFields.bind(this);
    }
    invoke(state) {
        return __awaiter(this, void 0, void 0, function* () {
            // Parse action input from action.xml
            this._appName = core.getInput(configuration_1.ConfigurationConstant.ParamInAppName);
            this._packagePath = core.getInput(configuration_1.ConfigurationConstant.ParamInPackagePath);
            this._slot = core.getInput(configuration_1.ConfigurationConstant.ParamInSlot);
            this._publishProfile = core.getInput(configuration_1.ConfigurationConstant.ParamInPublishProfile);
            this._respectPomXml = core.getInput(configuration_1.ConfigurationConstant.ParamInRespectPomXml);
            this._respectFuncignore = core.getInput(configuration_1.ConfigurationConstant.ParamInRespectFuncignore);
            this._scmDoBuildDuringDeployment = core.getInput(configuration_1.ConfigurationConstant.ParamInScmDoBuildDuringDeployment);
            this._enableOryxBuild = core.getInput(configuration_1.ConfigurationConstant.ParamInEnableOryxBuild);
            // Validate field
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
            params.respectPomXml = parser_1.Parser.IsTrueLike(this._respectPomXml);
            params.respectFuncignore = parser_1.Parser.IsTrueLike(this._respectFuncignore);
            params.scmDoBuildDuringDeployment = scm_build_1.ScmBuildUtil.FromString(this._scmDoBuildDuringDeployment);
            params.enableOryxBuild = enable_oryx_build_1.EnableOryxBuildUtil.FromString(this._enableOryxBuild);
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
            yield (0, xml2js_1.parseString)(publishProfile, (error, xmlResult) => {
                if (error) {
                    throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPublishProfile, "should be a valid XML. Please ensure your publish-profile secret is set in your " +
                        "GitHub repository by heading to GitHub repo -> Settings -> Secrets -> Repository secrets");
                }
                xmlProfile = xmlResult;
            });
            if (this.tryParsePublishProfileZipDeploy(xmlProfile, creds)) {
                logger_1.Logger.Info('Successfully parsed SCM credential from publish-profile format.');
            }
            else if (this.tryParseOldPublishProfile(xmlProfile, creds)) {
                logger_1.Logger.Info('Successfully parsed SCM credential from old publish-profile format.');
            }
            else if (this.tryParseNewPublishProfile(xmlProfile, creds)) {
                logger_1.Logger.Info('Successfully passed SCM crednetial from new publish-profile format.');
            }
            else {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPublishProfile, "should contain valid SCM credentials. Please ensure your publish-profile contains 'ZipDeploy' publish or 'MSDeploy' publish " +
                    "method. Ensure 'userName', 'userPWD', and 'publishUrl' exist in the section. You can always acquire " +
                    "the latest publish-profile from portal -> function app resource -> overview -> get publish profile");
            }
            core.setSecret(`${creds.username}`);
            core.setSecret(`${creds.password}`);
            return creds;
        });
    }
    tryParsePublishProfileZipDeploy(xmlResult, out) {
        // uri: cp-win-dotnet.scm.azurewebsites.net
        const options = xmlResult.publishData.publishProfile.filter((p) => {
            return p.$.publishMethod === "ZipDeploy";
        });
        if ((options || []).length == 0) {
            logger_1.Logger.Error('The publish profile does not contain ZipDeploy publish method.');
            return false;
        }
        const zipDeploy = options[0].$;
        const publishUrl = zipDeploy.publishUrl.split(":")[0];
        if (publishUrl.indexOf(".scm.") >= 0) {
            out.uri = `https://${zipDeploy.userName}:${zipDeploy.userPWD}@${publishUrl}`;
            out.username = zipDeploy.userName;
            out.password = zipDeploy.userPWD;
            out.appUrl = zipDeploy.destinationAppUrl;
            return true;
        }
        return false;
    }
    tryParseOldPublishProfile(xmlResult, out) {
        // uri: hazeng-fa-python38-azurecli.scm.azurewebsites.net
        const options = xmlResult.publishData.publishProfile.filter((p) => {
            return p.$.publishMethod === "MSDeploy";
        });
        if ((options || []).length == 0) {
            logger_1.Logger.Error('The old publish-profile does not contain MSDeploy publish method.');
            return false;
        }
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
        if ((options || []).length == 0) {
            logger_1.Logger.Error('The new publish profile does not contain MSDeploy publish method.');
            return false;
        }
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
        if (!(0, packageUtility_1.exist)(this._packagePath)) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPackagePath, `cannot find '${this._packagePath}'`);
        }
    }
    validateScmCredentialsSlotName(state) {
        if (this._scmCredentials && this._scmCredentials.uri && this._appName && this._slot) {
            let urlName = this._appName;
            // If slot name is 'production', the url name should not contain 'production' in it
            if (this._slot.toLowerCase() !== configuration_1.ConfigurationConstant.ProductionSlotName) {
                urlName = `${this._appName}-${this._slot}`;
            }
            const lowercasedUri = this._scmCredentials.uri.toLowerCase();
            const lowercasedAppName = urlName.toLowerCase();
            if (lowercasedUri.indexOf(lowercasedAppName) === -1) {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInSlot, `SCM credential does not match slot-name ${this._slot}. Please ensure the slot-name parameter has ` +
                    "correct casing and the publish-profile is acquired from your function app's slot rather than " +
                    "your main production site.");
            }
        }
    }
}
exports.ParameterValidator = ParameterValidator;
