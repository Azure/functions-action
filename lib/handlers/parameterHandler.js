"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const packageUtility_1 = require("pipelines-appservice-lib/lib/Utilities/packageUtility");
const state_1 = require("../constants/state");
const exceptions_1 = require("../exceptions");
const runtime_stack_1 = require("../constants/runtime_stack");
const function_runtime_1 = require("../constants/function_runtime");
const function_sku_1 = require("../constants/function_sku");
const configuration_1 = require("../constants/configuration");
class ParameterHandler {
    invoke(state) {
        return __awaiter(this, void 0, void 0, function* () {
            this._appName = core.getInput(configuration_1.ConfigurationConstant.ParamInAppName);
            this._runtimeStack = core.getInput(configuration_1.ConfigurationConstant.ParamInRuntimeStack);
            this._functionRuntime = core.getInput(configuration_1.ConfigurationConstant.ParamInFunctionRuntime);
            this._packagePath = core.getInput(configuration_1.ConfigurationConstant.ParamInPackagePath);
            this._functionSku = core.getInput(configuration_1.ConfigurationConstant.ParamInFunctionSku);
            this.validateFields(state);
            return state_1.StateConstant.ValidateAzureResource;
        });
    }
    changeParams(state, params) {
        return __awaiter(this, void 0, void 0, function* () {
            params.appName = this._appName;
            params.runtimeStack = runtime_stack_1.RuntimeStackUtil.FromString(this._runtimeStack);
            params.functionRuntime = function_runtime_1.FunctionRuntimeUtil.FromString(this._functionRuntime);
            params.sku = function_sku_1.FunctionSkuUtil.FromString(this._functionSku);
            params.packagePath = this._packagePath;
            this.validateRuntimeSku(state, params);
            this.validateLanguage(state, params);
            return params;
        });
    }
    changeContext(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.package = new packageUtility_1.Package(this._packagePath);
            return context;
        });
    }
    validateFields(state) {
        // app-name
        if (this._appName === undefined || this._appName.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInAppName, "should not be empty");
        }
        // runtime-stack
        if (this._runtimeStack === undefined || this._runtimeStack.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInRuntimeStack, "should not be empty");
        }
        try {
            runtime_stack_1.RuntimeStackUtil.FromString(this._runtimeStack);
        }
        catch (expt) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInRuntimeStack, "only accepts 'windows' or 'linux'", expt);
        }
        // function-runtime
        if (this._functionRuntime === undefined || this._functionRuntime.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionRuntime, "should not be empty");
        }
        try {
            function_runtime_1.FunctionRuntimeUtil.FromString(this._functionRuntime);
        }
        catch (expt) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionRuntime, "only accepts 'dotnet', 'powershell', 'java', 'python' or 'node'", expt);
        }
        // function-sku
        if (this._functionSku === undefined || this._functionSku.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionSku, "should not be empty");
        }
        try {
            function_sku_1.FunctionSkuUtil.FromString(this._functionSku);
        }
        catch (expt) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionSku, "only accepts 'consumption', 'dedicated' or 'elasticpremium'", expt);
        }
        // package
        if (this._packagePath === undefined || this._packagePath.trim() === "") {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPackagePath, "should not be empty");
        }
        if (!packageUtility_1.exist(this._packagePath)) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInPackagePath, "needs to be in the project");
        }
    }
    validateRuntimeSku(state, params) {
        // Linux Elastic Premium is not supported
        if (params.runtimeStack === runtime_stack_1.RuntimeStackConstant.Linux && params.sku === function_sku_1.FunctionSkuConstant.ElasticPremium) {
            throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionSku, "Linux ElasticPremium plan is not yet supported");
        }
    }
    validateLanguage(state, params) {
        // Windows Python is not supported
        if (params.runtimeStack === runtime_stack_1.RuntimeStackConstant.Windows) {
            if (params.functionRuntime === function_runtime_1.FunctionRuntimeConstant.Python) {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionRuntime, "Python Function App on Windows is not yet supported");
            }
        }
        // Linux Java and Linux Powershell is not supported
        if (params.runtimeStack === runtime_stack_1.RuntimeStackConstant.Linux) {
            if (params.functionRuntime === function_runtime_1.FunctionRuntimeConstant.Java) {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionRuntime, "Java Function App on Linux is not yet supported");
            }
            if (params.functionRuntime === function_runtime_1.FunctionRuntimeConstant.Powershell) {
                throw new exceptions_1.ValidationError(state, configuration_1.ConfigurationConstant.ParamInFunctionRuntime, "PowerShell Function App on Windows is not yet supported");
            }
        }
    }
}
exports.ParameterHandler = ParameterHandler;
