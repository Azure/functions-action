import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";

export class ZipDeploy {
    public static async execute(state: StateConstant, context: IActionContext): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        let isDeploymentSucceeded: boolean = false;
        try {
            deploymentId = await context.kuduServiceUtil.deployUsingZipDeploy(filePath);
            isDeploymentSucceeded = true;
        } catch (expt) {
            throw new AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
        } finally {
            if (isDeploymentSucceeded) {
                await context.kuduServiceUtil.postZipDeployOperation(deploymentId, deploymentId);
            }
            await context.kuduServiceUtil.updateDeploymentStatus(isDeploymentSucceeded, null, { 'type': 'Deployment' });
        }

        return deploymentId;
    }
}