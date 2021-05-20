import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { IScmCredentials } from "../interfaces/IScmCredentials";
import { ScmBuildConstant } from "../constants/scm_build";
import { EnableOryxBuildConstant } from "../constants/enable_oryx_build";

export class Builder {
    public static GetDefaultScmCredential(): IScmCredentials {
        return {
            appUrl: undefined,
            password: undefined,
            uri: undefined,
            username: undefined
        }
    }

    public static GetDefaultActionParameters(): IActionParameters {
        return {
            appName: undefined,
            packagePath: undefined,
            slot: undefined,
            publishProfile: undefined,
            respectPomXml: false,
            respectFuncignore: false,
            scmDoBuildDuringDeployment: ScmBuildConstant.Disabled,
            enableOryxBuild: EnableOryxBuildConstant.Disabled
        }
    }

    public static GetDefaultActionContext(): IActionContext {
        return {
            azureHttpUserAgent: undefined,
            azureHttpUserAgentPrefix: undefined,
            isLinux: undefined,
            kind: undefined,
            resourceGroupName: undefined,
            appService: undefined,
            appServiceUtil: undefined,
            endpoint: undefined,
            kuduService: undefined,
            kuduServiceUtil: undefined,
            package: undefined,
            packageType: undefined,
            publishContentPath: undefined,
            publishMethod: undefined,
            appSettings: undefined,
            language: undefined,
            os: undefined,
            sku: undefined,
            appUrl: undefined,
            scmCredentials: undefined,
            authenticationType: undefined
        }
    }
}