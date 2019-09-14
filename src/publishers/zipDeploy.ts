import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";
import { Logger } from "../utils";

export class ZipDeploy {
    public static async execute(state: StateConstant, context: IActionContext): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        let isDeploymentSucceeded: boolean = false;
        try {
            deploymentId = await context.kuduServiceUtil.deployUsingZipDeploy(filePath);
            if (!context.isLinux) {
                this.patchWebsiteRunFromPackageSetting(context);
            }
            isDeploymentSucceeded = true;
        } catch (expt) {
            throw new AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
        } finally {
            if (isDeploymentSucceeded) {
                await context.kuduServiceUtil.postZipDeployOperation(deploymentId, deploymentId);
            }
            await context.kuduServiceUtil.updateDeploymentStatus(isDeploymentSucceeded, null, {
                'type': 'Deployment',
                'slotName': context.appService.getSlot()
            });
        }
        return deploymentId;
    }

    private static async patchWebsiteRunFromPackageSetting(context: IActionContext) {
        try {
            await context.appService.patchApplicationSettings({ 'WEBSITE_RUN_FROM_PACKAGE': '1' });
        } catch (expt) {
            Logger.Warn("Patch Application Settings: Failed to set WEBSITE_RUN_FROM_PACKAGE to 1.");
        }
    }
}