import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";
import { Logger, Sleeper, Client, Parser } from "../utils";
import { AuthenticationType } from "../constants/authentication_type";
import { IAppSettings } from "../interfaces/IAppSettings";
import { RuntimeStackConstant } from "../constants/runtime_stack";
import { EnableOryxBuildConstant, EnableOryxBuildUtil } from "../constants/enable_oryx_build";
import { ScmBuildConstant, ScmBuildUtil } from "../constants/scm_build";


export class ZipDeploy {
    public static async execute(
        state: StateConstant,
        context: IActionContext,
        enableOryxBuild: EnableOryxBuildConstant,
        scmDobuildDuringDeployment: ScmBuildConstant
    ): Promise<string> {
        const filePath: string = context.publishContentPath;
        let deploymentId: string;
        let isDeploymentSucceeded: boolean = false;
        this.validateApplicationSettings(state, context);
        const originalAppSettings: IAppSettings = context.appSettings;

        try {
            await this.patchTemporaryAppSettings(context, enableOryxBuild, scmDobuildDuringDeployment);
            await Client.validateZipDeploy(context, filePath); 
            deploymentId = await context.kuduServiceUtil.deployUsingZipDeploy(filePath, {
                'slotName': context.appService ? context.appService.getSlot() : 'production'
            });
            isDeploymentSucceeded = true;
        } catch (expt) {
            throw new AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
        } finally {
            if (isDeploymentSucceeded) {
                await context.kuduServiceUtil.postZipDeployOperation(deploymentId, deploymentId);
            }
        }

        await this.restoreScmTemporarySettings(context, originalAppSettings);
        await this.deleteScmTemporarySettings(context, originalAppSettings);
        return deploymentId;
    }

    private static validateApplicationSettings(state: StateConstant, context: IActionContext) {
        const appSettings: IAppSettings = context.appSettings;
        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trim().startsWith('http')) {
            throw new AzureResourceError(state, "zipDepoy", "WEBSITE_RUN_FROM_PACKAGE in your function app is " +
                "set to an URL. Please remove WEBSITE_RUN_FROM_PACKAGE app setting from your function app.");
        }

        if (appSettings.WEBSITE_RUN_FROM_PACKAGE !== undefined &&
            appSettings.WEBSITE_RUN_FROM_PACKAGE.trim() === '0' &&
            (context.os === undefined || context.os === RuntimeStackConstant.Linux)) {
            Logger.Warn("Detected WEBSITE_RUN_FROM_PACKAGE is set to '0'. If you are deploying to a Linux " +
                "function app, you may need to remove this app setting.");
            return;
        }
    }

    private static async patchTemporaryAppSettings(
        context: IActionContext,
        enableOryxBuild: EnableOryxBuildConstant,
        scmDoBuildDuringDeployment: ScmBuildConstant
    ) {
        try {
            if (context.os === RuntimeStackConstant.Windows &&
                context.authenticationType === AuthenticationType.Rbac &&
                !Parser.IsTrueLike(context.appSettings.WEBSITE_RUN_FROM_PACKAGE)) {
                Logger.Info('Setting WEBSITE_RUN_FROM_PACKAGE to 1');
                await this._updateApplicationSettings(context, { 'WEBSITE_RUN_FROM_PACKAGE': '1' });
                await this.checkAppSettingPropagatedToKudu(context, 'WEBSITE_RUN_FROM_PACKAGE', '1');
            }

            if (context.authenticationType === AuthenticationType.Scm &&
                scmDoBuildDuringDeployment !== ScmBuildConstant.NotSet) {
                const scmValue = ScmBuildUtil.ToString(scmDoBuildDuringDeployment);
                Logger.Info(`Setting SCM_DO_BUILD_DURING_DEPLOYMENT in Kudu container to ${scmValue}`);
                await this._updateApplicationSettings(context, { 'SCM_DO_BUILD_DURING_DEPLOYMENT': scmValue });
                await this.checkAppSettingPropagatedToKudu(context, 'SCM_DO_BUILD_DURING_DEPLOYMENT', scmValue);
            }

            if (context.authenticationType === AuthenticationType.Scm &&
                enableOryxBuild !== EnableOryxBuildConstant.NotSet) {
                const oryxValue = EnableOryxBuildUtil.ToString(enableOryxBuild);
                Logger.Info(`Setting ENABLE_ORYX_BUILD in Kudu container to ${oryxValue}`);
                await this._updateApplicationSettings(context, { 'ENABLE_ORYX_BUILD': oryxValue });
                await this.checkAppSettingPropagatedToKudu(context, 'ENABLE_ORYX_BUILD', oryxValue);
            }

        } catch (expt) {
            Logger.Warn(`Patch Temporary Application Settings: Failed to change app settings. ${expt}`);
        }
    }

    private static async restoreScmTemporarySettings(context: IActionContext, original: IAppSettings) {
        try {
            if (context.authenticationType === AuthenticationType.Scm) {
                // Restore previous app settings if they are temporarily changed
                if (original.WEBSITE_RUN_FROM_PACKAGE) {
                    await Client.updateAppSettingViaKudu(context.scmCredentials, {
                        'WEBSITE_RUN_FROM_PACKAGE': original.WEBSITE_RUN_FROM_PACKAGE
                    }, 3, 3, false);
                }
                if (original.SCM_DO_BUILD_DURING_DEPLOYMENT) {
                    await Client.updateAppSettingViaKudu(context.scmCredentials, {
                        'SCM_DO_BUILD_DURING_DEPLOYMENT': original.SCM_DO_BUILD_DURING_DEPLOYMENT
                    }, 3, 3, false);
                }
                if (original.ENABLE_ORYX_BUILD) {
                    await Client.updateAppSettingViaKudu(context.scmCredentials, {
                        'ENABLE_ORYX_BUILD': original.ENABLE_ORYX_BUILD
                    }, 3, 3, false);
                }
            }
        } catch (expt) {
            Logger.Warn("Restore Application Settings: Failed to restore temporary SCM app settings.");
        }
    }

    private static async deleteScmTemporarySettings(context: IActionContext, original: IAppSettings) {
        try {
            if (context.authenticationType === AuthenticationType.Scm) {
                // Delete previous app settings if they are temporarily set
                if (original.WEBSITE_RUN_FROM_PACKAGE === undefined) {
                    await Client.deleteAppSettingViaKudu(context.scmCredentials,
                        'WEBSITE_RUN_FROM_PACKAGE', 3, 3, false);
                }
                if (original.SCM_DO_BUILD_DURING_DEPLOYMENT === undefined) {
                    await Client.deleteAppSettingViaKudu(context.scmCredentials,
                        'SCM_DO_BUILD_DURING_DEPLOYMENT', 3, 3, false);
                }
                if (original.ENABLE_ORYX_BUILD === undefined) {
                    await Client.deleteAppSettingViaKudu(context.scmCredentials,
                        'ENABLE_ORYX_BUILD', 3, 3, false);
                }
            }
        } catch (expt) {
            Logger.Warn("Delete Application Settings: Failed to delete temporary SCM app settings.");
        }
    }

    private static async checkAppSettingPropagatedToKudu(context: IActionContext, key: string, expectedValue: string) {
        let isSuccess: boolean = false;
        let retryCount: number = 20;
        const retryInterval: number = 5000;
        while (retryCount > 0) {
            await Sleeper.timeout(retryInterval);
            try {
                if (context.authenticationType === AuthenticationType.Rbac) {
                    const settings: any = await context.appService.getApplicationSettings();
                    if (settings && settings.properties[key] && settings.properties[key] === expectedValue) {
                        isSuccess = true;
                        break;
                    }
                }
                else{
                    const settings: any = await context.kuduService.getAppSettings();
                    if (settings && settings[key] && settings[key] === expectedValue) {
                        isSuccess = true;
                        break;
                    }
                }

            } catch (expt) {
                Logger.Warn(`Failed to check app setting propagation for ${key}, remaining retry ${retryCount-1}`);
            }

            Logger.Info(`App setting ${key} has not been propagated to Kudu container yet, remaining retry ${retryCount-1}`)
            retryCount--;
        }

        if (isSuccess) {
            Logger.Info(`App setting ${key} propagated to Kudu container`);
        } else {
            Logger.Warn(`App setting ${key} fails to propagate to Kudu container`);
        }
    }

    private static async _updateApplicationSettings(context: IActionContext, settings: Record<string, string>) {
        if (context.authenticationType === AuthenticationType.Rbac) {
            Logger.Info("Update using context.appService.patchApplicationSettings");
            return await context.appService.patchApplicationSettings(settings);
        }
        if (context.authenticationType === AuthenticationType.Scm) {
            Logger.Info("Update using Client.updateAppSettingViaKudu");
            return await Client.updateAppSettingViaKudu(context.scmCredentials, settings, 3);
        }
    }
}
