import { ScmBuildConstant } from "../constants/scm_build";
import { EnableOryxBuildConstant } from "../constants/enable_oryx_build";

export interface IActionParameters {
    appName: string;
    packagePath: string;
    slot: string;
    publishProfile: string;
    respectPomXml: boolean;
    respectFuncignore: boolean;
    scmDoBuildDuringDeployment: ScmBuildConstant;
    enableOryxBuild: EnableOryxBuildConstant;
}