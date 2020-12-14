import * as crypto from 'crypto';
import * as core from '@actions/core';
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { StateConstant } from '../constants/state';
import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from '../interfaces/IActionContext';
import { IActionParameters } from '../interfaces/IActionParameters';

export class Initializer implements IOrchestratable {
    public async invoke(): Promise<StateConstant> {
        const userAgentName: string = this.getUserAgent();
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentName);
        return StateConstant.ValidateParameter;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.azureHttpUserAgent = this.getUserAgent();
        context.azureHttpUserAgentPrefix = this.getUserAgentPrefix();
        return context;
    }

    private getUserAgentPrefix(): string {
        return !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
    }

    private getUserAgent(): string {
        const prefix = this.getUserAgentPrefix();
        const repo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        const action = ConfigurationConstant.ActionName;
        return (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${action}_${repo}`;
    }
}