import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";
import { Logger, Sleeper, Parser } from "../utils";

export class OneDeployFlex {
    public static async execute(
        state: StateConstant,
        context: IActionContext,
        remoteBuild: boolean
    ): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        let isDeploymentSucceeded: boolean = false;

        try {
            Logger.Info('Will use parameter remote build = ' + remoteBuild.toString());
            deploymentId = await context.kuduServiceUtil.deployUsingOneDeployFlex(filePath, remoteBuild.toString(), {
                'slotName': context.appService ? context.appService.getSlot() : 'production'
            });
            
            isDeploymentSucceeded = true;
        } catch (expt) {
            throw new AzureResourceError(state, "oneDeploy", `Failed to use ${filePath} as OneDeploy content`, expt);
        }

        return deploymentId;
    }
}
