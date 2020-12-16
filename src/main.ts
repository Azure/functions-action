/*
 * This code snippet needs to be executed at the very beginning of the action.
 * Since the underlying azure-actions-appservice-rest will load the AZURE_HTTP_USER_AGENT
 * environment variable in the initialization.
 * Thus, the AZURE_HTTP_USER_AGENT needs to be set before any rest request.
 */
import * as core from '@actions/core';
import * as crypto from "crypto";
import { ConfigurationConstant } from './constants/configuration';
const prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
const usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
const actionName = ConfigurationConstant.ActionName;
const userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

import { Orchestrator } from './managers/orchestrator';
import { StateConstant } from './constants/state';
import { Initializer } from './handlers/initializer';
import { ParameterValidator } from './handlers/parameterValidator';
import { ResourceValidator } from './handlers/resourceValidator';
import { ContentPreparer } from './handlers/contentPreparer';
import { ContentPublisher } from './handlers/contentPublisher';
import { PublishValidator } from './handlers/publishValidator';
import { Logger } from './utils';
import { UnexpectedExitException, BaseException } from './exceptions';


async function main(): Promise<void> {
    const actionManager = new Orchestrator();
    actionManager.register(StateConstant.Initialize, new Initializer());
    actionManager.register(StateConstant.ValidateParameter, new ParameterValidator());
    actionManager.register(StateConstant.ValidateAzureResource, new ResourceValidator());
    actionManager.register(StateConstant.PreparePublishContent, new ContentPreparer());
    actionManager.register(StateConstant.PublishContent, new ContentPublisher());
    actionManager.register(StateConstant.ValidatePublishedContent, new PublishValidator());

    while (!actionManager.isDone) {
        try {
            await actionManager.execute();
        } catch (expt) {
            if (expt instanceof BaseException) {
                expt.PrintTraceback(Logger.Error);
            } else if (expt instanceof Error) {
                Logger.Error(expt.message);
                if (expt.stack) {
                    Logger.Error(expt.stack);
                }
            }
            break;
        }
    }

    switch (actionManager.state) {
        case StateConstant.Succeeded:
            core.debug("Deployment Succeeded!");
            return
        case StateConstant.Failed:
            core.setFailed("Deployment Failed!");
            return
        default:
            const expt = new UnexpectedExitException(actionManager.state);
            core.setFailed(expt.message);
            throw expt;
    }
}

main();