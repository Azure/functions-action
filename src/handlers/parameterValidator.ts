import * as core from '@actions/core';
import { parseString } from 'xml2js';
import { exist, Package } from 'pipelines-appservice-lib/lib/Utilities/packageUtility'
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { StateConstant } from '../constants/state';
import { AuthenticationType } from '../constants/authentication_type';
import { IActionParameters } from '../interfaces/IActionParameters';
import { ValidationError } from '../exceptions';
import { IActionContext } from '../interfaces/IActionContext';
import { IScmCredentials } from '../interfaces/IScmCredentials';
import { ConfigurationConstant } from '../constants/configuration';


export class ParameterValidator implements IOrchestratable {
    private _appName: string;
    private _packagePath: string;
    private _slot: string;
    private _publishProfile: string;
    private _scmCredentials: IScmCredentials

    public async invoke(state: StateConstant): Promise<StateConstant> {
        this._appName = core.getInput(ConfigurationConstant.ParamInAppName);
        this._packagePath = core.getInput(ConfigurationConstant.ParamInPackagePath);
        this._slot = core.getInput(ConfigurationConstant.ParamInSlot);
        this._publishProfile = core.getInput(ConfigurationConstant.ParamInPublishProfile);
        if (this._slot !== undefined && this._slot.trim() === "") {
            this._slot = undefined;
        }
        this.validateFields(state);
        this._scmCredentials = await this.parseScmCredentials(state, this._publishProfile);
        return StateConstant.ValidateAzureResource;
    }

    public async changeParams(_0: StateConstant, params: IActionParameters): Promise<IActionParameters> {
        params.appName = this._appName;
        params.packagePath = this._packagePath;
        params.slot = this._slot;
        params.publishProfile = this._publishProfile;
        return params;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.package = new Package(this._packagePath);
        context.scmCredentials = this._scmCredentials;
        context.authenticationType = this._scmCredentials ? AuthenticationType.Scm : AuthenticationType.Rbac;
        return context;
    }

    private async parseScmCredentials(state: StateConstant, publishProfile: string): Promise<IScmCredentials> {
        let creds: IScmCredentials = undefined;
        if (publishProfile === undefined || publishProfile.trim() === "") {
            return creds;
        }

        await parseString(publishProfile, (error, result) => {
            if (error) {
                throw new ValidationError(state, ConfigurationConstant.ParamInPublishProfile, "should be a valid XML");
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
                throw new ValidationError(state, ConfigurationConstant.ParamInPublishProfile, "should contain scm URL");
            }
            creds.uri = `https://${creds.username}:${creds.password}@${creds.uri}`;
        });

        return creds;
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
}