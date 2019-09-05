import * as core from '@actions/core';
import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { ConfigurationConstant } from '../constants/configuration';

export class PublishValidator implements IOrchestratable {
    public async invoke(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<StateConstant> {
        const url: string = await context.appServiceUtil.getApplicationURL();
        core.setOutput(ConfigurationConstant.ParamOutResultName, url);
        return StateConstant.Succeeded;
    }
}