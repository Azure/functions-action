"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScmBuildUtil = exports.ScmBuildConstant = void 0;
const exceptions_1 = require("../exceptions");
const parser_1 = require("../utils/parser");
var ScmBuildConstant;
(function (ScmBuildConstant) {
    ScmBuildConstant[ScmBuildConstant["NotSet"] = 0] = "NotSet";
    ScmBuildConstant[ScmBuildConstant["Enabled"] = 1] = "Enabled";
    ScmBuildConstant[ScmBuildConstant["Disabled"] = 2] = "Disabled";
})(ScmBuildConstant = exports.ScmBuildConstant || (exports.ScmBuildConstant = {}));
class ScmBuildUtil {
    static FromString(setting) {
        if (setting.trim() === '') {
            return ScmBuildConstant.NotSet;
        }
        if (parser_1.Parser.IsTrueLike(setting)) {
            return ScmBuildConstant.Enabled;
        }
        if (parser_1.Parser.IsFalseLike(setting)) {
            return ScmBuildConstant.Disabled;
        }
        throw new exceptions_1.UnexpectedConversion("ScmDoBuildDuringDeployment", setting);
    }
    static ToString(setting) {
        if (setting === ScmBuildConstant.Enabled) {
            return 'true';
        }
        if (setting === ScmBuildConstant.Disabled) {
            return 'false';
        }
        return undefined;
    }
}
exports.ScmBuildUtil = ScmBuildUtil;
