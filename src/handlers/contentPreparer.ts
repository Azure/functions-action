import { generateTemporaryFolderOrZipPath } from 'pipelines-appservice-lib/lib/Utilities/utility.js';
import { archiveFolder } from 'pipelines-appservice-lib/lib/Utilities/ziputility.js';
import { PackageType, Package } from "pipelines-appservice-lib/lib/Utilities/packageUtility";
import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { IActionParameters } from "../interfaces/IActionParameters";
import { ValidationError, FileIOError, AzureResourceError } from "../exceptions";
import { PublishMethodConstant } from "../constants/publish_method";
import { FunctionSkuConstant } from "../constants/function_sku";
import { RuntimeStackConstant } from "../constants/runtime_stack";
import { Logger } from '../utils';

export class ContentPreparer implements IOrchestratable {
    private _packageType: PackageType;
    private _publishContentPath: string;
    private _publishMethod: PublishMethodConstant;

    public async invoke(state: StateConstant, params: IActionParameters, context: IActionContext): Promise<StateConstant> {
        this.validatePackageType(state, context.package);
        this._packageType = context.package.getPackageType();
        this._publishContentPath = await this.generatePublishContent(state, params.packagePath, this._packageType);
        this._publishMethod = this.derivePublishMethod(state, this._packageType, context.os, context.sku);

        try {
            context.kuduServiceUtil.warmpUp();
        } catch (expt) {
            throw new AzureResourceError(state, "Warmup", `Failed to warmup ${params.appName}`, expt);
        }

        return StateConstant.PublishContent;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.packageType = this._packageType;
        context.publishContentPath = this._publishContentPath;
        context.publishMethod = this._publishMethod;
        return context;
    }

    private validatePackageType(state: StateConstant, pkg: Package): void {
        const packageType: PackageType = pkg.getPackageType();
        switch (packageType) {
            case PackageType.zip:
            case PackageType.folder:
                break;
            default:
                throw new ValidationError(state, "validatePackageType", "only accepts zip or folder");
        }
    }

    private async generatePublishContent(state: StateConstant, packagePath: string, packageType: PackageType): Promise<string> {
        switch (packageType) {
            case PackageType.zip:
                Logger.Log(`Will directly deploy ${packagePath} as function app content`);
                return packagePath;
            case PackageType.folder:
                const tempoaryFilePath: string = generateTemporaryFolderOrZipPath(process.env.RUNNER_TEMP, false);
                Logger.Log(`Will archive ${packagePath} into ${tempoaryFilePath} as function app content`);
                try {
                    return await archiveFolder(packagePath, "", tempoaryFilePath) as string;
                } catch (expt) {
                    throw new FileIOError(state, "Generate Publish Content", `Failed to archive ${packagePath}`, expt);
                }
            default:
                throw new ValidationError(state, "Generate Publish Content", "only accepts zip or folder");
        }
    }

    private derivePublishMethod(state: StateConstant, packageType: PackageType, osType: RuntimeStackConstant, sku: FunctionSkuConstant): PublishMethodConstant {
        // Linux Consumption sets WEBSITE_RUN_FROM_PACKAGE app settings
        if (osType === RuntimeStackConstant.Linux && sku === FunctionSkuConstant.Consumption) {
            Logger.Log('Will use WEBSITE_RUN_FROM_PACKAGE to deploy');
            return PublishMethodConstant.WebsiteRunFromPackageDeploy;
        }

        // Rest Skus which support api/zipdeploy endpoint
        switch(packageType) {
            case PackageType.zip:
            case PackageType.folder:
                Logger.Log('Will use api/zipdeploy to deploy');
                return PublishMethodConstant.ZipDeploy;
            default:
                throw new ValidationError(state, "Derive Publish Method", "only accepts zip or folder");
        }
    }
}