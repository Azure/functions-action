import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";
import { Logger, Sleeper, Client } from "../utils";
import { AuthenticationType } from "../constants/authentication_type";
import { IAppSettings } from "../interfaces/IAppSettings";
import { RuntimeStackConstant } from "../constants/runtime_stack";
import { FunctionSkuConstant } from "../constants/function_sku";

export class ZipDeploy {
    public static async execute(state: StateConstant, context: IActionContext): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        let isDeploymentSucceeded: boolean = false;
        this.validateApplicationSettings(state, context);

        try {
            await this.patchApplicationSettings(context);
            await this.waitForSpinUp(state, context.appUrl);
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
                'slotName': context.appService ? context.appService.getSlot() : 'production'
            });
        }

        await this.restoreApplicationSettings(context);
        return deploymentId;
    }

    private static validateApplicationSettings(state: StateConstant, context: IActionContext) {
        const appSettings: IAppSettings = context.appSettings;
        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trimLeft().startsWith('http')) {
            throw new AzureResourceError(state, "zipDepoy", "WEBSITE_RUN_FROM_PACKAGE in your function app is " +
                "set to an URL. Please remove WEBSITE_RUN_FROM_PACKAGE app setting from your function app.");
        }

        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trim() === '1' &&
            (context.os === undefined || context.os === RuntimeStackConstant.Linux)) {
            Logger.Warn("Detected WEBSITE_RUN_FROM_PACKAGE is set to '1'. If you are deploying to a Linux " +
                "function app, you may need to remove this app setting.");
            return;
        }
    }

    private static async patchApplicationSettings(context: IActionContext) {
        try {
            if (context.authenticationType === AuthenticationType.Rbac &&
                context.os === RuntimeStackConstant.Windows &&
                context.appSettings.WEBSITE_RUN_FROM_PACKAGE !== '1') {
                Logger.Warn('Setting WEBSITE_RUN_FROM_PACKAGE to 1');
                await context.appService.patchApplicationSettings({
                    'WEBSITE_RUN_FROM_PACKAGE': '1'
                });
                await this.checkAppSettingPropagatedToKudu(context, 'WEBSITE_RUN_FROM_PACKAGE', '1');
            } else if (context.authenticationType === AuthenticationType.Scm &&
                context.appSettings.SCM_DO_BUILD_DURING_DEPLOYMENT !== 'false') {
                Logger.Warn('Setting SCM_DO_BUILD_DURING_DEPLOYMENT in Kudu container to false');
                await Client.updateAppSettingViaKudu(context.scmCredentials.uri, {
                    'SCM_DO_BUILD_DURING_DEPLOYMENT': 'false'
                }, 3);
            }
        } catch (expt) {
            Logger.Warn("Patch Application Settings: Failed to change app settings.");
        }
    }

    private static async restoreApplicationSettings(context: IActionContext) {
        try {
            const original: IAppSettings = context.appSettings;
            if (context.authenticationType === AuthenticationType.Scm) {
                if (context.appSettings.SCM_DO_BUILD_DURING_DEPLOYMENT != original.SCM_DO_BUILD_DURING_DEPLOYMENT) {
                    Logger.Warn(`Restore SCM_DO_BUILD_DURING_DEPLOYMENT in Kudu container back to ${original.SCM_DO_BUILD_DURING_DEPLOYMENT}.`);
                    if (original.SCM_DO_BUILD_DURING_DEPLOYMENT === undefined) {
                        await Client.deleteAppSettingViaKudu(context.scmCredentials.uri, 'SCM_DO_BUILD_DURING_DEPLOYMENT', 3);
                    } else {
                        await Client.updateAppSettingViaKudu(context.scmCredentials.uri, {
                            'SCM_DO_BUILD_DURING_DEPLOYMENT': original.SCM_DO_BUILD_DURING_DEPLOYMENT
                        }, 3);
                    }
                }
            }
        } catch (expt) {
            Logger.Warn("Restore Application Settings: Failed to restore app settings.");
        }
    }

    private static async checkAppSettingPropagatedToKudu(context: IActionContext, key: string, expectedValue: string) {
        let isSuccess: boolean = false;
        let retryCount: number = 20;
        const retryInterval: number = 5000;
        while (retryCount > 0) {
            await Sleeper.timeout(retryInterval);
            try {
                const settings: any = await context.kuduService.getAppSettings();
                if (settings && settings[key] === expectedValue) {
                    isSuccess = true;
                    break;
                }
            } catch (expt) {
                Logger.Warn(`Failed to check app setting propagation for ${key}, remaining retry ${retryCount-1}`);
            }

            Logger.Warn(`App setting ${key} has not been propagated to Kudu container yet, remaining retry ${retryCount-1}`)
            retryCount--;
        }

        if (isSuccess) {
            Logger.Log(`App setting ${key} propagated to Kudu container`);
        } else {
            Logger.Warn(`App setting ${key} fails to propagate to Kudu container`);
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