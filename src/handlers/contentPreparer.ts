import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { parseString } from 'xml2js';
import { generateTemporaryFolderOrZipPath } from 'azure-actions-utility/utility.js';
import { archiveFolder } from 'azure-actions-utility/ziputility.js';
import { PackageType, Package } from "azure-actions-utility/packageUtility";
import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { IActionParameters } from "../interfaces/IActionParameters";
import { ValidationError, FileIOError } from "../exceptions";
import { PublishMethodConstant } from "../constants/publish_method";
import { FunctionSkuConstant } from "../constants/function_sku";
import { RuntimeStackConstant } from "../constants/runtime_stack";
import { Logger, FuncIgnore } from '../utils';
import { AuthenticationType } from '../constants/authentication_type';

export class ContentPreparer implements IOrchestratable {
    private _packageType: PackageType;
    private _publishContentPath: string;
    private _publishMethod: PublishMethodConstant;

    public async invoke(state: StateConstant, params: IActionParameters, context: IActionContext): Promise<StateConstant> {
        // Collect prerequisites from context
        this.validatePackageType(state, context.package);
        this._packageType = context.package.getPackageType();
        this._publishContentPath = await this.generatePublishContent(state, params, this._packageType);
        this._publishMethod = this.derivePublishMethod(state, this._packageType, context.os, context.sku, context.authenticationType);

        // Warm up instances
        await this.warmUpInstance(params, context);

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

    private async warmUpInstance(params: IActionParameters, context: IActionContext): Promise<void> {
        try {
            await context.kuduServiceUtil.warmpUp();
        } catch (expt) {
            Logger.Warn(`Failed to warmup ${params.appName}. Continue deployment.`);
        }
    }

    private async generatePublishContent(state: StateConstant, params: IActionParameters, packageType: PackageType): Promise<string> {
        const packagePath: string = params.packagePath;
        const respectPomXml: boolean = params.respectPomXml;
        const respectFuncignore: boolean = params.respectFuncignore;

        switch (packageType) {
            case PackageType.zip:
                Logger.Info(`Will directly deploy ${packagePath} as function app content`);
                if (respectFuncignore) {
                    Logger.Warn('The "respect-funcignore" is only available when "package" points to host.json folder');
                }
                if (respectPomXml) {
                    Logger.Warn('The "respect-pom-xml" is only available when "package" points to host.json folder');
                }
                return packagePath;
            case PackageType.folder:
                const tempoaryFilePath: string = generateTemporaryFolderOrZipPath(process.env.RUNNER_TEMP, false);
                // Parse .funcignore and remove unwantted files
                if (respectFuncignore) {
                    await this.removeFilesDefinedInFuncignore(packagePath);
                }

                // Parse pom.xml for java function app
                let sourceLocation: string = packagePath;
                if (respectPomXml) {
                    sourceLocation = await this.getPomXmlSourceLocation(packagePath);
                }
                Logger.Info(`Will archive ${sourceLocation} into ${tempoaryFilePath} as function app content`);
                try {
                    return await archiveFolder(sourceLocation, "", tempoaryFilePath) as string;
                } catch (expt) {
                    throw new FileIOError(state, "Generate Publish Content", `Failed to archive ${sourceLocation}`, expt);
                }
            default:
                throw new ValidationError(state, "Generate Publish Content", "only accepts zip or folder");
        }
    }

    private async getPomXmlSourceLocation(packagePath: string): Promise<string> {
        const pomXmlPath: string = resolve(packagePath, 'pom.xml');
        if (!existsSync(pomXmlPath)) {
            Logger.Warn(`The file ${pomXmlPath} does not exist. Please ensure your publish-profile setting points to a folder containing host.json.`);
            Logger.Warn(`Using ${packagePath} as source folder for packaging`);
            return packagePath;
        }

        let pomXmlContent: string = undefined;
        try {
            pomXmlContent = readFileSync(pomXmlPath, 'utf8');
        } catch (expt) {
            Logger.Warn(`The file ${pomXmlPath} does not have valid content, using ${packagePath} as source folder for packaging`);
            return packagePath
        }

        let pomXmlResult: any = undefined;
        await parseString(pomXmlContent, (error, xmlResult) => {
            if (!error) {
                pomXmlResult = xmlResult;
            }
        });
        if (!pomXmlResult) {
            Logger.Warn(`The xml file ${pomXmlPath} is invalid, using ${packagePath} as source folder for packaging`);
            return packagePath;
        }

        let functionAppName: string = undefined;
        try {
            functionAppName = pomXmlResult.project.properties[0].functionAppName[0];
        } catch (expt) {
            Logger.Warn(`Cannot find functionAppName section in pom.xml, using ${packagePath} as source folder for packaging`);
            return packagePath;
        }

        const pomPackagePath: string = resolve(packagePath, 'target', 'azure-functions', functionAppName);
        Logger.Info(`Sucessfully parsed pom.xml. Using ${pomPackagePath} as source folder for packaging`);
        return pomPackagePath;
    }

    private removeFilesDefinedInFuncignore(packagePath: string): void {
        if (!FuncIgnore.doesFuncignoreExist(packagePath)) {
            Logger.Warn(`The .funcignore file does not exist in your path ${packagePath}. Nothing will be changed`);
            return;
        }

        const funcignoreParser = FuncIgnore.readFuncignore(packagePath);
        if (!funcignoreParser) {
            Logger.Warn(`Failed to parse .funcignore. Nothing will be changed`);
            return
        }

        FuncIgnore.removeFilesFromFuncIgnore(packagePath, funcignoreParser);
        return;
    }

    private derivePublishMethod(
        state: StateConstant,
        packageType: PackageType,
        osType: RuntimeStackConstant,
        sku: FunctionSkuConstant,
        authenticationType: AuthenticationType
    ): PublishMethodConstant {
        // Package Type Check early
        if (packageType !== PackageType.zip && packageType !== PackageType.folder) {
            throw new ValidationError(state, "Derive Publish Method", "only accepts zip or folder");
        }

        // Uses api/zipdeploy endpoint if scm credential is provided
        if (authenticationType == AuthenticationType.Scm) {
            Logger.Info('Will use api/zipdeploy to deploy (scm credential)');
            return PublishMethodConstant.ZipDeploy;
        }

        // Linux Consumption sets WEBSITE_RUN_FROM_PACKAGE app settings when scm credential is not available
        if (osType === RuntimeStackConstant.Linux && sku === FunctionSkuConstant.Consumption) {
            Logger.Info('Will use WEBSITE_RUN_FROM_PACKAGE to deploy');
            return PublishMethodConstant.WebsiteRunFromPackageDeploy;
        }

        // Rest Skus which support api/zipdeploy endpoint
        Logger.Info('Will use api/zipdeploy to deploy (rbac authentication)');
        return PublishMethodConstant.ZipDeploy;
    }
}
