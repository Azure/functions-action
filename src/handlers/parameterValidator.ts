import * as core from '@actions/core';

import { Package, exist } from 'azure-actions-utility/packageUtility'

import { AuthenticationType } from '../constants/authentication_type';
import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from '../interfaces/IActionContext';
import { IActionParameters } from '../interfaces/IActionParameters';
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { IScmCredentials } from '../interfaces/IScmCredentials';
import { StateConstant } from '../constants/state';
import { ValidationError } from '../exceptions';
import { parseString } from 'xml2js';
import { Builder } from '../managers/builder';
import { Logger } from '../utils/logger';
import { Parser } from '../utils/parser';
import { ScmBuildUtil } from '../constants/scm_build';
import { EnableOryxBuildUtil } from '../constants/enable_oryx_build';

export class ParameterValidator implements IOrchestratable {
    private _appName: string;
    private _packagePath: string;
    private _slot: string;
    private _publishProfile: string;
    private _respectPomXml: string;
    private _respectFuncignore: string;
    private _scmDoBuildDuringDeployment: string;
    private _enableOryxBuild: string;
    private _scmCredentials: IScmCredentials

    constructor() {
        this.parseScmCredentials = this.parseScmCredentials.bind(this);
        this.validateFields = this.validateFields.bind(this);
    }

    public async invoke(state: StateConstant): Promise<StateConstant> {
        // Parse action input from action.xml
        this._appName = core.getInput(ConfigurationConstant.ParamInAppName);
        this._packagePath = core.getInput(ConfigurationConstant.ParamInPackagePath);
        this._slot = core.getInput(ConfigurationConstant.ParamInSlot);
        this._publishProfile = core.getInput(ConfigurationConstant.ParamInPublishProfile);
        this._respectPomXml = core.getInput(ConfigurationConstant.ParamInRespectPomXml);
        this._respectFuncignore = core.getInput(ConfigurationConstant.ParamInRespectFuncignore);
        this._scmDoBuildDuringDeployment = core.getInput(ConfigurationConstant.ParamInScmDoBuildDuringDeployment);
        this._enableOryxBuild = core.getInput(ConfigurationConstant.ParamInEnableOryxBuild);

        // Validate field
        if (this._slot !== undefined && this._slot.trim() === "") {
            this._slot = undefined;
        }
        this.validateFields(state);
        this._scmCredentials = await this.parseScmCredentials(state, this._publishProfile);
        this.validateScmCredentialsSlotName(state);
        return StateConstant.ValidateAzureResource;
    }

    public async changeParams(_0: StateConstant, params: IActionParameters): Promise<IActionParameters> {
        params.appName = this._appName;
        params.packagePath = this._packagePath;
        params.slot = this._slot;
        params.publishProfile = this._publishProfile;
        params.respectPomXml = Parser.IsTrueLike(this._respectPomXml);
        params.respectFuncignore = Parser.IsTrueLike(this._respectFuncignore);
        params.scmDoBuildDuringDeployment = ScmBuildUtil.FromString(this._scmDoBuildDuringDeployment);
        params.enableOryxBuild = EnableOryxBuildUtil.FromString(this._enableOryxBuild);
        return params;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.package = new Package(this._packagePath);
        context.scmCredentials = this._scmCredentials;
        context.authenticationType = this._scmCredentials.appUrl ? AuthenticationType.Scm : AuthenticationType.Rbac;
        return context;
    }

    private async parseScmCredentials(state: StateConstant, publishProfile: string): Promise<IScmCredentials> {
        let creds: IScmCredentials = Builder.GetDefaultScmCredential();
        if (publishProfile === undefined || publishProfile === "") {
            return creds;
        }

        let xmlProfile: any = undefined;
        await parseString(publishProfile, (error, xmlResult) => {
            if (error) {
                throw new ValidationError(
                    state, ConfigurationConstant.ParamInPublishProfile,
                    "should be a valid XML. Please ensure your publish-profile secret is set in your " +
                    "GitHub repository by heading to GitHub repo -> Settings -> Secrets -> Repository secrets"
                );
            }
            xmlProfile = xmlResult;
        });

        if (this.tryParseOldPublishProfile(xmlProfile, creds)) {
            Logger.Info('Successfully parsed SCM credential from old publish-profile format.');
        } else if (this.tryParseNewPublishProfile(xmlProfile, creds)) {
            Logger.Info('Successfully passed SCM crednetial from new publish-profile format.');
        } else {
            throw new ValidationError(
                state, ConfigurationConstant.ParamInPublishProfile,
                "should contain valid SCM credentials. Please ensure your publish-profile contains 'MSDeploy' publish " +
                "method. Ensure 'userName', 'userPWD', and 'publishUrl' exist in the section. You can always acquire " +
                "the latest publish-profile from portal -> function app resource -> overview -> get publish profile"
            );
        }

        core.setSecret(`${creds.username}`);
        core.setSecret(`${creds.password}`);
        return creds;
    }

    private tryParseOldPublishProfile(xmlResult: any, out: IScmCredentials): boolean {
        // uri: hazeng-fa-python38-azurecli.scm.azurewebsites.net
        const options = xmlResult.publishData.publishProfile.filter((p: any) => {
            return p.$.publishMethod === "MSDeploy"
        });
        if ((options || []).length == 0) {
            Logger.Error('The old publish-profile does not contain MSDeploy publish method.');
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

    private tryParseNewPublishProfile(xmlResult: any, out: IScmCredentials): boolean {
        // uri: waws-prod-mwh-007.publish.azurewebsites.windows.net:443
        const options = xmlResult.publishData.publishProfile.filter((p: any) => {
            return p.$.publishMethod === "MSDeploy"
        });
        if ((options || []).length == 0) {
            Logger.Error('The new publish profile does not contain MSDeploy publish method.');
            return false;
        }
        const msDeploy = options[0].$;
        const publishUrl: string = msDeploy.publishUrl.split(":")[0];
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

    private validateFields(state: StateConstant): void {
        // app-name
        if (this._appName === undefined || this._appName.trim() === "") {
            throw new ValidationError(state, ConfigurationConstant.ParamInAppName, "should not be empty");
        }

        // package
        if (this._packagePath === undefined || this._packagePath.trim() === "") {
            throw new ValidationError(state, ConfigurationConstant.ParamInPackagePath, "should not be empty");
        }

        if (!exist(this._packagePath)) {
            throw new ValidationError(state, ConfigurationConstant.ParamInPackagePath, `cannot find '${this._packagePath}'`);
        }
    }

    private validateScmCredentialsSlotName(state: StateConstant): void {
        if (this._scmCredentials && this._scmCredentials.uri && this._appName && this._slot) {
            let urlName: string = this._appName;

            // If slot name is 'production', the url name should not contain 'production' in it
            if (this._slot.toLowerCase() !== ConfigurationConstant.ProductionSlotName) {
                urlName = `${this._appName}-${this._slot}`;
            }

            const lowercasedUri = this._scmCredentials.uri.toLowerCase()
            const lowercasedAppName = urlName.toLowerCase()
            if (lowercasedUri.indexOf(lowercasedAppName) === -1) {
                throw new ValidationError(
                    state, ConfigurationConstant.ParamInSlot,
                    `SCM credential does not match slot-name ${this._slot}. Please ensure the slot-name parameter has ` +
                    "correct casing and the publish-profile is acquired from your function app's slot rather than " +
                    "your main production site."
                );
            }
        }
    }
}
