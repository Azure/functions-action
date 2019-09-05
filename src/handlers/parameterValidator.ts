import * as core from '@actions/core';
import { exist, Package } from 'pipelines-appservice-lib/lib/Utilities/packageUtility'
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { StateConstant } from '../constants/state';
import { IActionParameters } from '../interfaces/IActionParameters';
import { ValidationError } from '../exceptions';
import { IActionContext } from '../interfaces/IActionContext';
import { ConfigurationConstant } from '../constants/configuration';


export class ParameterValidator implements IOrchestratable {
    private _appName: string;
    private _packagePath: string;

    public async invoke(state: StateConstant): Promise<StateConstant> {
        this._appName = core.getInput(ConfigurationConstant.ParamInAppName);
        this._packagePath = core.getInput(ConfigurationConstant.ParamInPackagePath);
        this.validateFields(state);
        return StateConstant.ValidateAzureResource;
    }

    public async changeParams(_0: StateConstant, params: IActionParameters): Promise<IActionParameters> {
        params.appName = this._appName;
        params.packagePath = this._packagePath;
        return params;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.package = new Package(this._packagePath);
        return context;
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