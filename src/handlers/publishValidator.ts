import * as core from '@actions/core';
import { addAnnotation } from 'pipelines-appservice-lib/lib/RestUtilities/AnnotationUtility';
import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { ConfigurationConstant } from '../constants/configuration';

export class PublishValidator implements IOrchestratable {
    public async invoke(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<StateConstant> {
        await addAnnotation(context.endpoint, context.appService, true);

        core.setOutput(ConfigurationConstant.ParamOutResultName, context.appUrl);
        return StateConstant.Succeeded;
    }
}