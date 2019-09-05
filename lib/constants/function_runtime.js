"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
var FunctionRuntimeConstant;
(function (FunctionRuntimeConstant) {
    FunctionRuntimeConstant[FunctionRuntimeConstant["None"] = 1] = "None";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Dotnet"] = 2] = "Dotnet";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Node"] = 3] = "Node";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Powershell"] = 4] = "Powershell";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Java"] = 5] = "Java";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Python"] = 6] = "Python";
})(FunctionRuntimeConstant = exports.FunctionRuntimeConstant || (exports.FunctionRuntimeConstant = {}));
class FunctionRuntimeUtil {
    static FromString(language) {
        if (language === undefined) {
            return FunctionRuntimeConstant.None;
        }
        const key = language.charAt(0).toUpperCase() + language.toLowerCase().slice(1);
        const result = FunctionRuntimeConstant[key];
        if (result === undefined) {
            throw new exceptions_1.UnexpectedConversion('FunctionRuntimeConstant', language);
        }
        return result;
    }
}
exports.FunctionRuntimeUtil = FunctionRuntimeUtil;
