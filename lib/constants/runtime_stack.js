"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
var RuntimeStackConstant;
(function (RuntimeStackConstant) {
    RuntimeStackConstant[RuntimeStackConstant["Windows"] = 1] = "Windows";
    RuntimeStackConstant[RuntimeStackConstant["Linux"] = 2] = "Linux";
})(RuntimeStackConstant = exports.RuntimeStackConstant || (exports.RuntimeStackConstant = {}));
class RuntimeStackUtil {
    static FromString(osType) {
        const key = osType.charAt(0).toUpperCase() + osType.toLowerCase().slice(1);
        const result = RuntimeStackConstant[key];
        if (result === undefined) {
            throw new exceptions_1.UnexpectedConversion("RuntimeStackConstant", osType);
        }
        return result;
    }
}
exports.RuntimeStackUtil = RuntimeStackUtil;
