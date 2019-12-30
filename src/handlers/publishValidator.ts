import * as core from '@actions/core';

import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from "../interfaces/IActionContext";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { addAnnotation } from 'azure-actions-appservice-rest/Utilities/AnnotationUtility';

export class PublishValidator implements IOrchestratable {
    public async invoke(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<StateConstant> {
        if (context.endpoint && context.appService) {
            await addAnnotation(context.endpoint, context.appService, true);
        }

        // Set app-url output to function app url
        core.setOutput(ConfigurationConstant.ParamOutResultName, context.appUrl);

        // Clean up AZURE_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', context.azureHttpUserAgentPrefix);

        return StateConstant.Succeeded;
    }
}