import * as crypto from 'crypto';
import * as core from '@actions/core';
import { IOrchestratable } from '../interfaces/IOrchestratable';
import { StateConstant } from '../constants/state';
import { ConfigurationConstant } from '../constants/configuration';
import { IActionContext } from '../interfaces/IActionContext';
import { IActionParameters } from '../interfaces/IActionParameters';

export class Initializer implements IOrchestratable {
    private _userAgentPrefix: string;
    private _userAgentActionName: string;
    private _userAgentRepo: string;

    public async invoke(): Promise<StateConstant> {
        this.getUserAgentInformation();
        const userAgentName: string = this.getUserAgentName(
            this._userAgentActionName,
            this._userAgentRepo,
            this._userAgentPrefix
        );
        core.exportVariable(ConfigurationConstant.EnvAzureHttpUserAgent, userAgentName);
        return StateConstant.ValidateParameter;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.azureHttpUserAgent = this.getUserAgentName(
            this._userAgentActionName,
            this._userAgentRepo,
            this._userAgentPrefix
        );
        return context;
    }

    private getUserAgentInformation(): void {
        if (process.env.AZURE_HTTP_USER_AGENT !== undefined) {
            this._userAgentPrefix = String(process.env.AZURE_HTTP_USER_AGENT);
        }
        this._userAgentActionName = ConfigurationConstant.ActionName;
        this._userAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
    }

    private getUserAgentName(actionName: string, repo: string, prefix?: string): string {
        let agentName: string = `GITHUBACTIONS_${actionName}_${repo}`;
        if (prefix !== undefined) {
            agentName = `${prefix} ${agentName}`;
        }
        return agentName;
    }
}