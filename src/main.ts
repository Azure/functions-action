import * as core from '@actions/core';

import { Orchestrator } from './manager/orchestrator';
import { StateConstant } from './constants/state';
import { Initializer } from './handlers/initializer';
import { ParameterValidator } from './handlers/parameterValidator';
import { ResourceValidator } from './handlers/resourceValidator';
import { ContentPreparer } from './handlers/contentPreparer';
import { ContentPublisher } from './handlers/contentPublisher';
import { PublishValidator } from './handlers/publishValidator';
import { UnexpectedExitException, ExecutionException } from './exceptions';


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
            if (expt instanceof ExecutionException) {
                expt.PrintTraceback(core.error);
            } else if (expt instanceof Error) {
                core.error(expt.message);
                core.error(expt.stack);
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