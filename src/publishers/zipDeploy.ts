import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";
import { Logger, Sleeper, Client } from "../utils";

export class ZipDeploy {
    public static async execute(state: StateConstant, context: IActionContext): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        let isDeploymentSucceeded: boolean = false;
        try {
            if (!context.isLinux) {
                this.patchWebsiteRunFromPackageSetting(context);
                this.waitForSpinUp(state, context.appUrl);
            }
            deploymentId = await context.kuduServiceUtil.deployUsingZipDeploy(filePath);
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

    private static async waitForSpinUp(state: StateConstant, appUrl: string) {
        Logger.Log("Waiting for function app to spin up after app settings change.");
        await Sleeper.timeout(5000);
        try {
            await Client.ping(appUrl, 10, 5);
        } catch {
            throw new AzureResourceError(state, "Wait For Spin Up", "Cannot detect heartbeats from your function app." +
            " Please check if your function app is up and running. You may need to manually restart it.");
        }
    }
}