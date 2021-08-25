"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionRuntimeUtil = exports.FunctionRuntimeConstant = void 0;
const exceptions_1 = require("../exceptions");
var FunctionRuntimeConstant;
(function (FunctionRuntimeConstant) {
    FunctionRuntimeConstant[FunctionRuntimeConstant["None"] = 1] = "None";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Dotnet"] = 2] = "Dotnet";
    FunctionRuntimeConstant[FunctionRuntimeConstant["DotnetIsolated"] = 3] = "DotnetIsolated";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Node"] = 4] = "Node";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Powershell"] = 5] = "Powershell";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Java"] = 6] = "Java";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Python"] = 7] = "Python";
    FunctionRuntimeConstant[FunctionRuntimeConstant["Custom"] = 8] = "Custom";
})(FunctionRuntimeConstant = exports.FunctionRuntimeConstant || (exports.FunctionRuntimeConstant = {}));
class FunctionRuntimeUtil {
    static FromString(language) {
        if (language === undefined) {
            return FunctionRuntimeConstant.None;
        }
        let key = "";
        language.split('-').forEach(element => {
            key += element.charAt(0).toUpperCase() + element.toLowerCase().slice(1);
        });
        const result = FunctionRuntimeConstant[key];
        if (result === undefined) {
            throw new exceptions_1.UnexpectedConversion('FunctionRuntimeConstant', language);
        }
        return result;
    }
}
exports.FunctionRuntimeUtil = FunctionRuntimeUtil;
