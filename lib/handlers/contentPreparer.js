"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utility_js_1 = require("pipelines-appservice-lib/lib/Utilities/utility.js");
const ziputility_js_1 = require("pipelines-appservice-lib/lib/Utilities/ziputility.js");
const packageUtility_1 = require("pipelines-appservice-lib/lib/Utilities/packageUtility");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
const publish_method_1 = require("../constants/publish_method");
const function_sku_1 = require("../constants/function_sku");
const runtime_stack_1 = require("../constants/runtime_stack");
const utils_1 = require("../utils");
class ContentPreparer {
    invoke(state, params, context) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validatePackageType(state, context.package);
            this._packageType = context.package.getPackageType();
            this._publishContentPath = yield this.generatePublishContent(state, params.packagePath, this._packageType);
            this._publishMethod = this.derivePublishMethod(state, this._packageType, context.os, context.sku);
            try {
                context.kuduServiceUtil.warmpUp();
            }
            catch (expt) {
                throw new exceptions_1.AzureResourceError(state, "Warmup", `Failed to warmup ${params.appName}`, expt);
            }
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
                throw new exceptions_1.ValidationError(state, "validatePackageType", "only accepts zip or folder");
        }
    }
    generatePublishContent(state, packagePath, packageType) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (packageType) {
                case packageUtility_1.PackageType.zip:
                    utils_1.Logger.Log(`Will directly deploy ${packagePath} as function app content`);
                    return packagePath;
                case packageUtility_1.PackageType.folder:
                    const tempoaryFilePath = utility_js_1.generateTemporaryFolderOrZipPath(process.env.RUNNER_TEMP, false);
                    utils_1.Logger.Log(`Will archive ${packagePath} into ${tempoaryFilePath} as function app content`);
                    try {
                        return yield ziputility_js_1.archiveFolder(packagePath, "", tempoaryFilePath);
                    }
                    catch (expt) {
                        throw new exceptions_1.FileIOError(state, "Generate Publish Content", `Failed to archive ${packagePath}`, expt);
                    }
                default:
                    throw new exceptions_1.ValidationError(state, "Generate Publish Content", "only accepts zip or folder");
            }
        });
    }
    derivePublishMethod(state, packageType, osType, sku) {
        // Linux Consumption sets WEBSITE_RUN_FROM_PACKAGE app settings
        if (osType === runtime_stack_1.RuntimeStackConstant.Linux && sku === function_sku_1.FunctionSkuConstant.Consumption) {
            utils_1.Logger.Log('Will use WEBSITE_RUN_FROM_PACKAGE to deploy');
            return publish_method_1.PublishMethodConstant.WebsiteRunFromPackageDeploy;
        }
        // Rest Skus which support api/zipdeploy endpoint
        switch (packageType) {
            case packageUtility_1.PackageType.zip:
            case packageUtility_1.PackageType.folder:
                utils_1.Logger.Log('Will use api/zipdeploy to deploy');
                return publish_method_1.PublishMethodConstant.ZipDeploy;
            default:
                throw new exceptions_1.ValidationError(state, "Derive Publish Method", "only accepts zip or folder");
        }
    }
}
exports.ContentPreparer = ContentPreparer;
