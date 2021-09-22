"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPreparer = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const xml2js_1 = require("xml2js");
const utility_js_1 = require("azure-actions-utility/utility.js");
const ziputility_js_1 = require("azure-actions-utility/ziputility.js");
const packageUtility_1 = require("azure-actions-utility/packageUtility");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
const publish_method_1 = require("../constants/publish_method");
const function_sku_1 = require("../constants/function_sku");
const runtime_stack_1 = require("../constants/runtime_stack");
const utils_1 = require("../utils");
const authentication_type_1 = require("../constants/authentication_type");
class ContentPreparer {
    invoke(state, params, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Collect prerequisites from context
            this.validatePackageType(state, context.package);
            this._packageType = context.package.getPackageType();
            this._publishContentPath = yield this.generatePublishContent(state, params, this._packageType);
            this._publishMethod = this.derivePublishMethod(state, this._packageType, context.os, context.sku, context.authenticationType);
            // Warm up instances
            yield this.warmUpInstance(params, context);
            return state_1.StateConstant.PublishContent;
        });
    }
    changeContext(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.packageType = this._packageType;
            context.publishContentPath = this._publishContentPath;
            context.publishMethod = this._publishMethod;
            return context;
        });
    }
    validatePackageType(state, pkg) {
        const packageType = pkg.getPackageType();
        switch (packageType) {
            case packageUtility_1.PackageType.zip:
            case packageUtility_1.PackageType.folder:
                break;
            default:
                throw new exceptions_1.ValidationError(state, "validatePackageType", "only accepts zip or folder. Any other deployment sources such as URL or .jar file currently are " +
                    "not supported in GitHub Action.");
        }
    }
    warmUpInstance(params, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield context.kuduServiceUtil.warmpUp();
            }
            catch (expt) {
                utils_1.Logger.Warn(`Failed to warmup ${params.appName}. Continue deployment.`);
            }
        });
    }
    generatePublishContent(state, params, packageType) {
        return __awaiter(this, void 0, void 0, function* () {
            const packagePath = params.packagePath;
            const respectPomXml = params.respectPomXml;
            const respectFuncignore = params.respectFuncignore;
            switch (packageType) {
                case packageUtility_1.PackageType.zip:
                    utils_1.Logger.Info(`Will directly deploy ${packagePath} as function app content.`);
                    if (respectFuncignore) {
                        utils_1.Logger.Warn('The "respect-funcignore" is only available when "package" points to host.json folder.');
                    }
                    if (respectPomXml) {
                        utils_1.Logger.Warn('The "respect-pom-xml" is only available when "package" points to host.json folder.');
                    }
                    return packagePath;
                case packageUtility_1.PackageType.folder:
                    const tempoaryFilePath = (0, utility_js_1.generateTemporaryFolderOrZipPath)(process.env.RUNNER_TEMP, false);
                    // Parse .funcignore and remove unwantted files
                    if (respectFuncignore) {
                        yield this.removeFilesDefinedInFuncignore(packagePath);
                    }
                    // Parse pom.xml for java function app
                    let sourceLocation = packagePath;
                    if (respectPomXml) {
                        sourceLocation = yield this.getPomXmlSourceLocation(packagePath);
                    }
                    utils_1.Logger.Info(`Will archive ${sourceLocation} into ${tempoaryFilePath} as function app content`);
                    try {
                        return yield (0, ziputility_js_1.archiveFolder)(sourceLocation, "", tempoaryFilePath);
                    }
                    catch (expt) {
                        throw new exceptions_1.FileIOError(state, "Generate Publish Content", `Failed to archive ${sourceLocation}`, expt);
                    }
                default:
                    throw new exceptions_1.ValidationError(state, "Generate Publish Content", "only accepts zip or folder");
            }
        });
    }
    getPomXmlSourceLocation(packagePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const pomXmlPath = (0, path_1.resolve)(packagePath, 'pom.xml');
            if (!(0, fs_1.existsSync)(pomXmlPath)) {
                utils_1.Logger.Warn(`The file ${pomXmlPath} does not exist. ` +
                    "Please ensure your publish-profile setting points to a folder containing host.json.");
                utils_1.Logger.Warn(`Fall back on ${packagePath} as packaging source.`);
                return packagePath;
            }
            let pomXmlContent = undefined;
            try {
                pomXmlContent = (0, fs_1.readFileSync)(pomXmlPath, 'utf8');
            }
            catch (expt) {
                utils_1.Logger.Warn(`The file ${pomXmlPath} does not have valid content. Please check if the pom.xml file is ` +
                    "and have proper encoding (utf-8).");
                utils_1.Logger.Warn(`Fall back on ${packagePath} as packaging source.`);
                return packagePath;
            }
            let pomXmlResult = undefined;
            yield (0, xml2js_1.parseString)(pomXmlContent, (error, xmlResult) => {
                if (!error) {
                    pomXmlResult = xmlResult;
                }
            });
            if (!pomXmlResult) {
                utils_1.Logger.Warn(`The xml file ${pomXmlPath} is invalid. Please check if the pom.xml file contains proper ` +
                    "content. Please visit https://maven.apache.org/pom.html#what-is-the-pom for more information.");
                utils_1.Logger.Warn(`Fall back on ${packagePath} as packaging source.`);
                return packagePath;
            }
            let functionAppName = undefined;
            try {
                functionAppName = pomXmlResult.project.properties[0].functionAppName[0];
            }
            catch (expt) {
                utils_1.Logger.Warn(`Cannot find functionAppName section in pom.xml. Please ensure the pom.xml is properly ` +
                    "generated from azure-functions maven plugin.");
                utils_1.Logger.Warn(`Fall back on ${packagePath} as packaging source.`);
                return packagePath;
            }
            const pomPackagePath = (0, path_1.resolve)(packagePath, 'target', 'azure-functions', functionAppName);
            utils_1.Logger.Info(`Successfully parsed pom.xml. Using ${pomPackagePath} as source folder for packaging`);
            return pomPackagePath;
        });
    }
    removeFilesDefinedInFuncignore(packagePath) {
        if (!utils_1.FuncIgnore.doesFuncignoreExist(packagePath)) {
            utils_1.Logger.Warn(`The .funcignore file does not exist in your path ${packagePath}. Nothing will be changed.`);
            utils_1.Logger.Warn("The .funcignore file shares the same format as .gitignore. " +
                "You can use it to exclude files from deployment.");
            return;
        }
        const funcignoreParser = utils_1.FuncIgnore.readFuncignore(packagePath);
        if (!funcignoreParser) {
            utils_1.Logger.Warn(`Failed to parse .funcignore. Nothing will be changed`);
            utils_1.Logger.Warn("The .funcignore file shares the same format as .gitignore. " +
                "You can use it to exclude files from deployment.");
            return;
        }
        utils_1.FuncIgnore.removeFilesFromFuncIgnore(packagePath, funcignoreParser);
        return;
    }
    derivePublishMethod(state, packageType, osType, sku, authenticationType) {
        // Package Type Check early
        if (packageType !== packageUtility_1.PackageType.zip && packageType !== packageUtility_1.PackageType.folder) {
            throw new exceptions_1.ValidationError(state, "Derive Publish Method", "only accepts zip or folder. Any other deployment sources such as URL or .jar file currently are " +
                "not supported in GitHub Action.");
        }
        // Uses api/zipdeploy endpoint if scm credential is provided
        if (authenticationType == authentication_type_1.AuthenticationType.Scm) {
            utils_1.Logger.Info('Will use Kudu https://<scmsite>/api/zipdeploy to deploy since publish-profile is detected.');
            return publish_method_1.PublishMethodConstant.ZipDeploy;
        }
        // Linux Consumption sets WEBSITE_RUN_FROM_PACKAGE app settings when scm credential is not available
        if (osType === runtime_stack_1.RuntimeStackConstant.Linux && sku === function_sku_1.FunctionSkuConstant.Consumption) {
            utils_1.Logger.Info('Will use WEBSITE_RUN_FROM_PACKAGE to deploy since RBAC is detected and your function app is ' +
                'on Linux Consumption.');
            return publish_method_1.PublishMethodConstant.WebsiteRunFromPackageDeploy;
        }
        // Rest Skus which support api/zipdeploy endpoint
        utils_1.Logger.Info('Will use https://<scmsite>/api/zipdeploy to deploy since RBAC Azure credential is detected.');
        return publish_method_1.PublishMethodConstant.ZipDeploy;
    }
}
exports.ContentPreparer = ContentPreparer;
