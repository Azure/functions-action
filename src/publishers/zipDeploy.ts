import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";

export class ZipDeploy {
    public static async execute(state: StateConstant, context: IActionContext): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        try {
            deploymentId = await context.kuduServiceUtil.deployUsingZipDeploy(filePath);
        } catch (expt) {
            throw new AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
        }

        if (deploymentId) {
            await context.kuduServiceUtil.postZipDeployOperation(deploymentId, deploymentId);
        }

        return deploymentId;
    }
}