"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableOryxBuildUtil = exports.EnableOryxBuildConstant = void 0;
const exceptions_1 = require("../exceptions");
const parser_1 = require("../utils/parser");
var EnableOryxBuildConstant;
(function (EnableOryxBuildConstant) {
    EnableOryxBuildConstant[EnableOryxBuildConstant["NotSet"] = 0] = "NotSet";
    EnableOryxBuildConstant[EnableOryxBuildConstant["Enabled"] = 1] = "Enabled";
    EnableOryxBuildConstant[EnableOryxBuildConstant["Disabled"] = 2] = "Disabled";
})(EnableOryxBuildConstant = exports.EnableOryxBuildConstant || (exports.EnableOryxBuildConstant = {}));
class EnableOryxBuildUtil {
    static FromString(setting) {
        if (setting.trim() === '') {
            return EnableOryxBuildConstant.NotSet;
        }
        if (parser_1.Parser.IsTrueLike(setting)) {
            return EnableOryxBuildConstant.Enabled;
        }
        if (parser_1.Parser.IsFalseLike(setting)) {
            return EnableOryxBuildConstant.Disabled;
        }
        throw new exceptions_1.UnexpectedConversion("EnableOryxBuild", setting);
    }
    static ToString(setting) {
        if (setting === EnableOryxBuildConstant.Enabled) {
            return 'true';
        }
        if (setting === EnableOryxBuildConstant.Disabled) {
            return 'false';
        }
        return undefined;
    }
}
exports.EnableOryxBuildUtil = EnableOryxBuildUtil;
