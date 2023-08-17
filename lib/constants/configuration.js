"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationConstant = void 0;
class ConfigurationConstant {
}
exports.ConfigurationConstant = ConfigurationConstant;
ConfigurationConstant.ParamInAppName = 'app-name';
ConfigurationConstant.ParamInPackagePath = 'package';
ConfigurationConstant.ParamInSlot = 'slot-name';
ConfigurationConstant.ParamInPublishProfile = 'publish-profile';
ConfigurationConstant.ParamInRespectPomXml = 'respect-pom-xml';
ConfigurationConstant.ParamInRespectFuncignore = 'respect-funcignore';
ConfigurationConstant.ParamInEnableOryxBuild = 'enable-oryx-build';
ConfigurationConstant.ParamInScmDoBuildDuringDeployment = 'scm-do-build-during-deployment';
ConfigurationConstant.ParamOutResultName = 'app-url';
ConfigurationConstant.ParamOutPackageUrl = 'package-url';
ConfigurationConstant.ActionName = 'DeployFunctionAppToAzure';
ConfigurationConstant.BlobContainerName = 'github-actions-deploy';
ConfigurationConstant.BlobNamePrefix = 'Functionapp';
ConfigurationConstant.BlobServiceTimeoutMs = 3 * 1000;
ConfigurationConstant.BlobUploadTimeoutMs = 30 * 60 * 1000;
ConfigurationConstant.BlobUploadBlockSizeByte = 4 * 1024 * 1024;
ConfigurationConstant.BlobUplaodBlockParallel = 4;
ConfigurationConstant.BlobPermission = 'r';
ConfigurationConstant.ProductionSlotName = 'production';
